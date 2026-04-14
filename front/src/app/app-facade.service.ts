import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DotacionApiService } from './core/dotacion-api.service';
import {
  AuthSession,
  ComplianceRow,
  ComplianceStatus,
  DashboardSummary,
  Delivery,
  DeliveryPayload,
  Employee,
  EmployeePayload,
  ItemCategory,
  ItemType,
  ItemTypePayload,
  Requirement,
  RequirementPayload,
  DeliveryType,
  StockMovement,
} from './core/dotacion.models';

@Injectable({ providedIn: 'root' })
export class AppFacade {
  private readonly tablePageSize = 10;

  private readonly api = inject(DotacionApiService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly currentView = signal<'dashboard' | 'employees' | 'items' | 'requirements' | 'deliveries-implementos' | 'reports'>(
    'dashboard',
  );

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly authSession = signal<AuthSession | null>(null);
  readonly authLoading = signal(false);

  readonly employees = signal<Employee[]>([]);
  readonly items = signal<ItemType[]>([]);
  readonly requirements = signal<Requirement[]>([]);
  readonly deliveries = signal<Delivery[]>([]);
  readonly complianceRows = signal<ComplianceRow[]>([]);
  readonly dashboard = signal<DashboardSummary | null>(null);
  readonly stockMovements = signal<StockMovement[]>([]);

  readonly editingEmployeeId = signal<string | null>(null);
  readonly editingItemId = signal<string | null>(null);
  readonly editingRequirementId = signal<string | null>(null);
  readonly complianceFilter = signal<ComplianceStatus>('ALL');
  readonly globalEmployeeFilterId = signal('');

  readonly employeeQuery = signal('');
  readonly itemQuery = signal('');
  readonly requirementQuery = signal('');
  readonly deliveryQuery = signal('');
  readonly reportQuery = signal('');

  readonly employeePage = signal(1);
  readonly itemPage = signal(1);
  readonly requirementPage = signal(1);
  readonly deliveryPage = signal(1);
  readonly reportPage = signal(1);
  readonly selectedStockItemId = signal<string | null>(null);

  readonly employeeSubmitState = signal<'idle' | 'success' | 'error'>('idle');
  readonly itemSubmitState = signal<'idle' | 'success' | 'error'>('idle');
  readonly requirementSubmitState = signal<'idle' | 'success' | 'error'>('idle');
  readonly deliverySubmitState = signal<'idle' | 'success' | 'error'>('idle');
  readonly deliveryValidationErrors = signal<Record<string, string[]>>({});
  readonly stockSubmitState = signal<'idle' | 'success' | 'error'>('idle');

  readonly navigation = [
    { id: 'dashboard', label: 'Resumen' },
    { id: 'employees', label: 'Empleados' },
    { id: 'items', label: 'Implementos' },
    { id: 'requirements', label: 'Solicitudes' },
    { id: 'deliveries-implementos', label: 'Entregas' },
    { id: 'reports', label: 'Reportes' },
  ] as const;

  readonly itemCategories: ItemCategory[] = ['DOTACION', 'REGALO'];

  readonly loginForm = this.fb.group({
    username: this.fb.control(this.api.getStoredUsername() ?? '', [Validators.required]),
    password: this.fb.control('', [Validators.required]),
  });

  readonly itemCategoryLabel: Record<ItemCategory, string> = {
    DOTACION: 'Dotacion',
    REGALO: 'Regalo',
  };

  readonly employeeForm = this.fb.group({
    documentNumber: this.fb.control('', [Validators.required, Validators.maxLength(40)]),
    firstName: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    lastName: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    email: this.fb.control('', [Validators.email, Validators.maxLength(200)]),
    phone: this.fb.control('', [Validators.maxLength(50)]),
    area: this.fb.control('', [Validators.maxLength(120)]),
    position: this.fb.control('', [Validators.maxLength(120)]),
    birthDate: this.fb.control(''),
    active: this.fb.control(true),
  });

  readonly itemForm = this.fb.group({
    code: this.fb.control('', [Validators.required, Validators.maxLength(30)]),
    name: this.fb.control('', [Validators.required, Validators.maxLength(140)]),
    category: this.fb.control<ItemCategory>('DOTACION', [Validators.required]),
    description: this.fb.control('', [Validators.maxLength(500)]),
    unitCost: this.fb.control(0, [Validators.required, Validators.min(0)]),
    availableStock: this.fb.control(0, [Validators.required, Validators.min(0)]),
    active: this.fb.control(true),
  });

  readonly deliveryForm = this.fb.group({
    employeeId: this.fb.control('', [Validators.required]),
    deliveryType: this.fb.control<DeliveryType>('IMPLEMENTOS', [Validators.required]),
    deliveredAt: this.fb.control(this.currentDate(), [Validators.required]),
    deliveredBy: this.fb.control('Recursos Humanos', [Validators.required, Validators.maxLength(140)]),
    signerName: this.fb.control('', [Validators.maxLength(140)]),
    notes: this.fb.control('', [Validators.maxLength(1000)]),
    signatureDataUrl: this.fb.control(''),
    duplicateAcknowledged: this.fb.control(false),
    items: this.fb.array([this.buildDeliveryItemGroup()], [Validators.minLength(1)]),
  });

  readonly requirementForm = this.fb.group({
    employeeId: this.fb.control('', [Validators.required]),
    itemTypeId: this.fb.control('', [Validators.required]),
    requestedQuantity: this.fb.control(1, [Validators.required, Validators.min(1)]),
    notes: this.fb.control('', [Validators.maxLength(500)]),
  });

  readonly pendingRows = computed(() =>
    this.complianceRows()
      .filter((row) => !this.globalEmployeeFilterId() || row.employeeId === this.globalEmployeeFilterId())
      .filter((row) => row.status === 'PENDING')
      .slice(0, 8),
  );

  readonly activeEmployeesCount = computed(
    () => this.dashboard()?.totalActiveEmployees ?? this.complianceRows().length,
  );

  readonly pendingEmployeesCount = computed(
    () => this.dashboard()?.pendingEmployees ?? this.pendingRows().length,
  );

  readonly upToDateEmployeesCount = computed(() => {
    const summary = this.dashboard();
    if (summary) {
      return summary.upToDateEmployees;
    }

    return Math.max(0, this.activeEmployeesCount() - this.pendingEmployeesCount());
  });

  readonly complianceCoveragePercent = computed(() =>
    this.calculateRatioPercent(this.upToDateEmployeesCount(), this.activeEmployeesCount()),
  );

  readonly pendingEmployeesPercent = computed(() =>
    this.calculateRatioPercent(this.pendingEmployeesCount(), this.activeEmployeesCount()),
  );

  readonly pendingRequirementTotal = computed(
    () => this.dashboard()?.pendingRequirements ?? this.pendingRows().reduce((total, row) => total + row.pendingRequirements, 0),
  );

  readonly deliveredRequirementsTotal = computed(() =>
    this.dashboard()?.deliveredRequirements ?? 0,
  );

  readonly deliveredRequirementsPercent = computed(() =>
    this.dashboard()?.deliveredRequirementsPercent ?? 0,
  );

  readonly pendingRequirementsPercent = computed(() =>
    this.dashboard()?.pendingRequirementsPercent ?? 0,
  );

  readonly deliveredCostThisMonth = computed(() => this.dashboard()?.deliveredCostThisMonth ?? 0);

  readonly pendingEstimatedCost = computed(() => this.dashboard()?.pendingEstimatedCost ?? 0);

  readonly birthdaysToday = computed(() => this.dashboard()?.birthdaysToday ?? 0);

  readonly canManage = computed(() => this.authSession()?.authenticated ?? false);
  readonly authenticatedUsername = computed(() => this.authSession()?.username ?? null);

  readonly complianceRowsView = computed(() => {
    if (this.complianceFilter() === 'ALL') {
      return this.complianceRows();
    }

    return this.complianceRows().filter((row) => row.status === this.complianceFilter());
  });

  readonly recentDeliveries = computed(() =>
    this.deliveries()
      .filter((delivery) => !this.globalEmployeeFilterId() || delivery.employeeId === this.globalEmployeeFilterId())
      .slice(0, 8),
  );

  readonly employeeFilterOptions = computed(() =>
    this.employees().map((employee) => ({
      id: employee.id,
      label: `${employee.fullName} · ${employee.documentNumber}`,
    })),
  );

  readonly filteredEmployees = computed(() => {
    const query = this.normalizeText(this.employeeQuery());
    if (!query) {
      return this.employees();
    }

    return this.employees().filter((employee) => {
      const searchable = this.normalizeText(
        `${employee.fullName} ${employee.documentNumber} ${employee.area ?? ''} ${employee.position ?? ''} ${employee.birthDate ?? ''}`,
      );
      return searchable.includes(query);
    });
  });

  readonly employeeTotalPages = computed(() => this.pageCount(this.filteredEmployees().length));
  readonly employeeCurrentPage = computed(() => Math.min(this.employeePage(), this.employeeTotalPages()));
  readonly paginatedEmployees = computed(() => this.paginate(this.filteredEmployees(), this.employeeCurrentPage()));

  readonly filteredItems = computed(() => {
    const query = this.normalizeText(this.itemQuery());
    if (!query) {
      return this.items();
    }

    return this.items().filter((item) => {
      const searchable = this.normalizeText(
        `${item.code} ${item.name} ${this.itemCategoryLabel[item.category]} ${item.description ?? ''} ${item.unitCost} ${item.availableStock}`,
      );
      return searchable.includes(query);
    });
  });

  readonly itemTotalPages = computed(() => this.pageCount(this.filteredItems().length));
  readonly itemCurrentPage = computed(() => Math.min(this.itemPage(), this.itemTotalPages()));
  readonly paginatedItems = computed(() => this.paginate(this.filteredItems(), this.itemCurrentPage()));

  readonly filteredRequirements = computed(() => {
    const query = this.normalizeText(this.requirementQuery());
    const employeeFilterId = this.globalEmployeeFilterId();

    const requirements = this.requirements().filter(
      (requirement) => !employeeFilterId || requirement.employeeId === employeeFilterId,
    );

    if (!query) {
      return requirements;
    }

    return requirements.filter((requirement) => {
      const searchable = this.normalizeText(
        `${requirement.employeeName} ${requirement.employeeDocument} ${requirement.itemCode} ${requirement.itemName} ${requirement.requestedQuantity} ${requirement.notes ?? ''}`,
      );
      return searchable.includes(query);
    });
  });

  readonly requirementTotalPages = computed(() => this.pageCount(this.filteredRequirements().length));
  readonly requirementCurrentPage = computed(() => Math.min(this.requirementPage(), this.requirementTotalPages()));
  readonly paginatedRequirements = computed(() =>
    this.paginate(this.filteredRequirements(), this.requirementCurrentPage()),
  );

  private readonly filteredDeliveries = computed(() => {
    const query = this.normalizeText(this.deliveryQuery());
    const employeeFilterId = this.globalEmployeeFilterId();

    const deliveries = this.deliveries().filter((delivery) => !employeeFilterId || delivery.employeeId === employeeFilterId);

    if (!query) {
      return deliveries;
    }

    return deliveries.filter((delivery) => {
      const searchable = this.normalizeText(
        `${delivery.employeeName} ${delivery.deliveredBy} ${delivery.certificateNumber} ${delivery.deliveredAt}`,
      );
      return searchable.includes(query);
    });
  });

  readonly filteredDeliveriesTable = computed(() => this.filteredDeliveries());

  readonly deliveryTotalPages = computed(() => this.pageCount(this.filteredDeliveriesTable().length));

  readonly deliveryCurrentPage = computed(() => Math.min(this.deliveryPage(), this.deliveryTotalPages()));
  readonly paginatedDeliveriesTable = computed(() =>
    this.paginate(this.filteredDeliveriesTable(), this.deliveryCurrentPage()),
  );

  readonly filteredComplianceRows = computed(() => {
    const query = this.normalizeText(this.reportQuery());
    const employeeFilterId = this.globalEmployeeFilterId();

    const complianceRows = this
      .complianceRowsView()
      .filter((row) => !employeeFilterId || row.employeeId === employeeFilterId);

    if (!query) {
      return complianceRows;
    }

    return complianceRows.filter((row) => {
      const searchable = this.normalizeText(
        `${row.employeeName} ${row.employeeDocument} ${row.area ?? ''} ${row.pendingItems ?? ''} ${row.nextDueDate ?? ''}`,
      );
      return searchable.includes(query);
    });
  });

  readonly reportTotalPages = computed(() => this.pageCount(this.filteredComplianceRows().length));
  readonly reportCurrentPage = computed(() => Math.min(this.reportPage(), this.reportTotalPages()));
  readonly paginatedComplianceRows = computed(() =>
    this.paginate(this.filteredComplianceRows(), this.reportCurrentPage()),
  );

  constructor() {
    void this.bootstrap();
  }

  get deliveryItems(): FormArray<DeliveryItemFormGroup> {
    return this.deliveryForm.controls.items;
  }

  setView(view: 'dashboard' | 'employees' | 'items' | 'requirements' | 'deliveries-implementos' | 'reports'): void {
    this.currentView.set(view);
  }

  setComplianceFilter(filter: ComplianceStatus): void {
    this.complianceFilter.set(filter);
    this.reportPage.set(1);
  }

  setGlobalEmployeeFilter(value: string): void {
    this.globalEmployeeFilterId.set(value);
    this.requirementPage.set(1);
    this.deliveryPage.set(1);
    this.reportPage.set(1);
  }

  setEmployeeQuery(value: string): void {
    this.employeeQuery.set(value);
    this.employeePage.set(1);
  }

  setItemQuery(value: string): void {
    this.itemQuery.set(value);
    this.itemPage.set(1);
  }

  setRequirementQuery(value: string): void {
    this.requirementQuery.set(value);
    this.requirementPage.set(1);
  }

  setDeliveryQuery(value: string): void {
    this.deliveryQuery.set(value);
    this.deliveryPage.set(1);
  }

  setReportQuery(value: string): void {
    this.reportQuery.set(value);
    this.reportPage.set(1);
  }

  previousEmployeePage(): void {
    this.employeePage.update((page) => Math.max(1, page - 1));
  }

  nextEmployeePage(): void {
    this.employeePage.update((page) => Math.min(this.employeeTotalPages(), page + 1));
  }

  previousItemPage(): void {
    this.itemPage.update((page) => Math.max(1, page - 1));
  }

  nextItemPage(): void {
    this.itemPage.update((page) => Math.min(this.itemTotalPages(), page + 1));
  }

  previousRequirementPage(): void {
    this.requirementPage.update((page) => Math.max(1, page - 1));
  }

  nextRequirementPage(): void {
    this.requirementPage.update((page) => Math.min(this.requirementTotalPages(), page + 1));
  }

  previousDeliveryPage(): void {
    this.deliveryPage.update((page) => Math.max(1, page - 1));
  }

  nextDeliveryPage(): void {
    this.deliveryPage.update((page) => Math.min(this.deliveryTotalPages(), page + 1));
  }

  previousReportPage(): void {
    this.reportPage.update((page) => Math.max(1, page - 1));
  }

  nextReportPage(): void {
    this.reportPage.update((page) => Math.min(this.reportTotalPages(), page + 1));
  }

  async loginAsAdmin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authLoading.set(true);
    this.errorMessage.set(null);

    try {
      const session = await firstValueFrom(
        this.api.login(
          this.loginForm.controls.username.value.trim(),
          this.loginForm.controls.password.value,
        ),
      );

      this.authSession.set(session);
      this.loginForm.patchValue({ password: '' });
      this.notifySuccess('Sesion administrativa iniciada.');
      await this.reloadEverything();
    } catch {
      this.errorMessage.set('Credenciales inválidas o sin permisos de administrador.');
    } finally {
      this.authLoading.set(false);
    }
  }

  async logoutAdmin(): Promise<void> {
    this.api.logout();
    this.authSession.set(null);
    this.loginForm.patchValue({ password: '' });
    this.notifySuccess('Sesion cerrada.');
    await this.reloadEverything();
  }

  async reloadEverything(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [dashboard, employees, items, requirements, deliveries, complianceRows] = await Promise.all([
        firstValueFrom(this.api.getDashboardSummary()),
        firstValueFrom(this.api.listEmployees(true)),
        firstValueFrom(this.api.listItems(true)),
        firstValueFrom(this.api.listRequirements()),
        firstValueFrom(this.api.listDeliveries()),
        firstValueFrom(this.api.getCompliance('ALL')),
      ]);

      const stockMovements = await firstValueFrom(this.api.listStockMovements(this.selectedStockItemId() ?? undefined));

      this.dashboard.set(dashboard);
      this.employees.set(employees);
      this.items.set(items);
      this.requirements.set(requirements);
      this.deliveries.set(deliveries);
      this.complianceRows.set(complianceRows);
      this.stockMovements.set(stockMovements);
    } catch (error: unknown) {
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible cargar la información inicial del sistema.'));
    } finally {
      this.loading.set(false);
    }
  }

  async saveEmployee(): Promise<void> {
    if (!this.ensureAdminSession()) {
      this.employeeSubmitState.set('error');
      return;
    }

    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.employeeSubmitState.set('error');
      return;
    }

    this.employeeSubmitState.set('idle');

    const payload: EmployeePayload = {
      documentNumber: this.employeeForm.controls.documentNumber.value.trim(),
      firstName: this.employeeForm.controls.firstName.value.trim(),
      lastName: this.employeeForm.controls.lastName.value.trim(),
      email: this.emptyAsNull(this.employeeForm.controls.email.value),
      phone: this.emptyAsNull(this.employeeForm.controls.phone.value),
      area: this.emptyAsNull(this.employeeForm.controls.area.value),
      position: this.emptyAsNull(this.employeeForm.controls.position.value),
      birthDate: this.emptyAsNull(this.employeeForm.controls.birthDate.value),
      active: this.employeeForm.controls.active.value,
    };

    try {
      const editingId = this.editingEmployeeId();
      if (editingId) {
        await firstValueFrom(this.api.updateEmployee(editingId, payload));
        this.notifySuccess('Empleado actualizado correctamente.');
      } else {
        await firstValueFrom(this.api.createEmployee(payload));
        this.notifySuccess('Empleado registrado correctamente.');
      }

      this.resetEmployeeForm();
      await this.refreshEmployeesRelatedData();
      this.employeeSubmitState.set('success');
    } catch (error: unknown) {
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible guardar el empleado.'));
      this.employeeSubmitState.set('error');
    }
  }

  editEmployee(employee: Employee): void {
    this.editingEmployeeId.set(employee.id);
    this.employeeForm.setValue({
      documentNumber: employee.documentNumber,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email ?? '',
      phone: employee.phone ?? '',
      area: employee.area ?? '',
      position: employee.position ?? '',
      birthDate: employee.birthDate ?? '',
      active: employee.active,
    });
  }

  cancelEmployeeEdition(): void {
    this.resetEmployeeForm();
  }

  async deactivateEmployee(employee: Employee): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    if (!window.confirm(`Desactivar a ${employee.fullName}?`)) {
      return;
    }

    try {
      await firstValueFrom(this.api.deactivateEmployee(employee.id));
      this.notifySuccess('Empleado desactivado correctamente.');
      await this.refreshEmployeesRelatedData();
    } catch (error: unknown) {
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible desactivar el empleado.'));
    }
  }

  async saveItem(): Promise<void> {
    if (!this.ensureAdminSession()) {
      this.itemSubmitState.set('error');
      return;
    }

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.itemSubmitState.set('error');
      return;
    }

    this.itemSubmitState.set('idle');

    const payload: ItemTypePayload = {
      code: this.itemForm.controls.code.value.trim().toUpperCase(),
      name: this.itemForm.controls.name.value.trim(),
      category: this.itemForm.controls.category.value,
      description: this.emptyAsNull(this.itemForm.controls.description.value),
      unitCost: this.roundToTwoDecimals(this.itemForm.controls.unitCost.value),
      availableStock: this.itemForm.controls.availableStock.value,
      active: this.itemForm.controls.active.value,
    };

    try {
      const editingId = this.editingItemId();
      if (editingId) {
        await firstValueFrom(this.api.updateItem(editingId, payload));
        this.notifySuccess('Implemento actualizado correctamente.');
      } else {
        await firstValueFrom(this.api.createItem(payload));
        this.notifySuccess('Implemento registrado correctamente.');
      }

      this.resetItemForm();
      await this.refreshItemsRelatedData();
      this.itemSubmitState.set('success');
    } catch (error: unknown) {
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible guardar el implemento.'));
      this.itemSubmitState.set('error');
    }
  }

  editItem(item: ItemType): void {
    this.editingItemId.set(item.id);
    this.itemForm.setValue({
      code: item.code,
      name: item.name,
      category: item.category,
      description: item.description ?? '',
      unitCost: item.unitCost,
      availableStock: item.availableStock,
      active: item.active,
    });
  }

  cancelItemEdition(): void {
    this.resetItemForm();
  }

  async deactivateItem(item: ItemType): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    if (!window.confirm(`Desactivar implemento ${item.code}?`)) {
      return;
    }

    try {
      await firstValueFrom(this.api.deactivateItem(item.id));
      this.notifySuccess('Implemento desactivado correctamente.');
      await this.refreshItemsRelatedData();
    } catch (error: unknown) {
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible desactivar el implemento.'));
    }
  }

  async selectStockMovementItem(itemId: string | null): Promise<void> {
    this.selectedStockItemId.set(itemId);
    await this.reloadStockMovements();
  }

  async addInboundStock(itemId: string, quantity: number, reason: string | null): Promise<void> {
    if (!this.ensureAdminSession()) {
      this.stockSubmitState.set('error');
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      this.errorMessage.set('La cantidad de ingreso debe ser mayor a cero.');
      this.stockSubmitState.set('error');
      return;
    }

    this.stockSubmitState.set('idle');

    try {
      await firstValueFrom(this.api.addItemStockInbound(itemId, {
        quantity: Math.floor(quantity),
        reason: reason && reason.trim().length > 0 ? reason.trim() : null,
      }));

      this.notifySuccess('Ingreso de stock registrado correctamente.');
      await this.refreshItemsRelatedData();
      this.stockSubmitState.set('success');
    } catch (error: unknown) {
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible registrar el ingreso de stock.'));
      this.stockSubmitState.set('error');
    }
  }

  async saveRequirement(): Promise<void> {
    if (!this.ensureAdminSession()) {
      this.requirementSubmitState.set('error');
      return;
    }

    if (this.requirementForm.invalid) {
      this.requirementForm.markAllAsTouched();
      this.requirementSubmitState.set('error');
      return;
    }

    this.requirementSubmitState.set('idle');

    const payload: RequirementPayload = {
      employeeId: this.requirementForm.controls.employeeId.value,
      itemTypeId: this.requirementForm.controls.itemTypeId.value,
      requestedQuantity: this.requirementForm.controls.requestedQuantity.value,
      notes: this.emptyAsNull(this.requirementForm.controls.notes.value),
    };

    try {
      const editingId = this.editingRequirementId();
      if (editingId) {
        await firstValueFrom(this.api.updateRequirement(editingId, payload));
        this.notifySuccess('Solicitud actualizada correctamente.');
      } else {
        await firstValueFrom(this.api.createRequirement(payload));
        this.notifySuccess('Solicitud registrada correctamente.');
      }

      this.resetRequirementForm();
      await this.refreshRequirementsRelatedData();
      this.requirementSubmitState.set('success');
    } catch (error: unknown) {
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible guardar la solicitud.'));
      this.requirementSubmitState.set('error');
    }
  }

  editRequirement(requirement: Requirement): void {
    this.editingRequirementId.set(requirement.id);
    this.requirementForm.setValue({
      employeeId: requirement.employeeId,
      itemTypeId: requirement.itemTypeId,
      requestedQuantity: requirement.requestedQuantity,
      notes: requirement.notes ?? '',
    });
  }

  cancelRequirementEdition(): void {
    this.resetRequirementForm();
  }

  async deleteRequirement(requirement: Requirement): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    if (!window.confirm(`Eliminar solicitud de ${requirement.employeeName} para ${requirement.itemName}?`)) {
      return;
    }

    try {
      await firstValueFrom(this.api.deleteRequirement(requirement.id));
      this.notifySuccess('Solicitud eliminada correctamente.');
      await this.refreshRequirementsRelatedData();
    } catch (error: unknown) {
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible eliminar la solicitud.'));
    }
  }

  addDeliveryItem(): void {
    this.deliveryItems.push(this.buildDeliveryItemGroup());
  }

  removeDeliveryItem(index: number): void {
    if (this.deliveryItems.length <= 1) {
      return;
    }
    this.deliveryItems.removeAt(index);
  }

  onSignatureChanged(dataUrl: string | null): void {
    this.deliveryForm.controls.signatureDataUrl.setValue(dataUrl ?? '');
  }

  async createDelivery(): Promise<void> {
    if (!this.ensureAdminSession()) {
      this.deliverySubmitState.set('error');
      return;
    }

    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      this.deliverySubmitState.set('error');
      return;
    }

    this.deliveryValidationErrors.set({});
    this.deliverySubmitState.set('idle');

    const payload: DeliveryPayload = {
      employeeId: this.deliveryForm.controls.employeeId.value,
      deliveryType: this.deliveryForm.controls.deliveryType.value,
      deliveredAt: this.deliveryForm.controls.deliveredAt.value,
      deliveredBy: this.deliveryForm.controls.deliveredBy.value.trim(),
      signerName: this.emptyAsNull(this.deliveryForm.controls.signerName.value),
      notes: this.emptyAsNull(this.deliveryForm.controls.notes.value),
      signatureDataUrl: this.emptyAsNull(this.deliveryForm.controls.signatureDataUrl.value),
      duplicateAcknowledged: this.deliveryForm.controls.duplicateAcknowledged.value,
      items: this.deliveryItems.controls
        .map((itemControl) => ({
          itemTypeId: itemControl.controls.itemTypeId.value,
          quantity: itemControl.controls.quantity.value,
        }))
        .filter((item) => item.itemTypeId.length > 0),
    };

    if (payload.items.length === 0) {
      this.errorMessage.set('Debe registrar al menos un implemento para la entrega.');
      this.deliverySubmitState.set('error');
      return;
    }

    const requestedByItemType = new Map<string, number>();
    for (const item of payload.items) {
      requestedByItemType.set(item.itemTypeId, (requestedByItemType.get(item.itemTypeId) ?? 0) + item.quantity);
    }

    const duplicateItemNames: string[] = [];

    for (const [itemTypeId, requestedQuantity] of requestedByItemType.entries()) {
      const item = this.items().find((registeredItem) => registeredItem.id === itemTypeId);
      if (!item) {
        this.errorMessage.set('No se puede registrar la entrega: uno de los implementos no existe o esta inactivo.');
        this.deliverySubmitState.set('error');
        return;
      }

      const expectedCategory: ItemCategory = payload.deliveryType === 'REGALOS' ? 'REGALO' : 'DOTACION';
      if (item.category !== expectedCategory) {
        const expectedLabel = expectedCategory === 'REGALO' ? 'Regalo' : 'Dotacion';
        this.errorMessage.set(
          `El item ${item.code} no corresponde al tipo de entrega actual. Solo se permiten items de categoria ${expectedLabel}.`,
        );
        this.deliverySubmitState.set('error');
        return;
      }

      if (item.availableStock < requestedQuantity) {
        this.errorMessage.set(
          `Stock insuficiente para ${item.code}. Disponible: ${item.availableStock}, solicitado: ${requestedQuantity}.`,
        );
        this.deliverySubmitState.set('error');
        return;
      }

      const duplicateAlreadyDelivered = this.deliveries().some((delivery) =>
        delivery.employeeId === payload.employeeId && delivery.items.some((deliveryItem) => deliveryItem.itemTypeId === itemTypeId),
      );

      if (duplicateAlreadyDelivered) {
        duplicateItemNames.push(item.name);
      }
    }

    if (duplicateItemNames.length > 0 && !payload.duplicateAcknowledged) {
      this.errorMessage.set(
        `Entrega duplicada detectada para: ${duplicateItemNames.join(', ')}. Debes marcar la confirmacion explicita para continuar.`,
      );
      this.deliverySubmitState.set('error');
      return;
    }

    try {
      await firstValueFrom(this.api.createDelivery(payload));
      this.notifySuccess('Entrega registrada correctamente.');
      this.deliveryValidationErrors.set({});
      this.resetDeliveryForm();
      await this.refreshDeliveriesRelatedData();
      this.deliverySubmitState.set('success');
    } catch (error: unknown) {
      this.deliveryValidationErrors.set(this.extractValidationErrorsByField(error));
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible registrar la entrega.'));
      this.deliverySubmitState.set('error');
    }
  }

  async downloadCertificate(delivery: Delivery): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    const previewWindow = window.open('about:blank', '_blank');

    if (previewWindow && !previewWindow.closed) {
      previewWindow.document.title = 'Generando certificado...';
      previewWindow.document.body.innerHTML = '<p style="font-family: Manrope, Segoe UI, sans-serif; padding: 18px; color: #4a3526;">Generando certificado PDF...</p>';
    }

    try {
      const file = await firstValueFrom(this.api.downloadCertificate(delivery.id));
      this.openPdfInNewTab(file, previewWindow);
    } catch (error: unknown) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible abrir el certificado en una nueva ventana.'));
    }
  }

  async exportComplianceExcel(): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    try {
      const file = await firstValueFrom(this.api.exportComplianceExcel());
      this.downloadFile(file, `reporte-dotacion-${this.currentDate()}.xlsx`);
    } catch (error: unknown) {
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible exportar el reporte.'));
    }
  }

  labelForStatus(status: 'PENDING' | 'UP_TO_DATE'): string {
    return status === 'PENDING' ? 'Pendiente' : 'Al día';
  }

  private buildDeliveryItemGroup(): DeliveryItemFormGroup {
    return this.fb.group({
      itemTypeId: this.fb.control('', [Validators.required]),
      quantity: this.fb.control(1, [Validators.required, Validators.min(1)]),
    });
  }

  private async bootstrap(): Promise<void> {
    await this.tryRestoreSession();
    await this.reloadEverything();
  }

  private async tryRestoreSession(): Promise<void> {
    if (!this.api.hasStoredSession()) {
      this.authSession.set(null);
      return;
    }

    try {
      const session = await firstValueFrom(this.api.getSession());
      this.authSession.set(session);
    } catch {
      this.api.logout();
      this.authSession.set(null);
    }
  }

  private ensureAdminSession(): boolean {
    if (this.canManage()) {
      return true;
    }

    this.errorMessage.set('Debes iniciar sesión como administrador para realizar esta acción.');
    return false;
  }

  private resetEmployeeForm(): void {
    this.editingEmployeeId.set(null);
    this.employeeForm.reset({
      documentNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      area: '',
      position: '',
      birthDate: '',
      active: true,
    });
  }

  private resetItemForm(): void {
    this.editingItemId.set(null);
    this.itemForm.reset({
      code: '',
      name: '',
      category: 'DOTACION',
      description: '',
      unitCost: 0,
      availableStock: 0,
      active: true,
    });
  }

  private resetRequirementForm(): void {
    this.editingRequirementId.set(null);
    this.requirementForm.reset({
      employeeId: '',
      itemTypeId: '',
      requestedQuantity: 1,
      notes: '',
    });
  }

  private resetDeliveryForm(): void {
    this.deliveryForm.reset({
      employeeId: '',
      deliveryType: 'IMPLEMENTOS',
      deliveredAt: this.currentDate(),
      deliveredBy: 'Recursos Humanos',
      signerName: '',
      notes: '',
      signatureDataUrl: '',
      duplicateAcknowledged: false,
      items: [],
    });

    this.deliveryItems.clear();
    this.deliveryItems.push(this.buildDeliveryItemGroup());
    this.deliveryValidationErrors.set({});
  }

  private async refreshEmployeesRelatedData(): Promise<void> {
    const [employees, requirements, deliveries, complianceRows, dashboard] = await Promise.all([
      firstValueFrom(this.api.listEmployees(true)),
      firstValueFrom(this.api.listRequirements()),
      firstValueFrom(this.api.listDeliveries()),
      firstValueFrom(this.api.getCompliance('ALL')),
      firstValueFrom(this.api.getDashboardSummary()),
    ]);

    this.employees.set(employees);
    this.requirements.set(requirements);
    this.deliveries.set(deliveries);
    this.complianceRows.set(complianceRows);
    this.dashboard.set(dashboard);
  }

  private async refreshItemsRelatedData(): Promise<void> {
    const [items, requirements, deliveries, complianceRows, stockMovements] = await Promise.all([
      firstValueFrom(this.api.listItems(true)),
      firstValueFrom(this.api.listRequirements()),
      firstValueFrom(this.api.listDeliveries()),
      firstValueFrom(this.api.getCompliance('ALL')),
      firstValueFrom(this.api.listStockMovements(this.selectedStockItemId() ?? undefined)),
    ]);

    this.items.set(items);
    this.requirements.set(requirements);
    this.deliveries.set(deliveries);
    this.complianceRows.set(complianceRows);
    this.stockMovements.set(stockMovements);
  }

  private async refreshRequirementsRelatedData(): Promise<void> {
    const [requirements, deliveries, complianceRows, dashboard] = await Promise.all([
      firstValueFrom(this.api.listRequirements()),
      firstValueFrom(this.api.listDeliveries()),
      firstValueFrom(this.api.getCompliance('ALL')),
      firstValueFrom(this.api.getDashboardSummary()),
    ]);

    this.requirements.set(requirements);
    this.deliveries.set(deliveries);
    this.complianceRows.set(complianceRows);
    this.dashboard.set(dashboard);
  }

  private async reloadStockMovements(): Promise<void> {
    try {
      const movements = await firstValueFrom(this.api.listStockMovements(this.selectedStockItemId() ?? undefined));
      this.stockMovements.set(movements);
    } catch (error: unknown) {
      this.errorMessage.set(this.extractApiErrorMessage(error, 'No fue posible cargar la trazabilidad de inventario.'));
    }
  }

  private extractApiErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error.trim();
    }

    if (!error.error || typeof error.error !== 'object') {
      return fallback;
    }

    const payload = error.error as {
      detail?: unknown;
      message?: unknown;
      details?: unknown;
    };

    const detail = this.nonEmptyString(payload.detail) ?? this.nonEmptyString(payload.message);
    const details = Array.isArray(payload.details)
      ? payload.details
        .map((entry) => this.nonEmptyString(entry))
        .filter((entry): entry is string => entry !== null)
      : [];

    if (detail && details.length > 0) {
      return `${detail} ${details.join(' · ')}`;
    }

    if (detail) {
      return detail;
    }

    if (details.length > 0) {
      return details.join(' · ');
    }

    return fallback;
  }

  private extractValidationErrorsByField(error: unknown): Record<string, string[]> {
    if (!(error instanceof HttpErrorResponse)) {
      return {};
    }

    if (!error.error || typeof error.error !== 'object') {
      return {};
    }

    const payload = error.error as {
      details?: unknown;
    };

    if (!Array.isArray(payload.details)) {
      return {};
    }

    const result: Record<string, string[]> = {};

    for (const rawEntry of payload.details) {
      const entry = this.nonEmptyString(rawEntry);
      if (!entry) {
        continue;
      }

      const separatorIndex = entry.indexOf(':');
      if (separatorIndex <= 0 || separatorIndex >= entry.length - 1) {
        continue;
      }

      const field = entry.slice(0, separatorIndex).trim();
      const message = entry.slice(separatorIndex + 1).trim();
      if (!field || !message) {
        continue;
      }

      const currentMessages = result[field] ?? [];
      if (!currentMessages.includes(message)) {
        result[field] = [...currentMessages, message];
      }
    }

    return result;
  }

  private nonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async refreshDeliveriesRelatedData(): Promise<void> {
    const [items, requirements, deliveries, complianceRows, dashboard, stockMovements] = await Promise.all([
      firstValueFrom(this.api.listItems(true)),
      firstValueFrom(this.api.listRequirements()),
      firstValueFrom(this.api.listDeliveries()),
      firstValueFrom(this.api.getCompliance('ALL')),
      firstValueFrom(this.api.getDashboardSummary()),
      firstValueFrom(this.api.listStockMovements(this.selectedStockItemId() ?? undefined)),
    ]);

    this.items.set(items);
    this.requirements.set(requirements);
    this.deliveries.set(deliveries);
    this.complianceRows.set(complianceRows);
    this.dashboard.set(dashboard);
    this.stockMovements.set(stockMovements);
  }

  private downloadFile(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  private openPdfInNewTab(blob: Blob, previewWindow: Window | null): void {
    const objectUrl = URL.createObjectURL(blob);

    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.href = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.click();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
  }

  private pageCount(totalRows: number): number {
    return Math.max(1, Math.ceil(totalRows / this.tablePageSize));
  }

  private calculateRatioPercent(part: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    const percent = Math.round((part / total) * 1000) / 10;
    return Math.max(0, Math.min(100, percent));
  }

  private paginate<T>(rows: T[], page: number): T[] {
    const safePage = Math.max(1, page);
    const start = (safePage - 1) * this.tablePageSize;
    return rows.slice(start, start + this.tablePageSize);
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private currentDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private emptyAsNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private notifySuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set(null);

    window.setTimeout(() => {
      if (this.successMessage() === message) {
        this.successMessage.set(null);
      }
    }, 3200);
  }
}

type DeliveryItemFormGroup = FormGroup<{
  itemTypeId: FormControl<string>;
  quantity: FormControl<number>;
}>;

import { computed, inject, Injectable, signal } from '@angular/core';
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
} from './core/dotacion.models';

@Injectable({ providedIn: 'root' })
export class AppFacade {
  private readonly tablePageSize = 10;

  private readonly api = inject(DotacionApiService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly currentView = signal<'dashboard' | 'employees' | 'items' | 'requirements' | 'deliveries' | 'reports'>(
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

  readonly editingEmployeeId = signal<string | null>(null);
  readonly editingItemId = signal<string | null>(null);
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

  readonly navigation = [
    { id: 'dashboard', label: 'Resumen' },
    { id: 'employees', label: 'Empleados' },
    { id: 'items', label: 'Implementos' },
    { id: 'requirements', label: 'Requerimientos' },
    { id: 'deliveries', label: 'Entregas' },
    { id: 'reports', label: 'Reportes' },
  ] as const;

  readonly itemCategories: ItemCategory[] = ['UNIFORME', 'BOTAS', 'EPP', 'OTRO'];

  readonly loginForm = this.fb.group({
    username: this.fb.control(this.api.getStoredUsername() ?? '', [Validators.required]),
    password: this.fb.control('', [Validators.required]),
  });

  readonly itemCategoryLabel: Record<ItemCategory, string> = {
    UNIFORME: 'Uniforme',
    BOTAS: 'Botas',
    EPP: 'EPP',
    OTRO: 'Otro',
  };

  readonly employeeForm = this.fb.group({
    documentNumber: this.fb.control('', [Validators.required, Validators.maxLength(40)]),
    firstName: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    lastName: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    email: this.fb.control('', [Validators.email, Validators.maxLength(200)]),
    phone: this.fb.control('', [Validators.maxLength(50)]),
    area: this.fb.control('', [Validators.maxLength(120)]),
    position: this.fb.control('', [Validators.maxLength(120)]),
    active: this.fb.control(true),
  });

  readonly itemForm = this.fb.group({
    code: this.fb.control('', [Validators.required, Validators.maxLength(30)]),
    name: this.fb.control('', [Validators.required, Validators.maxLength(140)]),
    category: this.fb.control<ItemCategory>('UNIFORME', [Validators.required]),
    description: this.fb.control('', [Validators.maxLength(500)]),
    defaultPeriodicityMonths: this.fb.control(6, [Validators.required, Validators.min(1), Validators.max(60)]),
    active: this.fb.control(true),
  });

  readonly requirementForm = this.fb.group({
    employeeId: this.fb.control('', [Validators.required]),
    itemTypeId: this.fb.control('', [Validators.required]),
    periodicityMonths: this.fb.control(6, [Validators.required, Validators.min(1), Validators.max(60)]),
    effectiveFrom: this.fb.control(this.currentDate(), [Validators.required]),
    notes: this.fb.control('', [Validators.maxLength(500)]),
  });

  readonly deliveryForm = this.fb.group({
    employeeId: this.fb.control('', [Validators.required]),
    deliveredAt: this.fb.control(this.currentDate(), [Validators.required]),
    deliveredBy: this.fb.control('Recursos Humanos', [Validators.required, Validators.maxLength(140)]),
    signerName: this.fb.control('', [Validators.maxLength(140)]),
    notes: this.fb.control('', [Validators.maxLength(1000)]),
    signatureDataUrl: this.fb.control(''),
    items: this.fb.array([this.buildDeliveryItemGroup()], [Validators.minLength(1)]),
  });

  readonly pendingRows = computed(() =>
    this.complianceRows()
      .filter((row) => !this.globalEmployeeFilterId() || row.employeeId === this.globalEmployeeFilterId())
      .filter((row) => row.status === 'PENDING')
      .slice(0, 8),
  );

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
        `${employee.fullName} ${employee.documentNumber} ${employee.area ?? ''} ${employee.position ?? ''}`,
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
        `${item.code} ${item.name} ${this.itemCategoryLabel[item.category]} ${item.description ?? ''}`,
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
        `${requirement.employeeName} ${requirement.itemName} ${requirement.effectiveFrom} ${requirement.notes ?? ''}`,
      );
      return searchable.includes(query);
    });
  });

  readonly requirementTotalPages = computed(() => this.pageCount(this.filteredRequirements().length));
  readonly requirementCurrentPage = computed(() => Math.min(this.requirementPage(), this.requirementTotalPages()));
  readonly paginatedRequirements = computed(() =>
    this.paginate(this.filteredRequirements(), this.requirementCurrentPage()),
  );

  readonly filteredDeliveries = computed(() => {
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

  readonly deliveryTotalPages = computed(() => this.pageCount(this.filteredDeliveries().length));
  readonly deliveryCurrentPage = computed(() => Math.min(this.deliveryPage(), this.deliveryTotalPages()));
  readonly paginatedDeliveries = computed(() => this.paginate(this.filteredDeliveries(), this.deliveryCurrentPage()));

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

  setView(view: 'dashboard' | 'employees' | 'items' | 'requirements' | 'deliveries' | 'reports'): void {
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

      this.dashboard.set(dashboard);
      this.employees.set(employees);
      this.items.set(items);
      this.requirements.set(requirements);
      this.deliveries.set(deliveries);
      this.complianceRows.set(complianceRows);
    } catch {
      this.errorMessage.set('No fue posible cargar la información inicial del sistema.');
    } finally {
      this.loading.set(false);
    }
  }

  async saveEmployee(): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const payload: EmployeePayload = {
      documentNumber: this.employeeForm.controls.documentNumber.value.trim(),
      firstName: this.employeeForm.controls.firstName.value.trim(),
      lastName: this.employeeForm.controls.lastName.value.trim(),
      email: this.emptyAsNull(this.employeeForm.controls.email.value),
      phone: this.emptyAsNull(this.employeeForm.controls.phone.value),
      area: this.emptyAsNull(this.employeeForm.controls.area.value),
      position: this.emptyAsNull(this.employeeForm.controls.position.value),
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
    } catch {
      this.errorMessage.set('No fue posible guardar el empleado.');
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
    } catch {
      this.errorMessage.set('No fue posible desactivar el empleado.');
    }
  }

  async saveItem(): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const payload: ItemTypePayload = {
      code: this.itemForm.controls.code.value.trim().toUpperCase(),
      name: this.itemForm.controls.name.value.trim(),
      category: this.itemForm.controls.category.value,
      description: this.emptyAsNull(this.itemForm.controls.description.value),
      defaultPeriodicityMonths: this.itemForm.controls.defaultPeriodicityMonths.value,
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
    } catch {
      this.errorMessage.set('No fue posible guardar el implemento.');
    }
  }

  editItem(item: ItemType): void {
    this.editingItemId.set(item.id);
    this.itemForm.setValue({
      code: item.code,
      name: item.name,
      category: item.category,
      description: item.description ?? '',
      defaultPeriodicityMonths: item.defaultPeriodicityMonths,
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
    } catch {
      this.errorMessage.set('No fue posible desactivar el implemento.');
    }
  }

  async createRequirement(): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    if (this.requirementForm.invalid) {
      this.requirementForm.markAllAsTouched();
      return;
    }

    const payload: RequirementPayload = {
      employeeId: this.requirementForm.controls.employeeId.value,
      itemTypeId: this.requirementForm.controls.itemTypeId.value,
      periodicityMonths: this.requirementForm.controls.periodicityMonths.value,
      effectiveFrom: this.requirementForm.controls.effectiveFrom.value,
      notes: this.emptyAsNull(this.requirementForm.controls.notes.value),
    };

    try {
      await firstValueFrom(this.api.createRequirement(payload));
      this.notifySuccess('Requerimiento creado correctamente.');
      this.requirementForm.reset({
        employeeId: '',
        itemTypeId: '',
        periodicityMonths: 6,
        effectiveFrom: this.currentDate(),
        notes: '',
      });
      await this.refreshComplianceRelatedData();
    } catch {
      this.errorMessage.set('No fue posible crear el requerimiento.');
    }
  }

  async deleteRequirement(requirement: Requirement): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    if (!window.confirm(`Eliminar requerimiento de ${requirement.employeeName}?`)) {
      return;
    }

    try {
      await firstValueFrom(this.api.deleteRequirement(requirement.id));
      this.notifySuccess('Requerimiento eliminado correctamente.');
      await this.refreshComplianceRelatedData();
    } catch {
      this.errorMessage.set('No fue posible eliminar el requerimiento.');
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
      return;
    }

    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      return;
    }

    const payload: DeliveryPayload = {
      employeeId: this.deliveryForm.controls.employeeId.value,
      deliveredAt: this.deliveryForm.controls.deliveredAt.value,
      deliveredBy: this.deliveryForm.controls.deliveredBy.value.trim(),
      signerName: this.emptyAsNull(this.deliveryForm.controls.signerName.value),
      notes: this.emptyAsNull(this.deliveryForm.controls.notes.value),
      signatureDataUrl: this.emptyAsNull(this.deliveryForm.controls.signatureDataUrl.value),
      items: this.deliveryItems.controls
        .map((itemControl) => ({
          itemTypeId: itemControl.controls.itemTypeId.value,
          quantity: itemControl.controls.quantity.value,
        }))
        .filter((item) => item.itemTypeId.length > 0),
    };

    if (payload.items.length === 0) {
      this.errorMessage.set('Debe registrar al menos un implemento para la entrega.');
      return;
    }

    try {
      await firstValueFrom(this.api.createDelivery(payload));
      this.notifySuccess('Entrega registrada correctamente.');
      this.resetDeliveryForm();
      await this.refreshDeliveriesRelatedData();
    } catch {
      this.errorMessage.set('No fue posible registrar la entrega.');
    }
  }

  async downloadCertificate(delivery: Delivery): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    const previewWindow = window.open('', '_blank', 'noopener,noreferrer');

    try {
      const file = await firstValueFrom(this.api.downloadCertificate(delivery.id));
      this.openPdfInNewTab(file, previewWindow);
    } catch {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
      this.errorMessage.set('No fue posible abrir el certificado en una nueva ventana.');
    }
  }

  async exportComplianceExcel(): Promise<void> {
    if (!this.ensureAdminSession()) {
      return;
    }

    try {
      const file = await firstValueFrom(this.api.exportComplianceExcel());
      this.downloadFile(file, `reporte-dotacion-${this.currentDate()}.xlsx`);
    } catch {
      this.errorMessage.set('No fue posible exportar el reporte.');
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
      active: true,
    });
  }

  private resetItemForm(): void {
    this.editingItemId.set(null);
    this.itemForm.reset({
      code: '',
      name: '',
      category: 'UNIFORME',
      description: '',
      defaultPeriodicityMonths: 6,
      active: true,
    });
  }

  private resetDeliveryForm(): void {
    this.deliveryForm.reset({
      employeeId: '',
      deliveredAt: this.currentDate(),
      deliveredBy: 'Recursos Humanos',
      signerName: '',
      notes: '',
      signatureDataUrl: '',
      items: [],
    });

    this.deliveryItems.clear();
    this.deliveryItems.push(this.buildDeliveryItemGroup());
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
    const [items, requirements, deliveries, complianceRows] = await Promise.all([
      firstValueFrom(this.api.listItems(true)),
      firstValueFrom(this.api.listRequirements()),
      firstValueFrom(this.api.listDeliveries()),
      firstValueFrom(this.api.getCompliance('ALL')),
    ]);

    this.items.set(items);
    this.requirements.set(requirements);
    this.deliveries.set(deliveries);
    this.complianceRows.set(complianceRows);
  }

  private async refreshComplianceRelatedData(): Promise<void> {
    const [requirements, complianceRows, dashboard] = await Promise.all([
      firstValueFrom(this.api.listRequirements()),
      firstValueFrom(this.api.getCompliance('ALL')),
      firstValueFrom(this.api.getDashboardSummary()),
    ]);

    this.requirements.set(requirements);
    this.complianceRows.set(complianceRows);
    this.dashboard.set(dashboard);
  }

  private async refreshDeliveriesRelatedData(): Promise<void> {
    const [deliveries, complianceRows, dashboard] = await Promise.all([
      firstValueFrom(this.api.listDeliveries()),
      firstValueFrom(this.api.getCompliance('ALL')),
      firstValueFrom(this.api.getDashboardSummary()),
    ]);

    this.deliveries.set(deliveries);
    this.complianceRows.set(complianceRows);
    this.dashboard.set(dashboard);
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

    window.location.href = objectUrl;
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
  }

  private pageCount(totalRows: number): number {
    return Math.max(1, Math.ceil(totalRows / this.tablePageSize));
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

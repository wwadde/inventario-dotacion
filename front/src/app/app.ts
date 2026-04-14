import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ComplianceStatus, Delivery, Employee, ItemType, Requirement } from './core/dotacion.models';
import { AppFacade } from './app-facade.service';
import { DashboardView } from './features/dashboard-view/dashboard-view';
import { DeliveriesView } from './features/deliveries-view/deliveries-view';
import { EmployeesView } from './features/employees-view/employees-view';
import { ItemsView } from './features/items-view/items-view';
import { ReportsView } from './features/reports-view/reports-view';
import { RequirementsView } from './features/requirements-view/requirements-view';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DashboardView,
    EmployeesView,
    ItemsView,
    RequirementsView,
    DeliveriesView,
    ReportsView,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly facade = inject(AppFacade);

  protected readonly currentView = this.facade.currentView;
  protected readonly loading = this.facade.loading;
  protected readonly errorMessage = this.facade.errorMessage;
  protected readonly successMessage = this.facade.successMessage;
  protected readonly authLoading = this.facade.authLoading;
  protected readonly canManage = this.facade.canManage;
  protected readonly authenticatedUsername = this.facade.authenticatedUsername;

  protected readonly navigation = this.facade.navigation;
  protected readonly loginForm = this.facade.loginForm;

  protected readonly globalEmployeeFilterId = this.facade.globalEmployeeFilterId;
  protected readonly employeeFilterOptions = this.facade.employeeFilterOptions;

  protected readonly dashboard = this.facade.dashboard;
  protected readonly pendingRows = this.facade.pendingRows;
  protected readonly recentDeliveries = this.facade.recentDeliveries;

  protected readonly employeeForm = this.facade.employeeForm;
  protected readonly editingEmployeeId = this.facade.editingEmployeeId;
  protected readonly employeeQuery = this.facade.employeeQuery;
  protected readonly filteredEmployees = this.facade.filteredEmployees;
  protected readonly paginatedEmployees = this.facade.paginatedEmployees;
  protected readonly employeeCurrentPage = this.facade.employeeCurrentPage;
  protected readonly employeeTotalPages = this.facade.employeeTotalPages;

  protected readonly itemForm = this.facade.itemForm;
  protected readonly editingItemId = this.facade.editingItemId;
  protected readonly itemCategories = this.facade.itemCategories;
  protected readonly itemCategoryLabel = this.facade.itemCategoryLabel;
  protected readonly itemQuery = this.facade.itemQuery;
  protected readonly filteredItems = this.facade.filteredItems;
  protected readonly paginatedItems = this.facade.paginatedItems;
  protected readonly itemCurrentPage = this.facade.itemCurrentPage;
  protected readonly itemTotalPages = this.facade.itemTotalPages;

  protected readonly requirementForm = this.facade.requirementForm;
  protected readonly employees = this.facade.employees;
  protected readonly items = this.facade.items;
  protected readonly requirementQuery = this.facade.requirementQuery;
  protected readonly filteredRequirements = this.facade.filteredRequirements;
  protected readonly paginatedRequirements = this.facade.paginatedRequirements;
  protected readonly requirementCurrentPage = this.facade.requirementCurrentPage;
  protected readonly requirementTotalPages = this.facade.requirementTotalPages;

  protected readonly deliveryForm = this.facade.deliveryForm;
  protected readonly deliveryQuery = this.facade.deliveryQuery;
  protected readonly filteredDeliveries = this.facade.filteredDeliveries;
  protected readonly paginatedDeliveries = this.facade.paginatedDeliveries;
  protected readonly deliveryCurrentPage = this.facade.deliveryCurrentPage;
  protected readonly deliveryTotalPages = this.facade.deliveryTotalPages;

  protected readonly complianceFilter = this.facade.complianceFilter;
  protected readonly reportQuery = this.facade.reportQuery;
  protected readonly paginatedComplianceRows = this.facade.paginatedComplianceRows;
  protected readonly reportCurrentPage = this.facade.reportCurrentPage;
  protected readonly reportTotalPages = this.facade.reportTotalPages;
  protected readonly labelForStatus = (status: 'PENDING' | 'UP_TO_DATE'): string =>
    this.facade.labelForStatus(status);

  protected get deliveryItems() {
    return this.facade.deliveryItems;
  }

  protected setView(view: 'dashboard' | 'employees' | 'items' | 'requirements' | 'deliveries' | 'reports'): void {
    this.facade.setView(view);
  }

  protected setGlobalEmployeeFilter(value: string): void {
    this.facade.setGlobalEmployeeFilter(value);
  }

  protected setEmployeeQuery(value: string): void {
    this.facade.setEmployeeQuery(value);
  }

  protected setItemQuery(value: string): void {
    this.facade.setItemQuery(value);
  }

  protected setRequirementQuery(value: string): void {
    this.facade.setRequirementQuery(value);
  }

  protected setDeliveryQuery(value: string): void {
    this.facade.setDeliveryQuery(value);
  }

  protected setReportQuery(value: string): void {
    this.facade.setReportQuery(value);
  }

  protected setComplianceFilter(filter: ComplianceStatus): void {
    this.facade.setComplianceFilter(filter);
  }

  protected previousEmployeePage(): void {
    this.facade.previousEmployeePage();
  }

  protected nextEmployeePage(): void {
    this.facade.nextEmployeePage();
  }

  protected previousItemPage(): void {
    this.facade.previousItemPage();
  }

  protected nextItemPage(): void {
    this.facade.nextItemPage();
  }

  protected previousRequirementPage(): void {
    this.facade.previousRequirementPage();
  }

  protected nextRequirementPage(): void {
    this.facade.nextRequirementPage();
  }

  protected previousDeliveryPage(): void {
    this.facade.previousDeliveryPage();
  }

  protected nextDeliveryPage(): void {
    this.facade.nextDeliveryPage();
  }

  protected previousReportPage(): void {
    this.facade.previousReportPage();
  }

  protected nextReportPage(): void {
    this.facade.nextReportPage();
  }

  protected loginAsAdmin(): Promise<void> {
    return this.facade.loginAsAdmin();
  }

  protected logoutAdmin(): Promise<void> {
    return this.facade.logoutAdmin();
  }

  protected reloadEverything(): Promise<void> {
    return this.facade.reloadEverything();
  }

  protected saveEmployee(): Promise<void> {
    return this.facade.saveEmployee();
  }

  protected editEmployee(employee: Employee): void {
    this.facade.editEmployee(employee);
  }

  protected cancelEmployeeEdition(): void {
    this.facade.cancelEmployeeEdition();
  }

  protected deactivateEmployee(employee: Employee): Promise<void> {
    return this.facade.deactivateEmployee(employee);
  }

  protected saveItem(): Promise<void> {
    return this.facade.saveItem();
  }

  protected editItem(item: ItemType): void {
    this.facade.editItem(item);
  }

  protected cancelItemEdition(): void {
    this.facade.cancelItemEdition();
  }

  protected deactivateItem(item: ItemType): Promise<void> {
    return this.facade.deactivateItem(item);
  }

  protected createRequirement(): Promise<void> {
    return this.facade.createRequirement();
  }

  protected deleteRequirement(requirement: Requirement): Promise<void> {
    return this.facade.deleteRequirement(requirement);
  }

  protected addDeliveryItem(): void {
    this.facade.addDeliveryItem();
  }

  protected removeDeliveryItem(index: number): void {
    this.facade.removeDeliveryItem(index);
  }

  protected onSignatureChanged(dataUrl: string | null): void {
    this.facade.onSignatureChanged(dataUrl);
  }

  protected createDelivery(): Promise<void> {
    return this.facade.createDelivery();
  }

  protected downloadCertificate(delivery: Delivery): Promise<void> {
    return this.facade.downloadCertificate(delivery);
  }

  protected exportComplianceExcel(): Promise<void> {
    return this.facade.exportComplianceExcel();
  }

}

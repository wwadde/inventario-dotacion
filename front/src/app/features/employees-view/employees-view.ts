import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Delivery, Employee } from '../../core/dotacion.models';

@Component({
  selector: 'app-employees-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employees-view.html',
})
export class EmployeesView {
  employeeForm = input.required<FormGroup>();
  editingEmployeeId = input<string | null>(null);
  submitState = input<'idle' | 'success' | 'error'>('idle');
  canManage = input(false);
  deliveries = input<Delivery[]>([]);

  employeeQuery = input('');
  filteredCount = input(0);
  paginatedEmployees = input.required<Employee[]>();
  currentPage = input(1);
  totalPages = input(1);

  setEmployeeQuery = output<string>();
  saveEmployee = output<void>();
  cancelEdition = output<void>();
  editEmployee = output<Employee>();
  deactivateEmployee = output<Employee>();
  previousPage = output<void>();
  nextPage = output<void>();

  protected readonly formModalOpen = signal(false);
  protected readonly submitInProgress = signal(false);
  protected readonly historyModalOpen = signal(false);
  protected readonly selectedEmployee = signal<Employee | null>(null);

  constructor() {
    effect(() => {
      if (!this.submitInProgress()) {
        return;
      }

      const state = this.submitState();
      if (state === 'success') {
        this.formModalOpen.set(false);
        this.submitInProgress.set(false);
      }

      if (state === 'error') {
        this.submitInProgress.set(false);
      }
    });
  }

  protected openCreateModal(): void {
    this.cancelEdition.emit();
    this.formModalOpen.set(true);
  }

  protected openEditModal(employee: Employee): void {
    this.editEmployee.emit(employee);
    this.formModalOpen.set(true);
  }

  protected closeModal(): void {
    this.cancelEdition.emit();
    this.submitInProgress.set(false);
    this.formModalOpen.set(false);
  }

  protected openHistoryModal(employee: Employee): void {
    this.selectedEmployee.set(employee);
    this.historyModalOpen.set(true);
  }

  protected closeHistoryModal(): void {
    this.selectedEmployee.set(null);
    this.historyModalOpen.set(false);
  }

  protected employeeHistory(): Delivery[] {
    const employee = this.selectedEmployee();
    if (!employee) {
      return [];
    }

    return this.deliveries()
      .filter((delivery) => delivery.employeeId === employee.id)
      .sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt));
  }

  protected submitForm(): void {
    if (!this.canManage()) {
      return;
    }

    if (this.employeeForm().invalid) {
      this.employeeForm().markAllAsTouched();
      return;
    }

    this.submitInProgress.set(true);
    this.saveEmployee.emit();
  }

  protected stopModalClose(event: Event): void {
    event.stopPropagation();
  }

  protected hasEmployeeControlError(controlName: string, error: string): boolean {
    const control = this.employeeForm().get(controlName);
    return !!control && control.touched && control.hasError(error);
  }
}

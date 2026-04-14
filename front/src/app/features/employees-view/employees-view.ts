import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Employee } from '../../core/dotacion.models';

@Component({
  selector: 'app-employees-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employees-view.html',
})
export class EmployeesView {
  employeeForm = input.required<FormGroup>();
  editingEmployeeId = input<string | null>(null);
  canManage = input(false);

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
}

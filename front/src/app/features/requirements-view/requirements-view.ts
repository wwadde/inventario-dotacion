import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Employee, ItemType, Requirement } from '../../core/dotacion.models';

@Component({
  selector: 'app-requirements-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './requirements-view.html',
})
export class RequirementsView {
  requirementForm = input.required<FormGroup>();
  employees = input.required<Employee[]>();
  items = input.required<ItemType[]>();
  canManage = input(false);

  requirementQuery = input('');
  filteredCount = input(0);
  paginatedRequirements = input.required<Requirement[]>();
  currentPage = input(1);
  totalPages = input(1);

  setRequirementQuery = output<string>();
  createRequirement = output<void>();
  deleteRequirement = output<Requirement>();
  previousPage = output<void>();
  nextPage = output<void>();
}

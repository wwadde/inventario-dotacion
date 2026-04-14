import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Employee, ItemType, Requirement, RequirementStatusFilter } from '../../core/dotacion.models';

@Component({
  selector: 'app-requirements-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './requirements-view.html',
})
export class RequirementsView {
  requirementForm = input.required<FormGroup>();
  editingRequirementId = input<string | null>(null);
  submitState = input<'idle' | 'success' | 'error'>('idle');
  employees = input.required<Employee[]>();
  items = input.required<ItemType[]>();
  canManage = input(false);
  statusFilter = input<RequirementStatusFilter>('OPEN');

  requirementQuery = input('');
  filteredCount = input(0);
  paginatedRequirements = input.required<Requirement[]>();
  currentPage = input(1);
  totalPages = input(1);

  setRequirementQuery = output<string>();
  setStatusFilter = output<RequirementStatusFilter>();
  saveRequirement = output<void>();
  cancelEdition = output<void>();
  editRequirement = output<Requirement>();
  deleteRequirement = output<Requirement>();
  previousPage = output<void>();
  nextPage = output<void>();

  protected readonly formModalOpen = signal(false);
  protected readonly submitInProgress = signal(false);

  protected readonly dotacionItems = computed(() =>
    this.items().filter((item) => item.category === 'DOTACION'),
  );

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

  protected openEditModal(requirement: Requirement): void {
    if (requirement.closed) {
      return;
    }

    this.editRequirement.emit(requirement);
    this.formModalOpen.set(true);
  }

  protected canEditRequirement(requirement: Requirement): boolean {
    return this.canManage() && !requirement.closed;
  }

  protected closeModal(): void {
    this.cancelEdition.emit();
    this.submitInProgress.set(false);
    this.formModalOpen.set(false);
  }

  protected submitForm(): void {
    if (!this.canManage()) {
      return;
    }

    if (this.requirementForm().invalid) {
      this.requirementForm().markAllAsTouched();
      return;
    }

    this.submitInProgress.set(true);
    this.saveRequirement.emit();
  }

  protected stopModalClose(event: Event): void {
    event.stopPropagation();
  }

  protected hasControlError(controlName: string, error: string): boolean {
    const control = this.requirementForm().get(controlName);
    return !!control && control.touched && control.hasError(error);
  }
}

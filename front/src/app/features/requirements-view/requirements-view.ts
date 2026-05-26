import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee, ItemSizeType, ItemType, Requirement, RequirementStatusFilter } from '../../core/dotacion.models';

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
  protected readonly clothingSizes = ['XS', 'S', 'M', 'L', 'XL'];
  protected readonly shoeSizes = [
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
  ];

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
    this.onItemTypeChanged();
  }

  protected openEditModal(requirement: Requirement): void {
    if (requirement.closed) {
      return;
    }

    this.editRequirement.emit(requirement);
    this.formModalOpen.set(true);
    this.onItemTypeChanged();
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

  protected onItemTypeChanged(): void {
    const itemTypeId = this.requirementForm().controls['itemTypeId']?.value ?? '';
    const sizeType = this.sizeTypeForItemId(itemTypeId);
    const sizeControl = this.requirementForm().get('size');
    if (!sizeControl) {
      return;
    }

    const requiresSize = sizeType !== 'NONE';
    sizeControl.setValidators(requiresSize ? [Validators.required, Validators.maxLength(40)] : [Validators.maxLength(40)]);
    sizeControl.updateValueAndValidity({ emitEvent: false });

    if (!requiresSize) {
      sizeControl.setValue('');
    }
  }

  protected shouldShowSize(): boolean {
    const itemTypeId = this.requirementForm().controls['itemTypeId']?.value ?? '';
    const sizeType = this.sizeTypeForItemId(itemTypeId);
    return sizeType === 'ROPA' || sizeType === 'CALZADO';
  }

  protected sizeOptionsForSelection(): string[] {
    const itemTypeId = this.requirementForm().controls['itemTypeId']?.value ?? '';
    const sizeType = this.sizeTypeForItemId(itemTypeId);
    return sizeType === 'CALZADO' ? this.shoeSizes : this.clothingSizes;
  }

  private sizeTypeForItemId(itemTypeId: string): ItemSizeType {
    if (!itemTypeId) {
      return 'NONE';
    }

    const item = this.items().find((registeredItem) => registeredItem.id === itemTypeId);
    return item?.sizeType ?? 'NONE';
  }
}

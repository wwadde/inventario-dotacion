import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ItemCategory, ItemSizeType, ItemType, StockMovement } from '../../core/dotacion.models';

@Component({
  selector: 'app-items-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './items-view.html',
})
export class ItemsView {
  private readonly fb = inject(NonNullableFormBuilder);

  itemForm = input.required<FormGroup>();
  editingItemId = input<string | null>(null);
  submitState = input<'idle' | 'success' | 'error'>('idle');
  stockSubmitState = input<'idle' | 'success' | 'error'>('idle');
  selectedStockItemId = input<string | null>(null);
  stockMovements = input.required<StockMovement[]>();
  canManage = input(false);

  itemCategories = input.required<ItemCategory[]>();
  itemCategoryLabel = input.required<Record<ItemCategory, string>>();
  itemSizeTypes = input.required<ItemSizeType[]>();
  itemSizeTypeLabel = input.required<Record<ItemSizeType, string>>();

  itemQuery = input('');
  filteredCount = input(0);
  paginatedItems = input.required<ItemType[]>();
  currentPage = input(1);
  totalPages = input(1);

  setItemQuery = output<string>();
  saveItem = output<void>();
  addInboundStock = output<{ itemId: string; quantity: number; reason: string | null }>();
  selectStockMovementItem = output<string | null>();
  cancelEdition = output<void>();
  editItem = output<ItemType>();
  deactivateItem = output<ItemType>();
  previousPage = output<void>();
  nextPage = output<void>();

  protected readonly formModalOpen = signal(false);
  protected readonly submitInProgress = signal(false);
  protected readonly stockModalOpen = signal(false);
  protected readonly stockSubmitInProgress = signal(false);
  protected readonly stockItem = signal<ItemType | null>(null);

  protected readonly stockForm = this.fb.group({
    quantity: this.fb.control(1, [Validators.required, Validators.min(1)]),
    reason: this.fb.control('', [Validators.maxLength(400)]),
  });

  protected readonly stockMovementsForSelectedItem = computed(() => {
    const selectedItemId = this.selectedStockItemId();
    if (!selectedItemId) {
      return this.stockMovements();
    }
    return this.stockMovements().filter((movement) => movement.itemTypeId === selectedItemId);
  });

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

    effect(() => {
      if (!this.stockSubmitInProgress()) {
        return;
      }

      const state = this.stockSubmitState();
      if (state === 'success') {
        this.closeStockModal();
      }

      if (state === 'error') {
        this.stockSubmitInProgress.set(false);
      }
    });
  }

  protected openCreateModal(): void {
    this.cancelEdition.emit();
    this.formModalOpen.set(true);
  }

  protected openEditModal(item: ItemType): void {
    this.editItem.emit(item);
    this.formModalOpen.set(true);
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

    if (this.itemForm().invalid) {
      this.itemForm().markAllAsTouched();
      return;
    }

    this.submitInProgress.set(true);
    this.saveItem.emit();
  }

  protected openStockModal(item: ItemType): void {
    this.stockItem.set(item);
    this.stockForm.reset({ quantity: 1, reason: '' });
    this.stockSubmitInProgress.set(false);
    this.stockModalOpen.set(true);
    this.selectStockMovementItem.emit(item.id);
  }

  protected closeStockModal(): void {
    this.stockSubmitInProgress.set(false);
    this.stockModalOpen.set(false);
    this.stockItem.set(null);
    this.stockForm.reset({ quantity: 1, reason: '' });
  }

  protected submitStockForm(): void {
    if (!this.canManage()) {
      return;
    }

    const item = this.stockItem();
    if (!item) {
      return;
    }

    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      return;
    }

    this.stockSubmitInProgress.set(true);
    this.addInboundStock.emit({
      itemId: item.id,
      quantity: this.stockForm.controls.quantity.value,
      reason: this.stockForm.controls.reason.value.trim() || null,
    });
  }

  protected openAllMovements(): void {
    this.selectStockMovementItem.emit(null);
  }

  protected movementTypeLabel(type: StockMovement['movementType']): string {
    if (type === 'INBOUND') {
      return 'Ingreso';
    }
    if (type === 'OUTBOUND') {
      return 'Salida';
    }
    return 'Ajuste';
  }

  protected movementTypeClass(type: StockMovement['movementType']): string {
    if (type === 'INBOUND') {
      return 'chip chip-inbound';
    }
    if (type === 'OUTBOUND') {
      return 'chip chip-outbound';
    }
    return 'chip';
  }

  protected stopModalClose(event: Event): void {
    event.stopPropagation();
  }

  protected hasItemControlError(controlName: string, error: string): boolean {
    const control = this.itemForm().get(controlName);
    return !!control && control.touched && control.hasError(error);
  }

  protected hasStockControlError(controlName: string, error: string): boolean {
    const control = this.stockForm.get(controlName);
    return !!control && control.touched && control.hasError(error);
  }

  protected isDotacionCategory(): boolean {
    return this.itemForm().controls['category']?.value === 'DOTACION';
  }

  protected onCategoryChanged(): void {
    if (!this.isDotacionCategory()) {
      this.itemForm().controls['sizeType']?.setValue('NONE');
    }
  }
}

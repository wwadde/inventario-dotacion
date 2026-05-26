import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Delivery, DeliveryType, Employee, ItemSizeType, ItemType, Requirement } from '../../core/dotacion.models';
import { SignaturePad } from '../../shared/signature-pad/signature-pad';
import { CameraCapture } from '../../shared/camera-capture/camera-capture';

@Component({
  selector: 'app-deliveries-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, SignaturePad, CameraCapture],
  templateUrl: './deliveries-view.html',
})
export class DeliveriesView {
  deliveryForm = input.required<FormGroup>();
  deliveryItems = input.required<FormArray>();
  submitState = input<'idle' | 'success' | 'error'>('idle');
  validationErrors = input<Record<string, string[]>>({});
  employees = input.required<Employee[]>();
  items = input.required<ItemType[]>();
  requirements = input.required<Requirement[]>();
  allDeliveries = input.required<Delivery[]>();
  canManage = input(false);

  deliveryQuery = input('');
  filteredCount = input(0);
  paginatedDeliveries = input.required<Delivery[]>();
  currentPage = input(1);
  totalPages = input(1);

  setDeliveryQuery = output<string>();
  createDelivery = output<void>();
  addDeliveryItem = output<void>();
  removeDeliveryItem = output<number>();
  signatureChange = output<string | null>();
  viewCertificate = output<Delivery>();
  previousPage = output<void>();
  nextPage = output<void>();

  protected readonly formModalOpen = signal(false);
  protected readonly submitInProgress = signal(false);
  protected readonly evidenceMode = signal<'signature' | 'photo'>('signature');
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
    this.formModalOpen.set(true);
    this.evidenceMode.set('signature');
    this.signatureChange.emit(null);
    this.resetItemsForCurrentMode();
  }

  protected closeModal(): void {
    this.submitInProgress.set(false);
    this.formModalOpen.set(false);
    this.evidenceMode.set('signature');
    this.signatureChange.emit(null);
  }

  protected submitDelivery(): void {
    if (!this.canManage()) {
      return;
    }

    if (this.deliveryForm().invalid) {
      this.deliveryForm().markAllAsTouched();
      return;
    }

    this.submitInProgress.set(true);
    this.createDelivery.emit();
  }

  protected stopModalClose(event: Event): void {
    event.stopPropagation();
  }

  protected hasControlError(controlName: string, error: string): boolean {
    const control = this.deliveryForm().get(controlName);
    return !!control && control.touched && control.hasError(error);
  }

  protected hasItemControlError(index: number, controlName: string, error: string): boolean {
    const group = this.deliveryItems().at(index);
    const control = group?.get(controlName);
    return !!control && control.touched && control.hasError(error);
  }

  protected selectedDeliveryType(): DeliveryType {
    const current = this.deliveryForm().controls['deliveryType']?.value;
    return current === 'REGALOS' ? 'REGALOS' : 'IMPLEMENTOS';
  }

  protected selectedEmployeeId(): string {
    return this.deliveryForm().controls['employeeId']?.value ?? '';
  }

  protected modeItems(): ItemType[] {
    const mode = this.selectedDeliveryType();
    if (mode === 'REGALOS') {
      return this.items().filter((item) => item.category === 'REGALO');
    }

    const employeeId = this.selectedEmployeeId();
    if (!employeeId) {
      return [];
    }

    const pendingByItem = this.pendingDotacionQuantityByItemForEmployee(employeeId);
    return this.items().filter((item) => item.category === 'DOTACION' && (pendingByItem.get(item.id) ?? 0) > 0);
  }

  protected pendingQuantityForItem(itemTypeId: string): number {
    if (this.selectedDeliveryType() !== 'IMPLEMENTOS') {
      return 0;
    }

    const employeeId = this.selectedEmployeeId();
    if (!employeeId) {
      return 0;
    }

    return this.pendingDotacionQuantityByItemForEmployee(employeeId).get(itemTypeId) ?? 0;
  }

  protected resetItemsForCurrentMode(): void {
    const allowedItemIds = new Set(this.modeItems().map((item) => item.id));
    for (const itemGroupControl of this.deliveryItems().controls) {
      const itemGroup = itemGroupControl as FormGroup;
      const itemTypeControl = itemGroup.get('itemTypeId');
      const quantityControl = itemGroup.get('quantity');
      const sizeControl = itemGroup.get('size');
      const currentItemId = itemTypeControl?.value ?? '';
      if (currentItemId && !allowedItemIds.has(currentItemId)) {
        itemTypeControl?.setValue('');
        quantityControl?.setValue(1);
        sizeControl?.setValue('');
        this.applySizeValidators(itemGroup, 'NONE');
        continue;
      }

      const requirementSize = this.requirementSizeForItem(currentItemId);
      if (sizeControl) {
        if (requirementSize) {
          sizeControl.setValue(requirementSize);
          sizeControl.disable({ emitEvent: false });
        } else {
          sizeControl.enable({ emitEvent: false });
          sizeControl.setValue('');
        }
      }

      this.applySizeValidators(itemGroup, this.sizeTypeForItemId(currentItemId));
    }
  }

  protected onItemTypeSelected(index: number): void {
    if (this.selectedDeliveryType() !== 'IMPLEMENTOS') {
      return;
    }

    const itemGroup = this.deliveryItems().at(index) as FormGroup | null;
    const itemTypeId = itemGroup?.get('itemTypeId')?.value ?? '';
    if (!itemTypeId) {
      return;
    }

    const item = this.items().find((registeredItem) => registeredItem.id === itemTypeId);
    if (!item) {
      return;
    }

    const requirementSize = this.requirementSizeForItem(itemTypeId);
    const sizeControl = itemGroup?.get('size');
    if (sizeControl) {
      if (requirementSize) {
        sizeControl.setValue(requirementSize);
        sizeControl.disable({ emitEvent: false });
      } else {
        sizeControl.enable({ emitEvent: false });
        sizeControl.setValue('');
      }
    }

    this.applySizeValidators(itemGroup, item.sizeType);

    const pendingQuantity = this.pendingQuantityForItem(itemTypeId);
    const suggestedQuantity = Math.max(1, Math.min(pendingQuantity, item.availableStock));
    itemGroup?.get('quantity')?.setValue(suggestedQuantity);
  }

  protected shouldShowSize(index: number): boolean {
    if (this.selectedDeliveryType() !== 'IMPLEMENTOS') {
      return false;
    }

    const itemTypeId = this.deliveryItems().at(index)?.get('itemTypeId')?.value ?? '';
    const sizeType = this.sizeTypeForItemId(itemTypeId);
    return sizeType === 'ROPA' || sizeType === 'CALZADO';
  }

  protected sizeOptionsForItem(index: number): string[] {
    const itemTypeId = this.deliveryItems().at(index)?.get('itemTypeId')?.value ?? '';
    const sizeType = this.sizeTypeForItemId(itemTypeId);
    return sizeType === 'CALZADO' ? this.shoeSizes : this.clothingSizes;
  }

  protected backendErrorsForControl(controlName: string): string[] {
    return this.validationErrors()[controlName] ?? [];
  }

  protected backendErrorsForItemControl(index: number, controlName: string): string[] {
    return this.validationErrors()[`items[${index}].${controlName}`] ?? [];
  }

  protected setEvidenceMode(mode: 'signature' | 'photo'): void {
    if (this.evidenceMode() === mode) {
      return;
    }

    this.evidenceMode.set(mode);
    this.signatureChange.emit(null);
  }

  protected onSignatureChanged(dataUrl: string | null): void {
    if (this.evidenceMode() !== 'signature') {
      return;
    }

    this.signatureChange.emit(dataUrl);
  }

  protected onPhotoChanged(dataUrl: string | null): void {
    if (this.evidenceMode() !== 'photo') {
      return;
    }

    this.signatureChange.emit(dataUrl);
  }

  private pendingDotacionQuantityByItemForEmployee(employeeId: string): Map<string, number> {
    const pendingByItem = new Map<string, number>();
    const employeeImplementosDeliveries = this.allDeliveries().filter(
      (delivery) => delivery.employeeId === employeeId && delivery.deliveryType === 'IMPLEMENTOS',
    );

    for (const requirement of this.requirements()) {
      if (requirement.employeeId !== employeeId) {
        continue;
      }

      const requirementStartTime = new Date(requirement.createdAt).getTime();
      let deliveredForRequirement = 0;

      for (const delivery of employeeImplementosDeliveries) {
        const deliveryCreatedAt = new Date(delivery.createdAt).getTime();
        if (deliveryCreatedAt < requirementStartTime) {
          continue;
        }

        for (const item of delivery.items) {
          if (item.itemTypeId === requirement.itemTypeId) {
            deliveredForRequirement += item.quantity;
          }
        }
      }

      const pendingQuantity = Math.max(0, requirement.requestedQuantity - deliveredForRequirement);
      if (pendingQuantity > 0) {
        pendingByItem.set(requirement.itemTypeId, pendingQuantity);
      }
    }

    return pendingByItem;
  }

  private sizeTypeForItemId(itemTypeId: string): ItemSizeType {
    if (!itemTypeId) {
      return 'NONE';
    }

    const item = this.items().find((registeredItem) => registeredItem.id === itemTypeId);
    return item?.sizeType ?? 'NONE';
  }

  private requirementSizeForItem(itemTypeId: string): string | null {
    if (!itemTypeId || !this.selectedEmployeeId()) {
      return null;
    }

    const requirement = this.requirements().find(
      (entry) => entry.employeeId === this.selectedEmployeeId() && entry.itemTypeId === itemTypeId,
    );

    return requirement?.size ?? null;
  }

  private applySizeValidators(itemGroup: FormGroup | null, sizeType: ItemSizeType): void {
    if (!itemGroup) {
      return;
    }

    const sizeControl = itemGroup.get('size');
    if (!sizeControl) {
      return;
    }

    const requiresSize = this.selectedDeliveryType() === 'IMPLEMENTOS' && sizeType !== 'NONE';
    const validators = requiresSize ? [Validators.required, Validators.maxLength(40)] : [Validators.maxLength(40)];
    sizeControl.setValidators(validators);
    sizeControl.updateValueAndValidity({ emitEvent: false });

    if (!requiresSize) {
      sizeControl.disable({ emitEvent: false });
      if (sizeControl.value) {
        sizeControl.setValue('');
      }
      return;
    }

    if (!sizeControl.disabled) {
      sizeControl.enable({ emitEvent: false });
    }
  }
}

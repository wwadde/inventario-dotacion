import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Delivery, Employee, ItemType } from '../../core/dotacion.models';
import { SignaturePad } from '../../shared/signature-pad/signature-pad';

@Component({
  selector: 'app-deliveries-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, SignaturePad],
  templateUrl: './deliveries-view.html',
})
export class DeliveriesView {
  deliveryForm = input.required<FormGroup>();
  deliveryItems = input.required<FormArray>();
  employees = input.required<Employee[]>();
  items = input.required<ItemType[]>();
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
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ItemCategory, ItemType } from '../../core/dotacion.models';

@Component({
  selector: 'app-items-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './items-view.html',
})
export class ItemsView {
  itemForm = input.required<FormGroup>();
  editingItemId = input<string | null>(null);
  canManage = input(false);

  itemCategories = input.required<ItemCategory[]>();
  itemCategoryLabel = input.required<Record<ItemCategory, string>>();

  itemQuery = input('');
  filteredCount = input(0);
  paginatedItems = input.required<ItemType[]>();
  currentPage = input(1);
  totalPages = input(1);

  setItemQuery = output<string>();
  saveItem = output<void>();
  cancelEdition = output<void>();
  editItem = output<ItemType>();
  deactivateItem = output<ItemType>();
  previousPage = output<void>();
  nextPage = output<void>();
}

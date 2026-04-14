import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceRow, ComplianceStatus } from '../../core/dotacion.models';

@Component({
  selector: 'app-reports-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './reports-view.html',
})
export class ReportsView {
  canManage = input(false);

  complianceFilter = input<ComplianceStatus>('ALL');
  reportQuery = input('');
  paginatedComplianceRows = input.required<ComplianceRow[]>();
  labelForStatus = input.required<(status: 'PENDING' | 'UP_TO_DATE') => string>();

  currentPage = input(1);
  totalPages = input(1);

  setComplianceFilter = output<ComplianceStatus>();
  setReportQuery = output<string>();
  exportComplianceExcel = output<void>();
  previousPage = output<void>();
  nextPage = output<void>();
}

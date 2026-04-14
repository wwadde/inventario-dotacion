import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardSummary, Delivery, ComplianceRow } from '../../core/dotacion.models';

@Component({
  selector: 'app-dashboard-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './dashboard-view.html',
})
export class DashboardView {
  dashboard = input<DashboardSummary | null>(null);
  pendingRows = input.required<ComplianceRow[]>();
  recentDeliveries = input.required<Delivery[]>();
  canManage = input(false);

  viewCertificate = output<Delivery>();
}

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardSummary, Delivery, ComplianceRow, Employee } from '../../core/dotacion.models';
import { BirthdayYearCalendar } from './birthday-year-calendar/birthday-year-calendar';

type DashboardTargetView = 'employees' | 'items' | 'deliveries-implementos' | 'reports';

@Component({
  selector: 'app-dashboard-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BirthdayYearCalendar],
  templateUrl: './dashboard-view.html',
})
export class DashboardView {
  dashboard = input<DashboardSummary | null>(null);
  employees = input.required<Employee[]>();
  pendingRows = input.required<ComplianceRow[]>();
  recentDeliveries = input.required<Delivery[]>();
  activeEmployeesCount = input(0);
  pendingEmployeesCount = input(0);
  upToDateEmployeesCount = input(0);
  complianceCoveragePercent = input(0);
  pendingEmployeesPercent = input(0);
  pendingRequirementTotal = input(0);
  deliveredRequirementsTotal = input(0);
  deliveredRequirementsPercent = input(0);
  pendingRequirementsPercent = input(0);
  deliveredCostThisMonth = input(0);
  pendingEstimatedCost = input(0);
  birthdaysToday = input(0);
  canManage = input(false);

  readonly coverageDonutBackground = computed(() => {
    const coverage = this.clampPercent(this.complianceCoveragePercent());
    return `conic-gradient(#2f7f65 0 ${coverage}%, #cd7a46 ${coverage}% 100%)`;
  });

  readonly deliveredCostPercent = computed(() =>
    this.calculatePercent(this.deliveredCostThisMonth(), this.totalTrackedCost()),
  );

  readonly pendingCostPercent = computed(() =>
    this.calculatePercent(this.pendingEstimatedCost(), this.totalTrackedCost()),
  );

  openView = output<DashboardTargetView>();
  viewCertificate = output<Delivery>();

  private totalTrackedCost(): number {
    return Math.max(0, this.deliveredCostThisMonth() + this.pendingEstimatedCost());
  }

  private calculatePercent(part: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    return this.clampPercent((part / total) * 100);
  }

  private clampPercent(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
  }
}

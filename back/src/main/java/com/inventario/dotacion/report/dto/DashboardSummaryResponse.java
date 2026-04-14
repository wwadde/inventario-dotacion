package com.inventario.dotacion.report.dto;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
        long totalActiveEmployees,
        long pendingEmployees,
        long upToDateEmployees,
        long deliveriesThisMonth,
        long totalRequirements,
        long deliveredRequirements,
        long pendingRequirements,
        double deliveredRequirementsPercent,
        double pendingRequirementsPercent,
        BigDecimal deliveredCostThisMonth,
        BigDecimal pendingEstimatedCost,
        long birthdaysToday
) {
}

package com.inventario.dotacion.report.dto;

public record DashboardSummaryResponse(
        long totalActiveEmployees,
        long pendingEmployees,
        long upToDateEmployees,
        long deliveriesThisMonth
) {
}

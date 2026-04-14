package com.inventario.dotacion.report.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.inventario.dotacion.report.ComplianceStatus;

public record ComplianceRowResponse(
        UUID employeeId,
        String employeeDocument,
        String employeeName,
        String area,
        int totalRequirements,
        int pendingRequirements,
        int upToDateRequirements,
        LocalDate nextDueDate,
        String pendingItems,
        ComplianceStatus status
) {
}

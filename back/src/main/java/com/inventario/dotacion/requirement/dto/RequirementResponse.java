package com.inventario.dotacion.requirement.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record RequirementResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        String employeeDocument,
        UUID itemTypeId,
        String itemCode,
        String itemName,
        int periodicityMonths,
        LocalDate effectiveFrom,
        String notes,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}

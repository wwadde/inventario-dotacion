package com.inventario.dotacion.requirement.dto;

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
        int requestedQuantity,
        String size,
        String notes,
        boolean closed,
        OffsetDateTime closedAt,
        String closedBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}

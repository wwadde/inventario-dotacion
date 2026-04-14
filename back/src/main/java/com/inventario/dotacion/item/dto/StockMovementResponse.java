package com.inventario.dotacion.item.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.inventario.dotacion.item.stock.StockMovementType;

public record StockMovementResponse(
        UUID id,
        UUID itemTypeId,
        String itemCode,
        String itemName,
        StockMovementType movementType,
        int quantity,
        int stockBefore,
        int stockAfter,
        String reason,
        String referenceType,
        UUID referenceId,
        String performedBy,
        OffsetDateTime performedAt
) {
}

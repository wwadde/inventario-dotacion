package com.inventario.dotacion.item.dto;

import java.time.OffsetDateTime;
import java.math.BigDecimal;
import java.util.UUID;

import com.inventario.dotacion.item.ItemCategory;
import com.inventario.dotacion.item.ItemSizeType;

public record ItemTypeResponse(
        UUID id,
        String code,
        String name,
        ItemCategory category,
        ItemSizeType sizeType,
        String description,
        BigDecimal unitCost,
        int availableStock,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}

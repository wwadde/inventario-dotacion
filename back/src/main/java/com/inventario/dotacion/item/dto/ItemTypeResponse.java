package com.inventario.dotacion.item.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.inventario.dotacion.item.ItemCategory;

public record ItemTypeResponse(
        UUID id,
        String code,
        String name,
        ItemCategory category,
        String description,
        int defaultPeriodicityMonths,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}

package com.inventario.dotacion.delivery.dto;

import java.util.UUID;

import com.inventario.dotacion.item.ItemCategory;

public record DeliveryItemResponse(
        UUID id,
        UUID itemTypeId,
        String itemCode,
        String itemName,
        ItemCategory category,
        String size,
        int quantity
) {
}

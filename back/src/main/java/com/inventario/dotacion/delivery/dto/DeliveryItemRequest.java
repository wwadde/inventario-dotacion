package com.inventario.dotacion.delivery.dto;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record DeliveryItemRequest(
        @NotNull(message = "El implemento es obligatorio")
        UUID itemTypeId,

        @Min(value = 1, message = "La cantidad minima es 1")
        int quantity
) {
}

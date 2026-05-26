package com.inventario.dotacion.delivery.dto;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DeliveryItemRequest(
        @NotNull(message = "El implemento es obligatorio")
        UUID itemTypeId,

        @Size(max = 40, message = "La talla no puede superar 40 caracteres")
        String size,

        @Min(value = 1, message = "La cantidad minima es 1")
        int quantity
) {
}

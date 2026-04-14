package com.inventario.dotacion.item.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ItemStockInboundRequest(
        @NotNull(message = "La cantidad a ingresar es obligatoria")
        @Min(value = 1, message = "La cantidad a ingresar debe ser mayor a cero")
        int quantity,

        @Size(max = 400, message = "La observacion no puede superar 400 caracteres")
        String reason
) {
}

package com.inventario.dotacion.requirement.dto;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RequirementUpsertRequest(
        @NotNull(message = "El empleado es obligatorio")
        UUID employeeId,

        @NotNull(message = "El implemento es obligatorio")
        UUID itemTypeId,

        @NotNull(message = "La cantidad solicitada es obligatoria")
        @Min(value = 1, message = "La cantidad solicitada debe ser mayor a cero")
        int requestedQuantity,

        @Size(max = 40, message = "La talla no puede superar 40 caracteres")
        String size,

        @Size(max = 500, message = "Las notas no pueden superar 500 caracteres")
        String notes
) {
}

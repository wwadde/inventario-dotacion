package com.inventario.dotacion.requirement.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RequirementUpsertRequest(
        @NotNull(message = "El empleado es obligatorio")
        UUID employeeId,

        @NotNull(message = "El implemento es obligatorio")
        UUID itemTypeId,

        @Min(value = 1, message = "La periodicidad minima es 1 mes")
        @Max(value = 60, message = "La periodicidad maxima es 60 meses")
        int periodicityMonths,

        @NotNull(message = "La fecha de inicio es obligatoria")
        LocalDate effectiveFrom,

        @Size(max = 500, message = "Las notas no pueden superar 500 caracteres")
        String notes
) {
}

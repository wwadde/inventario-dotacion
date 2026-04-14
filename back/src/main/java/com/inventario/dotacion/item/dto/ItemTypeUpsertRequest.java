package com.inventario.dotacion.item.dto;

import com.inventario.dotacion.item.ItemCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ItemTypeUpsertRequest(
        @NotBlank(message = "El codigo es obligatorio")
        @Size(max = 30, message = "El codigo no puede superar 30 caracteres")
        String code,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 140, message = "El nombre no puede superar 140 caracteres")
        String name,

        @NotNull(message = "La categoria es obligatoria")
        ItemCategory category,

        @Size(max = 500, message = "La descripcion no puede superar 500 caracteres")
        String description,

        @Min(value = 1, message = "La periodicidad minima es 1 mes")
        @Max(value = 60, message = "La periodicidad maxima es 60 meses")
        int defaultPeriodicityMonths,

        Boolean active
) {
}

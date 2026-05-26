package com.inventario.dotacion.item.dto;

import java.math.BigDecimal;

import com.inventario.dotacion.item.ItemCategory;
import com.inventario.dotacion.item.ItemSizeType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
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

        ItemSizeType sizeType,

        @Size(max = 500, message = "La descripcion no puede superar 500 caracteres")
        String description,

        @NotNull(message = "El costo unitario es obligatorio")
        @DecimalMin(value = "0.00", message = "El costo unitario no puede ser negativo")
        @Digits(integer = 12, fraction = 2, message = "El costo unitario admite hasta 2 decimales")
        BigDecimal unitCost,

        @NotNull(message = "El stock disponible es obligatorio")
        @Min(value = 0, message = "El stock disponible no puede ser negativo")
        int availableStock,

        Boolean active
) {
}

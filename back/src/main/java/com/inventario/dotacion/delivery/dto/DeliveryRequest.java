package com.inventario.dotacion.delivery.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.delivery.DeliveryType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DeliveryRequest(
        @NotNull(message = "El empleado es obligatorio")
        UUID employeeId,

        DeliveryType deliveryType,

        LocalDate deliveredAt,

        @NotBlank(message = "Debe indicar quien entrega")
        @Size(max = 140, message = "El campo quien entrega no puede superar 140 caracteres")
        String deliveredBy,

        @Size(max = 140, message = "El nombre de quien firma no puede superar 140 caracteres")
        String signerName,

        @Size(max = 1000, message = "Las notas no pueden superar 1000 caracteres")
        String notes,

        String signatureDataUrl,

        Boolean duplicateAcknowledged,

        @NotEmpty(message = "Debe registrar al menos un implemento")
        List<@Valid DeliveryItemRequest> items
) {
}

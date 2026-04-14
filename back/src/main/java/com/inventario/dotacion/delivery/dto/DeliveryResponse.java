package com.inventario.dotacion.delivery.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.delivery.DeliveryType;

public record DeliveryResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        String employeeDocument,
        DeliveryType deliveryType,
        String certificateNumber,
        LocalDate deliveredAt,
        String deliveredBy,
        String signerName,
        String notes,
        boolean duplicateAcknowledged,
        boolean signaturePresent,
        List<DeliveryItemResponse> items,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}

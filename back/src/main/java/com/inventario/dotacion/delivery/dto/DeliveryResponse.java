package com.inventario.dotacion.delivery.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record DeliveryResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        String employeeDocument,
        String certificateNumber,
        LocalDate deliveredAt,
        String deliveredBy,
        String signerName,
        String notes,
        boolean signaturePresent,
        List<DeliveryItemResponse> items,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}

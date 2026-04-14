package com.inventario.dotacion.delivery;

import java.time.LocalDate;
import java.util.UUID;

public record LastDeliverySnapshot(
        UUID employeeId,
        UUID itemTypeId,
        LocalDate lastDeliveredAt
) {
}

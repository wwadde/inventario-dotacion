package com.inventario.dotacion.delivery;

import java.util.UUID;

public record EmployeeItemDeliveredSummary(
        UUID employeeId,
        UUID itemTypeId,
        long deliveredQuantity
) {
}

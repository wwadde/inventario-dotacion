package com.inventario.dotacion.employee.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EmployeeResponse(
        UUID id,
        String documentNumber,
        String firstName,
        String lastName,
        String fullName,
        String email,
        String phone,
        String area,
        String position,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}

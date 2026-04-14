package com.inventario.dotacion.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmployeeUpsertRequest(
        @NotBlank(message = "El documento es obligatorio")
        @Size(max = 40, message = "El documento no puede superar 40 caracteres")
        String documentNumber,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre no puede superar 120 caracteres")
        String firstName,

        @NotBlank(message = "El apellido es obligatorio")
        @Size(max = 120, message = "El apellido no puede superar 120 caracteres")
        String lastName,

        @Email(message = "El correo no tiene un formato valido")
        @Size(max = 200, message = "El correo no puede superar 200 caracteres")
        String email,

        @Size(max = 50, message = "El telefono no puede superar 50 caracteres")
        String phone,

        @Size(max = 120, message = "El area no puede superar 120 caracteres")
        String area,

        @Size(max = 120, message = "El cargo no puede superar 120 caracteres")
        String position,

        Boolean active
) {
}

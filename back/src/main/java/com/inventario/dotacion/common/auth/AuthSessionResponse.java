package com.inventario.dotacion.common.auth;

import java.util.List;

public record AuthSessionResponse(
        String username,
        boolean authenticated,
        List<String> roles
) {
}
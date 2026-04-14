package com.inventario.dotacion.common.auth;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public AuthSessionResponse login(Authentication authentication) {
        return buildResponse(authentication);
    }

    @GetMapping("/me")
    public AuthSessionResponse me(Authentication authentication) {
        return buildResponse(authentication);
    }

    private AuthSessionResponse buildResponse(Authentication authentication) {
        List<String> roles = authentication.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority())
                .toList();

        return new AuthSessionResponse(
                authentication.getName(),
                authentication.isAuthenticated(),
                roles
        );
    }
}
package com.inventario.dotacion.common.security;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class DataPrivacyService {

    public String maskDocument(String documentNumber) {
        if (!StringUtils.hasText(documentNumber)) {
            return null;
        }

        String sanitized = documentNumber.trim();
        int length = sanitized.length();
        if (length <= 4) {
            return "****";
        }

        return "*".repeat(length - 4) + sanitized.substring(length - 4);
    }

    public String maskEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return null;
        }

        String value = email.trim();
        int atIndex = value.indexOf('@');
        if (atIndex <= 0) {
            return "***";
        }

        String localPart = value.substring(0, atIndex);
        String domainPart = value.substring(atIndex);
        String prefix = localPart.substring(0, 1);

        return prefix + "***" + domainPart;
    }

    public String maskPhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return null;
        }

        String sanitized = phone.trim();
        int length = sanitized.length();
        if (length <= 4) {
            return "****";
        }

        return "***" + sanitized.substring(length - 4);
    }
}
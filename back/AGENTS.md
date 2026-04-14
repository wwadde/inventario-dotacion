# AGENTS - Backend Dotacion

## Stack
- Java 25
- Spring Boot 4
- Spring Data JPA
- PostgreSQL
- Flyway
- Apache POI (Excel)
- OpenPDF (certificados PDF)

## Modulos implementados
- employee: gestion de empleados
- item: catalogo de implementos
- requirement: asignacion de implementos requeridos por empleado
- delivery: registro de entregas y certificado PDF
- report: dashboard y cumplimiento (pendientes/al dia) + exportacion Excel
- common: seguridad, CORS y manejo global de errores

## API principal
- /api/employees
- /api/items
- /api/requirements
- /api/deliveries
- /api/deliveries/{id}/certificate
- /api/reports/compliance
- /api/reports/compliance/export
- /api/dashboard/summary

## Reglas de negocio clave
- Un requerimiento por empleado + implemento (unico).
- El cumplimiento se calcula por fecha de ultima entrega + periodicidad.
- Si la fecha de vencimiento es hoy o anterior, se marca pendiente.
- Las entregas almacenan firma en base64 decodificada como imagen.

## Variables de entorno
- DB_URL
- DB_USERNAME
- DB_PASSWORD
- CORS_ALLOWED_ORIGINS
- COMPANY_NAME
- SERVER_PORT

## Flujo de build
- Gradle task principal: ./gradlew clean bootJar
- Imagen Docker: back/Dockerfile

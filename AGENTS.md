# AGENTS - Inventario Dotacion

## Objetivo del proyecto
Aplicacion para gestionar dotaciones empresariales con:
- Control de empleados, implementos y periodicidades
- Registro de entregas con firma digital
- Generacion de certificados PDF por entrega
- Reportes de cumplimiento y exportacion Excel

## Arquitectura general
- Backend: Spring Boot 4 + Java 25 + PostgreSQL + Flyway
- Frontend: Angular 21 (standalone + signals + formularios reactivos)
- Proxy: Nginx en contenedor frontend hacia backend
- CI/CD: GitHub Actions publicando imagenes en GHCR

## Estado de implementacion
- Backend operativo con API REST para empleados, implementos, requerimientos, entregas, dashboard y reportes.
- Frontend operativo con modulos funcionales para CRUDs, firma en pantalla y descarga de archivos.
- Dockerfiles listos para backend y frontend.
- Workflow de imagenes a GHCR para backend y frontend.

## Documentos por capa
- Backend: ver back/AGENTS.md
- Frontend: ver front/AGENTS.md

## Despliegue sugerido
1. Publicar imagenes desde GitHub Actions.
2. En la VPS (Dokploy), crear servicios para postgres, backend y frontend.
3. Configurar BACKEND_URL del frontend y variables DB del backend.
4. Exponer solo frontend en HTTP/HTTPS y dejar backend interno.

# Contribuir a GTEL Talento

## Flujo de trabajo

- Crear una rama `feature/<tema>` o `fix/<tema>` desde la rama de integración acordada.
- Mantener cada pull request centrado en un cambio y explicar problema, comportamiento resultante, pruebas y cambios de base de datos.
- No subir directamente a `main`; solicitar revisión antes de integrar.
- Ejecutar las validaciones del módulo modificado antes del pull request.

## Seguridad y datos

- No versionar contraseñas, tokens, códigos OTP, archivos `.env`, `local.properties`, respaldos ni datos personales.
- Utilizar las plantillas `.env.example` y `local.properties.example`.
- No registrar contraseñas, JWT, códigos OTP ni contenido privado de currículums en logs o evidencias.
- Mantener desactivados los accesos especiales de prueba fuera del entorno local.

## Backend

- Mantener el flujo `Controller → Service → Repository`.
- Usar DTO validados para entradas y salidas; no exponer `password_hash` ni entidades sensibles.
- Colocar reglas y transacciones en servicios y persistencia SQL/JPA en repositorios.
- Incorporar pruebas de errores, permisos y propiedad de recursos.
- Agregar cambios de esquema como una migración SQL numerada; no editar migraciones ya aplicadas ni usar `ddl-auto=update`.
- Ejecutar desde `backend/`:

```powershell
mvn.cmd test
```

Consulta la [arquitectura del backend](docs/architecture/arquitectura-src.md).

## Frontend

- Mantener componentes reutilizables en `src/components`, estado compartido en `src/context`, acceso HTTP en `src/services` y páginas en `src/pages`.
- No simular una operación como exitosa cuando el backend la rechaza o no existe.
- Mantener las comprobaciones de autenticación en la interfaz sin tratarlas como sustituto de Spring Security.
- Ejecutar desde `frontend/`:

```powershell
npm.cmd run check
```

Consulta la [documentación del frontend](frontend/docs/README.md).

## Revisión del pull request

- Confirmar compatibilidad entre frontend, API y esquema MySQL.
- Verificar autorización por rol y propiedad del recurso.
- Revisar validaciones, estados de error, transacciones y ausencia de secretos.
- Actualizar README, documentación y migraciones cuando cambie el procedimiento.
- Registrar pruebas ejecutadas y limitaciones; una prueba unitaria no acredita por sí sola MySQL, Gmail o producción.

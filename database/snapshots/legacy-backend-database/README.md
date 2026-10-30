# Base de datos

- `schema/gtel_talento.sql`: instalacion inicial en una BD nueva desde DBeaver.
- `migrations/`: cambios manuales historicos; revisar requisitos antes de aplicar.

No hay ejecucion automatica de SQL ni Flyway configurado. No ejecutar la migracion 001 si telefono ya existe.

La migracion 002 agrega auth_email_challenges para OTP. Aplicar solo en bases existentes sin esa tabla; schema/gtel_talento.sql ya la incluye para nuevas instalaciones. No modifica usuarios existentes.

La migracion 003 agrega ADMIN y las columnas auth_version y otp_exempt de usuarios. Aplicar una sola vez despues de la 002, solo si esas columnas no existen. El esquema inicial actualizado ya incluye ambos cambios. Las cuentas de prueba se crean desde DevelopmentAccounts unicamente con app.security.test-access-enabled=true; no se guardan contraseñas en texto plano en SQL.

La migración 008 adapta las instalaciones que conservan la tabla `notificaciones` creada por la migración 004. Agrega de forma idempotente `tipo`, `enlace` y `created_at`, conserva los registros previos y debe aplicarse después de la 007.

La migración 009 normaliza el ciclo de vida de soporte. Crea `ticket_soporte_estados`, relaciona los estados actuales e históricos y crea `tickets_soporte_archivo`. Debe aplicarse después de la 008. El backend ejecuta una tarea cada lunes a las 02:00, zona `America/Lima`: archiva y elimina de las tablas operativas los casos `RESUELTO` o `CERRADO` con al menos siete días. El detalle de `ticket_soporte_historial` se elimina por cascada, mientras el resumen y la auditoría se conservan.

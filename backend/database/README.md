# Base de datos

La eliminación administrativa de cuentas requiere `migrations/006_audit_deleted_users.sql`, una sola vez después de 005. Conserva la identidad histórica en auditoría al eliminar una cuenta. Ver [reporte de administración](../docs/reporte-cambios-administracion.md).

La versión con papelera requiere `migrations/005_job_trash.sql`, después de 004 y antes de arrancar el backend. Crea `vacantes_papelera`. La eliminación definitiva programada a los 30 días incluye las postulaciones y documentos de la oferta; consultar la [guía](../docs/flujo-reclutamiento.md). El esquema inicial ya contiene esta tabla.

- `schema/gtel_talento.sql`: instalacion inicial en una BD nueva desde DBeaver.
- `migrations/`: cambios manuales historicos; revisar requisitos antes de aplicar.

No hay ejecucion automatica de SQL ni Flyway configurado. No ejecutar la migracion 001 si telefono ya existe.

La migracion 002 agrega auth_email_challenges para OTP. Aplicar solo en bases existentes sin esa tabla; schema/gtel_talento.sql ya la incluye para nuevas instalaciones. No modifica usuarios existentes.

La migracion 003 agrega ADMIN y las columnas auth_version y otp_exempt de usuarios. Aplicar una sola vez despues de la 002, solo si esas columnas no existen. El esquema inicial actualizado ya incluye ambos cambios. Las cuentas de prueba se crean desde DevelopmentAccounts unicamente con app.security.test-access-enabled=true; no se guardan contraseñas en texto plano en SQL.

La migración 004 incorpora perfiles de contacto, documentos PDF privados, recuperación de acceso y notificaciones. Aplicarla en bases existentes después de las anteriores; el esquema inicial ya la incluye. No se ejecuta automáticamente. Consultar la [guía del flujo de reclutamiento](../docs/flujo-reclutamiento.md) para preparación, configuración y pruebas.

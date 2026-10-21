# Base de datos

- `schema/gtel_talento.sql`: instalacion inicial en una BD nueva desde DBeaver.
- `migrations/`: cambios manuales historicos; revisar requisitos antes de aplicar.

No hay ejecucion automatica de SQL ni Flyway configurado. No ejecutar la migracion 001 si telefono ya existe.

La migracion 002 agrega auth_email_challenges para OTP. Aplicar solo en bases existentes sin esa tabla; schema/gtel_talento.sql ya la incluye para nuevas instalaciones. No modifica usuarios existentes.

La migracion 003 agrega ADMIN y las columnas auth_version y otp_exempt de usuarios. Aplicar una sola vez despues de la 002, solo si esas columnas no existen. El esquema inicial actualizado ya incluye ambos cambios. Las cuentas de prueba se crean desde DevelopmentAccounts unicamente con app.security.test-access-enabled=true; no se guardan contraseñas en texto plano en SQL.

# Backend GTEL Talento

API REST en Java 21 y Spring Boot 3.5.5. Registro y login con MySQL, BCrypt y JWT. El login requiere verificacion por correo.

## Estructura

```text
backend/
  pom.xml
  src/main/java/pe/com/gtel/talento/
    auth/                    Autenticacion: controller, service, dto, repository
    mail/                    Envio SMTP
    identity/                Usuarios y perfiles: entity, repository
    recruitment/             Reclutamiento: controller, service, repository
    health/                  Endpoint de salud
    config/                  Configuracion Spring y CORS
    security/                JWT y filtros
  src/main/resources/        Configuracion compartida
  src/test/java/             Pruebas organizadas por los mismos modulos
  config/                    Configuracion local privada y ejemplo
  database/
    schema/                  SQL de instalacion inicial
    migrations/              Cambios manuales historicos
  docs/                     Documentacion consolidada en la raiz del proyecto
  target/                    Generado; excluido de Git
```

Los paquetes se agrupan por funcionalidad y mantienen capas dentro de cada modulo: Controller -> Service -> Repository -> MySQL. No es necesario dividir este backend pequeno en microservicios. El SQL del reclutador reside en RecruiterDataRepository; su servicio establece transacciones de lectura. Los contratos HTTP existentes se conservan.

## Configuracion local

1. Instalar Java 21, Maven 3.9 y MySQL 8.x.
2. En DBeaver, conectar a MySQL y ejecutar `../database/schema/gtel_talento.sql` solamente en una base nueva. Incluye roles y cuatro cuentas de demostración con hashes BCrypt.
3. Copiar `config/local.properties.example` a `config/local.properties` y completar las credenciales locales. No sobrescribir un archivo local existente.
4. Generar una clave JWT privada de al menos 32 bytes. No compartirla en Git.
5. Ejecutar los comandos desde `backend/`, para que Spring encuentre la configuracion local.

Spring no carga `.env` automaticamente; `.env.example` documenta variables para el proceso o IDE. `ddl-auto=validate` no crea ni modifica tablas. Las migraciones no se ejecutan automaticamente; la 001 no se aplica si telefono ya existe.

```powershell
mvn.cmd clean test
mvn.cmd spring-boot:run
```

Si la cache Maven predeterminada no es accesible:

```powershell
mvn.cmd "-Dmaven.repo.local=$env:USERPROFILE\.m2\repository" clean test
mvn.cmd "-Dmaven.repo.local=$env:USERPROFILE\.m2\repository" spring-boot:run
```

API: http://localhost:8080. Salud: http://localhost:8080/api/health.

`FRONTEND_URL` admite origenes separados por comas. Por defecto: `http://localhost:5173,http://127.0.0.1:5173`. CORS se define solamente en SecurityConfig.

## Contratos

| Metodo | Ruta | Funcion |
|---|---|---|
| POST | /api/auth/register | Registrar candidato; responde 201 |
| POST | /api/auth/login | Correo y password; rol obtenido de MySQL. OTP normal o sesión inmediata para pruebas autorizadas |
| GET | /api/auth/me | Perfil actual con Bearer token |
| POST | /api/auth/logout | Instruccion para eliminar token local; no revoca JWT |
| GET | /api/health | Salud basica |
| GET | /api/recruiter/candidates | Candidatos |
| GET | /api/recruiter/interviews | Entrevistas |
| GET | /api/recruiter/evaluations | Evaluaciones |
| GET | /api/recruiter/dashboard | Resumen de reclutamiento |

Las rutas de reclutamiento requieren RECLUTADOR. El registro publico solo crea candidatos. Registro devuelve ID de postulante; login/me devuelven ID de usuario.

## Trabajo colaborativo

Consultar [CONTRIBUTING.md](CONTRIBUTING.md). Cada integrante configura su propia BD y secretos. No versionar target, archivos del IDE, credenciales o datos personales.

## Limites actuales

- La integracion de los modulos de negocio del frontend no se resuelve con esta reorganizacion.
- Login requiere codigo de correo. La confirmacion independiente al registrarse y la recuperacion de contrasena no estan implementadas.
- Logout no revoca JWT y la autenticacion aun no aplica usuarios.estado.
- Las consultas conservan respuestas Map para compatibilidad; DTO tipados pueden incorporarse en otro cambio con pruebas del contrato.
- El diagnostico previo es historico; consultar la documentacion consolidada en `../docs/`.

## Login por correo

Aplicar `../database/migrations/002_email_otp.sql` una sola vez en bases existentes; el SQL inicial ya incluye la tabla. Configurar spring.mail.username, spring.mail.password (password de aplicacion Gmail) y otp.hash-secret en config/local.properties. Ver la guia completa de verificacion de correo en [README general](../README.md#10-verificación-de-acceso-por-correo-gmail-smtp).

POST /api/auth/login normalmente no entrega JWT (las tres cuentas de prueba habilitadas son la excepción); POST /api/auth/verify-otp recibe sessionId y otp y entrega el JWT. POST /api/auth/resend-otp recibe sessionId. Los tokens previos sin OTP se rechazan.

## Retención de tickets de soporte

En bases existentes, aplicar `../database/migrations/010_support_ticket_lifecycle.sql` después de las migraciones 008 y 009. La tarea programada se ejecuta los lunes a las 02:00 en `America/Lima` y procesa solamente tickets `RESUELTO` o `CERRADO` cuya `resolved_at` tenga al menos siete días. Primero conserva un resumen en `tickets_soporte_archivo` y una entrada en `auditoria`; después elimina el ticket operativo y su historial detallado.

La programación se configura con `SUPPORT_CLEANUP_ENABLED`, `SUPPORT_CLEANUP_RETENTION_DAYS`, `SUPPORT_CLEANUP_CRON` y `SUPPORT_CLEANUP_ZONE`. El backend fuerza una retención mínima de siete días aunque se indique un valor menor.


## Administración

Aplicar una vez `../database/migrations/004_admin_access.sql` en bases existentes, después de la 002. El esquema inicial actualizado ya incluye estas columnas. ADMIN usa ID 3 cuando está disponible; la autorización utiliza el nombre del rol.

El panel React `/admin` consume GET/POST `/api/admin/users` y PUT `/api/admin/users/{id}`. Las rutas requieren ADMIN. Spring Security permite también a ADMIN los módulos de candidato y reclutador. Los JWT comprueban estado, rol y versión en cada petición. Una edición revoca sesiones anteriores y desafíos OTP pendientes.

El bypass OTP está desactivado por defecto. Para habilitarlo localmente define únicamente `TEST_ACCESS_ENABLED=true` en el entorno del backend. La propiedad `app.security.test-access-enabled` por sí sola no lo habilita. Solo las cuatro cuentas sembradas por `database/schema/gtel_talento.sql`, con rol correcto y `otp_exempt=true`, omiten OTP después de validar su contraseña. El backend no crea ni sobrescribe cuentas al arrancar. Desactivar el bypass invalida sus sesiones de prueba.

Pruebas: `mvn.cmd test`; revisar además la sección de validación y los recorridos de navegador del README general. El registro público no permite seleccionar ni asignar ADMIN.

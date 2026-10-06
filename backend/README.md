# Backend GTEL Talento

API REST en Java 21 y Spring Boot 3.5.5. Registro y login con MySQL, BCrypt y JWT. El login requiere verificacion por correo.

## Estructura

```text
backend/
  pom.xml
  src/main/java/pe/com/gtel/talento/
    auth/                    Autenticacion: controller, service, dto, repository
    mail/                    Envio SMTP
    identity/                Identidad: entity, dto, repository, service
    profile/                 Perfil personal: controller, dto, repository, service
    recruitment/
      job/                   Vacantes y papelera; incluye scheduler
      application/           Postulaciones, CV y cambios de estado
      interview/             Agenda y reprogramación de entrevistas
      evaluation/            Evaluaciones y criterios
    admin/                   Gestión de usuarios: controller, dto, repository, service
    audit/                   Consulta y registro de auditoría
    notification/            Bandeja, entrega de correos y scheduler
    bootstrap/               Cuentas de prueba de activación explícita
    shared/api/              Respuestas comunes y errores de persistencia
    health/                  Endpoint de salud
    config/                  Configuracion Spring y CORS
    security/                JWT y filtros
  src/main/resources/        Configuracion compartida
  src/test/java/             Pruebas por módulo; integration/ para flujos completos
  config/                    Configuracion local privada y ejemplo
  database/
    schema/                  SQL de instalacion inicial
    migrations/              Cambios manuales historicos
  docs/
    history/                 Diagnosticos historicos
  target/                    Generado; excluido de Git
```

Los paquetes se agrupan por funcionalidad. Las peticiones siguen **Controller → Service → Repository**. Los controladores reciben DTO validados, los servicios conservan reglas y transacciones, y los repositorios contienen el SQL/JDBC o el acceso JPA. El dashboard React combina las consultas de postulaciones, ofertas, entrevistas y evaluaciones; no consume un endpoint exclusivo de dashboard.

Consulta el [mapa de arquitectura y validación por etapas](docs/arquitectura-src.md). Esta reorganización no requiere migraciones SQL ni cambios en el frontend.

## Configuracion local

1. Instalar Java 21, Maven 3.9 y MySQL 8.x.
2. En DBeaver, conectar a MySQL y ejecutar `database/schema/gtel_talento.sql` solamente en una base nueva. Incluye roles, no cuentas.
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
| GET | /api/recruiter/applications | Candidatos |
| GET | /api/recruiter/selection/interviews | Entrevistas |
| GET | /api/recruiter/selection/evaluations | Evaluaciones |

Las rutas de reclutamiento requieren RECLUTADOR o ADMIN. El registro publico solo crea candidatos. Registro devuelve ID de postulante; login/me devuelven ID de usuario.

## Trabajo colaborativo

Consultar [CONTRIBUTING.md](CONTRIBUTING.md). Cada integrante configura su propia BD y secretos. No versionar target, archivos del IDE, credenciales o datos personales.

## Limites actuales

- Los módulos de negocio se conectan mediante la API. Ver [activación y pruebas](docs/flujo-reclutamiento.md); bases existentes requieren migración 004.
- Login requiere codigo de correo. La recuperación usa un enlace por correo; la confirmación independiente al registrarse no está implementada.
- Logout es local. Las peticiones autenticadas comprueban estado, rol y versión de la cuenta.
- Las consultas de reclutamiento conservan respuestas Map para compatibilidad. Los mensajes, las páginas de usuarios/auditoría y los errores explícitos utilizan DTO tipados con los mismos campos JSON.
- El diagnóstico previo es histórico; consultar [la arquitectura actual](docs/arquitectura-src.md).

## Login por correo

Aplicar database/migrations/002_email_otp.sql una sola vez en bases existentes; el SQL inicial ya incluye la tabla. Configurar spring.mail.username, spring.mail.password (password de aplicacion Gmail) y otp.hash-secret en config/local.properties. Ver la guia completa de verificacion de correo en [README general](../README.md#10-verificación-de-acceso-por-correo-gmail-smtp).

POST /api/auth/login normalmente no entrega JWT (las tres cuentas de prueba habilitadas son la excepción); POST /api/auth/verify-otp recibe sessionId y otp y entrega el JWT. POST /api/auth/resend-otp recibe sessionId. Los tokens previos sin OTP se rechazan.


## Administración

Aplicar una vez `database/migrations/003_admin_access.sql` en bases existentes, después de la 002. El esquema inicial actualizado ya incluye estas columnas. ADMIN usa ID 3 cuando está disponible; la autorización utiliza el nombre del rol.

El panel React `/admin` consume GET/POST `/api/admin/users` y PUT `/api/admin/users/{id}`. Las rutas requieren ADMIN. Spring Security permite también a ADMIN los módulos de candidato y reclutador. Los JWT comprueban estado, rol y versión en cada petición. Una edición revoca sesiones anteriores y desafíos OTP pendientes.

`app.security.test-access-enabled=false` es el valor seguro predeterminado. Habilitarlo solo en configuración local crea, si faltan, las tres cuentas documentadas en el [README general](../README.md#6-credenciales-de-prueba). Solo esas cuentas, con rol correcto y `otp_exempt=true`, omiten OTP después de validar contraseña. Nunca se sobrescriben cuentas existentes. Desactivar la opción invalida sus sesiones de prueba.

Pruebas: `mvn.cmd test`; revisar además la sección de validación y los recorridos de navegador del README general. El registro público no permite seleccionar ni asignar ADMIN.

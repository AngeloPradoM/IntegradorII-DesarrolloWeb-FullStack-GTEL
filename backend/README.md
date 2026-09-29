# Backend GTEL Talento

API REST en Java 21 y Spring Boot 3.5.5. Registro y login con MySQL, BCrypt y JWT. La verificacion por correo sigue pendiente.

## Estructura

```text
backend/
  pom.xml
  src/main/java/pe/com/gtel/talento/
    auth/                    Autenticacion: controller, service, dto
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
  docs/
    history/                 Diagnosticos historicos
  target/                    Generado; excluido de Git
```

Los paquetes se agrupan por funcionalidad y mantienen capas dentro de cada modulo: Controller -> Service -> Repository -> MySQL. No es necesario dividir este backend pequeno en microservicios. El SQL del reclutador reside en RecruiterDataRepository; su servicio establece transacciones de lectura. Los contratos HTTP existentes se conservan.

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
| POST | /api/auth/login | Correo, password y rol; entrega JWT y requiresOtp=false |
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
- La verificacion por correo sigue pendiente; se retiro la referencia OTP inactiva.
- Logout no revoca JWT y la autenticacion aun no aplica usuarios.estado.
- Las consultas conservan respuestas Map para compatibilidad; DTO tipados pueden incorporarse en otro cambio con pruebas del contrato.
- El diagnostico previo es historico; consultar [la revision estructural](docs/estructura-colaborativa.md) para este cambio.

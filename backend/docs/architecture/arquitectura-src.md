# Arquitectura de SRC

El backend sigue siendo una sola aplicación Spring Boot. La reorganización conserva las rutas, los campos JSON, los roles, el esquema MySQL y los flujos del frontend. No requiere ejecutar migraciones ni modificar `local.properties`.

## Responsabilidades

| Carpeta | Responsabilidad |
|---|---|
| `auth` | Registro, login, OTP y recuperación de contraseña. |
| `identity` | Entidades JPA, consulta de cuentas e identificación del usuario activo. |
| `admin` | Administración de usuarios, protección del último administrador y eliminación de datos asociados. |
| `profile` | Perfil, contacto, formación, experiencia y fotografía. |
| `recruitment/job` | Ofertas, papelera de 30 días y eliminación programada. |
| `recruitment/application` | Postulaciones, documentos PDF, permisos de consulta y estados. |
| `recruitment/interview` | Programación, reprogramación y conflictos de agenda. |
| `recruitment/evaluation` | Evaluaciones, criterios y puntaje de la postulación. |
| `notification` | Bandeja de notificaciones y entrega de correo con reintentos. |
| `audit` | Registro y consulta de auditoría. |
| `bootstrap` | Creación opcional de cuentas de desarrollo; respeta las eliminaciones previas. |
| `config`, `security`, `mail`, `health` | Configuración, JWT, transporte de correo y salud. |
| `shared/api` | Contratos pequeños compartidos y tratamiento seguro de errores de persistencia. |

Dentro de cada módulo:

- `controller`: rutas HTTP, validación de entrada y respuesta.
- `dto`: datos de entrada/salida; conserva nombres de propiedades y restricciones existentes.
- `service`: autorización de negocio, reglas, transacciones y coordinación.
- `repository`: SQL parametrizado, JPA, lectura y escritura. No depende de controladores ni servicios.
- `scheduler`: tareas del módulo; invoca el servicio mediante el proxy transaccional de Spring.

No todos los módulos necesitan todas las carpetas. Los servicios mantienen `@Transactional`, incluidos los bloqueos y las eliminaciones en cascada. Extraer SQL no mueve las transacciones a operaciones individuales.

## Etapas aplicadas

| Etapa | Cambio | Verificación |
|---|---|---|
| 1 | Extraer DTO anidados y SQL a repositorios; mover generación de claves JDBC al repositorio. | Suite backend, contratos de servicios frontend y recorrido de navegador. |
| 2 | Separar vacantes, postulaciones, entrevistas y evaluaciones; independizar perfil, identidad, notificaciones y auditoría. | Compilación limpia, pruebas de negocio y frontend. |
| 3 | Reubicar schedulers y bootstrap; organizar pruebas por módulo e integración. | Arranque del contexto Spring con H2 y comprobación de rutas/permisos. |
| 4 | Tipar mensajes, páginas de usuarios/auditoría y errores explícitos; agregar respuesta segura para fallos JDBC. | Pruebas de contrato JSON, precedencia de errores y flujo HTTP completo. |
| 5 | Comprobar el conjunto y actualizar la documentación. | Maven, pruebas frontend, lint, build y navegador con HTTP simulado. |

## Compatibilidad de respuestas y errores

- Las rutas conservan sus métodos y estados de éxito; crear una oferta sigue respondiendo `200` y postular sigue respondiendo `201`.
- `MessageResponse` conserva `{ "message": "..." }`.
- `AdminUserPageResponse` conserva `items`, `total`, `page`; `AuditPageResponse` conserva `items`, `total`.
- `ApiError` conserva `detail` y añade `errors` solamente cuando hay errores por campo. Los mensajes específicos de administración y postulación se mantienen.
- Los conflictos de integridad no tratados por un módulo responden `409`; otros errores de acceso a datos responden `503`, con mensajes genéricos que no exponen SQL ni datos internos. Este es el cambio intencional en errores antes no gestionados.
- `ResponseStatusException`, OTP, filtros JWT y seguridad conservan sus reglas. No se agrega un contenedor global a todas las respuestas ni se capturan indiscriminadamente todas las excepciones.
- Las respuestas de lectura de reclutamiento siguen siendo mapas para conservar el contrato. Su tipado completo puede hacerse de forma incremental con pruebas de cada endpoint.

## Tareas programadas

`SchedulingConfig` centraliza `@EnableScheduling`. `app.scheduling.enabled` es `true` por defecto; las pruebas de contexto lo desactivan para evitar tareas en segundo plano. No hace falta agregar la propiedad a la configuración local.

`JobTrashScheduler` permanece con espera inicial de 60 segundos y ejecución cada hora. `NotificationScheduler` mantiene su intervalo de 10 segundos y depende de `app.notifications.email-enabled=true`. El intervalo de reenvío de OTP no cambia.

## Ejecutar las verificaciones

Desde `backend/`:

```powershell
mvn.cmd clean test
```

Las pruebas usan bases H2 temporales y correo simulado. `ModuleWiringTest` evita cargar la configuración local, arranca los componentes reales y usa JWT de prueba para recorrer las rutas y verificar permisos. Comprueba creación de oferta, perfil, carga/descarga del PDF, cambio de estado, entrevista, evaluación y listado administrativo. El flujo de escritura se revierte al terminar.

`WorkflowTest`, en `integration`, verifica las reglas entre módulos: duplicados, rollback, privacidad del CV, estados, agenda, recuperación, notificaciones, papelera, eliminación de usuarios y conservación de auditoría. Las pruebas específicas siguen los paquetes de producción.

Desde `frontend/`:

```powershell
node --test tests/*.test.mjs
npm.cmd run lint
npm.cmd run build
```

Para el recorrido de navegador, `tests/workflow-browser.mjs` requiere Vite en `127.0.0.1:5181` y Chrome con perfil desechable y depuración remota en `9241`. Usa HTTP simulado; no envía correo ni modifica cuentas reales.

Estas verificaciones no sustituyen una prueba de despliegue con MySQL y Gmail reales. El refactor no ejecuta ni modifica la base local del equipo.

## Resultado de la validación

| Comprobación | Resultado |
|---|---|
| Backend | 52 pruebas aprobadas, incluidas integración HTTP y autorización por rol. |
| Frontend | 11 pruebas aprobadas; lint y compilación de producción correctos. |
| Navegador | Ofertas/detalle, recuperación, selección, edición de oferta y notificaciones correctos con HTTP simulado. |
| Compatibilidad | Sin cambios de rutas ni de estados de éxito; configuración local, frontend y SQL de instalación/migraciones sin cambios. |

Avisos existentes: Mockito muestra un aviso sobre carga dinámica del agente; las pruebas frontend pueden avisar que el puerto HMR 24678 está ocupado; Vite advierte que el bundle principal supera 500 kB. No impidieron las verificaciones.

# Activar y verificar el flujo de reclutamiento

Actualización de administración: [reporte y activación de eliminación de cuentas](reporte-cambios-administracion.md). Requiere migración 006; conserva auditoría y elimina datos personales relacionados.

El frontend usa la API para perfiles, vacantes, postulaciones con CV, entrevistas, evaluaciones, notificaciones y auditoría. Se mantienen los roles CANDIDATO, RECLUTADOR y ADMIN. Esta entrega no incorpora jefaturas ni aprobaciones de requerimientos de personal.

## Verificación de la tabla de funcionalidades — 5 de octubre de 2026

**Resultado:** las siete funcionalidades están implementadas. La validación automatizada usa H2 y correo simulado; no constituye certificación del entorno MySQL/SMTP local. La migración 004 no se ejecutó durante esta revisión.

| Prioridad | Funcionalidad | Evidencia y correcciones | Estado |
|---|---|---|---|
| Alta | Recuperar contraseña por correo | Enlace de uso único, expiración, contraseña BCrypt, revocación de sesiones; pruebas de correo inexistente y fallo SMTP | Implementada y probada con remitente simulado; recepción real pendiente |
| Alta | Editar perfil real del candidato | API guarda contacto, formación, experiencia y ubicación; se sincronizan las ediciones del administrador con el perfil de contacto | Implementada; persistencia probada en H2 |
| Alta | Gestionar vacantes | Crear, editar, publicar, pausar y cerrar; editor incluye formación, experiencia y habilidades | Implementada; estados y requisitos probados |
| Alta | Postular y almacenar CV | PDF privado, propiedad de la postulación, validación de archivo, prevención de duplicados y transacción con rollback | Implementada y probada en H2 |
| Alta | Consultar postulaciones y cambiar estados | API real, transiciones controladas, historial persistente visible en Proceso de selección | Implementada y probada |
| Media | Auditoría administrativa | Responsable, fecha, cuenta afectada y detalle; distingue desactivación, activación y cambios de rol con valores anteriores y nuevos | Implementada; pruebas de autoría y ausencia de contraseñas en el detalle |
| Media | Entrevistas, evaluaciones y notificaciones | Agenda, reprogramación, cancelación, resultados por criterio y promedio; notificaciones privadas y cola con reintentos | Implementada; envío automático por correo requiere habilitación y validación SMTP real |

Verificación automática: **39 pruebas del backend y 10 del frontend aprobadas**, ESLint y compilación del frontend correctos. La compilación advierte que el paquete JavaScript principal supera 500 kB; no impide ejecutar el sistema. Las pruebas de navegador usan HTTP simulado.

Para aceptar la entrega en el entorno local faltan los pasos 1–3 de esta guía: aplicar/comprobar el esquema, reiniciar y recorrer los flujos con usuarios propios y correo real. No se debe interpretar “implementada” como una prueba ya realizada contra MySQL.

## 1. Preparar MySQL

### Papelera de ofertas (migración 005)

Para esta versión, aplicar también `backend/database/migrations/005_job_trash.sql` después de la 004 y **antes de reiniciar el backend**. Crea `vacantes_papelera`; el esquema de instalación nueva ya la incluye. No se ejecutó en el MySQL local durante el desarrollo.

- En Ofertas, **Eliminar oferta** solicita confirmación y la mueve a **Papelera (30 días)**. Deja de publicarse y no acepta postulaciones.
- Dentro de los 30 días puede restaurarse. Vuelve como **pausada**, conservando sus postulaciones y documentos; el reclutador debe editarla para publicarla.
- Al vencer 30 × 24 horas, el backend elimina definitivamente la oferta y sus postulaciones, CV, entrevistas, evaluaciones y líneas de historial. Conserva las cuentas, perfiles y auditoría. No existe eliminación anticipada desde la interfaz.
- La limpieza se ejecuta un minuto después del arranque y cada hora, hasta 25 ofertas por ejecución. Si el servidor estaba apagado, elimina los registros vencidos en la siguiente ejecución. La restauración no está permitida una vez vencido el plazo, aunque la limpieza aún no se haya ejecutado.
- Endpoints: `GET /api/recruiter/jobs/trash`, `DELETE /api/recruiter/jobs/{id}` y `POST /api/recruiter/jobs/{id}/restore`, protegidos para RECLUTADOR/ADMIN.

En Proceso de selección, **Gestionar postulación** carga la persona y oferta de esa fila en los formularios de entrevista y evaluación. También se puede filtrar por oferta.

El formulario de postulación acepta **PDF de hasta 5 MB**. Envía únicamente los campos del contrato multipart; los errores de validación especifican el campo en español. Recuperar acceso incluye **Mostrar/Ocultar contraseñas**.

Validación de esta ampliación: 42 pruebas backend aprobadas, incluyendo multipart con campos del navegador, validación de DNI, restauración y eliminación de relaciones solo tras vencer la retención. Pruebas con H2 y correo simulado; no se ha ejecutado la purga contra datos reales.

La migración no se ejecuta automáticamente al iniciar Spring.

- **Base existente:** realizar un respaldo, comprobar que se aplicaron las migraciones 001–003 y ejecutar íntegramente `backend/database/migrations/004_recruitment_workflow.sql` en DBeaver contra `gtel_talento`.
- **Base nueva:** importar `backend/database/schema/gtel_talento.sql`; ya incluye las tablas de esta entrega. No volver a importar el esquema sobre una base con datos.

La migración 004 crea `perfiles_contacto`, `documentos_postulacion`, `recuperacion_acceso` y `notificaciones`. Conserva los datos existentes y utiliza las tablas de vacantes, postulaciones, entrevistas, evaluaciones, historial y auditoría del esquema original. No rellena CV de postulaciones antiguas.

```sql
USE gtel_talento;
SHOW TABLES;
DESCRIBE perfiles_contacto;
DESCRIBE documentos_postulacion;
DESCRIBE recuperacion_acceso;
DESCRIBE notificaciones;
```

## 2. Configurar y ejecutar

En `backend/config/local.properties`, conservar la configuración local de MySQL, JWT y SMTP. Para los enlaces y notificaciones:

```properties
app.recovery-url=http://localhost:5173/recuperar-acceso
app.notifications.email-enabled=false
```

La recuperación envía el enlace con la configuración SMTP existente. La opción de notificaciones controla únicamente el envío automático de novedades de postulaciones y entrevistas: se guardan y se pueden consultar en la web incluso si vale `false`. Cambiarla a `true` y reiniciar habilita el envío de la cola pendiente; usar destinatarios propios durante las pruebas.

Desde la raíz, en dos terminales:

```powershell
cd backend
mvn.cmd spring-boot:run
```

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend: `http://localhost:5173`; backend: `http://localhost:8080`. Los nuevos módulos no utilizan persistencia demo local.

## 3. Recorrido de aceptación

| Actor | Acción | Resultado esperado |
|---|---|---|
| Reclutador / ADMIN | Crear una vacante desde Ofertas | La oferta publicada aparece en `/ofertas`, con descripción y requisitos guardados |
| Reclutador / ADMIN | Editar, pausar o cerrar la vacante | Se actualiza MySQL; las ofertas no activas dejan de aceptar postulaciones |
| Candidato | Guardar nombre, contacto, foto, ubicación, formación y experiencia en Perfil | Los cambios se conservan al volver a abrir Perfil |
| Candidato | Postular a una oferta activa, aceptar términos y adjuntar un PDF | Se genera código de seguimiento y se almacena el archivo; repetir la misma postulación da conflicto |
| Candidato | Abrir Mis postulaciones | Se muestra su historial; nunca postulaciones ajenas |
| Reclutador / ADMIN | Abrir Proceso de selección, buscar por formación o experiencia y descargar CV | Se muestran datos reales y un PDF autorizado |
| Reclutador / ADMIN | Cambiar el estado de la postulación | Se registra historial, auditoría y notificación para el candidato |
| Reclutador / ADMIN | Programar y editar una entrevista | Se guarda y notifica; se rechazan solapamientos en la agenda compartida |
| Reclutador / ADMIN | Registrar una evaluación técnica y de habilidades blandas | Se guardan criterios y promedio; no se cambia automáticamente el estado de la postulación |
| Candidato | Abrir Mis notificaciones y marcar como leída | La marca se conserva en MySQL |
| ADMIN | Abrir Auditoría | Ve acciones paginadas y su responsable, sin contraseñas ni tokens |
| Usuario | Recuperar acceso desde el login | Recibe enlace válido 15 minutos; al usarlo se revocan las sesiones anteriores |

Repetir el recorrido con cuentas separadas. Probar también acceso a CV ajeno, archivo no PDF, vacante cerrada, enlace vencido y transiciones de estado inválidas.

## 4. Contratos principales

| Método | Ruta API | Acceso |
|---|---|---|
| GET | `/api/jobs`, `/api/jobs/{id}` | Público; solo ofertas activas vigentes |
| GET / PUT | `/api/profile` | Perfil propio autenticado |
| GET / POST | `/api/recruiter/jobs` | RECLUTADOR / ADMIN |
| PUT | `/api/recruiter/jobs/{id}` | RECLUTADOR / ADMIN |
| GET | `/api/candidate/applications` | Postulaciones propias |
| POST | `/api/candidate/applications/{jobId}` | Multipart: `data` JSON, `cv` PDF y `terms` |
| GET | `/api/applications/{id}/cv` | Propietario, RECLUTADOR o ADMIN |
| GET | `/api/recruiter/applications` | RECLUTADOR / ADMIN |
| PUT | `/api/recruiter/applications/{id}/status` | RECLUTADOR / ADMIN |
| GET / POST | `/api/recruiter/selection/interviews` | RECLUTADOR / ADMIN |
| PUT | `/api/recruiter/selection/interviews/{id}` | RECLUTADOR / ADMIN |
| GET / POST | `/api/recruiter/selection/evaluations` | RECLUTADOR / ADMIN |
| GET | `/api/notifications` | Notificaciones propias |
| PUT | `/api/notifications/{id}/read` | Propietario |
| GET | `/api/admin/audit?page=0` | ADMIN |
| POST | `/api/auth/password/request`, `/api/auth/password/reset` | Público; restablecimiento exige token válido |

## 5. Reglas y límites

- Estados de vacante: `activa`, `pausada`, `cerrada`. Se conserva el vocabulario del esquema existente.
- Estados de postulación: `recibida`, `en_revision`, `entrevista`, `aprobada`, `rechazada`. Los dos últimos son finales. No se incorporan estados nuevos a los ENUM existentes.
- Los CV se almacenan privados en MySQL, con límite de 5 MB y comprobación básica de firma PDF. No hay escaneo antivirus ni extracción automática de formación del PDF. El filtrado usa el perfil escrito por el candidato.
- La agenda es compartida: bloquea cualquier solapamiento entre entrevistas programadas, aunque las creen reclutadores distintos.
- Recuperación: token aleatorio almacenado como SHA-256, uso único, 15 minutos y separación mínima de 60 segundos entre solicitudes para una misma cuenta. La respuesta no confirma si un correo existe. Falta limitación global por IP para una publicación abierta a Internet.
- Recuperar contraseña incrementa `auth_version`, elimina desafíos OTP y retira la excepción OTP de esa cuenta. No reactiva cuentas deshabilitadas.
- Notificaciones por correo: hasta cinco intentos, separados por cinco minutos tras un fallo. La entrega puede duplicarse si SMTP acepta el mensaje y falla la confirmación de la transacción. No se promete entrega exactamente una vez.
- La auditoría cubre operaciones de escritura implementadas; no es un registro inmutable de todas las peticiones HTTP.
- ADMIN supervisa ambos módulos, pero no suplanta al candidato: postular exige perfil propio de candidato.

## 6. Verificación automatizada

```powershell
# Desde backend: usa H2 y correo simulado, no MySQL real
mvn.cmd test

# Desde frontend
node --test tests/*.test.mjs
npm.cmd run lint
npm.cmd run build
```

`frontend/tests/workflow-browser.mjs` requiere Vite en `127.0.0.1:5181` y Chrome con un **perfil temporal** y depuración en `9241`. Simula HTTP para comprobar ofertas, enlace de recuperación bajo StrictMode, edición de vacantes, selección y notificaciones. No sustituye el recorrido real en MySQL ni una prueba de recepción SMTP.

# GTEL Talento — progreso de tickets e incidentes

## Arquitectura relevante

- Frontend: React/Vite; `RecruiterTicketsPage.jsx` registra solicitudes e incidencias.
- Transporte: `supportService.js` usa `POST /api/support/tickets` y `GET /api/support/tickets`.
- Backend: Spring Boot valida `TicketCreateRequest`, restringe la creación a `RECLUTADOR` y persiste con `SupportTicketRepository`.
- MySQL: `tickets_soporte` conserva prioridad, justificación, estado, solicitante, técnico y datos del flujo técnico.
- Incidentes de producción: módulo Spring Boot independiente con prioridades P1–P4, historial, actividades y relaciones sin propagación de estados.
- La matriz probabilidad × impacto no tenía cálculo asociado al formulario del reclutador.

## Archivos importantes

- `frontend/src/pages/support/RecruiterTicketsPage.jsx`: captura datos y muestra la clasificación sugerida.
- `frontend/src/utils/ticketClassification.js`: reglas deterministas y matriz de riesgo.
- `frontend/src/components/support/TicketEvaluationPanel.jsx`: expediente reutilizable para evaluación persistida y compatibilidad con tickets anteriores.
- `frontend/src/services/supportService.js`: contrato HTTP existente, sin cambios.
- `backend/src/main/java/pe/com/gtel/talento/support/dto/TicketCreateRequest.java`: acepta prioridad y justificación.
- `backend/src/main/java/pe/com/gtel/talento/support/service/SupportTicketService.java`: permisos, auditoría inicial y notificaciones.
- `backend/src/main/java/pe/com/gtel/talento/support/repository/SupportTicketRepository.java`: persistencia real.
- `database/migrations/008_support_tickets.sql`: estructura base de tickets.
- `backend/src/main/java/pe/com/gtel/talento/incident/`: controlador, DTO, repositorio, políticas y servicio de incidentes.
- `frontend/src/services/incidentService.js`: transporte autenticado del contrato real de incidentes.
- `frontend/src/pages/support/AdminIncidentPanel.jsx`: clasificación, asignación, relaciones y control administrativo.
- `frontend/src/pages/support/TechnicianIncidentPanel.jsx`: registro, bitácora y transiciones técnicas permitidas.
- `frontend/src/components/support/IncidentCreateForm.jsx`: captura compartida sin datos simulados.
- `database/migrations/015_production_incidents.sql`: migración base aprobada; el usuario reporta sus tablas aplicadas y sin datos, pendiente de verificación directa.
- `database/migrations/016_incident_reporting.sql`: extensión aditiva para categorías, SLA, asignación y escalamiento; el usuario reporta que ya fue aplicada, pendiente de verificación directa en la instancia.
- `backend/src/main/java/pe/com/gtel/talento/incident/repository/IncidentConfigurationRepository.java`: lectura de categoría, SLA y técnico elegible por reglas reales.

## Contratos y estados verificados

- Creación: título, categoría, subcategoría, tipo, prioridad, descripción y justificación de prioridad.
- Prioridades admitidas: `BAJA`, `MEDIA`, `ALTA`.
- Tipos admitidos: `SOLICITUD`, `INCIDENTE`.
- Estados: `NUEVO`, `ASIGNADO`, `EN_ATENCION`, `EN_ESPERA`, `RESUELTO`, `CERRADO`.
- La respuesta devuelve prioridad y justificación persistidas.
- Incidentes: `REGISTRADO`, `CLASIFICADO`, `ASIGNADO`, `EN_INVESTIGACION`, `EN_MITIGACION`, `SERVICIO_RECUPERADO`, `VERIFICADO`, `CERRADO`.
- La clasificación final, asignación y transiciones usan versión esperada para impedir actualizaciones concurrentes perdidas.

## Decisiones técnicas verificadas

- La prioridad se calcula solo con alcance, impacto declarado, urgencia, continuidad y frecuencia informados explícitamente.
- Alta: varios usuarios/servicio general, o bloqueo individual con impacto relevante.
- Media: afectación individual que bloquea o dificulta una operación importante.
- Baja: afectación individual, menor y no bloqueante.
- Frecuencia recurrente produce probabilidad alta; intermitente, media.
- Primera vez conserva probabilidad y riesgo como `Pendiente de evaluación`; no se inventa probabilidad baja.
- Se corrigió el formateo de `ALTA/BAJA` dentro de la explicación persistida; antes podía producir texto `undefined`.
- La matriz existente se conserva completa y calcula riesgo, no prioridad operativa.
- La prioridad y la explicación estructurada se guardan mediante el contrato real existente; no hay persistencia local simulada.
- El lector del expediente interpreta exclusivamente la explicación persistida por Fase 1; no recalcula ni completa datos ausentes.
- Los tickets anteriores se identifican como sin evaluación estructurada y conservan su justificación original.
- Hasta la Fase 2 no se modificaron backend, API ni MySQL.
- Fase 4 añade backend y definición de persistencia autorizados; ninguna migración fue aplicada a una base real.
- Los vínculos incidente–ticket e incidente–RFC son únicos y no actualizan estados de los registros relacionados.
- La deduplicación combina revisión de incidentes activos con clave única; solo Administración puede justificar un incidente distinto.
- Administración clasifica, asigna, vincula, verifica y cierra; Técnico opera únicamente incidentes asignados; Reclutador solo consulta resúmenes vinculados a sus tickets.

## Fases completadas

- Fase 0: diagnóstico focalizado reutilizado.
- Fase 1: clasificación automática del ticket del reclutador implementada en frontend con persistencia existente.
- Fase 2: bloqueada antes de integrar el expediente en las bandejas; el lector y panel compartido quedaron preparados, pero no conectados a páginas operativas.
- Fase 3: diseño de incidentes P1–P4, estados, relaciones, permisos y persistencia aprobado.
- Fase 4: backend y persistencia implementados; posteriormente el usuario confirmó la aplicación de la migración 016.
- Fase 5: integrada en las bandejas existentes de Administrador y Técnico mediante una tercera pestaña, sin rutas ni módulos operativos duplicados.
- Administración puede registrar, clasificar P1–P4, asignar, vincular tickets/RFC, verificar, cerrar y reabrir según el contrato real.
- Técnico puede registrar, documentar actividades y ejecutar únicamente las transiciones autorizadas de incidentes asignados.
- Ambos paneles consumen expediente, historial y relaciones persistidas; las mutaciones con cambio de estado usan `expectedVersion`.
- La interfaz reutiliza los tokens globales de modo claro/oscuro y conserva las pestañas y flujos previos de tickets y RFC.
- Fase 6: verificación focalizada completada para priorización, permisos, versión optimista, auditoría, relaciones ticket–incidente–RFC y flujos de Administrador/Técnico.
- Fase 6 no requirió cambios productivos; se agregó cobertura de orquestación al servicio de incidentes y se reforzó la comprobación estática de la migración.

## Ciclo de registro, indicadores y exportación

- Fase 0: auditoría focalizada completada sin modificaciones; se identificaron brechas de categoría, SLA P1–P4, primera atención, escalamiento, indicadores y XLSX.
- Fase 1: diseño aprobado con diez categorías estructuradas, seis estados visibles derivados de los ocho internos y métricas calculadas sin tablas de agregados.
- Fase 2: persistencia preparada en 016; el usuario confirmó su aplicación antes de iniciar la Fase 5.
- Fase 3: reglas backend implementadas sobre los contratos y tablas autorizados, sin ejecutar migraciones.
- La categoría se sugiere por módulo y la clasificación manual exige justificación cuando difiere; la prioridad P1–P4 es determinista y no usa probabilidades inventadas.
- Al clasificar se fijan los vencimientos SLA y se intenta asignar mediante reglas activas, prioridad específica, precedencia y menor carga; si no hay técnico elegible, el incidente permanece `CLASIFICADO` para asignación manual.
- Las fechas de asignación, primera atención, recuperación, verificación y cierre se derivan de las transiciones reales. Solución, causa raíz y aprendizaje quedan en el expediente auditable.
- El escalamiento admite una sola instancia activa por incidente, conserva historial, usa versión optimista y solo puede ser creado por Administración o por el técnico responsable; únicamente Administración lo resuelve.
- Los estados visibles derivados son `NUEVO`, `EN_DIAGNOSTICO`, `EN_ATENCION`, `ESCALADO`, `RESUELTO` y `CERRADO`, sin duplicar los estados internos.
- Fase 4: los contratos de la Fase 3 quedaron integrados en las pestañas existentes de Administrador y Técnico; no se crearon rutas ni módulos paralelos.
- Ambas vistas cargan categorías y SLA reales, permiten registrar módulo, bloqueo y recurrencia, y filtran por estado visible, prioridad y categoría.
- El expediente muestra categoría, asignación, SLA, fechas operativas, solución, causa raíz, aprendizaje, actividades, transiciones, escalaciones y relaciones existentes con tickets/RFC.
- Técnico puede guardar la resolución con versión esperada y escalar únicamente incidentes asignados; Administración resuelve el escalamiento y conserva la clasificación, asignación, verificación, cierre y vínculos existentes.
- Los paneles continúan usando tokens `app-*` y variantes `dark:*`, por lo que comparten el sistema global de temas claro/oscuro.
- Fase 5: indicadores reales y exportación XLSX integrados con los mismos filtros y alcance de permisos de cada bandeja.
- `Total` cuenta los incidentes filtrados; `Abiertos` incluye todo estado interno distinto de `CERRADO`; `Cerrados` cuenta únicamente `CERRADO`.
- El promedio de atención mide desde detección hasta primera atención. El promedio de solución mide desde detección hasta recuperación y usa cierre solo como respaldo para históricos sin recuperación.
- `Vencidos` cuenta incidentes cuyo momento de recuperación/cierre superó el límite SLA y los aún abiertos cuyo límite ya venció. `Fallas repetidas` usa el indicador persistido `falla_repetida`.
- Los desgloses por categoría, prioridad y estado visible se calculan sobre el mismo conjunto filtrado que se presenta y exporta.
- El XLSX contiene hojas `Registro` y `Resumen`, limita la salida a 10 000 filas, evita celdas de fórmula, deshabilita caché HTTP y audita cada exportación.
- Administración obtiene todos los incidentes permitidos; Técnico obtiene únicamente el mismo alcance de su bandeja. Reclutador no puede consultar indicadores ni exportar.
- Fase 6: verificación integral focalizada completada sin cambios productivos ni ejecución de migraciones.
- Se comprobó registro y prioridad sugerida, clasificación final, asignación automática, seis estados visibles, primera atención, solución, verificación, cierre, historial, auditoría y versiones concurrentes.
- También se comprobaron indicadores, XLSX, permisos por rol y la independencia de estados en las relaciones incidente–ticket e incidente–RFC.
- SLA inicial configurable: P1 15 min/4 h, P2 30 min/8 h, P3 4 h/24 h y P4 8 h/72 h.
- Las reglas iniciales vinculan todas las categorías con cada usuario activo de rol `TECNICO`; no contienen correos ni IDs fijos.
- La selección preparada prioriza regla específica, menor precedencia, menor carga activa e ID estable como desempate.

## Reorganización de Mesa de Ayuda — prototipo aislado

- Fase 0: se localizaron la página de Reclutador, los formularios y servicios reales de tickets, incidentes y RFC. No se modificaron componentes operativos, APIs, backend ni MySQL.
- Fase 1: se reemplazó la demostración local de `index/` por el flujo unificado **Ayuda y problemas**, manteniendo **Cambios** como sección separada e informativa.
- El prototipo clasifica de forma determinística entre Nivel 1 (solicitud de soporte) y Nivel 2 (incidente formal). Solo Nivel 2 recibe una sugerencia P1–P4 con motivo visible.
- Incluye formulario guiado, confirmación, seguimiento simulado, tema claro/oscuro y etiquetas explícitas de datos de demostración.
- No usa autenticación, `localStorage`, `sessionStorage`, llamadas HTTP ni contratos productivos. La carpeta `/index/` continúa ignorada por Git conforme a la configuración previa del proyecto.
- Ajuste previo a Fase 2: el prototipo incorpora los 11 códigos `SOL_*` para Nivel 1 y las 10 categorías activas de `incidente_categorias` para Nivel 2, con módulo, descripción y problemas seleccionables.
- La elección no expone un control de prioridad: Baja/Media/Alta para tickets y P1–P4 para incidentes se sugieren automáticamente mediante reglas determinísticas. La asignación técnica se presenta como automática y no es editable por el reclutador.

## Pruebas ejecutadas

- `node --test tests/ticket-classification.test.mjs tests/support-service.test.mjs`: 6/6 correctas.
- Fase 2 focalizada: clasificación, lectura persistida, transporte y estados técnicos: 10/10 correctas.
- `SupportTicketServiceTest`: 5/5 correctas; conserva consulta SLA, autorización y estados de resolución.
- ESLint del clasificador, panel de expediente y pruebas: correcto.
- Fase 4: 14/14 pruebas correctas para prioridad, permisos, transiciones, deduplicación y contrato aditivo de migración.
- Backend compilado correctamente con Java 21; permanece una advertencia previa de API de seguridad deprecada.
- ESLint focalizado sobre página, clasificador y prueba: correcto.
- Build normal: bloqueado por `EPERM` al limpiar `frontend/dist/assets`, problema previo del directorio de salida.
- Build alterno con directorio limpio: correcto; 2517 módulos transformados. Advertencia no bloqueante por chunk mayor a 500 kB.
- Fase 5: ESLint completo correcto.
- Fase 5: suite frontend completa 50/50 correcta, incluidos contratos de incidentes y regresión de tickets/RFC.
- Fase 5: build alterno correcto; 2522 módulos transformados. Continúa únicamente la advertencia no bloqueante por chunk mayor a 500 kB.
- Fase 6 backend: 33/33 pruebas focalizadas correctas (21 de incidentes, 5 de tickets y 7 de RFC).
- Fase 6 frontend focalizado: 13/13 pruebas correctas; suite completa: 50/50; ESLint completo correcto.
- Fase 6 compilación Java: correcta con `mvn -DskipTests compile`.
- Fase 6 build frontend alterno: correcto; 2522 módulos transformados. Se mantiene la advertencia no bloqueante por el chunk de 1,270.26 kB.
- Nueva Fase 2 de persistencia: 3/3 pruebas focalizadas correctas para migraciones 015/016, esquemas limpios y contrato del repositorio.
- Nueva Fase 3 backend: 28/28 pruebas focalizadas correctas para prioridad P1–P4, permisos, transiciones, deduplicación, categorías/SLA, asignación automática, solución, escalamiento, auditoría y versiones concurrentes.
- Nueva Fase 3 compiló 164 clases Java correctamente; permanece solo la advertencia previa de `permissionsPolicy` deprecada en `SecurityConfig`.
- Nueva Fase 4 frontend: 11/11 pruebas focalizadas correctas para transporte autenticado, composición en las colas existentes, filtros, seis estados visibles, contratos de resolución/escalamiento, temas y regresión del clasificador de tickets.
- Nueva Fase 4: ESLint focalizado correcto y build Vite correcto con 2522 módulos transformados; permanece únicamente la advertencia no bloqueante por el chunk principal mayor a 500 kB.
- Nueva Fase 5 backend: 33/33 pruebas focalizadas correctas, incluidas métricas, filtros, permisos, auditoría, encabezados de descarga, estructura XLSX y neutralización de fórmulas.
- Nueva Fase 5 frontend: 11/11 pruebas focalizadas correctas; ESLint correcto y build Vite correcto con 2523 módulos transformados.
- Nueva Fase 6 backend: 48/48 pruebas focalizadas correctas: 36 de incidentes, 5 de tickets y 7 de RFC. La compilación limpia procesó 168 clases productivas y 35 clases de prueba.
- Nueva Fase 6 frontend: suite completa 52/52 correcta, ESLint completo correcto y build Vite correcto con 2523 módulos transformados.
- Nueva Fase 6 empaquetado: JAR ejecutable generado correctamente en `backend/target/gtel-talento-backend-0.0.1-SNAPSHOT.jar`; no fue desplegado.
- Prompt maestro, Fase 0: se confirmó que Reclutador enviaba `INCIDENTE` al endpoint de tickets y que la política impedía registrar incidentes reales.
- Prompt maestro, Fase 1: Reclutador usa `POST /api/production-incidents`; puede registrar y leer la configuración, sin acceso a cola operativa, clasificación, asignación, verificación ni cierre. No requirió cambios de esquema.
- Prompt maestro, Fase 2: catálogos y reglas verificados sin reescribir la migración 016 ya aplicada. La prioridad sugerida P1–P4 se calcula en backend y la prioridad final sigue siendo administrativa.
- Correspondencia visible verificada: `REGISTRADO|CLASIFICADO|ASIGNADO → NUEVO`, `EN_INVESTIGACION → EN_DIAGNOSTICO`, `EN_MITIGACION → EN_ATENCION`, escalamiento activo → `ESCALADO`, `SERVICIO_RECUPERADO|VERIFICADO → RESUELTO` y `CERRADO → CERRADO`.
- Prompt maestro, Fase 2: 26/26 pruebas backend y 52/52 pruebas frontend correctas; historial, transiciones y estados internos permanecen sin cambios.
- Prompt maestro, Fase 3: Reclutador consulta únicamente incidentes cuyo `reportado_por` corresponde a su identidad autenticada mediante `GET /api/production-incidents/reported-by-me`; no se acepta un usuario desde el cliente.
- Prompt maestro, Fase 3: el alta incorpora la respuesta persistida a la lista, muestra código y prioridad sugerida reales y la recarga vuelve a obtener los registros desde backend. Solicitudes y RFC permanecen sin cambios.
- Prompt maestro, Fase 3: 24/24 pruebas backend y 52/52 pruebas frontend correctas; ESLint focalizado y build Vite correctos. Sin migraciones ni cambios directos en MySQL.
- Prompt maestro, Fase 4: Administrador y Técnico muestran la nomenclatura visible `Control de Incidentes` dentro de las colas existentes; no se crearon rutas de pantalla ni módulos paralelos.
- Prompt maestro, Fase 4: Administración incorpora filtros por responsable y rango de fechas; los mismos filtros se aplican a indicadores y XLSX mediante el contrato backend validado. Se conservan clasificación, asignación, historial, SLA, escalamiento, relaciones y concurrencia optimista.
- Prompt maestro, Fase 4: 24/24 pruebas backend y 52/52 pruebas frontend correctas; ESLint focalizado y build Vite correctos. Tickets, Solicitudes y RFC permanecen sin cambios funcionales.
- Prompt maestro, Fase 5: indicadores reales verificados para total, abiertos, cerrados, estados visibles, categoría, prioridad, promedio de primera atención, promedio de resolución, vencidos y fallas repetidas. Una respuesta fallida ya no se representa como ceros ficticios.
- Prompt maestro, Fase 5: el XLSX contiene `Registro`, `Indicadores` e `Información`; la tercera hoja conserva fecha de generación, cantidad exportada y filtros aplicados. Se mantienen límite de 10 000 filas, permisos, auditoría, encabezados seguros y neutralización de fórmulas.
- Prompt maestro, Fase 5: 8/8 pruebas backend focalizadas y 52/52 pruebas frontend correctas; ESLint focalizado y build Vite correctos. Sin migraciones ni cambios directos en MySQL.
- Prompt maestro, Fase 6: suite completa backend 140/140, suite frontend 52/52 y ESLint completo correctos. El empaquetado Maven generó el JAR ejecutable y el build Vite procesó 2522 módulos correctamente.
- Prompt maestro, Fase 6: MySQL local se comprobó saludable con las 9 tablas de incidentes, 10 categorías activas, 4 SLA activos y 0 incidentes antes del recorrido. Backend Docker inició conectado a MySQL 8.0.46 y `/api/health` respondió `UP`.
- Prompt maestro, Fase 6: la prueba HTTP integral no creó datos: el login local intentó OTP/correo y no devolvió sesión antes del timeout. Después Docker Desktop dejó de exponer su motor, por lo que no fue posible continuar la verificación transaccional. Queda pendiente repetir el recorrido con Docker activo y acceso local de pruebas efectivo.

## Bloqueos y próximos pasos

- Consolidación BD-3: preparada la migración 018 con 11 solicitudes y 16 problemas técnicos mediante `INSERT IGNORE`; no se ejecutó y no sobrescribe configuraciones existentes.
- Consolidación BD-4: backend adaptado con catálogo autenticado, referencias estructuradas opcionales compatibles, validación de códigos activos, categoría coherente, SLA aplicado persistido y primera atención de tickets. Servicios transaccionales y auditoría existentes se conservaron; frontend y RFC no se modificaron.
- Pruebas BD-3/BD-4: compilación Java 21 y 26/26 pruebas focalizadas correctas en una copia aislada, debido al bloqueo ACL previo de `backend/target`.
- Consolidación BD-5 no iniciada: no existe un listener MySQL local en 3306/3307 y no se confirmó respaldo ni autorización expresa para aplicar 017/018.

- Reorganización de Mesa de Ayuda detenida antes de Fase 2 por decisión del usuario. Se preparó `database/rollbacks/016_incident_reporting.rollback.sql` para retirar integralmente la versión 016 antes de su rediseño; no fue ejecutado sobre MySQL.
- El rollback conserva las cinco tablas de 015, se bloquea si detecta datos funcionales en campos o escalamientos de 016 y elimina cuatro tablas, 16 columnas, cuatro claves foráneas, tres índices y el registro 016 de la bitácora.

- No existe contrato para reclasificar prioridad con motivo, permiso específico e historial auditable.
- El backend acepta la prioridad enviada por el cliente; validar/recalcular la clasificación en servidor requiere autorización para cambiar backend y contrato.
- Alcance, impacto, urgencia, continuidad, frecuencia, probabilidad y riesgo quedan conservados dentro de la justificación, no como campos consultables. Persistirlos de forma estructurada requiere cambios autorizados de backend y MySQL.
- El usuario reporta que 015 ya está preparada/aplicada y sus tablas no contienen incidentes; esta sesión no verificó directamente la instancia MySQL.
- El usuario reporta que la migración 016 ya fue aplicada; esta sesión no consultó directamente la instancia MySQL ni ejecutó nuevamente la migración.
- Sigue pendiente validar la instancia con `check-schema.sql` y realizar una prueba integral con datos reales para confirmar conteos operativos.
- Las pruebas backend usan repositorios simulados y comprobaciones estáticas de SQL; no sustituyen una prueba transaccional contra la instancia MySQL donde se aplicó 016.
- La estructura XLSX se validó como ZIP/XML y se comprobó la descarga mediante Blob, pero no se abrió manualmente en Microsoft Excel o LibreOffice durante esta sesión.
- Los promedios excluyen incidentes sin fecha de primera atención o recuperación/cierre; no los convierten artificialmente en cero.
- Los indicadores cargan en memoria el alcance visible del usuario. La exportación está limitada a 10 000 filas, pero volúmenes mucho mayores requerirán agregación y paginación en base de datos.
- El build frontend conserva la advertencia no bloqueante por un chunk principal de aproximadamente 1.29 MB.
- El empaquetado `mvn -DskipTests package` quedó pendiente porque Maven necesita descargar `file-management:3.1.0` y la sesión no puede escribir en `C:\Users\ASUS\.m2`; compilación y pruebas no están afectadas.
- No existe integración Prometheus/Grafana; el registro inicial de incidentes es manual.
- Los permisos de `AdminTicketsPage.jsx` y `TechnicianTicketsPage.jsx` fueron corregidos manualmente y la integración quedó aplicada.
- Próximo paso: ejecutar `check-schema.sql` y una prueba integral controlada de indicadores/exportación contra la instancia MySQL ya migrada.

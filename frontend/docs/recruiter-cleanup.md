# Revisión del módulo reclutador y navegación

## Alcance

Cambios limitados a frontend. Se conservan autenticación, OTP y funcionalidades demo del candidato. No se implementan endpoints ni se publican cambios en Git.

## Archivos de esta limpieza

Modificados: `src/services/api.js`, `src/components/layout/Header.jsx`, `src/layouts/RecruiterLayout.jsx`, `src/routes/AppRoutes.jsx` y las páginas de reclutador `DashboardPage.jsx`, `PostulantesPage.jsx`, `EntrevistasPage.jsx`, `EvaluacionesPage.jsx`, `PerfilCandidatoPage.jsx`, `PublicarOfertaPage.jsx`.

Nuevos: `src/services/recruiterTransport.js`, `recruiterService.js`, `recruiterAdapters.js`, `src/hooks/useRecruiterData.js`, `src/components/ui/DataState.jsx`, `src/pages/reclutador/OfertasPage.jsx`, `tests/recruiter-service.test.mjs`, `tests/recruiter-browser.mjs` y este reporte. Se actualizaron las pruebas existentes de API y navegador. Otros cambios de candidato/auth presentes en el árbol pertenecen al trabajo previo, documentado en `functional-fixes.md`.

## Datos y pantallas

Se retiró del flujo del reclutador el consumo de candidatos, entrevistas, evaluaciones, estadísticas y notificaciones ficticias. Publicar ya no inserta ofertas en el almacenamiento demo. Se retiraron los valores de ejemplo precargados del formulario y la fecha fija del calendario. Los archivos demo compartidos se conservan para candidato y autenticación; no alimentan los nuevos servicios del reclutador.

Se conservan opciones de departamentos, jornadas, modalidades, estados, nombres de meses, colores, etiquetas e iconos: son configuración y presentación, no registros empresariales.

| Pantalla | Resultado |
| --- | --- |
| Dashboard | Métricas derivadas de las colecciones recibidas; cero al estar vacías, indicadores durante carga y error con reintento. Gráfico sin cifras inventadas. |
| Postulantes | Directorio vacío inicialmente; búsqueda, estados, paginación y enlaces a perfiles conservados. Puntaje desconocido se muestra N/D. |
| Entrevistas | Calendario inicia en el mes actual, navegación mensual y selección de día. Listas vacías sin entrevistas simuladas. |
| Evaluaciones | Contadores derivados, filtros, tarjetas y detalles preparados; sin puntajes o estados fabricados. |
| Ofertas | Listado, búsqueda, filtro, detalle por ID y acceso a publicar bajo `/reclutador/ofertas`. |
| Perfil de candidato | Carga por ID, estado no encontrado y manejo seguro de campos opcionales. Cambiar estado espera confirmación del servicio. |
| Publicación | Validación, control de envío duplicado, espera asíncrona y error visible. Nunca confirma un guardado local como publicación real. |
| Encabezado | Identidad de AuthContext, notificaciones vacías y búsqueda que dirige al directorio con `?q=`. |

## Rutas e interactividad revisadas

- Rutas públicas, login por modal, registro y OTP.
- Postulación por ID, oferta inexistente, navegación entre pasos, CV, términos y confirmación demo.
- Mis postulaciones aisladas por usuario; perfil con aviso de cambios sin guardar.
- Cierre de sesión y acceso sin sesión a ruta protegida.
- Reclutador: ofertas, postulantes, entrevistas, evaluaciones, publicación y dashboard.
- Detalles inexistentes y página 404, incluido el segmento de reclutador.
- Cambio de mes, búsqueda del encabezado, filtros con registros exclusivos de prueba, error controlado y reintento.

## Capa de integración

`api.js` reexporta las operaciones del reclutador; las páginas no necesitan conocer URLs. `recruiterService.js` maneja errores y timeout, y `recruiterAdapters.js` valida colecciones, IDs y campos opcionales. `recruiterTransport.js` concentra el punto pendiente de conexión. Sus lecturas devuelven arrays vacíos y sus escrituras rechazan la operación expresamente; no utilizan localStorage como backend.

Operaciones preparadas: `getRecruiterDashboard`, `getRecruiterJobs`, `getRecruiterJob`, `getRecruiterCandidates`, `getRecruiterCandidate`, `getRecruiterInterviews`, `getRecruiterEvaluations`, `getRecruiterNotifications`, `publishJob`, `updateRecruiterJob`, `updateCandidateStatus`, `scheduleRecruiterInterview`, `createRecruiterEvaluation`.

Pendiente: contratos reales, autenticación de solicitudes, URLs y adaptación de respuestas en la capa de servicios. Exportación, descarga de CV, reportes, borradores, programación, edición de ofertas y creación de evaluaciones requieren implementación real y tienen controles deshabilitados. La barra de formato del textarea también está deshabilitada porque no implementa edición enriquecida. El único punto de integración documentado está en el transporte; no hay URLs supuestas ni solicitudes a endpoints inventados.

## Validación y límites

- `npm.cmd run build`: correcto. Advertencia de bundle JS superior a 500 kB (aproximadamente 823 kB, 235 kB gzip).
- `npm.cmd run lint`: correcto.
- `node --test --test-concurrency=1 tests/*.test.mjs`: 8 pruebas correctas.
- `node tests/browser-flows.mjs` y después `node tests/recruiter-browser.mjs`: correctos, contra Vite en 5178 y Chrome con perfil desechable/CDP en 9238.
- Los registros sintéticos de prueba no forman parte de las fuentes de datos de la aplicación y se eliminan al recargar el navegador.

La integración real con servidor no está validada porque aún no existe un contrato conectado. Los detalles buscan actualmente dentro de las colecciones completas: si el backend ofrece paginación, el servicio deberá usar consultas por ID y totales del servidor. Los controles de acceso del cliente deberán complementarse con autorización en backend. El bundle se beneficiaría de carga diferida por ruta. Las pruebas de navegador cubren los flujos descritos, no constituyen una auditoría exhaustiva de todos los tamaños de pantalla o accesibilidad.

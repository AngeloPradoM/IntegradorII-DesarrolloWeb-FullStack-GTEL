# Entrega 3 — Validación funcional y calidad

Fecha de ejecución: 12/10/2026. Estado general: **En desarrollo**, con los pasos 11, 12, 13 y 15 en pruebas. No equivale a aprobación UAT ni a certificación ISO.

## Estado de los pasos 11 al 15

| Paso | Alcance | Estado | Evidencia actual | Pendiente para aprobar |
|---|---|---|---|---|
| 11 | Recorridos funcionales por actor | En pruebas | Suite backend, contratos frontend y recorrido Chrome con HTTP simulado | MySQL/Gmail reales, cuentas controladas y aprobación funcional |
| 12 | Rendimiento, paginación y filtros | En pruebas | Paginación con límite 100; build dividido por rutas; protocolo p50/p95 añadido | Ejecutar contra volumen representativo en MySQL y acordar SLA |
| 13 | Observabilidad y diagnóstico | En pruebas | Health público; métricas Actuator exclusivas de ADMIN; errores SQL con referencia | Integrar recolección externa, alertas, retención y responsables |
| 14 | Cobertura operativa | En desarrollo | Matriz funcional revisada abajo | Resolver o excluir formalmente exportaciones, borradores y sincronización de favoritos |
| 15 | Pruebas, documentación y UAT | En pruebas | CI, matriz UAT y evidencia reproducible | Ejecución CI remota, UAT firmada y navegadores/dispositivos reales |

## Evidencia automatizada

| Evidencia | Resultado |
|---|---|
| Backend `mvn test` | 60 pruebas, 0 fallos, 0 errores |
| Frontend `npm run lint` | Sin errores |
| Frontend `node --test tests/*.test.mjs` | 12 pruebas aprobadas |
| Build Vite | Correcto: 2490 módulos, aproximadamente 0.58 s en esta ejecución |
| Auditoría npm | 0 vulnerabilidades después de actualizar `brace-expansion` y `source-map-js` dentro de rangos compatibles |
| Backend local con MySQL | Inicio correcto con MySQL 9.7 y `GET /api/health` respondió `UP`; no sustituye los recorridos UAT ni la BD QA aislada |
| Recorrido Chrome | Ofertas, detalle, recuperación, selección, edición, papelera y notificaciones aprobados con HTTP simulado |
| Responsive | Selección validada a 390 × 844 sin desbordamiento horizontal |

Los errores de correo y persistencia registrados durante Maven pertenecen a casos negativos simulados. Las advertencias de Byte Buddy/Mockito no causaron fallos, pero deben revisarse antes de una versión del JDK que prohíba la carga dinámica de agentes.

## Mejora medible del frontend

Se aplicó carga diferida por ruta en `AppRoutes.jsx`. Antes, el archivo JavaScript principal medía aproximadamente **889.9 kB** (253.1 kB gzip). Después quedó en aproximadamente **355.3 kB** (109.0 kB gzip). El dashboard con gráficas se carga en un fragmento separado de aproximadamente 338.5 kB.

La reducción del archivo principal es cercana al 60 %. Estos tamaños no son tiempos de usuario ni un SLA; falta medir red, caché y dispositivos representativos. El recorrido de navegador ahora falla ante errores de consola. La primera ejecución detectó claves React duplicadas en datos de contacto; se sustituyeron por identificadores estables.

## Recorridos obligatorios de aceptación

| ID | Actor | Recorrido | Resultado esperado | Evidencia requerida | Estado |
|---|---|---|---|---|---|
| UAT-01 | Visitante | Consultar ofertas y detalle | Solo ofertas públicas activas; interfaz usable | Captura, HTTP y datos de BD controlada | Pendiente UAT |
| UAT-02 | Candidato | Registro → OTP → login | Cuenta creada, OTP válido y sesión correcta | Correo controlado, log sin códigos y captura | Pendiente UAT |
| UAT-03 | Candidato | Recuperar contraseña | Enlace único, contraseña cambia y sesión previa queda revocada | HTTP, correo y nuevo login | En pruebas automatizadas |
| UAT-04 | Candidato | Editar perfil → postular con PDF | Datos persisten; postulación y documento quedan asociados | Captura, filas y descarga protegida | En pruebas automatizadas |
| UAT-05 | Candidato | Consultar sus postulaciones | No accede a las de otra cuenta | HTTP 404/403 y captura | En pruebas automatizadas |
| UAT-06 | Reclutador | Crear, editar, publicar y enviar oferta a papelera/restaurar | Estados y plazo coherentes | Capturas, auditoría y BD | En pruebas automatizadas |
| UAT-07 | Reclutador | Buscar candidato, descargar CV y cambiar estado | Acceso compartido del equipo; transición válida | HTTP, PDF y timeline | En pruebas automatizadas |
| UAT-08 | Reclutador | Programar entrevista y registrar evaluación | Fecha, hora, duración y resultado persisten | Capturas y filas relacionadas | En pruebas automatizadas |
| UAT-09 | Administrador | Crear/editar/desactivar/eliminar cuenta y consultar auditoría | Permisos exclusivos y trazabilidad | Capturas, HTTP y auditoría | En pruebas automatizadas parciales |
| UAT-10 | Seguridad | Probar rutas con rol incorrecto y sin token | 401 o 403 sin filtrar datos | Solicitudes y respuestas | En pruebas automatizadas |

Una prueba automatizada no cambia a “Aprobado” hasta que el responsable funcional ejecute el recorrido sobre aceptación y registre su decisión.

## Rendimiento

El directorio usa paginación de servidor y limita el tamaño de página a 100. Las demás listas no están todas paginadas; notificaciones limita 100 y varias vistas de reclutamiento aún cargan colecciones completas.

`scripts/measure-api.ps1` mide una ruta GET local autenticada sin incluir el token en argumentos. Rechaza destinos distintos de localhost. Ejemplo:

```powershell
$env:GTEL_QA_TOKEN='TOKEN_DE_CUENTA_QA'
.\scripts\measure-api.ps1 -BaseUrl http://localhost:8080 -Samples 50 -MaxP95Ms 1000
Remove-Item Env:GTEL_QA_TOKEN
```

La meta inicial propuesta es p95 ≤ 1000 ms para búsquedas habituales. Debe acordarse y probarse con datos similares a producción. La medición p95 todavía debe ejecutarse y archivarse con el backend conectado a una base MySQL aislada y con volumen representativo.

## Observabilidad

- `/api/health` y `/actuator/health` son públicos y no muestran detalles internos.
- `/actuator/metrics` requiere ADMIN; candidato, reclutador y visitante están bloqueados por integración.
- Los errores inesperados de persistencia generan `X-Error-Id` y el log evita SQL y valores sensibles.
- Producción debe recolectar métricas y logs externamente con acceso restringido, alertas y retención definida.

No se habilitó Prometheus ni una plataforma externa porque depende de la infraestructura de despliegue.

## Cobertura operativa

| Función | Situación |
|---|---|
| Autenticación, OTP, recuperación y revocación | Implementada; Gmail real pendiente |
| Perfil del candidato | Implementado y persistido |
| Ofertas y papelera | Implementadas |
| Postulación y CV protegido | Implementados |
| Estados, timeline, entrevistas y evaluaciones | Implementados |
| Notificaciones internas y envío programado | Implementados; correo real pendiente |
| Administración y auditoría | Implementadas; protección externa pendiente |
| Exportación Excel/PDF de reportes | No implementada; control oculto |
| Borradores de ofertas | No implementados |
| Favoritos sincronizados entre equipos | No implementados; almacenamiento local por usuario |
| Métricas externas, alertas y SLA | No implementados en infraestructura |

Las funciones no implementadas deben incorporarse como requerimientos formales o excluirse de la versión; no se presentan como terminadas.

## Acta UAT

| Campo | Valor |
|---|---|
| Versión/commit | Pendiente |
| Entorno y BD aislada | Pendiente |
| Fecha y responsable | Pendiente |
| Recorridos ejecutados | Pendiente |
| Incidencias abiertas | Pendiente |
| Decisión | Pendiente / Aprobado / Rechazado |
| Evidencias | Rutas sin secretos ni datos personales innecesarios |

## Criterio de salida

La Entrega 3 sigue **En desarrollo** porque el paso 14 todavía requiere una decisión funcional. Para aprobarla se requieren además MySQL aislado, Gmail controlado, mediciones p95, ejecución remota del workflow y UAT firmada. No se declara “Todo funcional”.


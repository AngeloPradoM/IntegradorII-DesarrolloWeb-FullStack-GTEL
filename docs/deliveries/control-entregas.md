# Control de entregas — GTEL Talento

Fecha de revisión: 12/10/2026. Entrega activa: **3 — Validación funcional y calidad**, por indicación posterior del usuario; Entregas 1 y 2 mantienen pendientes.

## Reglas de control

Cada tarea recorre: **Pendiente → En desarrollo → Implementado → En pruebas → Aprobado**.
Una implementación existente no equivale a una aprobación. Se registra cada transición con evidencia y responsable. Si una prueba falla, la tarea permanece En pruebas, con una incidencia y una nueva ejecución; no se borra el resultado fallido.

DoR (antes de desarrollar): alcance, actor, dependencias, datos de prueba y resultado esperado definidos.
DoD (para aprobar): implementación revisada, pruebas obligatorias satisfactorias, evidencia reproducible y aprobación del responsable. Una entrega solo es Todo funcional cuando todas sus tareas y recorridos obligatorios están Aprobados.

## Entregas secuenciales

| Entrega | Pasos | Alcance | Estado |
|---|---|---|---|
| 1 | 1–5 | Alcance y permisos | En desarrollo |
| 2 | 6–10 | Protección y recuperación | En desarrollo |
| 3 | 11–15 | Validación funcional y calidad | En desarrollo |
| 4 | 16–17 | Despliegue y aprobación | Pendiente |

Regla original: cerrar cada entrega antes de iniciar la siguiente. Excepciones del 12/10/2026: el usuario indicó continuar primero con Protección y recuperación y después con Validación funcional y calidad. Los pendientes de las entregas anteriores siguen abiertos y condicionan la aprobación final.

## Decisiones de alcance

GTEL es un sistema de reclutamiento. Roles incluidos: ADMIN, RECLUTADOR y CANDIDATO. Jefatura, módulos escolares, matrículas, cursos y calificaciones quedan fuera de este alcance. El prototipo index no forma parte de la aplicación productiva evaluada.

**Decisión confirmada por el usuario:** los reclutadores acceden a todas las ofertas y candidatos del equipo. El administrador conserva supervisión global. Un candidato solo accede a su perfil, notificaciones, postulaciones y CV. El equipo se interpreta como la única organización de esta instalación; no existe aislamiento multiempresa acreditado.

## Entrega 1: tareas y aceptación

| Paso / ID | Trabajo y responsable propuesto | Criterio de aceptación / evidencia | Estado actual | Falta para aprobar |
|---|---|---|---|---|
| 1 / E1-01 | Consolidar alcance RF/RNF/SEG — líder técnico y responsable funcional | Catálogo con ID, actor, prioridad, dependencia, criterio y prueba; exclusiones explícitas | En desarrollo | Completar trazabilidad individual de RF01–RF18 y acordar el catálogo de requisitos adicionales; no se inventan RF19–RF27 |
| 2 / E1-02 | Matriz de permisos — responsable funcional y backend | Matriz validada para cada operación y alcance de registro | En desarrollo | Revisar todas las operaciones del catálogo; la decisión de acceso compartido ya está confirmada |
| 3 / E1-03 | Comprobar permisos en API e interfaz — backend, frontend y QA | Acceso del equipo, aislamiento del candidato, rechazo a anónimos y bloqueo administrativo | En pruebas | Completar cobertura de edición/borrado y recorrido real en navegador; evidencia parcial aprobatoria abajo |
| 4 / E1-04 | Revisar configuración y privilegios — backend y operaciones | Configuración sin secretos publicados, excepciones de prueba desactivadas en producción, usuario MySQL con privilegios necesarios | En desarrollo | Revisar historial y configuración efectiva, confirmar rotación de credenciales expuestas y privilegios reales de MySQL |
| 5 / E1-05 | Contrastar esquema y migraciones — backend, DBA y QA | MySQL aislado con esquema y migraciones compatibles, integridad y concurrencia verificadas | En desarrollo | Falta ejecutar y archivar la validación sobre una base MySQL aislada `gtel_qa_*`, comparar columnas/índices/FK y realizar pruebas concurrentes |

Los responsables son funciones propuestas; falta asignar integrantes concretos. No hay tareas ni entregas marcadas Aprobadas por ausencia de aprobación integral.

## Matriz inicial de permisos

| Operación | Visitante | Candidato | Reclutador | Administrador |
|---|---|---|---|---|
| Consultar ofertas públicas | Sí | Sí | Sí | Sí |
| Perfil y notificaciones personales | No | Propios | Propios | Propios |
| Postular con CV | No | Con perfil candidato válido | No | Requiere perfil candidato válido; supervisión no implica suplantación |
| Consultar postulaciones/CV | No | Propios | Todos los del equipo | Global |
| Gestionar ofertas, entrevistas, evaluaciones y estados | No | No | Compartido en el equipo | Global |
| Administrar usuarios y consultar auditoría | No | No | No | Sí |

Fuentes revisadas: SecurityConfig, AccountAccessService, ApplicationService, ApplicationController y ProtectedRoute. La matriz registra el alcance acordado; no sustituye pruebas de cada endpoint.

## Evidencia de esta ejecución

| ID | Comprobación | Resultado obtenido | Límite |
|---|---|---|---|
| EV-01 | Maven test, suite backend | 58 pruebas, 0 fallos, 0 errores | H2 aislado; no acredita MySQL real ni Gmail |
| EV-02 | Segundo reclutador y administrador consultan detalle y CV de una postulación | HTTP 200 y bytes del PDF iguales al original | MockMvc con cadena de seguridad real |
| EV-03 | Otro candidato solicita ese CV y consulta sus postulaciones | HTTP 404 para CV ajeno; listado propio vacío | Datos de prueba transaccionales |
| EV-04 | Visitante solicita CV protegido | HTTP 401 | API directa |
| EV-05 | npm run lint | Código de salida 0 | Análisis estático |
| EV-06 | node --test tests/*.test.mjs | 12 pruebas aprobadas, 0 fallos | Contratos frontend; no navegador conectado a MySQL |
| EV-07 | Configuración productiva y archivos locales | Perfil prod usa variables; test-access-enabled=false; local.properties e index/.env no aparecen en git ls-files | No acredita ausencia de secretos en todo el historial o configuración efectiva del despliegue |

Pruebas añadidas en src/test/java/pe/com/gtel/talento/integration/ModuleWiringTest.java, dentro de frontendWriteContractsCompleteTheRecruitmentWorkflow. Se crean dos cuentas únicamente en la transacción aislada, que se revierte. No se modificó la BD de desarrollo ni se enviaron correos.

Primera ejecución: falló el recuento administrativo esperado porque las dos nuevas cuentas aumentaron el total de 3 a 5. Se corrigió la expectativa y se repitió la suite completa con éxito. Los logs simulados de errores de persistencia/correo pertenecen a pruebas de manejo de errores. Hubo advertencias de Mockito y colisión del puerto HMR 24678 en pruebas frontend; las suites finalizaron correctamente.

Evidencia detallada regenerable: backend/target/surefire-reports/TEST-*.xml. Estos archivos de compilación no se versionan; archivarlos como artefactos del CI o del acta de validación para una aprobación duradera.

## Reproducción

Desde backend:

```powershell
mvn.cmd test
```

Desde frontend:

```powershell
npm.cmd run lint
node --test tests/*.test.mjs
```

La ejecución local utilizó además -Dmaven.repo.local=C:\Users\ASUS\.m2\repository. Nunca configurar QA_MYSQL_URL contra gtel_talento: la suite exige una base vacía aislada con prefijo gtel_qa_.

## Hallazgos y siguiente trabajo

1. Conservar el acceso compartido actual: no era necesario cambiar los permisos productivos para cumplir la decisión del usuario.
2. Completar catálogo y pruebas de todos los permisos, incluidas operaciones de escritura, desactivación y cambio de rol; ejecutar navegador con cuentas aisladas.
3. Verificar configuración efectiva y permisos MySQL sin publicar credenciales. La rotación de claves externas requiere ejecutarse en el proveedor; no se considera realizada.
4. Revisar migraciones en una copia aislada: el script consolidado termina con ALTER TABLE no idempotentes y la unicidad candidato/vacante depende del bloqueo en el servicio, no de una restricción compuesta de BD. No volver a ejecutar el esquema indiscriminadamente en una base con datos.
5. Validar en MySQL real integridad, restauración de la copia de prueba y concurrencia antes del cierre del paso 5. No asumir que H2 demuestra equivalencia total.
6. Registrar aprobación funcional de los recorridos; cerrar Entrega 1 y recién entonces iniciar Entrega 2.

## Registro de seguimiento

| Fecha | Tarea | Movimiento / evento | Evidencia |
|---|---|---|---|
| 12/10/2026 | E1-01, E1-02, E1-04, E1-05 | Pendiente → En desarrollo | Inspección inicial y este documento |
| 12/10/2026 | E1-02 | Decisión funcional confirmada: equipo compartido | Respuesta explícita del usuario |
| 12/10/2026 | E1-03 | Pendiente → En desarrollo → Implementado → En pruebas | Reglas existentes revisadas; nuevas aserciones de aislamiento y acceso compartido; EV-01 a EV-06 |

**Resultado de control:** Entrega 1 abierta. No se declara Todo funcional, despliegue aprobado ni cumplimiento formal de estándares.
Seguimiento: [Entrega 2](entrega-2-proteccion-recuperacion.md).

Seguimiento: [Entrega 3](entrega-3-validacion-calidad.md).

Preparación: [Entrega 4](entrega-4-despliegue-aprobacion.md).

# Plan de consolidación de base de datos

Estado: **Paso 6 — procedimiento operativo documentado; pendiente de aprobación del corte**.

`database/` es la fuente única de verdad para el esquema y las migraciones nuevas. Las rutas
anteriores se conservan únicamente como histórico dentro de `database/snapshots/`.

## Decisión de arquitectura

La fuente consolidada toma como referencia funcional `database/` porque:

- El esquema incluye las tablas que consume el backend actual, incluidos tickets, estados e historial.
- La configuración del proyecto no utiliza Flyway ni Liquibase.
- Las pruebas de integración y los documentos operativos apuntan al esquema consolidado.
- Las migraciones nuevas tienen numeración única y separan estructura, seeds y snapshots.

La carpeta raíz `database/` se clasifica como material histórico o alternativo hasta completar la comparación semántica. Sus migraciones no se ejecutarán automáticamente ni se mezclarán por número.

La estructura `database/` es el destino de consolidación. Durante la transición se mantienen
las rutas antiguas intactas y en modo solo lectura para conservar trazabilidad.

## Estructura objetivo

```text
database/
  README.md
  MIGRATION_GUIDE.md
  COMPATIBILITY_MATRIX.md
  schema/
    gtel_talento.sql
  migrations/
    000_migration_history.sql
    001_postulante_telefono.sql
    002_email_otp.sql
    003_admin_access.sql
    004_recruitment_workflow.sql
    005_job_trash.sql
    006_audit_deleted_users.sql
    007_support_tickets.sql
    008_notification_schema_compatibility.sql
    009_support_ticket_lifecycle.sql
  seeds/
    development_accounts.sql
  scripts/
    check-schema.sql
    migration-status.sql
  snapshots/
    README.md
```

Responsabilidades:

- `schema/`: instalación limpia y reproducible.
- `migrations/`: cambios incrementales numerados; no se edita una migración ya aplicada.
- `seeds/`: datos de referencia o desarrollo, separados de la estructura.
- `scripts/`: validaciones y consultas de diagnóstico que no modifican datos.
- `snapshots/`: referencia histórica, nunca scripts activos de actualización.
- `MIGRATION_GUIDE.md`: actualización desde las estructuras actuales.
- `COMPATIBILITY_MATRIX.md`: correspondencia, dependencias y riesgos de cada archivo.

## Correspondencia entre las rutas actuales

| Origen | Equivalente objetivo | Decisión | Motivo |
|---|---|---|---|
| `database/snapshots/legacy-backend-database/migrations/000_init_gtel_talento_mejoras.sql` | Base histórica | Conservar fuera de migraciones nuevas | Es un inicializador antiguo y ya tiene rollback asociado |
| `database/snapshots/legacy-backend-database/migrations/001_postulante_telefono.sql` | `database/migrations/001_postulante_telefono.sql` | Consolidar después de normalizar formato | Es equivalente a la versión raíz |
| `database/snapshots/legacy-backend-database/migrations/001_seed_vacantes.sql` | `database/seeds/` | Separar del esquema | Inserta datos, no modifica estructura |
| `database/snapshots/legacy-backend-database/migrations/002_email_otp.sql` | `database/migrations/002_email_otp.sql` | Consolidar | Es equivalente a la versión raíz |
| `database/snapshots/legacy-backend-database/migrations/002_postulaciones_cv.sql` | `database/migrations/003_postulaciones_cv.sql` | Renumerar solo durante la consolidación | Su número actual colisiona con otra funcionalidad |
| `database/snapshots/legacy-backend-database/migrations/003_admin_access.sql` | `database/migrations/004_admin_access.sql` | Renumerar con mapa de compatibilidad | El orden final debe ser único |
| `database/snapshots/legacy-backend-database/migrations/004_recruitment_workflow.sql` | `database/migrations/005_recruitment_workflow.sql` | Usar como base funcional | Es el flujo que consume el backend actual |
| `database/snapshots/legacy-backend-database/migrations/005_job_trash.sql` | `database/migrations/006_job_trash.sql` | Usar como base funcional | Compatible con el servicio de papelera actual |
| `database/snapshots/legacy-backend-database/migrations/006_audit_deleted_users.sql` | `database/migrations/007_audit_deleted_users.sql` | Usar como base funcional | Conserva el actor histórico requerido por administración |
| `database/snapshots/legacy-backend-database/migrations/007_support_tickets.sql` | `database/migrations/008_support_tickets.sql` | Usar como base funcional | Implementa Mesa de Ayuda y rol técnico |
| `database/snapshots/legacy-backend-database/migrations/008_notification_schema_compatibility.sql` | `database/migrations/009_notification_schema_compatibility.sql` | Usar como adaptación | Evita incompatibilidad con notificaciones existentes |
| `database/snapshots/legacy-backend-database/migrations/009_support_ticket_lifecycle.sql` | `database/migrations/010_support_ticket_lifecycle.sql` | Usar como base funcional | Implementa estados, historial y archivo de tickets |
| `database/migrations/004_seed_dashboard_analytics.sql` | `database/seeds/` | Revisar y separar | Es una carga de datos, no una migración estructural |
| `database/migrations/005_rbac_roles_requerimientos.sql` | Matriz de compatibilidad | No copiar todavía | Puede duplicar roles y requerimientos existentes |
| `database/migrations/006_seguridad_privacidad_arco.sql` | Matriz de compatibilidad | No copiar todavía | Usa nombres y reglas ARCO distintos al esquema actual |
| `database/migrations/007_notificaciones_tiempo_real.sql` | Matriz de compatibilidad | No copiar todavía | Debe compararse con la implementación actual de notificaciones |
| `database/migrations/008_unificacion_recuperacion_papelera_auditoria.sql` | Descomponer | No ejecutar íntegramente | Agrupa varios cambios y puede duplicar objetos existentes |
| `database/*.sql` | `database/snapshots/` | Solo referencia | Son volcados con `DROP TABLE`; no son migraciones seguras |

La numeración de `database` queda documentada y es la fuente de ejecución del
backend hasta aprobar el corte. La evidencia de validación está en
[`database/VALIDATION_REPORT.md`](../database/VALIDATION_REPORT.md).

## Reglas de control

1. Una migración nueva se crea únicamente en `database/migrations/`.
2. Una migración aplicada no se edita; se crea otra migración correctiva.
3. El esquema de instalación limpia debe generarse a partir de la estructura objetivo validada.
4. Los seeds no deben ser necesarios para crear tablas.
5. Los snapshots no se ejecutan contra una base existente.
6. Cada migración debe documentar dependencias, riesgo de pérdida de datos y validación posterior.
7. Las credenciales quedan fuera de los scripts versionados.
8. Antes de actualizar una base existente se realiza un respaldo comprobable.

## Historial de aplicación futuro

Como el proyecto no tiene un historial automático de migraciones, la estructura consolidada deberá incorporar una tabla de control, por ejemplo `db_migration_history`, con:

- versión lógica;
- nombre del archivo;
- SHA-256 del archivo aplicado;
- fecha y hora;
- responsable;
- resultado;
- observación o respaldo asociado.

No se marcarán migraciones antiguas como aplicadas sin evidencia. Para bases existentes se registrará primero el diagnóstico estructural y luego una línea de baseline aprobada por el equipo.

## Estado de los pasos

| Paso | Resultado |
|---|---|
| 1. Preparación | Completado |
| 2. Diseño de consolidación | Completado |
| 3. Construcción de `database/` | Completado |
| 4. Validación aislada | Completado; 90 pruebas backend aprobadas |
| 5. Reorganización documental | Completado |
| 6. Procedimiento operativo | Documentado; pendiente de ejecución autorizada |
| 7. Corte de fuente de verdad | Completado; `database/` es la ruta oficial |
| 8. Cierre post-corte | Completado; suite Maven 90/90 aprobada |
| 9. Cierre de entrega y traspaso | En curso; pendientes evidencias operativas y UAT |

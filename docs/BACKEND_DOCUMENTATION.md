# Documentación del backend

Los documentos se agrupan por responsabilidad para distinguir las guías vigentes de los informes históricos.

| Carpeta | Contenido |
|---|---|
| [`architecture/`](architecture/) | Arquitectura de `src` y flujo funcional de reclutamiento |
| [`deliveries/`](deliveries/) | Control de las cuatro entregas, estados y evidencias requeridas |
| [`operations/`](operations/) | Configuración, respaldo, restauración y despliegue |
| [`reports/`](reports/) | Informes de cambios, diagnósticos y correcciones realizadas |

## Base de datos

La estrategia consolidada se encuentra en [`database/`](../database/). Incluye el esquema,
migraciones numeradas, seeds, scripts de diagnóstico y snapshots históricos. `database/` es la
fuente oficial para nuevas instalaciones y cambios; las rutas históricas no reciben cambios.
Toda aplicación sobre una base compartida requiere autorización y respaldo.

Documentos principales:

- [Plan de consolidación](database-consolidation-plan.md).
- [Guía de migración](../database/MIGRATION_GUIDE.md).
- [Matriz de compatibilidad](../database/COMPATIBILITY_MATRIX.md).
- [Informe de validación](../database/VALIDATION_REPORT.md).
- [Procedimiento operativo](../database/OPERATIONS.md).
- [Checklist de cierre post-corte](../database/POST_CUTOVER_CHECKLIST.md).
- [Traspaso de la entrega](../database/STEP9_HANDOFF.md).

## Lectura recomendada

1. [Arquitectura del backend](architecture/arquitectura-src.md).
2. [Flujo de reclutamiento](architecture/flujo-reclutamiento.md).
3. [Control de entregas](deliveries/control-entregas.md).
4. [Operación y producción](operations/operacion-produccion.md).

Los documentos de `reports/` conservan evidencia histórica. Si una afirmación difiere del código o de las entregas actuales, prevalecen el código validado, el README vigente y el control de entregas.

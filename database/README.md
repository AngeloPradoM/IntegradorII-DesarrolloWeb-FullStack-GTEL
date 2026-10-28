# Base de datos oficial de GTEL Talento

Esta carpeta contiene la estrategia consolidada de base de datos. `database/` es la única
fuente que utiliza el backend para nuevas instalaciones, pruebas y cambios incrementales.
Las rutas históricas se conservan fuera de esta ubicación y no reciben cambios nuevos.

## Estructura

- `schema/`: instalación limpia.
- `migrations/`: cambios incrementales consolidados y numerados.
- `seeds/`: datos de referencia o desarrollo, separados de la estructura.
- `scripts/`: comprobaciones de solo lectura.
- `snapshots/`: archivos históricos que no se ejecutan como migraciones.
- `OPERATIONS.md`: procedimiento de respaldo, baseline, actualización y recuperación.
- `LOCAL_SETUP.md`: guía práctica para integrar una base local desactualizada.

## Reglas

1. No editar una migración después de aplicarla.
2. Crear una migración nueva para cada cambio de estructura.
3. Ejecutar `schema/gtel_talento.sql` únicamente sobre una base nueva.
4. Respaldar una base existente antes de aplicar migraciones.
5. Registrar cada aplicación en `db_migration_history` con su SHA-256.
6. No registrar un baseline sin evidencia estructural de la base.
7. No ejecutar archivos de `snapshots/`.
8. No guardar contraseñas, tokens ni datos personales en esta carpeta.

## Estado de transición

Los archivos fueron consolidados desde las estrategias actuales. Las referencias del backend y
las pruebas ya apuntan al esquema consolidado; la base real no fue modificada automáticamente.
La evidencia de las pruebas aisladas está en [`VALIDATION_REPORT.md`](VALIDATION_REPORT.md).
El procedimiento operativo está en [`OPERATIONS.md`](OPERATIONS.md).
El detalle del corte está en [`CUTOVER_REPORT.md`](CUTOVER_REPORT.md).
El checklist de cierre está en [`POST_CUTOVER_CHECKLIST.md`](POST_CUTOVER_CHECKLIST.md).
El traspaso de la entrega está en [`STEP9_HANDOFF.md`](STEP9_HANDOFF.md).
La incorporación de una base local está en [`LOCAL_SETUP.md`](LOCAL_SETUP.md).

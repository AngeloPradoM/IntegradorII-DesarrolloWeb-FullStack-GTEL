# Base de datos oficial de GTEL Talento

Esta carpeta contiene el esquema canónico, las migraciones y las herramientas de
comprobación de MySQL. Empieza siempre por este archivo.

## Mapa rápido

| Ruta | Para qué sirve | ¿Se ejecuta? |
|---|---|---|
| `schema/gtel_talento.sql` | Crea una instalación nueva y completa | Solo sobre una base vacía |
| `gtel_talento.sql` | Espejo del esquema usado por Docker | Docker lo carga automáticamente en un volumen nuevo |
| `migrations/` | Cambios incrementales numerados de una base existente | Sí, en orden y después de respaldo/preflight |
| `rollbacks/` | Reversión controlada de migraciones concretas | Solo ante una reversión aprobada |
| `seeds/` | Datos de referencia o demostración | Solo cuando el entorno lo requiera |
| `scripts/` | Preflight, verificaciones y registro del historial | Según la clasificación de su README |
| `docs/setup/` | Instalación local y estrategia de migraciones | Documentación |
| `docs/operations/` | Respaldo, recuperación y cierre operativo | Documentación |
| `docs/reports/` | Evidencias, compatibilidad y traspaso | Documentación |
| `snapshots/` | Copias históricas anteriores a la consolidación | Nunca como migraciones actuales |

## Qué ruta debo usar

- **Base nueva y vacía:** `schema/gtel_talento.sql`.
- **Base existente con datos:** respaldo, preflight y solo las migraciones faltantes.
- **Docker con volumen nuevo:** `gtel_talento.sql`, montado por `docker-compose.yml`.
- **Comprobar el estado:** scripts `check-*` y `migration-status.sql`.
- **Entender el procedimiento:** [`docs/README.md`](docs/README.md).

## Reglas obligatorias

1. No editar una migración después de aplicarla.
2. Crear una migración nueva para cada cambio posterior.
3. No importar el esquema completo sobre una base con datos.
4. Respaldar y comprobar la restauración antes de una migración.
5. Registrar versión, archivo y SHA-256 en `db_migration_history`.
6. No registrar un baseline sin comprobar previamente la estructura.
7. No ejecutar archivos de `snapshots/`.
8. No guardar contraseñas, tokens ni datos personales en el repositorio.

## Estado actual de Mesa de Ayuda

- `015`: incidentes de producción P1-P4 y relaciones con tickets/RFC.
- `016`: categorías, SLA, asignación, escalamiento y seguimiento.
- `017`: consolidación estructural de solicitudes e incidentes.
- `018`: catálogos de 11 solicitudes y 16 problemas técnicos.
- `019`: idempotencia persistente para evitar tickets duplicados por reintentos.
- `020`: control operativo de incidentes y vista calculada de seguimiento.

Una instalación nueva creada con `database/gtel_talento.sql` utiliza únicamente
el esquema `gtel_talento` e incorpora 015 a 020 como `BASELINE`. Las migraciones
individuales se conservan para actualizar instalaciones anteriores; no deben
ejecutarse nuevamente sobre una instalación consolidada.

## Lectura recomendada

1. [Índice documental](docs/README.md).
2. [Configuración local](docs/setup/LOCAL_SETUP.md).
3. [Guía de migraciones](docs/setup/MIGRATION_GUIDE.md).
4. [Operación y recuperación](docs/operations/OPERATIONS.md).
5. [Informe de validación](docs/reports/VALIDATION_REPORT.md).

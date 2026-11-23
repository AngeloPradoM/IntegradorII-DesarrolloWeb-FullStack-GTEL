# Migraciones

Cada archivo modifica de forma incremental una base existente. Se ejecutan en
orden numérico y únicamente si `db_migration_history` demuestra que falta la
versión correspondiente.

| Rango | Área principal |
|---|---|
| `000` | Historial de migraciones |
| `001-007` | Usuarios, OTP, postulantes, reclutamiento y auditoría |
| `008-013` | Tickets, notificaciones, SLA, consentimiento y cuentas de prueba |
| `014` | Gestión de cambios y RFC |
| `015-016` | Incidentes de producción, categorías, SLA y asignación |
| `017-018` | Consolidación y catálogos de Mesa de Ayuda |
| `019` | Idempotencia persistente de creación de tickets |
| `020` | Evaluación estructurada de reportes técnicos Nivel 2 |

No vuelvas a ejecutar una migración aplicada ni cambies su contenido. Antes de
aplicar una nueva: preflight, respaldo restaurable, SHA-256 y autorización.

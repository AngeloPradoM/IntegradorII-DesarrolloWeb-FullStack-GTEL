# Matriz de compatibilidad

Estado: validada para pruebas aisladas; el corte de fuente de verdad sigue pendiente.

| Fuente | Destino propuesto | Tratamiento |
|---|---|---|
| `database/snapshots/legacy-backend-database/schema/gtel_talento.sql` | `database/schema/gtel_talento.sql` | Copia consolidada; conservar el origen como histórico |
| Migraciones 001–003 comunes | `database/migrations/001–004` | Contenido equivalente; se normalizan nombres y orden |
| `001_seed_vacantes.sql` | `database/seeds/001_seed_vacantes.sql` | Separado por ser carga de datos |
| Migraciones backend 004–009 | `database/migrations/005–010` | Base funcional actual |
| `database/migrations/004_seed_dashboard_analytics.sql` | Pendiente | No incluido: requiere validar datos y columnas |
| `database/migrations/005_rbac_roles_requerimientos.sql` | Pendiente | No incluido: posible duplicación de roles |
| `database/migrations/006_seguridad_privacidad_arco.sql` | Pendiente | No incluido: diferencias en solicitudes ARCO |
| `database/migrations/007_notificaciones_tiempo_real.sql` | Pendiente | No incluido: comparar con notificaciones actuales |
| `database/migrations/008_unificacion_recuperacion_papelera_auditoria.sql` | Pendiente | Debe descomponerse antes de usarlo |
| Volcados históricos | `database/snapshots/` | Solo históricos; contienen operaciones destructivas |

La numeración destino fue comprobada mediante instalación limpia y actualización de una base
temporal. Las migraciones originales permanecen sin cambios y son las que sigue usando el
backend hasta la aprobación del corte.

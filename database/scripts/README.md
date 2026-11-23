# Scripts de administración y validación

| Grupo | Archivos | Función |
|---|---|---|
| Solo lectura | `check-*.sql`, `migration-status.sql`, `preflight-*.sql` | Diagnosticar estructura, datos e historial |
| Registro | `register-*-after-verification.sql` | Registrar una migración ya comprobada |
| Mantenimiento | `corregir_ortografia_caracteres_bd.sql` | Corrección específica; revisar antes de ejecutar |
| Reinicio local | `reset-local-db.ps1` | Recrear una base local; operación destructiva |

Los scripts de registro y mantenimiento no son preflight. Requieren respaldo y
autorización. `reset-local-db.ps1` nunca debe apuntar a producción.

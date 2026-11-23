# Paso 8 — Cierre y estabilización post-corte

Este checklist cierra la transición hacia `database`. No autoriza eliminar el histórico ni
considera el trabajo finalizado hasta reunir evidencia de cada control.

## Checklist de cierre

| Control | Estado | Evidencia requerida |
|---|---|---|
| `database` es la única ruta para migraciones nuevas | Completado | Revisión de referencias activas |
| Histórico de migraciones queda archivado en `database/snapshots/` | Completado | Conteos de archivo coincidentes |
| Esquema consolidado probado en instalación limpia | Completado | Informe de validación aislada |
| Actualización de base existente probada | Completado | Informe de validación aislada |
| Baseline de la base compartida registrado | Pendiente | Diagnóstico, hash, fecha y responsable |
| Respaldo restaurado satisfactoriamente | Pendiente | Manifiesto y evidencia de restauración |
| Suite Maven posterior al corte | Pendiente | `BUILD SUCCESS` sin fallos |
| Recorrido frontend-backend conectado | Pendiente | Evidencia de navegador y logs |
| Revisión de seguridad y secretos | Pendiente | Checklist sin credenciales versionadas |
| Aprobación formal del equipo | Pendiente | Responsable y fecha de aprobación |

## Criterio de cierre

El Paso 8 solo puede marcarse como aprobado cuando todos los controles pendientes tengan
evidencia. En particular, una prueba anterior al corte no sustituye la ejecución posterior al
cambio de rutas.

## Ejecución recomendada

Realizar desde una carpeta escribible por el usuario:

```powershell
cd C:\ruta\escribible\IntegradorII-DesarrolloWeb-FullStack-GTEL\backend
mvn.cmd "-Dmaven.repo.local=C:\Users\ASUS\.m2\repository" test
```

Después de obtener `BUILD SUCCESS`, ejecutar el diagnóstico de `database/scripts/`, validar el
respaldo restaurado y registrar el resultado en la bitácora del entorno. No borrar las rutas
históricas antes de esa aprobación.

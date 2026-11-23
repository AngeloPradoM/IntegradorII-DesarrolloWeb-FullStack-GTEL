# Informe de validación aislada

## Alcance

Validación ejecutada en el Paso 4 sobre bases MySQL temporales. La base real `gtel_talento`
no fue modificada.

## Resultados

| Control | Resultado |
|---|---|
| Instalación limpia desde `schema/gtel_talento.sql` | Aprobado |
| Actualización de esquema anterior con soporte de tickets | Aprobado |
| Catálogo de estados de tickets | 6 estados verificados |
| Claves foráneas de soporte | 3 verificadas |
| Compatibilidad de `notificaciones.tipo` | Aprobada |
| Pruebas automatizadas del backend | 90 ejecutadas, 0 fallos |
| Limpieza de bases temporales | Aprobada |

## Observaciones

- La prueba demuestra que la estructura consolidada es instalable y compatible con el escenario
  de actualización validado.
- Las rutas históricas fueron archivadas en `database/snapshots/` y las referencias activas apuntan a `database/`.
- No se ejecutó ningún script destructivo sobre la base del equipo.
- Este informe no autoriza el cambio de fuente de verdad. Ese cambio requiere el procedimiento
  operativo, un respaldo comprobable y autorización del equipo.

## Evidencia reproducible

Desde `backend/`:

```powershell
mvn.cmd -Dmaven.repo.local="$env:USERPROFILE\\.m2\\repository" test
```

El resultado esperado es `BUILD SUCCESS` con `90` pruebas sin fallos.

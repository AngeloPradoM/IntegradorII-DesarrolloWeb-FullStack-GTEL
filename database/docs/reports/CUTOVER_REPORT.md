# Informe de corte hacia `database`

## Alcance

`database/` queda establecido como fuente oficial para nuevas instalaciones, pruebas y
migraciones incrementales. Las rutas anteriores se conservan en `database/snapshots/` como
histórico y no deben recibir cambios nuevos.

## Referencias actualizadas

- El esquema utilizado por `ModuleWiringTest` apunta a `database/schema/gtel_talento.sql`.
- Las pruebas de OTP y tickets leen `database/migrations/` con la numeración consolidada.
- El README raíz y el README del backend enlazan el esquema y las migraciones consolidadas.
- Las guías operativas y de flujo utilizan `database` como ruta oficial.
- No se eliminaron archivos de la ruta histórica.

## Validación

| Control | Resultado |
|---|---|
| Rutas consolidadas existentes | Aprobado |
| Referencias activas antiguas en `backend/src` | No encontradas |
| Formato de cambios (`git diff --check`) | Aprobado |
| Base de datos real | No modificada |
| Suite Maven posterior al corte | Pendiente de ejecutar en un entorno escribible |

La suite anterior al corte finalizó con 90 pruebas correctas. La ejecución posterior no pudo
completarse en el entorno actual porque `backend/target` está protegido dentro de `Program Files`
y la copia temporal encontró acceso denegado a un artefacto del repositorio Maven local. Para
cerrar la validación, ejecutar Maven desde una carpeta escribible por el usuario con un repositorio
local accesible.

## Procedimiento recomendado para cerrar la evidencia

```powershell
cd C:\ruta\escribible\IntegradorII-DesarrolloWeb-FullStack-GTEL\backend
mvn.cmd "-Dmaven.repo.local=C:\Users\ASUS\.m2\repository" test
```

El criterio de aprobación es `BUILD SUCCESS`, sin fallos ni errores.

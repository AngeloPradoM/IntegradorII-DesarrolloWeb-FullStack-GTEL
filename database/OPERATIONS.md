# Procedimiento operativo de base de datos

Este procedimiento es obligatorio para trabajar con `database`. Está diseñado para una
base temporal o para un cambio autorizado.

## 1. Precondiciones

1. Confirmar el entorno y la base objetivo.
2. Confirmar que el cambio tiene autorización y una ventana de mantenimiento.
3. Usar una cuenta MySQL con el mínimo privilegio necesario.
4. Confirmar que no existen contraseñas, tokens ni datos personales en los scripts.
5. Registrar responsable, fecha, versión y ticket o referencia del cambio.

Nunca usar la base real para una prueba de instalación limpia. Para las pruebas usar un nombre
temporal con prefijo `gtel_qa_`.

## 2. Respaldo comprobable

Crear el respaldo antes de modificar una base existente y verificarlo restaurándolo en una base
independiente. El respaldo se guarda fuera del repositorio:

```powershell
mysql_config_editor set --login-path=gtel --host=localhost --user=USUARIO_RESPALDO --password
.\scripts\backup.ps1 -LoginPath gtel -Database gtel_talento `
  -Destination 'D:\Respaldos\GTEL\gtel-aaaa-mm-dd.sql'
.\scripts\verify-backup.ps1 -Manifest 'D:\Respaldos\GTEL\gtel-aaaa-mm-dd.sql.sha256'
```

Un archivo `.partial` o un manifiesto ausente significa que el respaldo no está aprobado.
La restauración de comprobación debe realizarse en una base diferente y debe incluir conteos,
relaciones y una prueba funcional mínima.

## 3. Diagnóstico y baseline

Con la base seleccionada en DBeaver, ejecutar solo consultas de diagnóstico:

```sql
SOURCE database/scripts/check-schema.sql;
SOURCE database/scripts/migration-status.sql;
```

Guardar los resultados junto con el respaldo. Si `db_migration_history` no existe, no se debe
inventar un historial: primero registrar el diagnóstico y aprobar un baseline inicial.

El baseline debe incluir la versión lógica, el hash SHA-256 del archivo, el responsable, la
fecha, el respaldo asociado y el resultado de la comprobación.

## 4. Instalación limpia

1. Crear una base vacía de pruebas.
2. Ejecutar `schema/gtel_talento.sql`.
3. Verificar que exista `db_migration_history`.
4. Ejecutar únicamente el seed autorizado para el entorno.
5. Ejecutar `scripts/check-schema.sql`.
6. Ejecutar las pruebas del backend.

Los snapshots no forman parte de este procedimiento y nunca se ejecutan contra una base
existente.

## 5. Actualización de una base existente

1. Realizar y comprobar el respaldo.
2. Comparar tablas, columnas, índices y claves foráneas con la matriz de compatibilidad.
3. Seleccionar únicamente las migraciones faltantes y aplicarlas en orden.
4. Ejecutar cada archivo dentro de su propia ventana controlada.
5. Registrar el hash y el resultado en `db_migration_history` después de validar.
6. Ejecutar `check-schema.sql` y las pruebas del backend.
7. Ejecutar un recorrido funcional conectado al entorno de pruebas.

No ejecutar todos los archivos de `migrations/` indiscriminadamente ni editar una migración
que ya haya sido aplicada. Una corrección debe ser una migración nueva.

## 6. Criterio de aprobación

El cambio se considera aprobado únicamente si:

- el respaldo fue creado y restaurado correctamente;
- no quedan objetos faltantes en el diagnóstico;
- las claves foráneas e índices esperados existen;
- las pruebas automatizadas terminan con `BUILD SUCCESS`;
- el frontend puede completar sus recorridos contra el backend;
- la bitácora registra archivo, hash, responsable, fecha, resultado y evidencia.

## 7. Recuperación ante fallo

Si una migración falla, detener la ejecución, conservar el log y marcar el resultado como
`FAILED`. No continuar con migraciones posteriores. Evaluar el rollback específico o restaurar
el respaldo comprobado en una ventana autorizada. Nunca ejecutar los archivos de
`snapshots/` como rollback automático.

## 8. Regla de transición

El backend utiliza `database/` como fuente única para nuevas instalaciones, pruebas y
migraciones. Las rutas históricas no deben recibir cambios nuevos.

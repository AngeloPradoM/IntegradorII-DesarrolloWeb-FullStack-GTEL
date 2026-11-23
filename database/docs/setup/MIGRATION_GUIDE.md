# Guía de migración de la base oficial

> Esta guía describe el procedimiento aprobado para pruebas aisladas. No autoriza por sí sola
> el cambio de la fuente de verdad en entornos compartidos o productivos.

## Instalación nueva

1. Crear una base vacía llamada `gtel_talento`.
2. Ejecutar `schema/gtel_talento.sql`.
3. Ejecutar `migrations/000_migration_history.sql` si el esquema no contiene todavía `db_migration_history`.
4. Ejecutar el seed autorizado del entorno, si corresponde.
5. Registrar las migraciones aplicadas con el nombre, hash y responsable.
6. Ejecutar `scripts/check-schema.sql` y las pruebas del backend.

## Base existente

1. Identificar el entorno y realizar un respaldo comprobable.
2. Ejecutar el diagnóstico de `database/scripts/check-schema.sql`.
3. Comparar tablas, columnas, índices y claves foráneas con `schema/gtel_talento.sql`.
4. No aplicar toda la carpeta de forma indiscriminada.
5. Aplicar únicamente los cambios aprobados y en orden.
6. Registrar el baseline o cada migración en `db_migration_history` solo después de verificar el resultado.
7. Ejecutar las pruebas del backend y validar los recorridos funcionales.

## Compatibilidad durante la transición

Las migraciones históricas se conservan intactas. La matriz de equivalencias está en
`COMPATIBILITY_MATRIX.md`. Los integrantes deben utilizar únicamente `database/` para nuevas
instalaciones y cambios; no ejecutar snapshots contra `gtel_talento` compartida.

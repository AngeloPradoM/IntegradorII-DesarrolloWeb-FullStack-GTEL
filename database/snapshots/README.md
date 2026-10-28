# Snapshots históricos

Estos archivos representan estados anteriores de la base de datos. No son migraciones activas y no deben ejecutarse sobre una base existente.

Los volcados completos históricos se conservan dentro de `database/snapshots/` hasta definir su retención y custodia. Algunos contienen `DROP TABLE` y datos del entorno de origen.

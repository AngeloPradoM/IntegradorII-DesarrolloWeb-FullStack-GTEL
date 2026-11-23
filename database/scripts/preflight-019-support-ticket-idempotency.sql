-- Solo lectura. Ejecutar antes de 019 sobre gtel_talento.
USE gtel_talento;

SELECT DATABASE() AS esquema,VERSION() AS version_mysql;

SELECT 'required tables (3)' AS requirement,COUNT(*) AS present
FROM information_schema.tables
WHERE table_schema=DATABASE()
  AND table_name IN ('usuarios','tickets_soporte','db_migration_history')
UNION ALL
SELECT '019 target table conflicts (expect 0)',COUNT(*)
FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_name='ticket_creacion_idempotencia'
UNION ALL
SELECT '019 migration history conflicts (expect 0)',COUNT(*)
FROM db_migration_history WHERE version='019';

SELECT COUNT(*) AS tickets_existentes FROM tickets_soporte;

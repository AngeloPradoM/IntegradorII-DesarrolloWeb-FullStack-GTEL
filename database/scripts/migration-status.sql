-- Consulta de solo lectura para la bitácora consolidada.
USE gtel_talento;

SET @status_sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'db_migration_history'
  ),
  'SELECT version,filename,checksum_sha256,applied_at,applied_by,result,notes FROM db_migration_history ORDER BY version',
  'SELECT ''db_migration_history no existe; ejecutar el bootstrap autorizado'' AS estado'
);
PREPARE status_statement FROM @status_sql;
EXECUTE status_statement;
DEALLOCATE PREPARE status_statement;

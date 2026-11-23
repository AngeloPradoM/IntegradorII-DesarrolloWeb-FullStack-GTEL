-- Registrar 018 únicamente después de verificar los 27 códigos esperados.
USE gtel_talento;

SET @migration_018_ready = (
  (SELECT COUNT(*) FROM solicitud_tipos WHERE codigo LIKE 'SOL\_%') >= 11
  AND (SELECT COUNT(*) FROM incidente_tipos_problema WHERE codigo LIKE 'INC\_%') >= 16
);

INSERT INTO db_migration_history(version,filename,checksum_sha256,applied_by,result,notes)
SELECT '018','018_helpdesk_catalog_seed.sql',
       'e932c2589cdee3e26915d4b4dd10cc96ba41d20198ab8aadee4d5a5a511dc53f',
       CURRENT_USER(),'APPLIED','Catálogos iniciales Nivel 1 y Nivel 2 de Mesa de Ayuda'
WHERE @migration_018_ready
  AND NOT EXISTS (SELECT 1 FROM db_migration_history WHERE version='018');

SELECT CASE
  WHEN NOT @migration_018_ready THEN 'NOT_READY'
  WHEN EXISTS (SELECT 1 FROM db_migration_history WHERE version='018'
    AND checksum_sha256='e932c2589cdee3e26915d4b4dd10cc96ba41d20198ab8aadee4d5a5a511dc53f') THEN 'APPLIED'
  ELSE 'CHECKSUM_CONFLICT'
END AS migration_018_status;

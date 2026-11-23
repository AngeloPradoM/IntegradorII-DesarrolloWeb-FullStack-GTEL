-- Registrar 019 únicamente después de ejecutar check-019 y obtener 1/6/2/1.
USE gtel_talento;

SET @migration_019_ready = (
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema=DATABASE() AND table_name='ticket_creacion_idempotencia') = 1
  AND
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='ticket_creacion_idempotencia'
     AND column_name IN ('solicitante_id','clave_idempotencia','solicitud_hash',
                         'ticket_id','created_at','completed_at')) = 6
  AND
  (SELECT COUNT(*) FROM information_schema.referential_constraints
   WHERE constraint_schema=DATABASE() AND table_name='ticket_creacion_idempotencia') = 2
);

INSERT INTO db_migration_history(version,filename,checksum_sha256,applied_by,result,notes)
SELECT '019','019_support_ticket_idempotency.sql',
       '17f99aab91a3bc11bd7dd883c3a703ec403f044941da1b9505d524dc8e8c4207',
       CURRENT_USER(),'APPLIED','Idempotencia persistente para creación de tickets'
WHERE @migration_019_ready
  AND NOT EXISTS (SELECT 1 FROM db_migration_history WHERE version='019');

SELECT CASE
  WHEN NOT @migration_019_ready THEN 'NOT_READY'
  WHEN EXISTS (SELECT 1 FROM db_migration_history WHERE version='019'
    AND checksum_sha256='17f99aab91a3bc11bd7dd883c3a703ec403f044941da1b9505d524dc8e8c4207')
    THEN 'APPLIED'
  ELSE 'CHECKSUM_CONFLICT'
END AS migration_019_status;

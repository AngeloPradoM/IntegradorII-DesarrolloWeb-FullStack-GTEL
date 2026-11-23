-- Registrar 017 únicamente después de aplicar la migración y aprobar check-017.


SET @migration_017_ready = (
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema=DATABASE() AND table_name IN ('solicitud_tipos','incidente_tipos_problema')) = 2
  AND
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND (
     (table_name='tickets_soporte' AND column_name IN (
       'solicitud_tipo_codigo','incidente_tipo_codigo','canal_origen','sla_politica_id',
       'sla_respuesta_limite_at','sla_resolucion_limite_at','primera_atencion_at'))
     OR (table_name='incidentes_produccion' AND column_name IN ('incidente_tipo_codigo','sla_politica_id'))
   )) = 9
);

INSERT INTO db_migration_history(version,filename,checksum_sha256,applied_by,result,notes)
SELECT '017','017_helpdesk_consolidation.sql',
       'f8da9263d043bd551df82a859146b7f7c5fa22084d33b4a2309e0b280e4781ba',
       CURRENT_USER(),'APPLIED','Catálogos estructurados y referencias auditables de Mesa de Ayuda'
WHERE @migration_017_ready
  AND NOT EXISTS (SELECT 1 FROM db_migration_history WHERE version='017');

SELECT CASE
  WHEN NOT @migration_017_ready THEN 'NOT_READY'
  WHEN EXISTS (SELECT 1 FROM db_migration_history
               WHERE version='017'
                 AND checksum_sha256='f8da9263d043bd551df82a859146b7f7c5fa22084d33b4a2309e0b280e4781ba') THEN 'APPLIED'
  ELSE 'CHECKSUM_CONFLICT'
END AS migration_017_status;

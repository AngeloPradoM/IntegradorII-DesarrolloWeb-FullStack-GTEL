-- Registra la migracion 016 solo cuando su estructura y semillas ya estan completas.
-- No crea ni modifica tablas funcionales. Es seguro volver a ejecutarlo.
USE gtel_talento;

SET @migration_016_version = '016';
SET @migration_016_filename = '016_incident_reporting.sql';
SET @migration_016_checksum = '6216076ccb96a52b8632641d6f6d746a25dcf0d0b2220d6ef0be8af68fc31b9b';

SET @migration_016_tables = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_type = 'BASE TABLE'
    AND table_name IN (
      'incidentes_produccion','incidente_historial','incidente_actividades',
      'incidente_ticket','incidente_cambio','incidente_categorias',
      'incidente_sla_politicas','incidente_asignacion_reglas','incidente_escalamientos'
    )
);

SET @migration_016_columns = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'incidentes_produccion'
    AND column_name IN (
      'modulo_codigo','categoria_sugerida','categoria_codigo','categoria_motivo',
      'servicio_bloqueado','primera_atencion_at','solucion_aplicada','causa_raiz',
      'aprendizaje','falla_repetida','incidente_previo_id','sla_primera_atencion_at',
      'sla_resolucion_at','asignacion_fuente','regla_asignacion_id','asignado_at'
    )
);

SET @migration_016_categories = (
  SELECT COUNT(*) FROM incidente_categorias WHERE activa = TRUE
);
SET @migration_016_sla = (
  SELECT COUNT(*) FROM incidente_sla_politicas WHERE activa = TRUE
);
SET @migration_016_rules = (
  SELECT COUNT(*) FROM incidente_asignacion_reglas WHERE activa = TRUE
);
SET @migration_016_existing_checksum = (
  SELECT checksum_sha256
  FROM db_migration_history
  WHERE version = @migration_016_version
  LIMIT 1
);

SET @migration_016_ready = (
  @migration_016_tables = 9
  AND @migration_016_columns = 16
  AND @migration_016_categories >= 10
  AND @migration_016_sla = 4
  AND @migration_016_rules > 0
  AND (
    @migration_016_existing_checksum IS NULL
    OR @migration_016_existing_checksum = @migration_016_checksum
  )
);

INSERT INTO db_migration_history
  (version, filename, checksum_sha256, applied_by, result, notes)
SELECT
  @migration_016_version,
  @migration_016_filename,
  @migration_016_checksum,
  CURRENT_USER(),
  'APPLIED',
  'Registro posterior a verificacion: 9 tablas, 16 columnas, categorias, SLA y reglas completas'
WHERE @migration_016_ready
  AND @migration_016_existing_checksum IS NULL;

SELECT
  CASE
    WHEN @migration_016_existing_checksum IS NOT NULL
         AND @migration_016_existing_checksum <> @migration_016_checksum
      THEN 'CHECKSUM_CONFLICT: no se modifico la bitacora'
    WHEN NOT @migration_016_ready
      THEN 'STRUCTURE_INCOMPLETE: no se modifico la bitacora'
    WHEN EXISTS (
      SELECT 1 FROM db_migration_history
      WHERE version = @migration_016_version
        AND checksum_sha256 = @migration_016_checksum
        AND result = 'APPLIED'
    ) THEN 'APPLIED_OK'
    ELSE 'NOT_APPLIED'
  END AS migration_016_status,
  @migration_016_tables AS incident_tables,
  @migration_016_columns AS reporting_columns,
  @migration_016_categories AS active_categories,
  @migration_016_sla AS active_sla_policies,
  @migration_016_rules AS active_assignment_rules;

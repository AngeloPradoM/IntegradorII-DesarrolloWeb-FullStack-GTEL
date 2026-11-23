-- Verificación de solo lectura para 017_helpdesk_consolidation.sql.


SELECT 'catalog tables (2)' AS requirement,COUNT(*) AS present
FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_name IN ('solicitud_tipos','incidente_tipos_problema')
UNION ALL
SELECT 'new columns (9)',COUNT(*)
FROM information_schema.columns
WHERE table_schema=DATABASE() AND (
  (table_name='tickets_soporte' AND column_name IN (
    'solicitud_tipo_codigo','incidente_tipo_codigo','canal_origen','sla_politica_id',
    'sla_respuesta_limite_at','sla_resolucion_limite_at','primera_atencion_at'))
  OR (table_name='incidentes_produccion' AND column_name IN ('incidente_tipo_codigo','sla_politica_id'))
)
UNION ALL
SELECT 'foreign keys (6)',COUNT(*)
FROM information_schema.referential_constraints
WHERE constraint_schema=DATABASE() AND constraint_name IN (
  'fk_incidente_tipo_categoria','fk_ticket_solicitud_tipo','fk_ticket_incidente_tipo',
  'fk_ticket_sla_politica','fk_incidente_tipo_categoria_compuesta','fk_incidente_sla_politica')
UNION ALL
SELECT 'validation checks (5)',COUNT(*)
FROM information_schema.table_constraints
WHERE constraint_schema=DATABASE() AND constraint_type='CHECK' AND constraint_name IN (
  'chk_solicitud_tipo_orden','chk_incidente_tipo_orden','chk_ticket_tipo_estructurado',
  'chk_ticket_canal_origen','chk_incidente_tipo_requiere_categoria')
UNION ALL
SELECT 'support indexes (5)',COUNT(DISTINCT index_name)
FROM information_schema.statistics
WHERE table_schema=DATABASE() AND table_name='tickets_soporte' AND index_name IN (
  'idx_ticket_solicitud_tipo','idx_ticket_incidente_tipo','idx_ticket_canal_origen',
  'idx_ticket_sla_respuesta','idx_ticket_sla_resolucion')
UNION ALL
SELECT 'incident indexes (2)',COUNT(DISTINCT index_name)
FROM information_schema.statistics
WHERE table_schema=DATABASE() AND table_name='incidentes_produccion' AND index_name IN (
  'idx_incidente_tipo_fecha','idx_incidente_sla_politica');

-- Deben permanecer en cero hasta BD-3; 017 solo crea estructura.
SELECT
  (SELECT COUNT(*) FROM solicitud_tipos) AS solicitud_tipos_cargados,
  (SELECT COUNT(*) FROM incidente_tipos_problema) AS incidente_tipos_cargados;






SELECT version, filename, result
FROM gtel_talento.db_migration_history
ORDER BY version;

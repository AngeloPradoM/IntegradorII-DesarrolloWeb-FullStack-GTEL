-- Preflight de solo lectura. Ejecutar antes de respaldar y aplicar 017.
USE gtel_talento;

SELECT DATABASE() AS base_seleccionada,VERSION() AS mysql_version,@@version_comment AS distribucion;

SELECT 'required dependency tables (8)' AS requirement,COUNT(*) AS present
FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_name IN (
  'tickets_soporte','ticket_sla_politicas','incidentes_produccion','incidente_categorias',
  'incidente_sla_politicas','incidente_ticket','incidente_historial','db_migration_history')
UNION ALL
SELECT 'required ticket type column (1)',COUNT(*)
FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='tickets_soporte' AND column_name='tipo_atencion'
UNION ALL
SELECT '017 catalog conflicts (expect 0)',COUNT(*)
FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_name IN ('solicitud_tipos','incidente_tipos_problema')
UNION ALL
SELECT '017 column conflicts (expect 0)',COUNT(*)
FROM information_schema.columns
WHERE table_schema=DATABASE() AND (
  (table_name='tickets_soporte' AND column_name IN (
    'solicitud_tipo_codigo','incidente_tipo_codigo','canal_origen','sla_politica_id',
    'sla_respuesta_limite_at','sla_resolucion_limite_at','primera_atencion_at'))
  OR (table_name='incidentes_produccion' AND column_name IN ('incidente_tipo_codigo','sla_politica_id'))
)
UNION ALL
SELECT 'migration 017 history conflicts (expect 0)',COUNT(*)
FROM db_migration_history WHERE version='017';

SELECT
  (SELECT COUNT(*) FROM tickets_soporte) AS tickets_existentes,
  (SELECT COUNT(*) FROM incidentes_produccion) AS incidentes_existentes,
  (SELECT COUNT(*) FROM incidente_ticket) AS relaciones_ticket_incidente;

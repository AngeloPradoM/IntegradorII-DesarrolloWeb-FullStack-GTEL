-- Solo lectura. Ejecutar antes de 020 sobre gtel_talento.
USE gtel_talento;

SELECT 'required incident tables (5)' AS requirement, COUNT(*) AS present
FROM information_schema.tables
WHERE table_schema=DATABASE()
  AND table_name IN ('incidentes_produccion','incidente_categorias','incidente_tipos_problema',
                     'incidente_sla_politicas','usuarios');

SELECT '020 column conflicts (expect 0)' AS requirement, COUNT(*) AS present
FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='incidentes_produccion'
  AND column_name IN ('canal_reporte','reportante_detalle','registrado_por');

SELECT '020 history conflicts (expect 0)' AS requirement, COUNT(*) AS present
FROM db_migration_history WHERE version='020';


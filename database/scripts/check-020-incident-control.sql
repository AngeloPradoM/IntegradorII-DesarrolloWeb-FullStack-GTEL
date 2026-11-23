-- Verificación posterior de la migración 020.
USE gtel_talento;

SELECT 'incident control columns (3)' AS requirement, COUNT(*) AS present
FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='incidentes_produccion'
  AND column_name IN ('canal_reporte','reportante_detalle','registrado_por');

SELECT 'incident control view (1)' AS requirement, COUNT(*) AS present
FROM information_schema.views
WHERE table_schema=DATABASE() AND table_name='vw_control_incidentes';

SELECT 'incident registrar foreign key (1)' AS requirement, COUNT(*) AS present
FROM information_schema.referential_constraints
WHERE constraint_schema=DATABASE() AND table_name='incidentes_produccion'
  AND constraint_name='fk_incidente_registrador';

SELECT COUNT(*) AS incidentes, COUNT(DISTINCT codigo) AS codigos_unicos
FROM incidentes_produccion;


-- Rollback integral de 016_incident_reporting.sql.
-- PREPARADO PARA REVISION: NO ejecutar sin respaldo y autorización expresa.
-- Conserva las cinco tablas y los datos creados por 015_production_incidents.sql.
-- Elimina exclusivamente estructuras, configuración y bitácora de la versión 016.

USE gtel_talento;

-- La migración 016 agregó datos funcionales a incidentes_produccion. El rollback
-- se bloquea si alguno de esos campos contiene información que se perdería.
DELIMITER $$
DROP PROCEDURE IF EXISTS assert_rollback_016_safe$$
CREATE PROCEDURE assert_rollback_016_safe()
BEGIN
  DECLARE extended_data_count BIGINT DEFAULT 0;
  DECLARE escalation_count BIGINT DEFAULT 0;
  DECLARE migration_count BIGINT DEFAULT 0;

  SELECT COUNT(*) INTO migration_count
  FROM db_migration_history
  WHERE version = '016';

  IF migration_count <> 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Rollback 016 detenido: la bitacora no contiene exactamente una version 016.';
  END IF;

  SELECT COUNT(*) INTO extended_data_count
  FROM incidentes_produccion
  WHERE modulo_codigo IS NOT NULL
     OR categoria_sugerida IS NOT NULL
     OR categoria_codigo IS NOT NULL
     OR categoria_motivo IS NOT NULL
     OR servicio_bloqueado = TRUE
     OR primera_atencion_at IS NOT NULL
     OR solucion_aplicada IS NOT NULL
     OR causa_raiz IS NOT NULL
     OR aprendizaje IS NOT NULL
     OR falla_repetida = TRUE
     OR incidente_previo_id IS NOT NULL
     OR sla_primera_atencion_at IS NOT NULL
     OR sla_resolucion_at IS NOT NULL
     OR asignacion_fuente <> 'PENDIENTE'
     OR regla_asignacion_id IS NOT NULL
     OR asignado_at IS NOT NULL;

  SELECT COUNT(*) INTO escalation_count FROM incidente_escalamientos;

  IF extended_data_count > 0 OR escalation_count > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Rollback 016 detenido: existen datos funcionales 016. Exportarlos o migrarlos antes de continuar.';
  END IF;
END$$
DELIMITER ;

CALL assert_rollback_016_safe();
DROP PROCEDURE assert_rollback_016_safe;

-- 1. Retirar dependencias de incidentes_produccion antes de borrar catálogos.
ALTER TABLE incidentes_produccion
  DROP FOREIGN KEY fk_incidente_categoria_sugerida,
  DROP FOREIGN KEY fk_incidente_categoria,
  DROP FOREIGN KEY fk_incidente_previo,
  DROP FOREIGN KEY fk_incidente_regla_asignacion;

ALTER TABLE incidentes_produccion
  DROP INDEX idx_incidente_categoria_fecha,
  DROP INDEX idx_incidente_sla_resolucion,
  DROP INDEX idx_incidente_repetido;

-- 2. Retirar las 16 columnas agregadas por 016, en orden inverso.
ALTER TABLE incidentes_produccion
  DROP COLUMN asignado_at,
  DROP COLUMN regla_asignacion_id,
  DROP COLUMN asignacion_fuente,
  DROP COLUMN sla_resolucion_at,
  DROP COLUMN sla_primera_atencion_at,
  DROP COLUMN incidente_previo_id,
  DROP COLUMN falla_repetida,
  DROP COLUMN aprendizaje,
  DROP COLUMN causa_raiz,
  DROP COLUMN solucion_aplicada,
  DROP COLUMN primera_atencion_at,
  DROP COLUMN servicio_bloqueado,
  DROP COLUMN categoria_motivo,
  DROP COLUMN categoria_codigo,
  DROP COLUMN categoria_sugerida,
  DROP COLUMN modulo_codigo;

-- 3. Borrar únicamente las cuatro tablas creadas por 016.
DROP TABLE incidente_escalamientos;
DROP TABLE incidente_asignacion_reglas;
DROP TABLE incidente_sla_politicas;
DROP TABLE incidente_categorias;

-- 4. Permitir que una 016 rediseñada pueda registrarse nuevamente.
DELETE FROM db_migration_history WHERE version = '016';

-- 5. Resultado esperado: cinco tablas de 015 y ninguna estructura de 016.
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = DATABASE()
     AND table_name IN ('incidentes_produccion','incidente_historial','incidente_actividades','incidente_ticket','incidente_cambio')) AS tablas_015_conservadas,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = DATABASE()
     AND table_name IN ('incidente_categorias','incidente_sla_politicas','incidente_asignacion_reglas','incidente_escalamientos')) AS tablas_016_restantes,
  (SELECT COUNT(*) FROM db_migration_history WHERE version='016') AS registro_016_restante;

-- Rollback de 017 antes de cargar catálogos o adaptar backend.
-- NO ejecutar si cualquiera de las columnas nuevas contiene datos.
USE gtel_talento;

ALTER TABLE incidentes_produccion
  DROP FOREIGN KEY fk_incidente_tipo_categoria_compuesta,
  DROP FOREIGN KEY fk_incidente_sla_politica,
  DROP CHECK chk_incidente_tipo_requiere_categoria,
  DROP INDEX idx_incidente_tipo_fecha,
  DROP INDEX idx_incidente_sla_politica,
  DROP COLUMN sla_politica_id,
  DROP COLUMN incidente_tipo_codigo;

ALTER TABLE tickets_soporte
  DROP FOREIGN KEY fk_ticket_solicitud_tipo,
  DROP FOREIGN KEY fk_ticket_incidente_tipo,
  DROP FOREIGN KEY fk_ticket_sla_politica,
  DROP CHECK chk_ticket_tipo_estructurado,
  DROP CHECK chk_ticket_canal_origen,
  DROP INDEX idx_ticket_solicitud_tipo,
  DROP INDEX idx_ticket_incidente_tipo,
  DROP INDEX idx_ticket_canal_origen,
  DROP INDEX idx_ticket_sla_respuesta,
  DROP INDEX idx_ticket_sla_resolucion,
  DROP COLUMN primera_atencion_at,
  DROP COLUMN sla_resolucion_limite_at,
  DROP COLUMN sla_respuesta_limite_at,
  DROP COLUMN sla_politica_id,
  DROP COLUMN canal_origen,
  DROP COLUMN incidente_tipo_codigo,
  DROP COLUMN solicitud_tipo_codigo;

DROP TABLE incidente_tipos_problema;
DROP TABLE solicitud_tipos;

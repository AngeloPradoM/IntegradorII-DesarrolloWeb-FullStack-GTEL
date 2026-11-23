-- Reversión estructural de 020. No ejecutar si existen datos que dependan de estos campos.
USE gtel_talento;

DROP VIEW IF EXISTS vw_control_incidentes;

ALTER TABLE incidentes_produccion
  DROP FOREIGN KEY fk_incidente_registrador,
  DROP COLUMN registrado_por,
  DROP COLUMN reportante_detalle,
  DROP COLUMN canal_reporte;

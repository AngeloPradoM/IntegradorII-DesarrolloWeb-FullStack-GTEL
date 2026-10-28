-- Politicas SLA configurables para la Mesa de Ayuda GTEL.
-- Ejecutar despues de 010_support_ticket_lifecycle.sql.
USE gtel_talento;

CREATE TABLE IF NOT EXISTS ticket_sla_politicas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  prioridad ENUM('BAJA','MEDIA','ALTA') NOT NULL UNIQUE,
  horas_respuesta INT NOT NULL,
  horas_resolucion INT NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_sla_horas_respuesta CHECK (horas_respuesta > 0),
  CONSTRAINT chk_sla_horas_resolucion CHECK (horas_resolucion >= horas_respuesta)
);

INSERT INTO ticket_sla_politicas (prioridad, horas_respuesta, horas_resolucion, descripcion)
VALUES
  ('BAJA', 48, 72, 'Incidencia de impacto bajo.'),
  ('MEDIA', 24, 48, 'Incidencia que requiere atención prioritaria.'),
  ('ALTA', 4, 8, 'Incidencia crítica para la operación.')
ON DUPLICATE KEY UPDATE
  horas_respuesta = VALUES(horas_respuesta),
  horas_resolucion = VALUES(horas_resolucion),
  descripcion = VALUES(descripcion),
  activo = VALUES(activo);

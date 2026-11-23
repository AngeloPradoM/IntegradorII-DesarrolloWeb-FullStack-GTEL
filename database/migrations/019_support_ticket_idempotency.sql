-- Idempotencia persistente para la creación de tickets de Mesa de Ayuda.
-- Requiere tickets_soporte y usuarios. No modifica tickets existentes.
USE gtel_talento;

CREATE TABLE IF NOT EXISTS ticket_creacion_idempotencia (
  solicitante_id BIGINT NOT NULL,
  clave_idempotencia VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  solicitud_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  ticket_id BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  PRIMARY KEY (solicitante_id,clave_idempotencia),
  UNIQUE KEY uk_ticket_idempotencia_ticket (ticket_id),
  INDEX idx_ticket_idempotencia_fecha (created_at),
  CONSTRAINT fk_ticket_idempotencia_solicitante FOREIGN KEY (solicitante_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_idempotencia_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets_soporte(id) ON DELETE CASCADE,
  CONSTRAINT chk_ticket_idempotencia_hash CHECK (
    solicitud_hash REGEXP '^[0-9a-f]{64}$'
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

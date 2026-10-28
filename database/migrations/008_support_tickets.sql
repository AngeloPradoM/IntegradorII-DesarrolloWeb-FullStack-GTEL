-- Módulo de Mesa de Ayuda GTEL: rol técnico, tickets e historial.
-- Ejecutar una sola vez sobre una instalación existente.
USE gtel_talento;

INSERT INTO roles (nombre, descripcion)
VALUES ('TECNICO', 'Técnico de sistemas y soporte')
ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion);

-- Cuenta técnica local de prueba. La contraseña legible solo se documenta en README;
-- MySQL almacena exclusivamente su hash BCrypt.
INSERT INTO usuarios (email, password_hash, rol_id, estado, otp_exempt)
SELECT 'tecnico1@gmail.com',
       '$2a$10$y7W2CoaLcLFziEztu6IcoOweE7TOJLownoHkrfe6nQdFPhhT8VPCO',
       r.id,
       'activo',
       TRUE
FROM roles r
WHERE r.nombre='TECNICO'
ON DUPLICATE KEY UPDATE
  password_hash=VALUES(password_hash),
  rol_id=VALUES(rol_id),
  estado='activo',
  otp_exempt=TRUE,
  auth_version=auth_version+1;

CREATE TABLE IF NOT EXISTS tickets_soporte (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NULL UNIQUE,
  solicitante_id BIGINT NOT NULL,
  tecnico_id BIGINT NULL,
  area VARCHAR(80) NOT NULL DEFAULT 'Reclutamiento',
  titulo VARCHAR(120) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  subcategoria VARCHAR(100) NOT NULL,
  prioridad ENUM('BAJA','MEDIA','ALTA') NOT NULL DEFAULT 'MEDIA',
  justificacion_prioridad VARCHAR(1000) NOT NULL,
  descripcion VARCHAR(2000) NOT NULL,
  estado ENUM('NUEVO','ASIGNADO','EN_ATENCION','EN_ESPERA','RESUELTO','CERRADO') NOT NULL DEFAULT 'NUEVO',
  diagnostico VARCHAR(2000) NULL,
  solucion_propuesta VARCHAR(3000) NULL,
  estado_propuesta ENUM('SIN_PROPUESTA','PENDIENTE','APROBADA','RECHAZADA') NOT NULL DEFAULT 'SIN_PROPUESTA',
  comentario_admin VARCHAR(1000) NULL,
  evidencia_ejecucion VARCHAR(3000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  CONSTRAINT fk_ticket_solicitante FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  CONSTRAINT fk_ticket_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios(id),
  INDEX idx_ticket_solicitante (solicitante_id, created_at),
  INDEX idx_ticket_tecnico (tecnico_id, estado),
  INDEX idx_ticket_estado (estado, prioridad)
);

CREATE TABLE IF NOT EXISTS ticket_soporte_historial (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id BIGINT NOT NULL,
  actor_id BIGINT NOT NULL,
  estado_anterior VARCHAR(30) NULL,
  estado_nuevo VARCHAR(30) NOT NULL,
  detalle VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ticket_historial_ticket FOREIGN KEY (ticket_id) REFERENCES tickets_soporte(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_historial_actor FOREIGN KEY (actor_id) REFERENCES usuarios(id),
  INDEX idx_ticket_historial (ticket_id, created_at)
);

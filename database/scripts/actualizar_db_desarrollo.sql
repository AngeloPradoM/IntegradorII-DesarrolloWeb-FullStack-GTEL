-- =============================================================================
-- GTEL TALENTO - SCRIPT DE ACTUALIZACIÓN RÁPIDA DE BASE DE DATOS LOCAL
-- Propósito: Actualiza cualquier base 'gtel_talento' desfasada aplicando
--            las migraciones 008 a 013 de forma aditiva e idempotente.
-- Regla de Oro: NO BORRA NINGÚN DATO (conserva usuarios, postulantes y vacantes).
-- =============================================================================

USE gtel_talento;

-- 1. Bitácora de migraciones (000)
CREATE TABLE IF NOT EXISTS db_migration_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  filename VARCHAR(255) NOT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(150) NOT NULL,
  result ENUM('APPLIED','BASELINE','FAILED') NOT NULL,
  notes VARCHAR(1000) NULL
);

-- 2. Rol técnico y módulo de tickets de soporte (008)
INSERT INTO roles (nombre, descripcion)
VALUES ('TECNICO', 'Técnico de sistemas y soporte')
ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion);

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
  estado VARCHAR(30) NOT NULL DEFAULT 'NUEVO',
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
  INDEX idx_ticket_estado (estado)
);

CREATE TABLE IF NOT EXISTS ticket_soporte_historial (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id BIGINT NOT NULL,
  autor_id BIGINT NOT NULL,
  estado_anterior VARCHAR(30) NULL,
  estado_nuevo VARCHAR(30) NOT NULL,
  accion VARCHAR(50) NOT NULL,
  detalle VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_ticket FOREIGN KEY (ticket_id) REFERENCES tickets_soporte(id) ON DELETE CASCADE,
  CONSTRAINT fk_historial_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id),
  INDEX idx_historial_ticket (ticket_id, created_at)
);

-- 3. Compatibilidad de notificaciones (009)
SET @add_tipo = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'tipo'),
  'SELECT 1',
  "ALTER TABLE notificaciones ADD COLUMN tipo VARCHAR(50) NOT NULL DEFAULT 'SISTEMA' AFTER mensaje"
);
PREPARE statement_tipo FROM @add_tipo;
EXECUTE statement_tipo;
DEALLOCATE PREPARE statement_tipo;

SET @add_enlace = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'enlace'),
  'SELECT 1',
  'ALTER TABLE notificaciones ADD COLUMN enlace VARCHAR(255) NULL AFTER tipo'
);
PREPARE statement_enlace FROM @add_enlace;
EXECUTE statement_enlace;
DEALLOCATE PREPARE statement_enlace;

SET @add_created_at = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'created_at'),
  'SELECT 1',
  'ALTER TABLE notificaciones ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER leida'
);
PREPARE statement_created_at FROM @add_created_at;
EXECUTE statement_created_at;
DEALLOCATE PREPARE statement_created_at;

-- 4. Catálogo de Estados y Archivo de tickets (010)
CREATE TABLE IF NOT EXISTS ticket_soporte_estados (
  codigo VARCHAR(30) PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  orden SMALLINT NOT NULL UNIQUE,
  terminal BOOLEAN NOT NULL DEFAULT FALSE,
  descripcion VARCHAR(255) NOT NULL
);

INSERT INTO ticket_soporte_estados (codigo, nombre, orden, terminal, descripcion) VALUES
  ('NUEVO', 'Nuevo', 10, FALSE, 'Solicitud registrada y pendiente de asignacion.'),
  ('ASIGNADO', 'Asignado', 20, FALSE, 'Solicitud asignada a un tecnico responsable.'),
  ('EN_ATENCION', 'En atencion', 30, FALSE, 'El tecnico esta ejecutando la atencion autorizada.'),
  ('EN_ESPERA', 'En espera', 40, FALSE, 'El caso espera informacion o autorizacion administrativa.'),
  ('RESUELTO', 'Resuelto', 50, TRUE, 'La solucion fue ejecutada y registrada con evidencia.'),
  ('CERRADO', 'Cerrado', 60, TRUE, 'El caso fue cerrado definitivamente.')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  orden = VALUES(orden),
  terminal = VALUES(terminal),
  descripcion = VALUES(descripcion);

ALTER TABLE tickets_soporte
  MODIFY estado VARCHAR(30) NOT NULL DEFAULT 'NUEVO';

SET @schema_name = DATABASE();
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CAST(CONSTRAINT_SCHEMA AS BINARY) = CAST(@schema_name AS BINARY)
      AND CAST(CONSTRAINT_NAME AS BINARY) = CAST('fk_ticket_estado_catalogo' AS BINARY)
  ),
  'SELECT 1',
  'ALTER TABLE tickets_soporte ADD CONSTRAINT fk_ticket_estado_catalogo FOREIGN KEY (estado) REFERENCES ticket_soporte_estados(codigo)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS tickets_soporte_archivo (
  ticket_id BIGINT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  solicitante_email VARCHAR(150) NOT NULL,
  tecnico_email VARCHAR(150) NULL,
  area VARCHAR(80) NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  prioridad VARCHAR(10) NOT NULL,
  estado_final VARCHAR(30) NOT NULL,
  resumen_resolucion VARCHAR(3000) NULL,
  cantidad_eventos INT NOT NULL DEFAULT 0,
  ultimo_evento VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_archivo_resuelto (resolved_at),
  INDEX idx_ticket_archivo_solicitante (solicitante_email)
);

-- 5. Políticas SLA configurables (011)
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

-- 6. Consentimiento de privacidad y compatibilidad de documento (012)
SET @add_consentimiento = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'consentimiento_datos'),
  'SELECT 1',
  'ALTER TABLE postulantes ADD COLUMN consentimiento_datos BOOLEAN NOT NULL DEFAULT TRUE'
);
PREPARE stmt FROM @add_consentimiento;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_fecha = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'fecha_consentimiento'),
  'SELECT 1',
  'ALTER TABLE postulantes ADD COLUMN fecha_consentimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'
);
PREPARE stmt FROM @add_fecha;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_version = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'consentimiento_version'),
  'SELECT 1',
  "ALTER TABLE postulantes ADD COLUMN consentimiento_version VARCHAR(30) NOT NULL DEFAULT 'v1.0-ley29733'"
);
PREPARE stmt FROM @add_version;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Compatibilidad total dni y numero_documento
SET @sync_dni = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'dni'),
  'ALTER TABLE postulantes MODIFY COLUMN dni VARCHAR(30) NULL',
  'ALTER TABLE postulantes ADD COLUMN dni VARCHAR(30) NULL'
);
PREPARE stmt FROM @sync_dni;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sync_num_doc = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'postulantes' AND COLUMN_NAME = 'numero_documento'),
  'ALTER TABLE postulantes MODIFY COLUMN numero_documento VARCHAR(30) NULL',
  'ALTER TABLE postulantes ADD COLUMN numero_documento VARCHAR(30) NULL'
);
PREPARE stmt FROM @sync_num_doc;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE postulantes SET numero_documento = dni WHERE numero_documento IS NULL AND dni IS NOT NULL;
UPDATE postulantes SET dni = numero_documento WHERE dni IS NULL AND numero_documento IS NOT NULL;

-- 7. Cuentas locales de prueba exentas de OTP (013)
UPDATE usuarios
SET otp_exempt = TRUE,
    estado = 'activo'
WHERE LOWER(email) IN (
  'administrador@gmail.com',
  'postulante1@gmail.com',
  'reclutador1@gmail.com',
  'tecnico1@gmail.com'
);

INSERT INTO postulantes (usuario_id, nombres, apellidos, telefono)
SELECT id, 'Postulante', 'De Prueba Uno', '+51999999999'
FROM usuarios
WHERE LOWER(email) = 'postulante1@gmail.com'
  AND rol_id = (SELECT id FROM roles WHERE nombre = 'CANDIDATO')
ON DUPLICATE KEY UPDATE
  nombres = VALUES(nombres),
  apellidos = VALUES(apellidos),
  telefono = VALUES(telefono);

SELECT 'Actualización completada exitosamente. Todas las tablas y compatibilidades están 100% al día.' AS resultado;

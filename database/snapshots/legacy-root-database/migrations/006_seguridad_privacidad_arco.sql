-- ============================================================================
-- MIGRACIÓN 006: BLINDAJE DE SEGURIDAD Y PRIVACIDAD ARCO (LEY 29733 - PERÚ)
-- ATS GTEL TALENTO
-- ============================================================================

-- 1. Ampliar estados en tabla usuarios para soportar 'anonimizado'
ALTER TABLE usuarios 
  MODIFY COLUMN estado ENUM('activo', 'inactivo', 'anonimizado') NOT NULL DEFAULT 'activo';

-- 2. Ampliar estados en tabla postulantes y añadir campos de consentimiento Ley 29733
ALTER TABLE postulantes 
  MODIFY COLUMN estado ENUM('activo', 'inactivo', 'anonimizado') NOT NULL DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS consentimiento_datos TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Consentimiento explícito Ley 29733',
  ADD COLUMN IF NOT EXISTS fecha_consentimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de aceptación de términos de privacidad',
  ADD COLUMN IF NOT EXISTS consentimiento_version VARCHAR(30) NOT NULL DEFAULT 'v1.0-ley29733' COMMENT 'Versión de la política aceptada';

-- 3. Tabla para registro de auditoría de solicitudes ARCO (Acceso, Rectificación, Cancelación, Oposición)
CREATE TABLE IF NOT EXISTS solicitudes_arco (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NULL,
  email_solicitante VARCHAR(150) NOT NULL,
  tipo_solicitud ENUM('ACCESO', 'RECTIFICACION', 'CANCELACION_OLVIDO', 'OPOSICION') NOT NULL,
  estado ENUM('EJECUTADA', 'PENDIENTE', 'RECHAZADA') NOT NULL DEFAULT 'EJECUTADA',
  detalle TEXT NULL,
  ip_origen VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_solicitudes_arco_usuario (usuario_id),
  INDEX idx_solicitudes_arco_tipo (tipo_solicitud),
  CONSTRAINT fk_solicitudes_arco_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Actualizar consentimiento para postulantes existentes
UPDATE postulantes 
SET consentimiento_datos = 1,
    consentimiento_version = 'v1.0-ley29733'
WHERE consentimiento_datos IS NULL OR consentimiento_datos = 0;

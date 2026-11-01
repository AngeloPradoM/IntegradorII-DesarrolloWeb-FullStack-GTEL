-- Gestion de cambios (RFC) para la mesa de ayuda.
-- Ejecutar despues de 013_test_accounts_otp_exempt.sql.
-- Es una migracion aditiva: conserva los tickets y datos existentes.
USE gtel_talento;

SET @tipo_atencion_existe := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tickets_soporte'
    AND COLUMN_NAME = 'tipo_atencion'
);
SET @sql_tipo_atencion := IF(
  @tipo_atencion_existe = 0,
  "ALTER TABLE tickets_soporte ADD COLUMN tipo_atencion ENUM('SOLICITUD','INCIDENTE') NOT NULL DEFAULT 'INCIDENTE' AFTER subcategoria",
  'SELECT 1'
);
PREPARE stmt_tipo_atencion FROM @sql_tipo_atencion;
EXECUTE stmt_tipo_atencion;
DEALLOCATE PREPARE stmt_tipo_atencion;

SET @archivo_tipo_existe := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tickets_soporte_archivo'
    AND COLUMN_NAME = 'tipo_atencion'
);
SET @sql_archivo_tipo := IF(
  @archivo_tipo_existe = 0,
  "ALTER TABLE tickets_soporte_archivo ADD COLUMN tipo_atencion VARCHAR(20) NOT NULL DEFAULT 'INCIDENTE' AFTER categoria",
  'SELECT 1'
);
PREPARE stmt_archivo_tipo FROM @sql_archivo_tipo;
EXECUTE stmt_archivo_tipo;
DEALLOCATE PREPARE stmt_archivo_tipo;

CREATE TABLE IF NOT EXISTS solicitudes_cambio (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(24) NULL UNIQUE,
  solicitante_id BIGINT NOT NULL,
  responsable_id BIGINT NULL,
  implementador_id BIGINT NULL,
  titulo VARCHAR(160) NOT NULL,
  tipo ENUM('ESTANDAR','NORMAL','EMERGENCIA') NOT NULL,
  categoria ENUM('HARDWARE','SOFTWARE','RED','SEGURIDAD','BASE_DATOS','INFRAESTRUCTURA','OTRO') NOT NULL,
  prioridad ENUM('BAJA','MEDIA','ALTA','CRITICA') NOT NULL,
  impacto ENUM('BAJO','MEDIO','ALTO') NOT NULL,
  urgencia ENUM('BAJA','MEDIA','ALTA') NOT NULL,
  descripcion TEXT NOT NULL,
  justificacion TEXT NOT NULL,
  areas_afectadas TEXT NOT NULL,
  estado VARCHAR(40) NOT NULL DEFAULT 'REGISTRADO',
  evaluacion_tecnica TEXT NULL,
  plan_implementacion TEXT NULL,
  plan_pruebas TEXT NULL,
  plan_retorno TEXT NULL,
  plan_comunicacion TEXT NULL,
  probabilidad_riesgo ENUM('BAJA','MEDIA','ALTA') NULL,
  impacto_riesgo ENUM('BAJO','MEDIO','ALTO') NULL,
  nivel_riesgo ENUM('BAJO','MEDIO','ALTO') NULL,
  comentario_cab TEXT NULL,
  miembros_cab TEXT NULL,
  evidencia_ejecucion TEXT NULL,
  resultado ENUM('EXITOSO','PARCIAL','FALLIDO','REVERTIDO') NULL,
  lecciones_aprendidas TEXT NULL,
  comentario_validacion TEXT NULL,
  approved_at TIMESTAMP NULL,
  implemented_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cambio_solicitante FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  CONSTRAINT fk_cambio_responsable FOREIGN KEY (responsable_id) REFERENCES usuarios(id),
  CONSTRAINT fk_cambio_implementador FOREIGN KEY (implementador_id) REFERENCES usuarios(id),
  INDEX idx_cambio_solicitante (solicitante_id, created_at),
  INDEX idx_cambio_responsable (responsable_id, estado),
  INDEX idx_cambio_estado (estado, prioridad),
  INDEX idx_cambio_tipo (tipo, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS solicitud_cambio_documentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  solicitud_cambio_id BIGINT NOT NULL,
  version SMALLINT NOT NULL DEFAULT 1,
  nombre_original VARCHAR(255) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  tamano BIGINT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  contenido LONGBLOB NOT NULL,
  cargado_por BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cambio_documento_solicitud FOREIGN KEY (solicitud_cambio_id) REFERENCES solicitudes_cambio(id) ON DELETE CASCADE,
  CONSTRAINT fk_cambio_documento_actor FOREIGN KEY (cargado_por) REFERENCES usuarios(id),
  UNIQUE KEY uk_cambio_documento_version (solicitud_cambio_id, version),
  INDEX idx_cambio_documento_sha (sha256)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitud_cambio_aprobaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  solicitud_cambio_id BIGINT NOT NULL,
  actor_id BIGINT NOT NULL,
  rol_aprobacion ENUM('AUTORIDAD_CAMBIO','CAB_TI','CAB_NEGOCIO','CAB_CALIDAD') NOT NULL,
  decision ENUM('APROBADO','RECHAZADO','AJUSTES') NOT NULL,
  comentario TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cambio_aprobacion_solicitud FOREIGN KEY (solicitud_cambio_id) REFERENCES solicitudes_cambio(id) ON DELETE CASCADE,
  CONSTRAINT fk_cambio_aprobacion_actor FOREIGN KEY (actor_id) REFERENCES usuarios(id),
  INDEX idx_cambio_aprobacion (solicitud_cambio_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitud_cambio_historial (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  solicitud_cambio_id BIGINT NOT NULL,
  actor_id BIGINT NOT NULL,
  estado_anterior VARCHAR(40) NULL,
  estado_nuevo VARCHAR(40) NOT NULL,
  detalle VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cambio_historial_solicitud FOREIGN KEY (solicitud_cambio_id) REFERENCES solicitudes_cambio(id) ON DELETE CASCADE,
  CONSTRAINT fk_cambio_historial_actor FOREIGN KEY (actor_id) REFERENCES usuarios(id),
  INDEX idx_cambio_historial (solicitud_cambio_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

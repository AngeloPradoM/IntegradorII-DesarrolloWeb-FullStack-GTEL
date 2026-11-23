-- Gestión de incidentes de producción P1-P4.
-- Migración aditiva aprobada; ejecutar después de 014_change_management.sql.
USE gtel_talento;

CREATE TABLE IF NOT EXISTS incidentes_produccion (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(24) NULL UNIQUE,
  titulo VARCHAR(180) NOT NULL,
  componente VARCHAR(100) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  fuente ENUM('MANUAL','MONITOREO') NOT NULL DEFAULT 'MANUAL',
  clave_deduplicacion CHAR(64) NULL UNIQUE,
  descripcion TEXT NOT NULL,
  alcance ENUM('LIMITADO','MULTIPLE','GENERAL') NOT NULL,
  impacto ENUM('BAJO','MEDIO','ALTO','CRITICO') NOT NULL,
  urgencia ENUM('BAJA','MEDIA','ALTA','INMEDIATA') NOT NULL,
  proceso_esencial BOOLEAN NOT NULL DEFAULT FALSE,
  alternativa_disponible BOOLEAN NOT NULL DEFAULT TRUE,
  prioridad_sugerida ENUM('P1','P2','P3','P4') NOT NULL,
  prioridad ENUM('P1','P2','P3','P4') NULL,
  estado ENUM('REGISTRADO','CLASIFICADO','ASIGNADO','EN_INVESTIGACION','EN_MITIGACION','SERVICIO_RECUPERADO','VERIFICADO','CERRADO') NOT NULL DEFAULT 'REGISTRADO',
  reportado_por BIGINT NULL,
  responsable_id BIGINT NULL,
  verificado_por BIGINT NULL,
  detectado_at TIMESTAMP NOT NULL,
  iniciado_at TIMESTAMP NULL,
  recuperado_at TIMESTAMP NULL,
  verificado_at TIMESTAMP NULL,
  cerrado_at TIMESTAMP NULL,
  version INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_incidente_reportante FOREIGN KEY (reportado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_responsable FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_verificador FOREIGN KEY (verificado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_incidente_estado_prioridad (estado, prioridad),
  INDEX idx_incidente_responsable (responsable_id, estado),
  INDEX idx_incidente_componente (componente, detectado_at),
  INDEX idx_incidente_deteccion (detectado_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incidente_historial (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  incidente_id BIGINT NOT NULL,
  actor_id BIGINT NULL,
  actor_email VARCHAR(150) NOT NULL,
  estado_anterior VARCHAR(40) NULL,
  estado_nuevo VARCHAR(40) NOT NULL,
  detalle VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_incidente_historial_incidente FOREIGN KEY (incidente_id) REFERENCES incidentes_produccion(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidente_historial_actor FOREIGN KEY (actor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_incidente_historial (incidente_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incidente_actividades (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  incidente_id BIGINT NOT NULL,
  actor_id BIGINT NULL,
  actor_email VARCHAR(150) NOT NULL,
  tipo ENUM('DIAGNOSTICO','MITIGACION','EVIDENCIA','CAUSA','RESOLUCION','PREVENCION','NOTA') NOT NULL,
  detalle TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_incidente_actividad_incidente FOREIGN KEY (incidente_id) REFERENCES incidentes_produccion(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidente_actividad_actor FOREIGN KEY (actor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_incidente_actividad (incidente_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incidente_ticket (
  incidente_id BIGINT NOT NULL,
  ticket_id BIGINT NOT NULL,
  tipo_relacion ENUM('ORIGEN','AFECTADO','RELACIONADO') NOT NULL DEFAULT 'RELACIONADO',
  vinculado_por BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (incidente_id, ticket_id),
  CONSTRAINT fk_incidente_ticket_incidente FOREIGN KEY (incidente_id) REFERENCES incidentes_produccion(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidente_ticket_ticket FOREIGN KEY (ticket_id) REFERENCES tickets_soporte(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidente_ticket_actor FOREIGN KEY (vinculado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_incidente_ticket_ticket (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incidente_cambio (
  incidente_id BIGINT NOT NULL,
  solicitud_cambio_id BIGINT NOT NULL,
  proposito ENUM('MITIGACION','CORRECCION','PREVENCION') NOT NULL,
  vinculado_por BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (incidente_id, solicitud_cambio_id),
  CONSTRAINT fk_incidente_cambio_incidente FOREIGN KEY (incidente_id) REFERENCES incidentes_produccion(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidente_cambio_solicitud FOREIGN KEY (solicitud_cambio_id) REFERENCES solicitudes_cambio(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidente_cambio_actor FOREIGN KEY (vinculado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_incidente_cambio_solicitud (solicitud_cambio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consolidación aditiva de Mesa de Ayuda: catálogos estructurados y SLA auditable.
-- Requiere 008, 010, 011, 014, 015 y 016. No clasifica ni modifica datos históricos.
USE gtel_talento;

CREATE TABLE IF NOT EXISTS solicitud_tipos (
  codigo VARCHAR(64) PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  modulo_codigo VARCHAR(50) NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  orden_visual INT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT chk_solicitud_tipo_orden CHECK (orden_visual > 0),
  UNIQUE KEY uk_solicitud_tipo_orden (orden_visual),
  INDEX idx_solicitud_tipo_activa (activa,orden_visual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incidente_tipos_problema (
  codigo VARCHAR(64) PRIMARY KEY,
  categoria_codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  orden_visual INT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_incidente_tipo_categoria FOREIGN KEY (categoria_codigo)
    REFERENCES incidente_categorias(codigo),
  CONSTRAINT chk_incidente_tipo_orden CHECK (orden_visual > 0),
  UNIQUE KEY uk_incidente_tipo_categoria_orden (categoria_codigo,orden_visual),
  UNIQUE KEY uk_incidente_tipo_codigo_categoria (codigo,categoria_codigo),
  INDEX idx_incidente_tipo_activo (activa,categoria_codigo,orden_visual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Las referencias quedan nulas para tickets legados. El backend exigirá el catálogo
-- correspondiente para registros nuevos sin inventar clasificaciones históricas.
ALTER TABLE tickets_soporte
  ADD COLUMN solicitud_tipo_codigo VARCHAR(64) NULL AFTER tipo_atencion,
  ADD COLUMN incidente_tipo_codigo VARCHAR(64) NULL AFTER solicitud_tipo_codigo,
  ADD COLUMN canal_origen VARCHAR(30) NULL AFTER incidente_tipo_codigo,
  ADD COLUMN sla_politica_id BIGINT NULL AFTER prioridad,
  ADD COLUMN sla_respuesta_limite_at TIMESTAMP NULL AFTER sla_politica_id,
  ADD COLUMN sla_resolucion_limite_at TIMESTAMP NULL AFTER sla_respuesta_limite_at,
  ADD COLUMN primera_atencion_at TIMESTAMP NULL AFTER sla_resolucion_limite_at,
  ADD CONSTRAINT fk_ticket_solicitud_tipo FOREIGN KEY (solicitud_tipo_codigo)
    REFERENCES solicitud_tipos(codigo),
  ADD CONSTRAINT fk_ticket_incidente_tipo FOREIGN KEY (incidente_tipo_codigo)
    REFERENCES incidente_tipos_problema(codigo),
  ADD CONSTRAINT fk_ticket_sla_politica FOREIGN KEY (sla_politica_id)
    REFERENCES ticket_sla_politicas(id),
  ADD CONSTRAINT chk_ticket_tipo_estructurado CHECK (
    (solicitud_tipo_codigo IS NULL AND incidente_tipo_codigo IS NULL)
    OR (tipo_atencion='SOLICITUD' AND solicitud_tipo_codigo IS NOT NULL AND incidente_tipo_codigo IS NULL)
    OR (tipo_atencion='INCIDENTE' AND solicitud_tipo_codigo IS NULL AND incidente_tipo_codigo IS NOT NULL)
  ),
  ADD CONSTRAINT chk_ticket_canal_origen CHECK (
    canal_origen IS NULL OR canal_origen IN ('WEB','MONITOREO','TECNICO','INTEGRACION')
  ),
  ADD INDEX idx_ticket_solicitud_tipo (solicitud_tipo_codigo,created_at),
  ADD INDEX idx_ticket_incidente_tipo (incidente_tipo_codigo,created_at),
  ADD INDEX idx_ticket_canal_origen (canal_origen,created_at),
  ADD INDEX idx_ticket_sla_respuesta (estado,sla_respuesta_limite_at),
  ADD INDEX idx_ticket_sla_resolucion (estado,sla_resolucion_limite_at);

-- Un incidente de monitoreo puede no tener ticket, pero su problema técnico puede
-- conservarse estructuradamente. La FK compuesta impide mezclar tipo y categoría.
ALTER TABLE incidentes_produccion
  ADD COLUMN incidente_tipo_codigo VARCHAR(64) NULL AFTER categoria_codigo,
  ADD COLUMN sla_politica_id BIGINT NULL AFTER sla_resolucion_at,
  ADD CONSTRAINT fk_incidente_tipo_categoria_compuesta
    FOREIGN KEY (incidente_tipo_codigo,categoria_codigo)
    REFERENCES incidente_tipos_problema(codigo,categoria_codigo),
  ADD CONSTRAINT fk_incidente_sla_politica FOREIGN KEY (sla_politica_id)
    REFERENCES incidente_sla_politicas(id),
  ADD CONSTRAINT chk_incidente_tipo_requiere_categoria CHECK (
    incidente_tipo_codigo IS NULL OR categoria_codigo IS NOT NULL
  ),
  ADD INDEX idx_incidente_tipo_fecha (incidente_tipo_codigo,detectado_at),
  ADD INDEX idx_incidente_sla_politica (sla_politica_id,detectado_at);

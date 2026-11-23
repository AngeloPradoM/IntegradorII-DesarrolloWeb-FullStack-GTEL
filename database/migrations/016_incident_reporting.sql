-- Extensión configurable de incidentes: categorías, asignación, SLA y escalamiento.
-- Migración aditiva aprobada; ejecutar únicamente después de 015_production_incidents.sql.
USE gtel_talento;

CREATE TABLE IF NOT EXISTS incidente_categorias (
  codigo VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  modulo_codigo VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(500) NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO incidente_categorias(codigo,nombre,modulo_codigo,descripcion,activa) VALUES
  ('ACCESO_AUTENTICACION','Acceso y autenticación','AUTH','Inicio de sesión, permisos y recuperación de acceso',TRUE),
  ('CARGA_CV','Carga de CV','CV','Carga, lectura y descarga de currículums',TRUE),
  ('POSTULACIONES','Postulaciones','APPLICATIONS','Registro y seguimiento de postulaciones',TRUE),
  ('OFERTAS_LABORALES','Ofertas laborales','JOBS','Publicación y administración de ofertas',TRUE),
  ('DATOS_MYSQL','Datos y MySQL','DATABASE','Persistencia, consultas e integridad de datos',TRUE),
  ('RENDIMIENTO_SATURACION','Rendimiento y saturación','PERFORMANCE','Latencia, capacidad y consumo de recursos',TRUE),
  ('DISPONIBILIDAD_PLATAFORMA','Disponibilidad de la plataforma','AVAILABILITY','Interrupciones generales o parciales del servicio',TRUE),
  ('NOTIFICACIONES','Notificaciones','NOTIFICATIONS','Entrega y visualización de notificaciones',TRUE),
  ('INTERFAZ','Interfaz','UI','Presentación, accesibilidad y comportamiento visual',TRUE),
  ('OTROS','Otros','OTHER','Incidentes que requieren clasificación administrativa',TRUE)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre),modulo_codigo=VALUES(modulo_codigo),
  descripcion=VALUES(descripcion),activa=VALUES(activa);

CREATE TABLE IF NOT EXISTS incidente_sla_politicas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  prioridad ENUM('P1','P2','P3','P4') NOT NULL UNIQUE,
  minutos_primera_atencion INT NOT NULL,
  minutos_resolucion INT NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_incidente_sla_atencion CHECK (minutos_primera_atencion > 0),
  CONSTRAINT chk_incidente_sla_resolucion CHECK (minutos_resolucion >= minutos_primera_atencion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO incidente_sla_politicas(prioridad,minutos_primera_atencion,minutos_resolucion,descripcion,activa) VALUES
  ('P1',15,240,'Crítica: atención en 15 minutos y recuperación objetivo en 4 horas',TRUE),
  ('P2',30,480,'Alta: atención en 30 minutos y recuperación objetivo en 8 horas',TRUE),
  ('P3',240,1440,'Media: atención en 4 horas y recuperación objetivo en 24 horas',TRUE),
  ('P4',480,4320,'Baja: atención en 8 horas y recuperación objetivo en 72 horas',TRUE)
ON DUPLICATE KEY UPDATE minutos_primera_atencion=VALUES(minutos_primera_atencion),
  minutos_resolucion=VALUES(minutos_resolucion),descripcion=VALUES(descripcion),activa=VALUES(activa);

CREATE TABLE IF NOT EXISTS incidente_asignacion_reglas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  categoria_codigo VARCHAR(50) NOT NULL,
  prioridad ENUM('P1','P2','P3','P4') NULL,
  prioridad_clave VARCHAR(2) GENERATED ALWAYS AS (COALESCE(prioridad,'*')) STORED,
  tecnico_id BIGINT NOT NULL,
  precedencia SMALLINT NOT NULL DEFAULT 100,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  vigencia_desde TIMESTAMP NULL,
  vigencia_hasta TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_incidente_regla_categoria FOREIGN KEY (categoria_codigo) REFERENCES incidente_categorias(codigo),
  CONSTRAINT fk_incidente_regla_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT chk_incidente_regla_precedencia CHECK (precedencia > 0),
  CONSTRAINT chk_incidente_regla_vigencia CHECK (vigencia_hasta IS NULL OR vigencia_desde IS NULL OR vigencia_hasta > vigencia_desde),
  UNIQUE KEY uk_incidente_regla (categoria_codigo,prioridad_clave,tecnico_id),
  INDEX idx_incidente_regla_busqueda (categoria_codigo,prioridad,activa,precedencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Regla inicial real: todo técnico activo queda elegible para todas las categorías.
-- Reglas específicas por categoría/prioridad podrán reducir precedencia en fases posteriores.
INSERT INTO incidente_asignacion_reglas(categoria_codigo,prioridad,tecnico_id,precedencia,activa)
SELECT c.codigo,NULL,u.id,100,TRUE
FROM incidente_categorias c
CROSS JOIN usuarios u
JOIN roles r ON r.id=u.rol_id
WHERE c.activa=TRUE AND u.estado='activo' AND r.nombre='TECNICO'
ON DUPLICATE KEY UPDATE activa=TRUE,updated_at=CURRENT_TIMESTAMP;

ALTER TABLE incidentes_produccion
  ADD COLUMN modulo_codigo VARCHAR(50) NULL AFTER tipo,
  ADD COLUMN categoria_sugerida VARCHAR(50) NULL AFTER modulo_codigo,
  ADD COLUMN categoria_codigo VARCHAR(50) NULL AFTER categoria_sugerida,
  ADD COLUMN categoria_motivo VARCHAR(800) NULL AFTER categoria_codigo,
  ADD COLUMN servicio_bloqueado BOOLEAN NOT NULL DEFAULT FALSE AFTER alternativa_disponible,
  ADD COLUMN primera_atencion_at TIMESTAMP NULL AFTER iniciado_at,
  ADD COLUMN solucion_aplicada TEXT NULL AFTER cerrado_at,
  ADD COLUMN causa_raiz TEXT NULL AFTER solucion_aplicada,
  ADD COLUMN aprendizaje TEXT NULL AFTER causa_raiz,
  ADD COLUMN falla_repetida BOOLEAN NOT NULL DEFAULT FALSE AFTER aprendizaje,
  ADD COLUMN incidente_previo_id BIGINT NULL AFTER falla_repetida,
  ADD COLUMN sla_primera_atencion_at TIMESTAMP NULL AFTER incidente_previo_id,
  ADD COLUMN sla_resolucion_at TIMESTAMP NULL AFTER sla_primera_atencion_at,
  ADD COLUMN asignacion_fuente ENUM('PENDIENTE','MANUAL','AUTOMATICA') NOT NULL DEFAULT 'PENDIENTE' AFTER responsable_id,
  ADD COLUMN regla_asignacion_id BIGINT NULL AFTER asignacion_fuente,
  ADD COLUMN asignado_at TIMESTAMP NULL AFTER regla_asignacion_id,
  ADD CONSTRAINT fk_incidente_categoria_sugerida FOREIGN KEY (categoria_sugerida) REFERENCES incidente_categorias(codigo),
  ADD CONSTRAINT fk_incidente_categoria FOREIGN KEY (categoria_codigo) REFERENCES incidente_categorias(codigo),
  ADD CONSTRAINT fk_incidente_previo FOREIGN KEY (incidente_previo_id) REFERENCES incidentes_produccion(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_incidente_regla_asignacion FOREIGN KEY (regla_asignacion_id) REFERENCES incidente_asignacion_reglas(id) ON DELETE SET NULL,
  ADD INDEX idx_incidente_categoria_fecha (categoria_codigo,detectado_at),
  ADD INDEX idx_incidente_sla_resolucion (estado,sla_resolucion_at),
  ADD INDEX idx_incidente_repetido (falla_repetida,detectado_at);

UPDATE incidentes_produccion
SET asignacion_fuente='MANUAL',asignado_at=COALESCE(asignado_at,updated_at,created_at)
WHERE responsable_id IS NOT NULL AND asignacion_fuente='PENDIENTE';

CREATE TABLE IF NOT EXISTS incidente_escalamientos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  incidente_id BIGINT NOT NULL,
  escalado_por BIGINT NULL,
  escalado_a BIGINT NULL,
  motivo VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atendido_at TIMESTAMP NULL,
  resuelto_at TIMESTAMP NULL,
  resuelto_por BIGINT NULL,
  resolucion VARCHAR(1000) NULL,
  incidente_activo_id BIGINT GENERATED ALWAYS AS (CASE WHEN resuelto_at IS NULL THEN incidente_id ELSE NULL END) STORED,
  CONSTRAINT fk_incidente_escalamiento_incidente FOREIGN KEY (incidente_id) REFERENCES incidentes_produccion(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidente_escalamiento_actor FOREIGN KEY (escalado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_escalamiento_destino FOREIGN KEY (escalado_a) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_escalamiento_resolutor FOREIGN KEY (resuelto_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE KEY uk_incidente_escalamiento_activo (incidente_activo_id),
  INDEX idx_incidente_escalamiento_historial (incidente_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

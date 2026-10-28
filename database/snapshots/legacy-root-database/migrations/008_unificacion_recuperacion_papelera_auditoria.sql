-- ============================================================================
-- MIGRACIÓN 008: UNIFICACIÓN DE MÓDULOS DE RECUPERACIÓN, PAPELERA Y AUDITORÍA
-- GTEL TALENTO ATS - FUSIÓN BRIAN & ANGELO
-- ============================================================================

USE gtel_talento;

-- 1. Módulo de Recuperación de Contraseña por Token Seguro
CREATE TABLE IF NOT EXISTS recuperacion_acceso (
  usuario_id BIGINT PRIMARY KEY,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expira BIGINT NOT NULL,
  solicitado BIGINT NOT NULL,
  CONSTRAINT fk_recuperacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Módulo de Papelera de Vacantes (Ciclo de Vida de 30 días / Soft Delete)
CREATE TABLE IF NOT EXISTS vacantes_papelera (
  vacante_id BIGINT PRIMARY KEY,
  eliminada_en BIGINT NOT NULL,
  eliminar_despues BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  INDEX idx_papelera_vencimiento (eliminar_despues),
  CONSTRAINT fk_papelera_vacante FOREIGN KEY (vacante_id) REFERENCES vacantes (id) ON DELETE CASCADE,
  CONSTRAINT fk_papelera_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Perfiles de Contacto Extendidos y Documentos de Postulación
CREATE TABLE IF NOT EXISTS perfiles_contacto (
  usuario_id BIGINT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  telefono VARCHAR(16),
  ubicacion VARCHAR(100),
  localidad VARCHAR(100),
  correo_contacto VARCHAR(150),
  foto MEDIUMTEXT,
  educacion TEXT,
  experiencia TEXT,
  CONSTRAINT fk_perfiles_contacto_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documentos_postulacion (
  postulacion_id BIGINT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  contenido LONGBLOB NOT NULL,
  datos_personales JSON NOT NULL,
  CONSTRAINT fk_documentos_postulacion FOREIGN KEY (postulacion_id) REFERENCES postulaciones (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Extensión de Auditoría Histórica
ALTER TABLE auditoria ADD COLUMN IF NOT EXISTS actor_id_historico BIGINT NULL;
ALTER TABLE auditoria ADD COLUMN IF NOT EXISTS actor_email_historico VARCHAR(150) NULL;

-- 5. Extensión de Cola y Reintentos en Notificaciones
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS enviada BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS intentos INT NOT NULL DEFAULT 0;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS proximo_intento BIGINT NOT NULL DEFAULT 0;

-- =============================================================================
-- MIGRACIÓN 000: Inicialización de Base de Datos Aislada para Mejoras
-- Base de datos destino: gtel_talento_mejoras
-- Reversible: Sí (ver 000_init_gtel_talento_mejoras_rollback.sql)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS gtel_talento_mejoras
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gtel_talento_mejoras;

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(150)
) ENGINE=InnoDB;

-- 2. DEPARTAMENTOS
CREATE TABLE IF NOT EXISTS departamentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(200),
  estado ENUM('activo','inactivo') DEFAULT 'activo'
) ENGINE=InnoDB;

-- 3. USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  auth_version INT NOT NULL DEFAULT 0,
  otp_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  rol_id BIGINT NOT NULL,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_roles FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- 4. POSTULANTES
CREATE TABLE IF NOT EXISTS postulantes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  dni VARCHAR(8),
  telefono VARCHAR(16),
  fecha_nacimiento DATE,
  cv_url VARCHAR(255),
  experiencia TEXT,
  educacion TEXT,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  CONSTRAINT fk_postulantes_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. REQUERIMIENTOS DE PERSONAL
CREATE TABLE IF NOT EXISTS requerimientos_personal (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  departamento_id BIGINT NOT NULL,
  solicitante_id BIGINT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  cantidad INT DEFAULT 1,
  estado ENUM('pendiente','aprobado','rechazado','cerrado') DEFAULT 'pendiente',
  fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_aprobacion TIMESTAMP NULL,
  observaciones VARCHAR(255),
  CONSTRAINT fk_req_departamentos FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  CONSTRAINT fk_req_usuarios FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- 6. VACANTES
CREATE TABLE IF NOT EXISTS vacantes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  requerimiento_id BIGINT NULL,
  titulo VARCHAR(150) NOT NULL,
  departamento_id BIGINT NOT NULL,
  reclutador_id BIGINT NOT NULL,
  num_vacantes INT DEFAULT 1,
  sueldo_min DECIMAL(10,2),
  sueldo_max DECIMAL(10,2),
  tipo_jornada ENUM('full_time','part_time','por_turnos','freelance') NOT NULL,
  modalidad ENUM('presencial','remoto','hibrido') NOT NULL,
  sede VARCHAR(150),
  fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_limite_postulacion DATE,
  fecha_cierre DATE NULL,
  descripcion TEXT,
  nivel_educativo VARCHAR(80),
  experiencia_minima VARCHAR(80),
  habilidades VARCHAR(255),
  estado ENUM('activa','pausada','cerrada') DEFAULT 'activa',
  CONSTRAINT fk_vacantes_requerimientos FOREIGN KEY (requerimiento_id) REFERENCES requerimientos_personal(id),
  CONSTRAINT fk_vacantes_departamentos FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  CONSTRAINT fk_vacantes_reclutador FOREIGN KEY (reclutador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- 7. POSTULACIONES
CREATE TABLE IF NOT EXISTS postulaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE,
  postulante_id BIGINT NOT NULL,
  vacante_id BIGINT NOT NULL,
  puntaje_general INT,
  estado ENUM('recibida','en_revision','entrevista','aprobada','rechazada') DEFAULT 'recibida',
  fecha_postulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_postulaciones_postulantes FOREIGN KEY (postulante_id) REFERENCES postulantes(id),
  CONSTRAINT fk_postulaciones_vacantes FOREIGN KEY (vacante_id) REFERENCES vacantes(id)
) ENGINE=InnoDB;

-- 8. TIMELINE DE POSTULACIÓN
CREATE TABLE IF NOT EXISTS postulacion_timeline (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  comentario VARCHAR(255),
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_id BIGINT,
  CONSTRAINT fk_timeline_postulaciones FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_timeline_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- 9. ENTREVISTAS
CREATE TABLE IF NOT EXISTS entrevistas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  duracion_min INT DEFAULT 30,
  tipo ENUM('video','presencial') NOT NULL,
  ubicacion VARCHAR(255),
  estado ENUM('programada','realizada','cancelada') DEFAULT 'programada',
  CONSTRAINT fk_entrevistas_postulaciones FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. EVALUACIONES
CREATE TABLE IF NOT EXISTS evaluaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  tipo_evaluacion VARCHAR(100) NOT NULL,
  puntaje_total INT NOT NULL,
  tiempo_min INT,
  resultado ENUM('aprobado','en_revision','no_aprobado') NOT NULL,
  fecha_evaluacion DATE DEFAULT (CURRENT_DATE),
  usuario_id BIGINT,
  CONSTRAINT fk_evaluaciones_postulaciones FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_evaluaciones_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- 11. DETALLE DE EVALUACIÓN
CREATE TABLE IF NOT EXISTS evaluacion_detalle (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  evaluacion_id BIGINT NOT NULL,
  criterio VARCHAR(100) NOT NULL,
  puntaje INT NOT NULL,
  porcentaje INT,
  observacion VARCHAR(255),
  CONSTRAINT fk_detalle_evaluaciones FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. AUDITORÍA
CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tabla_afectada VARCHAR(50) NOT NULL,
  registro_id BIGINT NOT NULL,
  accion ENUM('crear','actualizar','eliminar') NOT NULL,
  detalle VARCHAR(255),
  usuario_id BIGINT,
  fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- 13. DESAFÍOS OTP (2FA por correo)
CREATE TABLE IF NOT EXISTS auth_email_challenges (
  usuario_id BIGINT NOT NULL PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL,
  rol VARCHAR(50) NOT NULL,
  code_hash VARCHAR(64) NOT NULL,
  expires_at BIGINT NOT NULL,
  deadline BIGINT NOT NULL,
  resend_at BIGINT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  sends INT NOT NULL DEFAULT 0,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_auth_challenge_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- DATOS INICIALES SEMILLA (Roles y Departamentos)
-- =============================================================================

INSERT INTO roles (id, nombre, descripcion) VALUES
  (1, 'CANDIDATO', 'Postulante externo a convocatorias'),
  (2, 'RECLUTADOR', 'Gestión de procesos de selección y reclutamiento'),
  (3, 'ADMIN', 'Administrador de seguridad y usuarios del sistema')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), descripcion=VALUES(descripcion);

INSERT INTO departamentos (id, nombre, descripcion, estado) VALUES
  (1, 'Ventas y Comercial', 'Campañas comerciales outbound e inbound de telecomunicaciones', 'activo'),
  (2, 'Atención al Cliente', 'Atención y soporte telefónico de usuarios', 'activo'),
  (3, 'Soporte Técnico e IT', 'Soporte de sistemas y conectividad para operaciones', 'activo'),
  (4, 'Recursos Humanos', 'Atracción, selección y bienestar del talento humano', 'activo'),
  (5, 'Operaciones Call Center', 'Gestión y supervisión de piso operativo', 'activo')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), descripcion=VALUES(descripcion);

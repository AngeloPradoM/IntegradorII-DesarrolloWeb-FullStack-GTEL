-- Instalacion inicial: solo para una base nueva sin tablas. No ejecutar sobre la BD existente.
CREATE DATABASE IF NOT EXISTS gtel_talento
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gtel_talento;

-- ============================
-- 1. ROLES
-- ============================
CREATE TABLE roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,      -- 'CANDIDATO', 'RECLUTADOR'
  descripcion VARCHAR(150)
);

-- ============================
-- 2. DEPARTAMENTOS
-- ============================
CREATE TABLE departamentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,      -- 'Ventas', 'Soporte Técnico', etc.
  descripcion VARCHAR(200),
  estado ENUM('activo','inactivo') DEFAULT 'activo'
);

-- ============================
-- 3. USUARIOS (acceso al sistema)
-- ============================
CREATE TABLE usuarios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  auth_version INT NOT NULL DEFAULT 0,
  otp_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  rol_id BIGINT NOT NULL,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- ============================
-- 4. POSTULANTES (perfil profesional, 1:1 con usuarios candidato)
-- ============================
CREATE TABLE postulantes (
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
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================
-- 5. REQUERIMIENTOS DE PERSONAL
-- ============================
CREATE TABLE requerimientos_personal (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  departamento_id BIGINT NOT NULL,
  solicitante_id BIGINT NOT NULL,            -- usuario que solicita (reclutador/gerente)
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  cantidad INT DEFAULT 1,
  estado ENUM('pendiente','aprobado','rechazado','cerrado') DEFAULT 'pendiente',
  fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_aprobacion TIMESTAMP NULL,
  observaciones VARCHAR(255),
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
);

-- ============================
-- 6. VACANTES
-- ============================
CREATE TABLE vacantes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  requerimiento_id BIGINT NULL,              -- opcional
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
  fecha_limite_postulacion DATE,             -- Actualizado de fecha_limite
  fecha_cierre DATE NULL,
  descripcion TEXT,
  nivel_educativo VARCHAR(80),
  experiencia_minima VARCHAR(80),
  habilidades VARCHAR(255),
  estado ENUM('activa','pausada','cerrada') DEFAULT 'activa',
  FOREIGN KEY (requerimiento_id) REFERENCES requerimientos_personal(id),
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (reclutador_id) REFERENCES usuarios(id)
);

-- ============================
-- 7. POSTULACIONES
-- ============================
CREATE TABLE postulaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE,                 -- ej. GTEL-2026-0847
  postulante_id BIGINT NOT NULL,
  vacante_id BIGINT NOT NULL,
  puntaje_general INT,
  estado ENUM('recibida','en_revision','entrevista','aprobada','rechazada') DEFAULT 'recibida',
  fecha_postulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postulante_id) REFERENCES postulantes(id),
  FOREIGN KEY (vacante_id) REFERENCES vacantes(id)
);

-- ============================
-- 8. TIMELINE DE POSTULACIÓN
-- ============================
CREATE TABLE postulacion_timeline (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  comentario VARCHAR(255),
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Actualizado de fecha
  usuario_id BIGINT,                         -- quién generó el cambio (puede ser NULL si es automático)
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================
-- 9. ENTREVISTAS
-- ============================
CREATE TABLE entrevistas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  duracion_min INT DEFAULT 30,
  tipo ENUM('video','presencial') NOT NULL,
  ubicacion VARCHAR(255),
  estado ENUM('programada','realizada','cancelada') DEFAULT 'programada',
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id)
);

-- ============================
-- 10. EVALUACIONES
-- ============================
CREATE TABLE evaluaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  tipo_evaluacion VARCHAR(100) NOT NULL,    -- 'Prueba de Inglés', 'Evaluación de Ventas'
  puntaje_total INT NOT NULL,
  tiempo_min INT,
  resultado ENUM('aprobado','en_revision','no_aprobado') NOT NULL,
  fecha_evaluacion DATE DEFAULT (CURRENT_DATE), -- Actualizado de fecha
  usuario_id BIGINT,                         -- quién evaluó
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================
-- 11. DETALLE DE EVALUACIÓN
-- ============================
CREATE TABLE evaluacion_detalle (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  evaluacion_id BIGINT NOT NULL,
  criterio VARCHAR(100) NOT NULL,            -- 'Comprensión oral', 'Técnicas de cierre'
  puntaje INT NOT NULL,
  porcentaje INT,
  observacion VARCHAR(255),
  FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id)
);

-- ============================
-- 12. AUDITORÍA
-- ============================
CREATE TABLE auditoria (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tabla_afectada VARCHAR(50) NOT NULL,
  registro_id BIGINT NOT NULL,
  accion ENUM('crear','actualizar','eliminar') NOT NULL,
  detalle VARCHAR(255),
  usuario_id BIGINT,
  fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
INSERT INTO roles (nombre, descripcion) VALUES ('CANDIDATO', 'Postulante'), ('RECLUTADOR', 'Gestion de reclutamiento');

-- Aplicar una vez en gtel_talento antes de iniciar la version con OTP.
-- No modifica cuentas existentes. Tiempos UTC expresados en epoch milisegundos.
CREATE TABLE auth_email_challenges (
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

INSERT INTO roles(nombre,descripcion) VALUES ('ADMIN','Administrador del sistema');

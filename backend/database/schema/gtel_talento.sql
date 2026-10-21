-- Esquema DDL Unificado GTEL Talento ATS
-- Compatible con MySQL 8.4, MariaDB y H2 (Modo MySQL)

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS departamentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(200),
  estado ENUM('activo','inactivo') DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS usuarios (
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

CREATE TABLE IF NOT EXISTS postulantes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  tipo_documento ENUM('DNI','CE','PASAPORTE','OTRO'),
  numero_documento VARCHAR(30),
  telefono VARCHAR(16),
  fecha_nacimiento DATE,
  cv_url VARCHAR(255),
  experiencia TEXT,
  educacion TEXT,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

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
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
);

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
  FOREIGN KEY (requerimiento_id) REFERENCES requerimientos_personal(id),
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (reclutador_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS postulaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE,
  postulante_id BIGINT NOT NULL,
  vacante_id BIGINT NOT NULL,
  puntaje_general INT,
  estado ENUM('recibida','en_revision','entrevista','aprobada','rechazada') DEFAULT 'recibida',
  fecha_postulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postulante_id) REFERENCES postulantes(id),
  FOREIGN KEY (vacante_id) REFERENCES vacantes(id)
);

CREATE TABLE IF NOT EXISTS postulacion_timeline (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  comentario VARCHAR(255),
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_id BIGINT,
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS entrevistas (
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

CREATE TABLE IF NOT EXISTS evaluaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  tipo_evaluacion VARCHAR(100) NOT NULL,
  puntaje_total INT NOT NULL,
  tiempo_min INT,
  resultado ENUM('aprobado','en_revision','no_aprobado') NOT NULL,
  fecha_evaluacion DATE,
  usuario_id BIGINT,
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS evaluacion_detalle (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  evaluacion_id BIGINT NOT NULL,
  criterio VARCHAR(100) NOT NULL,
  puntaje INT NOT NULL,
  porcentaje INT,
  observacion VARCHAR(255),
  FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id)
);

CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tabla_afectada VARCHAR(50) NOT NULL,
  registro_id BIGINT NOT NULL,
  accion ENUM('crear','actualizar','eliminar') NOT NULL,
  detalle VARCHAR(255),
  usuario_id BIGINT,
  fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actor_id_historico BIGINT NULL,
  actor_email_historico VARCHAR(150) NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

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
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

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
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS documentos_postulacion (
  postulacion_id BIGINT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  contenido LONGBLOB NOT NULL,
  datos_personales JSON NOT NULL,
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id)
);

CREATE TABLE IF NOT EXISTS recuperacion_acceso (
  usuario_id BIGINT PRIMARY KEY,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expira BIGINT NOT NULL,
  solicitado BIGINT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje VARCHAR(1000) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  enviada BOOLEAN NOT NULL DEFAULT FALSE,
  intentos INT NOT NULL DEFAULT 0,
  proximo_intento BIGINT NOT NULL DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS vacantes_papelera (
  vacante_id BIGINT PRIMARY KEY,
  eliminada_en BIGINT NOT NULL,
  eliminar_despues BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  FOREIGN KEY (vacante_id) REFERENCES vacantes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS solicitudes_arco (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  tipo_derecho ENUM('acceso','rectificacion','cancelacion','oposicion') NOT NULL,
  motivo TEXT NOT NULL,
  estado ENUM('pendiente','en_proceso','aprobada','rechazada') DEFAULT 'pendiente',
  fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta TIMESTAMP NULL,
  respuesta TEXT,
  atendido_por BIGINT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (atendido_por) REFERENCES usuarios(id)
);

INSERT INTO roles (id, nombre, descripcion) VALUES
  (1, 'CANDIDATO', 'Postulante'),
  (2, 'RECLUTADOR', 'Gestion de reclutamiento'),
  (3, 'ADMIN', 'Administrador del sistema'),
  (4, 'JEFATURA', 'Jefatura de area'),
  (5, 'ANALISTA', 'Analista de seleccion'),
  (6, 'ENTREVISTADOR', 'Entrevistador tecnico')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

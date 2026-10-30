CREATE DATABASE IF NOT EXISTS gtel_talento CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gtel_talento;

-- Fuente canónica: database/schema/gtel_talento.sql. La copia raíz solo se monta como init de Docker.
-- Esquema DDL Unificado GTEL Talento ATS
-- Compatible con MySQL 8.4, MariaDB y H2 (Modo MySQL)

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(150)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departamentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(200),
  estado ENUM('activo','inactivo') DEFAULT 'activo') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  auth_version INT NOT NULL DEFAULT 0,
  otp_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  rol_id BIGINT NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  estado VARCHAR(20) NOT NULL DEFAULT 'activo',
  consentimiento_datos BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_consentimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consentimiento_version VARCHAR(30) NOT NULL DEFAULT 'v1.0-ley29733',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (reclutador_id) REFERENCES usuarios(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS postulaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE,
  postulante_id BIGINT NOT NULL,
  vacante_id BIGINT NOT NULL,
  puntaje_general INT,
  estado VARCHAR(20) NOT NULL DEFAULT 'recibida',
  fecha_postulacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cv_url VARCHAR(255) NULL,
  cv_nombre VARCHAR(255) NULL,
  FOREIGN KEY (postulante_id) REFERENCES postulantes(id),
  FOREIGN KEY (vacante_id) REFERENCES vacantes(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS postulacion_timeline (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  comentario VARCHAR(255),
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_id BIGINT,
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS entrevistas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  duracion_min INT DEFAULT 30,
  tipo ENUM('video','presencial') NOT NULL,
  ubicacion VARCHAR(255),
  estado ENUM('programada','realizada','cancelada') DEFAULT 'programada',
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evaluacion_detalle (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  evaluacion_id BIGINT NOT NULL,
  criterio VARCHAR(100) NOT NULL,
  puntaje INT NOT NULL,
  porcentaje INT,
  observacion VARCHAR(255),
  FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documentos_postulacion (
  postulacion_id BIGINT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  contenido LONGBLOB NOT NULL,
  datos_personales JSON NOT NULL,
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recuperacion_acceso (
  usuario_id BIGINT PRIMARY KEY,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expira BIGINT NOT NULL,
  solicitado BIGINT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje VARCHAR(1000) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'SISTEMA',
  enlace VARCHAR(255) NULL,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  enviada BOOLEAN NOT NULL DEFAULT FALSE,
  intentos INT NOT NULL DEFAULT 0,
  proximo_intento BIGINT NOT NULL DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vacantes_papelera (
  vacante_id BIGINT PRIMARY KEY,
  eliminada_en BIGINT NOT NULL,
  eliminar_despues BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  FOREIGN KEY (vacante_id) REFERENCES vacantes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_papelera_vencimiento (eliminar_despues)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitudes_arco (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NULL,
  email_solicitante VARCHAR(150) NOT NULL,
  tipo_solicitud VARCHAR(30) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'EJECUTADA',
  detalle TEXT NULL,
  ip_origen VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_soporte_estados (
  codigo VARCHAR(30) PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  orden SMALLINT NOT NULL UNIQUE,
  terminal BOOLEAN NOT NULL DEFAULT FALSE,
  descripcion VARCHAR(255) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ticket_soporte_estados (codigo, nombre, orden, terminal, descripcion) VALUES
  ('NUEVO', 'Nuevo', 10, FALSE, 'Solicitud registrada y pendiente de asignación.'),
  ('ASIGNADO', 'Asignado', 20, FALSE, 'Solicitud asignada a un técnico responsable.'),
  ('EN_ATENCION', 'En atención', 30, FALSE, 'El técnico está ejecutando la atención autorizada.'),
  ('EN_ESPERA', 'En espera', 40, FALSE, 'El caso espera información o autorización administrativa.'),
  ('RESUELTO', 'Resuelto', 50, TRUE, 'La solucion fue ejecutada y registrada con evidencia.'),
  ('CERRADO', 'Cerrado', 60, TRUE, 'El caso fue cerrado definitivamente.')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  orden = VALUES(orden),
  terminal = VALUES(terminal),
  descripcion = VALUES(descripcion);

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
  diagnostico VARCHAR(2000),
  solucion_propuesta VARCHAR(3000),
  estado_propuesta ENUM('SIN_PROPUESTA','PENDIENTE','APROBADA','RECHAZADA') NOT NULL DEFAULT 'SIN_PROPUESTA',
  comentario_admin VARCHAR(1000),
  evidencia_ejecucion VARCHAR(3000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (tecnico_id) REFERENCES usuarios(id),
  CONSTRAINT fk_ticket_estado_catalogo FOREIGN KEY (estado) REFERENCES ticket_soporte_estados(codigo),
  INDEX idx_ticket_solicitante (solicitante_id, created_at),
  INDEX idx_ticket_tecnico (tecnico_id, estado),
  INDEX idx_ticket_estado (estado, prioridad)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_soporte_historial (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id BIGINT NOT NULL,
  actor_id BIGINT NOT NULL,
  estado_anterior VARCHAR(30),
  estado_nuevo VARCHAR(30) NOT NULL,
  detalle VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets_soporte(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES usuarios(id),
  CONSTRAINT fk_ticket_historial_estado_anterior FOREIGN KEY (estado_anterior) REFERENCES ticket_soporte_estados(codigo),
  CONSTRAINT fk_ticket_historial_estado_nuevo FOREIGN KEY (estado_nuevo) REFERENCES ticket_soporte_estados(codigo),
  INDEX idx_ticket_historial (ticket_id, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  created_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_archivo_resuelto (resolved_at),
  INDEX idx_ticket_archivo_solicitante (solicitante_email)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT chk_sla_horas_resolucion CHECK (horas_resolucion >= horas_respuesta)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ticket_sla_politicas (prioridad, horas_respuesta, horas_resolucion, descripcion) VALUES
  ('BAJA', 48, 72, 'Incidencia de impacto bajo.'),
  ('MEDIA', 24, 48, 'Incidencia que requiere atención prioritaria.'),
  ('ALTA', 4, 8, 'Incidencia crítica para la operación.')
ON DUPLICATE KEY UPDATE
  horas_respuesta = VALUES(horas_respuesta),
  horas_resolucion = VALUES(horas_resolucion),
  descripcion = VALUES(descripcion),
  activo = VALUES(activo);
INSERT INTO roles (id, nombre, descripcion) VALUES
  (1, 'CANDIDATO', 'Postulante'),
  (2, 'RECLUTADOR', 'Gestión de reclutamiento'),
  (3, 'ADMIN', 'Administrador del sistema'),
  (4, 'JEFATURA_SOLICITANTE', 'Jefatura de área'),
  (5, 'ANALISTA_RRHH', 'Analista de selección'),
  (6, 'ENTREVISTADOR', 'Entrevistador técnico'),
  (7, 'TECNICO', 'Técnico de sistemas y soporte')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), descripcion=VALUES(descripcion);

-- Cuentas exclusivas para desarrollo y demostración. No ejecutar ni desplegar estas semillas en producción.
-- Las contraseñas se almacenan únicamente como BCrypt (strength 10).
INSERT INTO usuarios (email, password_hash, rol_id, estado, otp_exempt) VALUES
  ('Administrador@gmail.com', '$2a$10$HuJzOUJ3kOibr2tgqYehN.dPuyDNGx4v.GuCcgrvH4CouxVBcAdSe', 3, 'activo', TRUE),
  ('postulante1@gmail.com', '$2a$10$6fW8tUZt15hakazplDpGLer9I2H6NesWSZDFmFLvGa9qPwfxyJgn.', 1, 'activo', TRUE),
  ('reclutador1@gmail.com', '$2a$10$7E6hjIlblEpkBM/tXTyj4.jm2Ye87Kw9HRwB85j9GOCxVT6JsFauS', 2, 'activo', TRUE),
  ('tecnico1@gmail.com', '$2a$10$.Myz/0VVk33hHyRoPv.4jOfoT9Si3N3zpra2zkS7cEh1xYIU6tB0.', 7, 'activo', TRUE)
ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), rol_id=VALUES(rol_id), estado='activo', otp_exempt=TRUE;

INSERT INTO postulantes (usuario_id, nombres, apellidos, telefono)
SELECT id, 'Postulante', 'De Prueba', '+51999999999' FROM usuarios WHERE LOWER(email)='postulante1@gmail.com'
ON DUPLICATE KEY UPDATE nombres=VALUES(nombres), apellidos=VALUES(apellidos), telefono=VALUES(telefono);

INSERT INTO departamentos (id, nombre, descripcion, estado) VALUES
  (1, 'Ventas y Comercial', 'Campañas comerciales outbound e inbound de telecomunicaciones', 'activo'),
  (2, 'Atención al Cliente', 'Atención y soporte telefónico de usuarios', 'activo'),
  (3, 'Soporte Técnico e IT', 'Soporte de sistemas y conectividad para operaciones', 'activo'),
  (4, 'Recursos Humanos', 'Atracción, selección y bienestar del talento humano', 'activo'),
  (5, 'Operaciones Call Center', 'Gestión y supervisión del piso operativo', 'activo')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), descripcion=VALUES(descripcion), estado=VALUES(estado);

-- Datos de vacantes de demostración, ya corregidos y asociados al usuario reclutador por correo.
INSERT INTO vacantes (
  id, titulo, departamento_id, reclutador_id, num_vacantes, sueldo_min, sueldo_max,
  tipo_jornada, modalidad, sede, fecha_publicacion, fecha_limite_postulacion,
  descripcion, nivel_educativo, experiencia_minima, habilidades, estado
) VALUES
  (1, 'Asesor de Ventas Telefónicas Outbound', 1, (SELECT id FROM usuarios WHERE LOWER(email)='reclutador1@gmail.com'), 5, 1500.00, 2200.00, 'full_time', 'presencial', 'Lima, Perú', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY), 'Buscamos asesores comerciales talentosos para contactar clientes potenciales, ofrecer planes corporativos y de telecomunicaciones GTEL, y cumplir metas mensuales con excelentes comisiones y todos los beneficios de ley.', 'Secundaria completa', '6 meses - 1 año', 'Ventas, Negociación, Comunicación asertiva, CRM', 'activa'),
  (2, 'Soporte Técnico Nivel 1 - Mesa de Ayuda', 3, (SELECT id FROM usuarios WHERE LOWER(email)='reclutador1@gmail.com'), 2, 1800.00, 2500.00, 'full_time', 'hibrido', 'Lima, Perú', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY), 'Atención de tickets e incidencias técnicas de conectividad de fibra óptica, configuración de routers y asistencia técnica remota a usuarios corporativos de GTEL Telecomunicaciones.', 'Técnico', '1 - 2 años', 'Redes, Helpdesk, Routers, Windows, Linux, Diagnóstico de conectividad', 'activa'),
  (3, 'Supervisor de Operaciones Call Center', 5, (SELECT id FROM usuarios WHERE LOWER(email)='reclutador1@gmail.com'), 1, 2800.00, 3600.00, 'full_time', 'presencial', 'Arequipa, Perú', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'Liderar y supervisar equipos de agentes telefónicos, monitorear métricas operativas (AHT, FCR, CSAT, Adherencia) y asegurar el cumplimiento de KPIs de calidad y satisfacción del cliente.', 'Universitario', '2 - 5 años', 'Liderazgo, KPIs, Feedback constructivo, Coaching, Excel avanzado', 'activa'),
  (4, 'Asesor de Atención al Cliente y Reclamos', 2, (SELECT id FROM usuarios WHERE LOWER(email)='reclutador1@gmail.com'), 4, 1300.00, 1800.00, 'part_time', 'remoto', 'Remoto', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_DATE, INTERVAL 40 DAY), 'Brindar atención oportuna, profesional y empática a consultas y reclamos de usuarios de servicios GTEL, garantizando una alta satisfacción y pronta resolución de casos.', 'Secundaria completa', 'Sin experiencia', 'Atención al cliente, Empatía, Resolución de problemas, Redacción', 'activa'),
  (5, 'Especialista de Atracción del Talento', 4, (SELECT id FROM usuarios WHERE LOWER(email)='reclutador1@gmail.com'), 1, 2400.00, 3200.00, 'full_time', 'hibrido', 'Lima, Perú', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_DATE, INTERVAL 50 DAY), 'Gestión de procesos integrales de selección masiva y perfiles técnicos, entrevistas por competencias, aplicación de evaluaciones psicológicas y coordinación de inducción e ingreso.', 'Universitario', '1 - 2 años', 'Entrevistas por competencias, Reclutamiento masivo, ATS, Pruebas psicotécnicas', 'activa')
ON DUPLICATE KEY UPDATE
  titulo=VALUES(titulo), departamento_id=VALUES(departamento_id), num_vacantes=VALUES(num_vacantes),
  sueldo_min=VALUES(sueldo_min), sueldo_max=VALUES(sueldo_max), tipo_jornada=VALUES(tipo_jornada),
  modalidad=VALUES(modalidad), sede=VALUES(sede), descripcion=VALUES(descripcion),
  nivel_educativo=VALUES(nivel_educativo), experiencia_minima=VALUES(experiencia_minima),
  habilidades=VALUES(habilidades), estado=VALUES(estado);

CREATE TABLE IF NOT EXISTS db_migration_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  filename VARCHAR(255) NOT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(150) NOT NULL,
  result ENUM('APPLIED','BASELINE','FAILED') NOT NULL,
  notes VARCHAR(1000) NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

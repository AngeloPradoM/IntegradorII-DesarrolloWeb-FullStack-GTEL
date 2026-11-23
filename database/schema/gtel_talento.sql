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
  estado VARCHAR(20) NOT NULL DEFAULT 'activo') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  estado VARCHAR(20) DEFAULT 'pendiente',
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
  tipo_jornada VARCHAR(30) NOT NULL,
  modalidad VARCHAR(30) NOT NULL,
  sede VARCHAR(150),
  fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_limite_postulacion DATE,
  fecha_cierre DATE NULL,
  descripcion TEXT,
  nivel_educativo VARCHAR(80),
  experiencia_minima VARCHAR(80),
  habilidades VARCHAR(255),
  estado VARCHAR(20) NOT NULL DEFAULT 'activa',
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
  tipo VARCHAR(20) NOT NULL,
  ubicacion VARCHAR(255),
  estado VARCHAR(20) DEFAULT 'programada',
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evaluaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  tipo_evaluacion VARCHAR(100) NOT NULL,
  puntaje_total INT NOT NULL,
  tiempo_min INT,
  resultado VARCHAR(30) NOT NULL,
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

INSERT INTO solicitud_tipos
  (codigo,nombre,descripcion,modulo_codigo,activa,orden_visual)
VALUES
  ('SOL_RECUPERAR_ACCESO','Recuperar acceso','Ayuda para restablecer contraseña o recuperar el acceso','AUTH',TRUE,10),
  ('SOL_AYUDA_CUENTA','Ayuda con mi cuenta','Orientación sobre datos y configuración de cuenta','AUTH',TRUE,20),
  ('SOL_AYUDA_CV','Ayuda para cargar CV','Asistencia para adjuntar correctamente un currículum','CV',TRUE,30),
  ('SOL_FORMATO_CV','Formato de archivo CV','Consultas sobre formatos y requisitos del documento','CV',TRUE,40),
  ('SOL_PERFIL','Actualización de perfil','Orientación para modificar datos del usuario','PROFILE',TRUE,50),
  ('SOL_PUBLICAR_OFERTA','Ayuda con ofertas','Asistencia para crear o publicar una oferta laboral','JOBS',TRUE,60),
  ('SOL_EDITAR_OFERTA','Modificación de oferta','Orientación para actualizar una publicación','JOBS',TRUE,70),
  ('SOL_POSTULACIONES','Consulta de postulaciones','Ayuda para comprender estados y seguimiento','APPLICATIONS',TRUE,80),
  ('SOL_NOTIFICACIONES','Configuración de notificaciones','Asistencia para revisar notificaciones','NOTIFICATIONS',TRUE,90),
  ('SOL_USO_SISTEMA','Orientación general','Consultas sobre funcionalidades de GTEL Talento','GENERAL',TRUE,100),
  ('SOL_OTROS','Otra solicitud','Necesidad individual que requiere clasificación','OTHER',TRUE,110)
ON DUPLICATE KEY UPDATE
  nombre=VALUES(nombre),descripcion=VALUES(descripcion),modulo_codigo=VALUES(modulo_codigo),
  activa=VALUES(activa),orden_visual=VALUES(orden_visual);

CREATE TABLE IF NOT EXISTS tickets_soporte (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NULL UNIQUE,
  solicitante_id BIGINT NOT NULL,
  tecnico_id BIGINT NULL,
  area VARCHAR(80) NOT NULL DEFAULT 'Reclutamiento',
  titulo VARCHAR(120) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  subcategoria VARCHAR(100) NOT NULL,
  tipo_atencion ENUM('SOLICITUD','INCIDENTE') NOT NULL DEFAULT 'INCIDENTE',
  solicitud_tipo_codigo VARCHAR(64) NULL,
  incidente_tipo_codigo VARCHAR(64) NULL,
  canal_origen VARCHAR(30) NULL,
  prioridad ENUM('BAJA','MEDIA','ALTA') NOT NULL DEFAULT 'MEDIA',
  sla_politica_id BIGINT NULL,
  sla_respuesta_limite_at TIMESTAMP NULL,
  sla_resolucion_limite_at TIMESTAMP NULL,
  primera_atencion_at TIMESTAMP NULL,
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
  CONSTRAINT fk_ticket_solicitud_tipo FOREIGN KEY (solicitud_tipo_codigo) REFERENCES solicitud_tipos(codigo),
  CONSTRAINT fk_ticket_estado_catalogo FOREIGN KEY (estado) REFERENCES ticket_soporte_estados(codigo),
  CONSTRAINT chk_ticket_tipo_estructurado CHECK (
    (solicitud_tipo_codigo IS NULL AND incidente_tipo_codigo IS NULL)
    OR (tipo_atencion='SOLICITUD' AND solicitud_tipo_codigo IS NOT NULL AND incidente_tipo_codigo IS NULL)
    OR (tipo_atencion='INCIDENTE' AND solicitud_tipo_codigo IS NULL AND incidente_tipo_codigo IS NOT NULL)),
  CONSTRAINT chk_ticket_canal_origen CHECK (
    canal_origen IS NULL OR canal_origen IN ('WEB','MONITOREO','TECNICO','INTEGRACION')),
  INDEX idx_ticket_solicitante (solicitante_id, created_at),
  INDEX idx_ticket_tecnico (tecnico_id, estado),
  INDEX idx_ticket_estado (estado, prioridad),
  INDEX idx_ticket_solicitud_tipo (solicitud_tipo_codigo,created_at),
  INDEX idx_ticket_incidente_tipo (incidente_tipo_codigo,created_at),
  INDEX idx_ticket_canal_origen (canal_origen,created_at),
  INDEX idx_ticket_sla_respuesta (estado,sla_respuesta_limite_at),
  INDEX idx_ticket_sla_resolucion (estado,sla_resolucion_limite_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_creacion_idempotencia (
  solicitante_id BIGINT NOT NULL,
  clave_idempotencia VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  solicitud_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  ticket_id BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  PRIMARY KEY (solicitante_id,clave_idempotencia),
  UNIQUE KEY uk_ticket_idempotencia_ticket (ticket_id),
  INDEX idx_ticket_idempotencia_fecha (created_at),
  CONSTRAINT fk_ticket_idempotencia_solicitante FOREIGN KEY (solicitante_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_idempotencia_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets_soporte(id) ON DELETE CASCADE,
  CONSTRAINT chk_ticket_idempotencia_hash CHECK (
    solicitud_hash REGEXP '^[0-9a-f]{64}$'
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


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
  evaluacion_tecnica TEXT,
  plan_implementacion TEXT,
  plan_pruebas TEXT,
  plan_retorno TEXT,
  plan_comunicacion TEXT,
  probabilidad_riesgo ENUM('BAJA','MEDIA','ALTA'),
  impacto_riesgo ENUM('BAJO','MEDIO','ALTO'),
  nivel_riesgo ENUM('BAJO','MEDIO','ALTO'),
  comentario_cab TEXT,
  miembros_cab TEXT,
  evidencia_ejecucion TEXT,
  resultado ENUM('EXITOSO','PARCIAL','FALLIDO','REVERTIDO'),
  lecciones_aprendidas TEXT,
  comentario_validacion TEXT,
  approved_at TIMESTAMP NULL,
  implemented_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id),
  FOREIGN KEY (implementador_id) REFERENCES usuarios(id),
  INDEX idx_cambio_solicitante (solicitante_id, created_at),
  INDEX idx_cambio_responsable (responsable_id, estado),
  INDEX idx_cambio_estado (estado, prioridad),
  INDEX idx_cambio_tipo (tipo, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (solicitud_cambio_id) REFERENCES solicitudes_cambio(id) ON DELETE CASCADE,
  FOREIGN KEY (cargado_por) REFERENCES usuarios(id),
  UNIQUE KEY uk_cambio_documento_version (solicitud_cambio_id, version),
  INDEX idx_cambio_documento_sha (sha256)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitud_cambio_aprobaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  solicitud_cambio_id BIGINT NOT NULL,
  actor_id BIGINT NOT NULL,
  rol_aprobacion ENUM('AUTORIDAD_CAMBIO','CAB_TI','CAB_NEGOCIO','CAB_CALIDAD') NOT NULL,
  decision ENUM('APROBADO','RECHAZADO','AJUSTES') NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitud_cambio_id) REFERENCES solicitudes_cambio(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES usuarios(id),
  INDEX idx_cambio_aprobacion (solicitud_cambio_id, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitud_cambio_historial (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  solicitud_cambio_id BIGINT NOT NULL,
  actor_id BIGINT NOT NULL,
  estado_anterior VARCHAR(40),
  estado_nuevo VARCHAR(40) NOT NULL,
  detalle VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitud_cambio_id) REFERENCES solicitudes_cambio(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES usuarios(id),
  INDEX idx_cambio_historial (solicitud_cambio_id, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  tipo_atencion VARCHAR(20) NOT NULL DEFAULT 'INCIDENTE',
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

ALTER TABLE tickets_soporte
  ADD CONSTRAINT fk_ticket_sla_politica FOREIGN KEY (sla_politica_id)
    REFERENCES ticket_sla_politicas(id);

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


-- Configuración de clasificación, SLA y asignación de incidentes.
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
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre),modulo_codigo=VALUES(modulo_codigo),descripcion=VALUES(descripcion),activa=VALUES(activa);

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

INSERT INTO incidente_tipos_problema
  (codigo,categoria_codigo,nombre,descripcion,activa,orden_visual)
VALUES
  ('INC_ERROR_LOGIN','ACCESO_AUTENTICACION','Error técnico de inicio de sesión','Fallo técnico al iniciar sesión.',TRUE,10),
  ('INC_PERMISOS','ACCESO_AUTENTICACION','Permisos incorrectos','Permisos incorrectos que bloquean funciones.',TRUE,20),
  ('INC_CV_SUBIDA','CARGA_CV','Error al subir CV','Error técnico al subir un CV válido.',TRUE,10),
  ('INC_CV_DESCARGA','CARGA_CV','Error al descargar CV','Error técnico al descargar currículums.',TRUE,20),
  ('INC_DATOS_NO_GUARDAN','DATOS_MYSQL','Datos no guardados','La información no se guarda correctamente.',TRUE,10),
  ('INC_DATOS_NO_CARGAN','DATOS_MYSQL','Datos no disponibles','Los registros no aparecen o no pueden consultarse.',TRUE,20),
  ('INC_PLATAFORMA_CAIDA','DISPONIBILIDAD_PLATAFORMA','Plataforma inaccesible','La plataforma se encuentra completamente inaccesible.',TRUE,10),
  ('INC_MODULO_CAIDO','DISPONIBILIDAD_PLATAFORMA','Módulo fuera de servicio','Un módulo deja de responder.',TRUE,20),
  ('INC_FORMULARIO','INTERFAZ','Formulario inoperativo','Un formulario falla o bloquea una operación.',TRUE,10),
  ('INC_PANTALLA_BLANCA','INTERFAZ','Pantalla en blanco','Pantalla en blanco o error de renderizado.',TRUE,20),
  ('INC_NOTIFICACIONES','NOTIFICACIONES','Fallo de notificaciones','Fallo técnico en la entrega de notificaciones.',TRUE,10),
  ('INC_OFERTAS_GUARDADO','OFERTAS_LABORALES','Error al guardar ofertas','Error al guardar o publicar ofertas laborales.',TRUE,10),
  ('INC_POSTULACIONES','POSTULACIONES','Fallo de postulaciones','Fallo en el registro o consulta de postulaciones.',TRUE,10),
  ('INC_LENTITUD','RENDIMIENTO_SATURACION','Lentitud anormal','La plataforma responde con lentitud anormal.',TRUE,10),
  ('INC_TIEMPO_ESPERA','RENDIMIENTO_SATURACION','Tiempo de espera excedido','Una operación excede el tiempo de espera.',TRUE,20),
  ('INC_OTROS','OTROS','Otro problema técnico','Problema técnico que requiere revisión y clasificación.',TRUE,10)
ON DUPLICATE KEY UPDATE
  categoria_codigo=VALUES(categoria_codigo),nombre=VALUES(nombre),descripcion=VALUES(descripcion),
  activa=VALUES(activa),orden_visual=VALUES(orden_visual);

ALTER TABLE tickets_soporte
  ADD CONSTRAINT fk_ticket_incidente_tipo FOREIGN KEY (incidente_tipo_codigo)
    REFERENCES incidente_tipos_problema(codigo);

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
ON DUPLICATE KEY UPDATE minutos_primera_atencion=VALUES(minutos_primera_atencion),minutos_resolucion=VALUES(minutos_resolucion),descripcion=VALUES(descripcion),activa=VALUES(activa);

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

INSERT INTO incidente_asignacion_reglas(categoria_codigo,prioridad,tecnico_id,precedencia,activa)
SELECT c.codigo,NULL,u.id,100,TRUE FROM incidente_categorias c CROSS JOIN usuarios u
JOIN roles r ON r.id=u.rol_id
WHERE c.activa=TRUE AND u.estado='activo' AND r.nombre='TECNICO'
ON DUPLICATE KEY UPDATE activa=TRUE,updated_at=CURRENT_TIMESTAMP;

-- Gestión de incidentes de producción P1-P4.
CREATE TABLE IF NOT EXISTS incidentes_produccion (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(24) NULL UNIQUE,
  titulo VARCHAR(180) NOT NULL,
  componente VARCHAR(100) NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  modulo_codigo VARCHAR(50) NULL,
  categoria_sugerida VARCHAR(50) NULL,
  categoria_codigo VARCHAR(50) NULL,
  incidente_tipo_codigo VARCHAR(64) NULL,
  categoria_motivo VARCHAR(800) NULL,
  fuente ENUM('MANUAL','MONITOREO') NOT NULL DEFAULT 'MANUAL',
  canal_reporte ENUM('WEB','TELEFONO','MONITOREO','INTEGRACION') NOT NULL DEFAULT 'WEB',
  reportante_detalle VARCHAR(200) NULL,
  clave_deduplicacion CHAR(64) NULL UNIQUE,
  descripcion TEXT NOT NULL,
  alcance ENUM('LIMITADO','MULTIPLE','GENERAL') NOT NULL,
  impacto ENUM('BAJO','MEDIO','ALTO','CRITICO') NOT NULL,
  urgencia ENUM('BAJA','MEDIA','ALTA','INMEDIATA') NOT NULL,
  proceso_esencial BOOLEAN NOT NULL DEFAULT FALSE,
  alternativa_disponible BOOLEAN NOT NULL DEFAULT TRUE,
  servicio_bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
  prioridad_sugerida ENUM('P1','P2','P3','P4') NOT NULL,
  prioridad ENUM('P1','P2','P3','P4') NULL,
  estado ENUM('REGISTRADO','CLASIFICADO','ASIGNADO','EN_INVESTIGACION','EN_MITIGACION','SERVICIO_RECUPERADO','VERIFICADO','CERRADO') NOT NULL DEFAULT 'REGISTRADO',
  reportado_por BIGINT NULL,
  registrado_por BIGINT NULL,
  responsable_id BIGINT NULL,
  asignacion_fuente ENUM('PENDIENTE','MANUAL','AUTOMATICA') NOT NULL DEFAULT 'PENDIENTE',
  regla_asignacion_id BIGINT NULL,
  asignado_at TIMESTAMP NULL,
  verificado_por BIGINT NULL,
  detectado_at TIMESTAMP NOT NULL,
  iniciado_at TIMESTAMP NULL,
  primera_atencion_at TIMESTAMP NULL,
  recuperado_at TIMESTAMP NULL,
  verificado_at TIMESTAMP NULL,
  cerrado_at TIMESTAMP NULL,
  solucion_aplicada TEXT NULL,
  causa_raiz TEXT NULL,
  aprendizaje TEXT NULL,
  falla_repetida BOOLEAN NOT NULL DEFAULT FALSE,
  incidente_previo_id BIGINT NULL,
  sla_primera_atencion_at TIMESTAMP NULL,
  sla_resolucion_at TIMESTAMP NULL,
  sla_politica_id BIGINT NULL,
  version INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_incidente_reportante FOREIGN KEY (reportado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_registrador FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_responsable FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_verificador FOREIGN KEY (verificado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_categoria_sugerida FOREIGN KEY (categoria_sugerida) REFERENCES incidente_categorias(codigo),
  CONSTRAINT fk_incidente_categoria FOREIGN KEY (categoria_codigo) REFERENCES incidente_categorias(codigo),
  CONSTRAINT fk_incidente_tipo_categoria_compuesta FOREIGN KEY (incidente_tipo_codigo,categoria_codigo)
    REFERENCES incidente_tipos_problema(codigo,categoria_codigo),
  CONSTRAINT fk_incidente_sla_politica FOREIGN KEY (sla_politica_id) REFERENCES incidente_sla_politicas(id),
  CONSTRAINT fk_incidente_previo FOREIGN KEY (incidente_previo_id) REFERENCES incidentes_produccion(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_regla_asignacion FOREIGN KEY (regla_asignacion_id) REFERENCES incidente_asignacion_reglas(id) ON DELETE SET NULL,
  CONSTRAINT chk_incidente_tipo_requiere_categoria CHECK (
    incidente_tipo_codigo IS NULL OR categoria_codigo IS NOT NULL),
  INDEX idx_incidente_estado_prioridad (estado, prioridad),
  INDEX idx_incidente_responsable (responsable_id, estado),
  INDEX idx_incidente_componente (componente, detectado_at),
  INDEX idx_incidente_deteccion (detectado_at),
  INDEX idx_incidente_categoria_fecha (categoria_codigo,detectado_at),
  INDEX idx_incidente_tipo_fecha (incidente_tipo_codigo,detectado_at),
  INDEX idx_incidente_sla_politica (sla_politica_id,detectado_at),
  INDEX idx_incidente_sla_resolucion (estado,sla_resolucion_at),
  INDEX idx_incidente_repetido (falla_repetida,detectado_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  incidente_activo_id BIGINT GENERATED ALWAYS AS (CASE WHEN resuelto_at IS NULL THEN incidente_id ELSE NULL END) VIRTUAL,
  CONSTRAINT fk_incidente_escalamiento_incidente FOREIGN KEY (incidente_id) REFERENCES incidentes_produccion(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidente_escalamiento_actor FOREIGN KEY (escalado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_escalamiento_destino FOREIGN KEY (escalado_a) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_incidente_escalamiento_resolutor FOREIGN KEY (resuelto_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE KEY uk_incidente_escalamiento_activo (incidente_activo_id),
  INDEX idx_incidente_escalamiento_historial (incidente_id,created_at)
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

-- Vista operativa del Control de Incidentes. Los tiempos se calculan para evitar
-- duplicar valores que podrían quedar desactualizados en la tabla principal.
CREATE OR REPLACE VIEW vw_control_incidentes AS
SELECT
  i.codigo AS codigo,
  i.detectado_at AS fecha_hora_deteccion,
  COALESCE(rep.email,i.reportante_detalle,'Sin identificar') AS reportado_por,
  i.descripcion AS descripcion,
  c.nombre AS categoria,
  COALESCE(i.prioridad,i.prioridad_sugerida) AS prioridad,
  resp.email AS responsable,
  i.estado AS estado,
  i.primera_atencion_at AS fecha_hora_primera_atencion,
  i.cerrado_at AS fecha_hora_cierre,
  i.solucion_aplicada AS solucion_aplicada,
  CONCAT_WS('\n',i.causa_raiz,i.aprendizaje) AS causa_y_aprendizaje,
  i.falla_repetida AS falla_repetida,
  CASE WHEN i.primera_atencion_at IS NULL THEN NULL
       ELSE ROUND(TIMESTAMPDIFF(MINUTE,i.detectado_at,i.primera_atencion_at)/60,2)
  END AS horas_hasta_primera_atencion,
  CASE WHEN i.recuperado_at IS NULL THEN NULL
       ELSE ROUND(TIMESTAMPDIFF(MINUTE,i.detectado_at,i.recuperado_at)/60,2)
  END AS horas_hasta_solucion,
  CASE WHEN sla.minutos_resolucion IS NULL THEN NULL
       ELSE ROUND(sla.minutos_resolucion/60,2)
  END AS tiempo_limite_h,
  CASE WHEN i.sla_resolucion_at IS NULL THEN NULL
       WHEN COALESCE(i.recuperado_at,CURRENT_TIMESTAMP) > i.sla_resolucion_at THEN TRUE
       ELSE FALSE
  END AS vencido
FROM incidentes_produccion i
LEFT JOIN usuarios rep ON rep.id=i.reportado_por
LEFT JOIN usuarios resp ON resp.id=i.responsable_id
LEFT JOIN incidente_categorias c ON c.codigo=i.categoria_codigo
LEFT JOIN incidente_sla_politicas sla ON sla.id=i.sla_politica_id;

-- La instalación consolidada ya contiene las estructuras de 015 a 020.
INSERT INTO db_migration_history
  (version,filename,checksum_sha256,applied_by,result,notes)
VALUES
  ('015','015_production_incidents.sql','e2ad73827346f44b24b5e1bf114b9be386d4fbc7a717c632db4afa3d43337ae0',CURRENT_USER(),'BASELINE','Estructura incluida en el esquema consolidado'),
  ('016','016_incident_reporting.sql','6216076ccb96a52b8632641d6f6d746a25dcf0d0b2220d6ef0be8af68fc31b9b',CURRENT_USER(),'BASELINE','Campos de reporte incluidos en el esquema consolidado'),
  ('017','017_helpdesk_consolidation.sql','f8da9263d043bd551df82a859146b7f7c5fa22084d33b4a2309e0b280e4781ba',CURRENT_USER(),'BASELINE','Catálogos y referencias de Mesa de Ayuda incluidos'),
  ('018','018_helpdesk_catalog_seed.sql','8c8b601dd9bc18b723e506811728b059232fc5e3b57b2324e66c78ee38ca5d0',CURRENT_USER(),'BASELINE','Catálogos SOL e INC incluidos'),
  ('019','019_support_ticket_idempotency.sql','17f99aab91a3bc11bd7dd883c3a703ec403f044941da1b9505d524dc8e8c4207',CURRENT_USER(),'BASELINE','Idempotencia de tickets incluida'),
  ('020','020_incident_control_consolidation.sql','679a6a4e9e3c6a56fe918f2112149a6d36aa9d1829847bd9cbefabf7ee79a761',CURRENT_USER(),'BASELINE','Control operativo de incidentes y vista de seguimiento incluidos')
ON DUPLICATE KEY UPDATE
  filename=VALUES(filename),checksum_sha256=VALUES(checksum_sha256),notes=VALUES(notes);

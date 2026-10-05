-- Aplicar manualmente despues de 003. No elimina ni modifica registros existentes.
USE gtel_talento;
CREATE TABLE IF NOT EXISTS perfiles_contacto (
 usuario_id BIGINT PRIMARY KEY,
 nombres VARCHAR(100) NOT NULL, apellidos VARCHAR(100) NOT NULL,
 telefono VARCHAR(16), ubicacion VARCHAR(100), localidad VARCHAR(100),
 correo_contacto VARCHAR(150), foto MEDIUMTEXT,
 educacion TEXT, experiencia TEXT,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS documentos_postulacion (
 postulacion_id BIGINT PRIMARY KEY,
 nombre VARCHAR(150) NOT NULL, contenido LONGBLOB NOT NULL,
 datos_personales JSON NOT NULL,
 FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS recuperacion_acceso (
 usuario_id BIGINT PRIMARY KEY, token_hash VARCHAR(64) NOT NULL UNIQUE,
 expira BIGINT NOT NULL, solicitado BIGINT NOT NULL,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS notificaciones (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 usuario_id BIGINT NOT NULL, titulo VARCHAR(150) NOT NULL, mensaje VARCHAR(1000) NOT NULL,
 fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP, leida BOOLEAN NOT NULL DEFAULT FALSE,
 enviada BOOLEAN NOT NULL DEFAULT FALSE, intentos INT NOT NULL DEFAULT 0,
 proximo_intento BIGINT NOT NULL DEFAULT 0,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
-- Los duplicados se evitan en el servicio bloqueando la fila del postulante.
-- No se elimina informacion previa para imponer una restriccion UNIQUE retroactiva.

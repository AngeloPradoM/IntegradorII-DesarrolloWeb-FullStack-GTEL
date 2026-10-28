USE gtel_talento;
SET SESSION lock_wait_timeout=15;
-- Ejecutar una vez. El nombre del rol, no el numero, controla los permisos.
INSERT INTO roles (id,nombre,descripcion)
SELECT 3,'ADMIN','Administrador del sistema'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id=3 OR nombre='ADMIN');
INSERT INTO roles (nombre,descripcion)
SELECT 'ADMIN','Administrador del sistema' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre='ADMIN');
ALTER TABLE usuarios
  ADD COLUMN auth_version INT NOT NULL DEFAULT 0,
  ADD COLUMN otp_exempt BOOLEAN NOT NULL DEFAULT FALSE;

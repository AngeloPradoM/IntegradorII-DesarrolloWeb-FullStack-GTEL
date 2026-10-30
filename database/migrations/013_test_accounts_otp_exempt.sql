-- Cuentas locales de prueba: autentican sin desafío OTP.
-- Ejecutar despues de 012_postulante_consentimiento.sql.
USE gtel_talento;

UPDATE usuarios
SET otp_exempt = TRUE,
    estado = 'activo'
WHERE LOWER(email) IN (
  'administrador@gmail.com',
  'postulante1@gmail.com',
  'reclutador1@gmail.com',
  'tecnico1@gmail.com'
);

INSERT INTO postulantes (usuario_id, nombres, apellidos, telefono)
SELECT id, 'Postulante', 'De Prueba Uno', '+51999999999'
FROM usuarios
WHERE LOWER(email) = 'postulante1@gmail.com'
  AND rol_id = (SELECT id FROM roles WHERE nombre = 'CANDIDATO')
ON DUPLICATE KEY UPDATE
  nombres = VALUES(nombres),
  apellidos = VALUES(apellidos),
  telefono = VALUES(telefono);

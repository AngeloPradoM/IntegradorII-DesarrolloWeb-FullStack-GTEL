-- =============================================================================
-- MIGRACIÓN 004: Semillero de Postulaciones y Métricas Reales para Dashboard ATS
-- Destino: gtel_talento y gtel_talento_mejoras
-- =============================================================================

-- 1. Usuarios Candidatos
INSERT INTO usuarios (id, email, password_hash, auth_version, otp_exempt, rol_id, estado, created_at) VALUES
  (101, 'ana.torres@gmail.com', '$2a$10$05zqAdPTwtKhlABiE4IJW.wcMlKwX9jXULfTbaRx.Bx5DwGMaspBe', 0, 0, 1, 'activo', NOW()),
  (102, 'carlos.mendoza@gmail.com', '$2a$10$05zqAdPTwtKhlABiE4IJW.wcMlKwX9jXULfTbaRx.Bx5DwGMaspBe', 0, 0, 1, 'activo', NOW()),
  (103, 'lucia.ramos@gmail.com', '$2a$10$05zqAdPTwtKhlABiE4IJW.wcMlKwX9jXULfTbaRx.Bx5DwGMaspBe', 0, 0, 1, 'activo', NOW()),
  (104, 'diego.salazar@gmail.com', '$2a$10$05zqAdPTwtKhlABiE4IJW.wcMlKwX9jXULfTbaRx.Bx5DwGMaspBe', 0, 0, 1, 'activo', NOW()),
  (105, 'valeria.ponce@gmail.com', '$2a$10$05zqAdPTwtKhlABiE4IJW.wcMlKwX9jXULfTbaRx.Bx5DwGMaspBe', 0, 0, 1, 'activo', NOW()),
  (106, 'jose.castillo@gmail.com', '$2a$10$05zqAdPTwtKhlABiE4IJW.wcMlKwX9jXULfTbaRx.Bx5DwGMaspBe', 0, 0, 1, 'activo', NOW())
ON DUPLICATE KEY UPDATE estado = 'activo';

-- 2. Postulantes (Perfiles)
INSERT INTO postulantes (id, usuario_id, nombres, apellidos, dni, telefono, fecha_nacimiento, cv_url, experiencia, educacion, estado) VALUES
  (101, 101, 'Ana', 'Torres Vega', '72145896', '+51987432110', '1998-05-14', '/api/recruiter/cv/ana_torres_cv.pdf', '2 años en ventas telefónicas y telemarketing', 'Técnico en Administración', 'activo'),
  (102, 102, 'Carlos', 'Mendoza Quispe', '74859632', '+51966521880', '1997-11-20', '/api/recruiter/cv/carlos_mendoza_cv.pdf', '3 años en mesa de ayuda TI y conectividad', 'Técnico en Computación e Informática', 'activo'),
  (103, 103, 'Lucía', 'Ramos Flores', '71258963', '+51955398214', '1994-03-08', '/api/recruiter/cv/lucia_ramos_cv.pdf', '5 años liderando operaciones de contact center', 'Licenciatura en Administración de Empresas', 'activo'),
  (104, 104, 'Diego', 'Salazar Paredes', '76321458', '+51944126390', '2001-08-22', '/api/recruiter/cv/diego_salazar_cv.pdf', '1 año en atención al cliente presencial', 'Secundaria completa', 'activo'),
  (105, 105, 'Valeria', 'Ponce Córdova', '75896321', '+51933764205', '1996-09-17', '/api/recruiter/cv/valeria_ponce_cv.pdf', '3 años en selección de talento y evaluación', 'Licenciatura en Psicología Organizacional', 'activo'),
  (106, 106, 'José Luis', 'Castillo Rivas', '70451236', '+51922456789', '1999-12-03', '/api/recruiter/cv/jose_castillo_cv.pdf', '6 meses en ventas de campo', 'Secundaria completa', 'activo')
ON DUPLICATE KEY UPDATE nombres = VALUES(nombres), apellidos = VALUES(apellidos), dni = VALUES(dni), telefono = VALUES(telefono);

-- 3. Postulaciones Reales
INSERT INTO postulaciones (id, codigo, postulante_id, vacante_id, puntaje_general, estado, fecha_postulacion, cv_url, cv_nombre) VALUES
  (101, 'GTEL-2026-1001', 101, 1, 85, 'en_revision', DATE_SUB(NOW(), INTERVAL 4 DAY), '/api/recruiter/cv/ana_torres_cv.pdf', 'CV_Ana_Torres_2026.pdf'),
  (102, 'GTEL-2026-1002', 102, 2, 92, 'entrevista', DATE_SUB(NOW(), INTERVAL 5 DAY), '/api/recruiter/cv/carlos_mendoza_cv.pdf', 'CV_Carlos_Mendoza_TI.pdf'),
  (103, 'GTEL-2026-1003', 103, 3, 96, 'aprobada', DATE_SUB(NOW(), INTERVAL 12 DAY), '/api/recruiter/cv/lucia_ramos_cv.pdf', 'CV_Lucia_Ramos_Ops.pdf'),
  (104, 'GTEL-2026-1004', 104, 4, 74, 'recibida', DATE_SUB(NOW(), INTERVAL 1 DAY), '/api/recruiter/cv/diego_salazar_cv.pdf', 'CV_Diego_Salazar.pdf'),
  (105, 'GTEL-2026-1005', 105, 5, 88, 'entrevista', DATE_SUB(NOW(), INTERVAL 3 DAY), '/api/recruiter/cv/valeria_ponce_cv.pdf', 'CV_Valeria_Ponce_Talento.pdf'),
  (106, 'GTEL-2026-1006', 106, 1, 52, 'rechazada', DATE_SUB(NOW(), INTERVAL 7 DAY), '/api/recruiter/cv/jose_castillo_cv.pdf', 'CV_Jose_Castillo.pdf')
ON DUPLICATE KEY UPDATE estado = VALUES(estado), puntaje_general = VALUES(puntaje_general);

-- 4. Historial de Auditoría (postulacion_timeline)
INSERT INTO postulacion_timeline (postulacion_id, estado_anterior, estado_nuevo, comentario, fecha_cambio, usuario_id) VALUES
  (101, NULL, 'recibida', 'Postulación registrada en el portal', DATE_SUB(NOW(), INTERVAL 4 DAY), 101),
  (101, 'recibida', 'en_revision', 'Perfil cumple con experiencia mínima requerida para outbound', DATE_SUB(NOW(), INTERVAL 2 DAY), 3),

  (102, NULL, 'recibida', 'Postulación registrada en el portal', DATE_SUB(NOW(), INTERVAL 5 DAY), 102),
  (102, 'recibida', 'en_revision', 'Revisión técnica de certificaciones de redes', DATE_SUB(NOW(), INTERVAL 3 DAY), 3),
  (102, 'en_revision', 'entrevista', 'Pase a entrevista técnica con soporte N2', DATE_SUB(NOW(), INTERVAL 1 DAY), 3),

  (103, NULL, 'recibida', 'Postulación registrada en el portal', DATE_SUB(NOW(), INTERVAL 12 DAY), 103),
  (103, 'recibida', 'en_revision', 'Experiencia destacada en supervisión de call center', DATE_SUB(NOW(), INTERVAL 10 DAY), 3),
  (103, 'en_revision', 'entrevista', 'Entrevista por competencias con Gerencia de Operaciones', DATE_SUB(NOW(), INTERVAL 7 DAY), 3),
  (103, 'entrevista', 'aprobada', 'Candidata seleccionada para la vacante. Oferta económica aceptada.', DATE_SUB(NOW(), INTERVAL 2 DAY), 3),

  (104, NULL, 'recibida', 'Postulación recibida pendiente de revisión inicial', DATE_SUB(NOW(), INTERVAL 1 DAY), 104),

  (105, NULL, 'recibida', 'Postulación registrada en el portal', DATE_SUB(NOW(), INTERVAL 3 DAY), 105),
  (105, 'recibida', 'en_revision', 'Validación de títulos y experiencia en reclutamiento masivo', DATE_SUB(NOW(), INTERVAL 2 DAY), 3),
  (105, 'en_revision', 'entrevista', 'Agendada entrevista técnica presencial', DATE_SUB(NOW(), INTERVAL 1 DAY), 3),

  (106, NULL, 'recibida', 'Postulación recibida en el portal', DATE_SUB(NOW(), INTERVAL 7 DAY), 106),
  (106, 'recibida', 'rechazada', 'No cumple con la disponibilidad horaria completa exigida para el turno de tarde', DATE_SUB(NOW(), INTERVAL 5 DAY), 3)
ON DUPLICATE KEY UPDATE comentario = VALUES(comentario);

-- 5. Agenda de Entrevistas (entrevistas)
INSERT INTO entrevistas (id, postulacion_id, fecha, hora, duracion_min, tipo, ubicacion, estado) VALUES
  (101, 102, CURDATE(), '15:30:00', 45, 'video', 'https://teams.microsoft.com/l/meetup-join/gtel-interview-carlos-mendoza', 'programada'),
  (102, 105, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 30, 'presencial', 'Sede Central GTEL - Av. Primavera 120, Sala 3B', 'programada'),
  (103, 103, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:00:00', 45, 'video', 'https://meet.google.com/gtel-interview-lucia-ramos', 'realizada')
ON DUPLICATE KEY UPDATE estado = VALUES(estado), fecha = VALUES(fecha), hora = VALUES(hora);

-- 6. Evaluaciones Técnicas (evaluaciones y detalles)
INSERT INTO evaluaciones (id, postulacion_id, tipo_evaluacion, puntaje_total, tiempo_min, resultado, fecha_evaluacion, usuario_id) VALUES
  (101, 102, 'Soporte y Diagnóstico N1', 92, 25, 'aprobado', CURDATE(), 3),
  (102, 103, 'Liderazgo y Habilidades Operativas', 96, 30, 'aprobado', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 3)
ON DUPLICATE KEY UPDATE puntaje_total = VALUES(puntaje_total), resultado = VALUES(resultado);

INSERT INTO evaluacion_detalle (id, evaluacion_id, criterio, puntaje, porcentaje, observacion) VALUES
  (101, 101, 'Diagnóstico de Redes y Conectividad', 95, 40, 'Excelente comprensión de protocolos TCP/IP y resolución de fallas'),
  (102, 101, 'Atención y Comunicación con Usuario', 90, 30, 'Trato cordial y vocabulario técnico accesible'),
  (103, 101, 'Gestión y Seguimiento de Tickets Helpdesk', 90, 30, 'Conocimiento de buenas prácticas ITIL y SLA'),
  (104, 102, 'Gestión de KPIs y Adherencia Operativa', 98, 50, 'Dominio sobresaliente de métricas de call center (AHT, FCR, CSAT)'),
  (105, 102, 'Liderazgo y Coaching de Equipos', 94, 50, 'Capacidad demostrada para motivar y dar feedback oportuno')
ON DUPLICATE KEY UPDATE puntaje = VALUES(puntaje), observacion = VALUES(observacion);

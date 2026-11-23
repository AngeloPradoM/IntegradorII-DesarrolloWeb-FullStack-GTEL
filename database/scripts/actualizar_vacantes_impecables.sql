-- =============================================================================
-- GTEL TALENTO - ACTUALIZACIÓN IMPECABLE DE VACANTES Y DEPARTAMENTOS
-- Restaura textos completos, descripciones, requisitos, sedes y tildes en UTF-8
-- =============================================================================

USE gtel_talento;
SET NAMES utf8mb4;

-- Departamentos limpios
INSERT INTO departamentos (id, nombre, descripcion, estado) VALUES
  (1, 'Ventas y Comercial', 'Campañas comerciales outbound e inbound de telecomunicaciones', 'activo'),
  (2, 'Atención al Cliente', 'Atención y soporte telefónico de usuarios', 'activo'),
  (3, 'Soporte Técnico e IT', 'Soporte de sistemas y conectividad para operaciones', 'activo'),
  (4, 'Recursos Humanos', 'Atracción, selección y bienestar del talento humano', 'activo'),
  (5, 'Operaciones Call Center', 'Gestión y supervisión de piso operativo', 'activo')
ON DUPLICATE KEY UPDATE 
  nombre=VALUES(nombre), 
  descripcion=VALUES(descripcion), 
  estado=VALUES(estado);

-- Vacantes limpias con tildes y descripciones completas
INSERT INTO vacantes (
  id, titulo, departamento_id, reclutador_id, num_vacantes, sueldo_min, sueldo_max,
  tipo_jornada, modalidad, sede, fecha_publicacion, fecha_limite_postulacion,
  descripcion, nivel_educativo, experiencia_minima, habilidades, estado
) VALUES
(
  1,
  'Asesor de Ventas Telefónicas Outbound',
  1,
  3,
  5,
  1500.00,
  2200.00,
  'full_time',
  'presencial',
  'Lima, Perú',
  NOW(),
  DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY),
  'Buscamos asesores comerciales talentosos para contactar clientes potenciales, ofrecer planes corporativos y de telecomunicaciones GTEL, y cumplir metas mensuales con excelentes comisiones y todos los beneficios de ley.',
  'Secundaria completa',
  '6 meses - 1 año',
  'Ventas, Negociación, Comunicación asertiva, CRM',
  'activa'
),
(
  2,
  'Soporte Técnico Nivel 1 - Mesa de Ayuda',
  3,
  3,
  2,
  1800.00,
  2500.00,
  'full_time',
  'hibrido',
  'Lima, Perú',
  NOW(),
  DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY),
  'Atención de tickets e incidencias técnicas de conectividad de fibra óptica, configuración de routers y asistencia técnica remota a usuarios corporativos de GTEL Telecomunicaciones.',
  'Técnico',
  '1 - 2 años',
  'Redes, Helpdesk, Routers, Windows, Linux, Diagnóstico de conectividad',
  'activa'
),
(
  3,
  'Supervisor de Operaciones Call Center',
  5,
  3,
  1,
  2800.00,
  3600.00,
  'full_time',
  'presencial',
  'Arequipa, Perú',
  NOW(),
  DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY),
  'Liderar y supervisar equipos de agentes telefónicos, monitorear métricas operativas (AHT, FCR, CSAT, Adherencia) y asegurar el cumplimiento de KPIs de calidad y satisfacción del cliente.',
  'Universitario',
  '2 - 5 años',
  'Liderazgo, KPIs, Feedback constructivo, Coaching, Excel avanzado',
  'activa'
),
(
  4,
  'Asesor de Atención al Cliente y Reclamos',
  2,
  3,
  4,
  1300.00,
  1800.00,
  'part_time',
  'remoto',
  'Remoto',
  NOW(),
  DATE_ADD(CURRENT_DATE, INTERVAL 40 DAY),
  'Brindar atención oportuna, profesional y empática a consultas y reclamos de usuarios de servicios GTEL, garantizando una alta satisfacción y pronta resolución de casos.',
  'Secundaria completa',
  'Sin experiencia',
  'Atención al cliente, Empatía, Resolución de problemas, Redacción',
  'activa'
),
(
  5,
  'Especialista de Atracción del Talento',
  4,
  3,
  1,
  2400.00,
  3200.00,
  'full_time',
  'hibrido',
  'Lima, Perú',
  NOW(),
  DATE_ADD(CURRENT_DATE, INTERVAL 50 DAY),
  'Gestión de procesos integrales de selección masiva y perfiles técnicos, entrevistas por competencias, aplicación de evaluaciones psicológicas y coordinación de inducción e ingreso.',
  'Universitario',
  '1 - 2 años',
  'Entrevistas por competencias, Reclutamiento masivo, ATS, Pruebas psicotécnicas',
  'activa'
)
ON DUPLICATE KEY UPDATE
  titulo = VALUES(titulo),
  departamento_id = VALUES(departamento_id),
  num_vacantes = VALUES(num_vacantes),
  sueldo_min = VALUES(sueldo_min),
  sueldo_max = VALUES(sueldo_max),
  tipo_jornada = VALUES(tipo_jornada),
  modalidad = VALUES(modalidad),
  sede = VALUES(sede),
  descripcion = VALUES(descripcion),
  nivel_educativo = VALUES(nivel_educativo),
  experiencia_minima = VALUES(experiencia_minima),
  habilidades = VALUES(habilidades),
  estado = VALUES(estado);

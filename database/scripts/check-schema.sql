-- Read-only verification for a freshly created gtel_talento database.
SELECT DATABASE() AS selected_database;

SELECT 'core tables (25)' AS requirement, COUNT(*) AS present
FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_type='BASE TABLE' AND table_name IN (
  'roles','departamentos','usuarios','postulantes','requerimientos_personal','vacantes',
  'postulaciones','postulacion_timeline','entrevistas','evaluaciones','evaluacion_detalle',
  'auditoria','auth_email_challenges','perfiles_contacto','documentos_postulacion',
  'recuperacion_acceso','notificaciones','vacantes_papelera','solicitudes_arco',
  'ticket_soporte_estados','tickets_soporte','ticket_soporte_historial',
  'tickets_soporte_archivo','ticket_sla_politicas','db_migration_history'
)
UNION ALL
SELECT 'tables using utf8mb4', COUNT(*) FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_type='BASE TABLE' AND table_collation LIKE 'utf8mb4%'
UNION ALL
SELECT 'required roles (7)', COUNT(*) FROM roles WHERE (id,nombre) IN (
  (1,'CANDIDATO'),(2,'RECLUTADOR'),(3,'ADMIN'),(4,'JEFATURA_SOLICITANTE'),
  (5,'ANALISTA_RRHH'),(6,'ENTREVISTADOR'),(7,'TECNICO')
)
UNION ALL
SELECT 'test accounts active and OTP-exempt (4)', COUNT(*) FROM usuarios
WHERE LOWER(email) IN ('administrador@gmail.com','postulante1@gmail.com','reclutador1@gmail.com','tecnico1@gmail.com')
  AND estado='activo' AND otp_exempt=TRUE
UNION ALL
SELECT 'candidate profile and consent defaults', COUNT(*) FROM postulantes p
JOIN usuarios u ON u.id=p.usuario_id
WHERE LOWER(u.email)='postulante1@gmail.com' AND p.consentimiento_datos=TRUE
  AND p.fecha_consentimiento IS NOT NULL AND p.consentimiento_version='v1.0-ley29733'
UNION ALL
SELECT 'canonical document column', COUNT(*) FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='postulantes' AND column_name='numero_documento'
UNION ALL
SELECT 'forbidden duplicate dni column (expect 0)', COUNT(*) FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='postulantes' AND column_name='dni'
UNION ALL
SELECT 'postulaciones CV columns', COUNT(*) FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='postulaciones' AND column_name IN ('cv_url','cv_nombre')
UNION ALL
SELECT 'privacy audit entity columns (8)', COUNT(*) FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='solicitudes_arco'
  AND column_name IN ('usuario_id','email_solicitante','tipo_solicitud','estado','detalle','ip_origen','user_agent','created_at')
UNION ALL
SELECT 'ticket states (6)', COUNT(*) FROM ticket_soporte_estados
UNION ALL
SELECT 'SLA policies (3 active)', COUNT(*) FROM ticket_sla_politicas WHERE activo=TRUE
UNION ALL
SELECT 'ticket state foreign key', COUNT(*) FROM information_schema.key_column_usage
WHERE table_schema=DATABASE() AND table_name='tickets_soporte' AND column_name='estado'
  AND referenced_table_name='ticket_soporte_estados' AND referenced_column_name='codigo'
UNION ALL
SELECT 'ticket history state foreign keys (2)', COUNT(*) FROM information_schema.key_column_usage
WHERE table_schema=DATABASE() AND table_name='ticket_soporte_historial'
  AND column_name IN ('estado_anterior','estado_nuevo')
  AND referenced_table_name='ticket_soporte_estados' AND referenced_column_name='codigo'
UNION ALL
SELECT 'migration history table', COUNT(*) FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_name='db_migration_history';

-- Read-only check: a result of 0 indicates a missing object. Run in the target database.
SELECT DATABASE() AS selected_database;
SELECT '001 phone' AS requirement, COUNT(*) AS present FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='postulantes' AND column_name='telefono'
UNION ALL SELECT '002 OTP',COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='auth_email_challenges'
UNION ALL SELECT '003 auth version',COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='usuarios' AND column_name='auth_version'
UNION ALL SELECT '004 documents',COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='documentos_postulacion'
UNION ALL SELECT '005 trash',COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='vacantes_papelera'
UNION ALL SELECT '006 historical audit',COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='auditoria' AND column_name='actor_email_historico'
UNION ALL SELECT '007 support tickets',COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='tickets_soporte'
UNION ALL SELECT '008 notification compatibility',COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='notificaciones' AND column_name='tipo'
UNION ALL SELECT '009 support states',COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='ticket_soporte_estados'
UNION ALL SELECT '009 support archive',COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='tickets_soporte_archivo'
UNION ALL SELECT '011 SLA policies',COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='ticket_sla_politicas'
UNION ALL SELECT '000 migration history',COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='db_migration_history';
-- This checks representative schema objects, not the full successful execution of each migration.

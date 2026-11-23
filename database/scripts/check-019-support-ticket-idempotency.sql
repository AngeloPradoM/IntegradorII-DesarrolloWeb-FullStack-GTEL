-- Verificación de solo lectura posterior a 019.
USE gtel_talento;

SELECT 'idempotency table (1)' AS requirement,COUNT(*) AS present
FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_name='ticket_creacion_idempotencia'
UNION ALL
SELECT 'idempotency columns (6)',COUNT(*)
FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='ticket_creacion_idempotencia'
  AND column_name IN ('solicitante_id','clave_idempotencia','solicitud_hash','ticket_id','created_at','completed_at')
UNION ALL
SELECT 'idempotency foreign keys (2)',COUNT(*)
FROM information_schema.referential_constraints
WHERE constraint_schema=DATABASE() AND table_name='ticket_creacion_idempotencia'
UNION ALL
SELECT 'idempotency primary key (1)',COUNT(*)
FROM information_schema.table_constraints
WHERE constraint_schema=DATABASE() AND table_name='ticket_creacion_idempotencia'
  AND constraint_type='PRIMARY KEY';

SELECT COUNT(*) AS orphan_idempotency_rows
FROM ticket_creacion_idempotencia i
LEFT JOIN usuarios u ON u.id=i.solicitante_id
LEFT JOIN tickets_soporte t ON t.id=i.ticket_id
WHERE u.id IS NULL OR (i.ticket_id IS NOT NULL AND t.id IS NULL);

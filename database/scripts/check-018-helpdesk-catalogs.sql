-- Verificación de solo lectura para 018_helpdesk_catalog_seed.sql.
USE gtel_talento;

SELECT 'request catalog (11)' AS requirement,COUNT(*) AS present
FROM solicitud_tipos
WHERE codigo IN ('SOL_RECUPERAR_ACCESO','SOL_AYUDA_CUENTA','SOL_AYUDA_CV','SOL_FORMATO_CV',
  'SOL_PERFIL','SOL_PUBLICAR_OFERTA','SOL_EDITAR_OFERTA','SOL_POSTULACIONES',
  'SOL_NOTIFICACIONES','SOL_USO_SISTEMA','SOL_OTROS')
UNION ALL
SELECT 'incident problem catalog (16)',COUNT(*)
FROM incidente_tipos_problema
WHERE codigo IN ('INC_ERROR_LOGIN','INC_PERMISOS','INC_CV_SUBIDA','INC_CV_DESCARGA',
  'INC_DATOS_NO_GUARDAN','INC_DATOS_NO_CARGAN','INC_PLATAFORMA_CAIDA','INC_MODULO_CAIDO',
  'INC_FORMULARIO','INC_PANTALLA_BLANCA','INC_NOTIFICACIONES','INC_OFERTAS_GUARDADO',
  'INC_POSTULACIONES','INC_LENTITUD','INC_TIEMPO_ESPERA','INC_OTROS')
UNION ALL
SELECT 'invalid incident category references (expect 0)',COUNT(*)
FROM incidente_tipos_problema p
LEFT JOIN incidente_categorias c ON c.codigo=p.categoria_codigo
WHERE c.codigo IS NULL
UNION ALL
SELECT 'duplicate request visual order (expect 0)',COUNT(*) FROM (
  SELECT orden_visual FROM solicitud_tipos GROUP BY orden_visual HAVING COUNT(*)>1
) duplicates
UNION ALL
SELECT 'duplicate incident visual order per category (expect 0)',COUNT(*) FROM (
  SELECT categoria_codigo,orden_visual FROM incidente_tipos_problema
  GROUP BY categoria_codigo,orden_visual HAVING COUNT(*)>1
) duplicates;

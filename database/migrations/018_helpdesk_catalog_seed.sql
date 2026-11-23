-- Carga idempotente de catálogos de Mesa de Ayuda.
-- Requiere 017. INSERT IGNORE conserva cualquier configuración administrativa existente.

INSERT IGNORE INTO solicitud_tipos
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
  ('SOL_OTROS','Otra solicitud','Necesidad individual que requiere clasificación','OTHER',TRUE,110);

INSERT IGNORE INTO incidente_tipos_problema
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
  ('INC_OTROS','OTROS','Otro problema técnico','Problema técnico que requiere revisión y clasificación.',TRUE,10);

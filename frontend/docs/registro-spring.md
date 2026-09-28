# Registro conectado a Spring

El registro llama siempre a POST /api/auth/register, aunque VITE_DATA_MODE conserve el modo demo para otros módulos. Usa VITE_API_URL o http://localhost:8080 por defecto. No cambiar globalmente el modo de datos para probar esta entrega.

Solo se envían nombres, apellidos, email, password y telefono. El teléfono peruano nacional se normaliza con +51; un número internacional válido conserva su prefijo. Ubicación no se persiste por este contrato. No se guarda una copia de la cuenta en localStorage ni se adjuntan tokens demo.

Solo se muestra éxito si Spring devuelve 201 y un usuario con ID y correo coincidente. Se presentan errores de validación, duplicados, conexión y respuesta inesperada. Si hay timeout puede haberse completado la operación: comprobar antes de repetirla.

El login sigue en su estado previo. Una cuenta guardada en MySQL aún no puede acceder mediante el login demo. Las cuentas previamente creadas como demo tampoco se migran automáticamente. OTP, roles, perfil y postulaciones no se modificaron.

Validación del 27/09/2026:

- Lint y build correctos (permanece la advertencia de tamaño del bundle).
- Nueve pruebas automatizadas aprobadas; la nueva prueba de registro simula HTTP sin acceder al almacenamiento demo.
- Prueba real contra Spring en 8080: HTTP 201, usuario y postulante encontrados en MySQL, rol CANDIDATO y contraseña BCrypt. Se eliminó exclusivamente la cuenta temporal creada por esta comprobación.
- No se ejecutó una prueba visual completa de navegador en esta entrega.

## Inicio de sesion conectado
El registro y el inicio de sesion usan Spring independientemente de VITE_DATA_MODE.
POST /api/auth/login envia email, password y rol. La respuesta autenticada entrega
el JWT y el perfil; no se solicita OTP en este paso. GET /api/auth/me valida la
sesion guardada al recargar. Las sesiones demo anteriores se descartan.
Cerrar sesion elimina el token del navegador; el backend no revoca el JWT.
El reclutador debe existir en MySQL con el rol RECLUTADOR.
El resto de los modulos conserva su configuracion anterior; esto no conecta sus
operaciones con MySQL. La edicion de perfiles reales queda bloqueada hasta contar
con su endpoint, para evitar modificar usuarios demo por coincidencias de ID.
Prueba manual: registrar, ingresar, recargar, cerrar sesion e intentar una clave
incorrecta. La verificacion por correo sigue pendiente.
El script browser-flows.mjs corresponde al flujo demo anterior con OTP y requiere
adaptacion antes de reutilizarlo con cuentas reales; no se ejecuto en este paso.

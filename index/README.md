# Pruebas locales de registro y verificación por correo

## Panel administrador

Desde la carpeta `index`, ejecuta `npm.cmd run admin:setup -- tu-correo@gmail.com`. Se guarda ADMIN_EMAIL y el hash ADMIN_PASSWORD_HASH en `.env`; la contraseña nueva se muestra una sola vez en esa terminal. No utiliza tu contraseña de Gmail ni envía correos. Volver a ejecutar el comando sustituye el administrador anterior. Reinicia el servidor para aplicar el cambio.

Abre `/admin.html` en el mismo servidor (por ejemplo `http://localhost:3002/admin.html`). Accede con ese correo y la contraseña generada. La sesión admin es independiente de las sesiones de candidatos, dura una hora y se elimina al reiniciar el servidor. No requiere tablas adicionales.

El panel permite buscar, paginar, eliminar usuarios con confirmación de su correo y restablecer contraseñas. El borrado es permanente en MySQL; las claves foráneas del esquema original eliminan sesiones y códigos asociados. No se borran usuarios durante las pruebas automatizadas, que usan un repositorio aislado.

Las contraseñas originales no se muestran ni se recuperan. Restablecer genera una nueva contraseña aleatoria que se muestra una sola vez y solo guarda su hash. Esta contraseña no tiene vencimiento ni cambio obligatorio en este prototipo. Se revocan las sesiones y códigos pendientes, pero sigue siendo obligatorio el OTP por correo al iniciar sesión. El listado no expone hashes de contraseñas.

El servidor Node sirve esta carpeta y la API en el mismo origen. No abrir con Live Server ni con `file://`. El frontend React del proyecto no se modifica.

## Configuración

Requiere Node 22 o superior, MySQL y las tres tablas creadas anteriormente: `usuarios`, `verificaciones_email` y `sesiones` en `gtel_auth_pruebas`. No se borran ni recrean tablas automáticamente.

1. Abre `index/.env` y configura DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD. La contraseña vacía solo sirve si tu instalación local de MySQL lo permite.
2. Configura SMTP_USER con la cuenta Gmail remitente y SMTP_PASSWORD con una **contraseña de aplicación de Google**, no la contraseña habitual. Para generar una, habilita la verificación en dos pasos en esa cuenta. Si tu cuenta no permite contraseñas de aplicación, necesitarás OAuth2 u otro proveedor; este prototipo utiliza contraseña de aplicación.
3. OTP_SECRET ya se genera localmente. No la compartas ni la cambies mientras pruebes códigos pendientes. `.env` está excluido de Git y no se sirve por HTTP.
4. Mantén APP_ORIGIN=http://localhost:3001 y PORT=3001. El servidor escucha solo en 127.0.0.1 para pruebas locales.

En una terminal:

```powershell
cd index
npm.cmd install
npm.cmd run check
npm.cmd start
```

`check` consulta las tablas y verifica las credenciales SMTP sin enviar correos. Abre **http://localhost:3001**. La dirección de registro debe ser correcta: `gmail.com`, no `gmial.com`.

Referencia: https://nodemailer.com/guides/using-gmail

## Flujo real

- Registro: inserta el usuario con bcrypt; envía código para confirmar el correo. Todavía no crea sesión.
- Confirmación: marca el correo como verificado y vuelve al login.
- Login: comprueba contraseña y envía un nuevo código. No entrega sesión hasta validarlo.
- Código correcto: crea sesión de ocho horas y cookie HttpOnly/SameSite=Strict.
- Cierre de sesión: revoca el registro de sesión y elimina la cookie.
- Si SMTP falla después del registro, la cuenta permanece creada. Inicia sesión para reintentar; no vuelvas a registrarla.
- Código: seis dígitos, cinco minutos, un solo uso, cinco intentos. Reenvío desde 60 segundos, invalida el anterior. Un máximo de diez envíos por usuario y hora y límites adicionales por IP.
- Solo se muestra “enviado” si Gmail aceptó el mensaje; esto no garantiza entrega en bandeja principal. Revisa Spam.

## Límites de este alcance

La edición del perfil sigue siendo una vista previa local, señalada como tal; no actualiza MySQL, contraseñas ni el correo de acceso. El registro guarda los campos que existen en la tabla usuarios: nombres, apellidos, email, teléfono y contraseña protegida. Ubicación y foto todavía no se persisten en MySQL. No existen roles de reclutador en este esquema.

El servidor no tiene recuperación de contraseña. La opción “recordar sesión” no se utiliza: la sesión dura ocho horas. Los límites por IP viven en memoria y se reinician con el servidor; para producción deben persistirse y compartirse, además de configurar HTTPS, infraestructura y un servicio de envío adecuado.

Las comprobaciones automatizadas no sustituyen la prueba real con tu MySQL y tu Gmail. No se inventan credenciales ni se envían códigos simulados.

## API

POST `/api/auth/register`, `/api/auth/login`, `/api/auth/verify`, `/api/auth/resend`, `/api/auth/logout`; GET `/api/me`.

Todas las mutaciones requieren Origin igual a APP_ORIGIN. Las consultas utilizan parámetros; OTP se guarda como HMAC-SHA256 con secreto del servidor; token de sesión aleatorio se guarda como SHA-256. Los secretos y códigos no se registran en consola ni se devuelven en respuestas.

Ejecutar pruebas: `npm.cmd test`.

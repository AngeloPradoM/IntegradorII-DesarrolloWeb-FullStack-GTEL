# Verificación de candidatos por WhatsApp

El flujo usa `AuthController`, `CandidatoService`, `OtpSessionService` y
`WhatsAppService` existentes. React llama exclusivamente a Spring Boot en el
puerto configurado por `VITE_API_URL` (8080 por defecto). `index/` es un laboratorio
independiente y no debe usarse como backend oficial de autenticación.

## Preparación

1. Revisar el esquema antes de aplicar `migrations/001_postulante_telefono.sql`.
   El SQL compartido el 27/09/2026 ya contiene `postulantes.telefono`: no ejecutar
   ese ADD COLUMN en esa base porque fallará por columna duplicada. El script es
   histórico, solo para bases sin la columna. Revisar también el tamaño: el SQL
   compartido define VARCHAR(15), mientras Java contempla 16 caracteres para
   admitir el signo + y hasta 15 dígitos. La tabla `otp_challenges` no aparece en
   ese SQL; debe resolverse antes de arrancar con validación JPA. Ver README.
   Se mantiene `JPA_DDL_AUTO=validate`. El campo admite NULL para no inventar
   teléfonos de cuentas existentes; esas cuentas no pueden iniciar el flujo
   hasta registrar un teléfono válido por un procedimiento confiable.
2. Definir las variables de `backend/.env.example` en el proceso Spring Boot.
   Spring Boot no carga automáticamente los archivos `.env`. `OTP_HASH_SECRET`
   necesita al menos 32 caracteres aleatorios y `JWT_SECRET` debe ser un secreto
   fuerte independiente. No publicar ninguno.
3. Configurar el token, Phone Number ID (no WABA ID), versión de Graph API,
   nombre e idioma exactos de una plantilla AUTHENTICATION aprobada con botón
   para copiar código. La petición incluye el mismo OTP en body y botón URL,
   índice 0. La URL se restringe a `https://graph.facebook.com`.
4. Usar `VITE_API_URL=http://localhost:8080` en React. Nunca definir el token de
   Meta en variables `VITE_*`.

El nombre y el idioma de la plantilla deben configurarse explícitamente; no se
supone que una plantilla de ejemplo esté aprobada. Los valores de Phone
Number ID y token reales, sus permisos, vigencia y pertenencia a la misma cuenta
solo se pueden comprobar con acceso a Meta. `WHATSAPP_TEST_RECIPIENT` ya no se
consulta en Spring. En una cuenta de prueba de Meta, los números de los candidatos
también deben estar autorizados por Meta como destinatarios de prueba.

## Contrato y límites

- Registro: `POST /api/auth/register` exige `telefono` en formato internacional
  `+` y 8–15 dígitos. Se guarda en `postulantes.telefono` en la misma transacción.
- Login: valida credenciales, recupera ese teléfono y devuelve `OTP_REQUIRED`,
  `sessionId`, `maskedPhone`, `expiresInSeconds` y `resendAfterSeconds`; no JWT ni OTP.
- Verificación: `POST /api/auth/verify-otp` con `{sessionId, otp}`. Solo un código
  correcto y vigente produce un JWT. El código se consume una sola vez.
- Reenvío: `POST /api/auth/resend-otp` con `{sessionId}`. Cambia el código, invalida
  el anterior y usa el teléfono guardado en la sesión, sin aceptar otro destinatario.
- Valores por defecto: 5 minutos por código, 5 intentos totales por sesión,
  30 segundos entre envíos y 3 reenvíos. Reenviar no restablece intentos.
- Solo una sesión activa por cuenta: repetir login no reinicia los límites.
  La sesión completa dura como máximo 20 minutos con los valores por defecto.
  Si se pierde la sesión al recargar/cerrar la pantalla, hay que esperar su caducidad.
- Fallos de envío invalidan la sesión y devuelven un error genérico, sin datos de Meta.

Se conserva el almacenamiento en memoria de `OtpSessionService`: guarda HMAC-SHA256
por sesión, nunca el OTP en texto plano. Un reinicio pierde las sesiones; para
varias instancias será necesario un almacén compartido con consumo atómico. Las
clases JPA OTP preexistentes no se usan en este flujo y se conservan sin crear otro
sistema. Su tabla preexistente sigue siendo requerida por la validación JPA.

La implementación no entrega JWT a reclutadores sin perfil y teléfono de candidato:
no existe un teléfono de reclutador en el modelo actual. Se devuelve un error explícito.

## Validación

Ejecutar `mvn test` en backend y `npm run build` en frontend. Las pruebas usan
destinatarios y credenciales ficticios y transporte HTTP simulado; no envían mensajes.
La entrega real requiere credenciales válidas, plantilla aprobada, la base migrada
y un candidato con WhatsApp. No se ha validado contra una cuenta real de Meta.

Referencia de Meta:
https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/authentication-templates/copy-code-button-authentication-templates

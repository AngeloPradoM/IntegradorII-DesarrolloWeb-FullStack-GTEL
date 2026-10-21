# Autenticacion Spring

Registro, login, verificacion y reenvio usan Spring independientemente del modo demo de otros modulos. El login unico envia correo y password, y recibe el rol de MySQL. Normalmente devuelve un desafio sin JWT; verify-otp entrega perfil y JWT tras un codigo valido. Las tres cuentas de prueba habilitadas por el servidor reciben JWT con authMethod=TEST_PASSWORD y otpSkipped=true. AuthContext acepta estos contratos y recupera sesiones mediante /me.

El panel `/admin` requiere ADMIN y usa la API real `/api/admin/users`. ADMIN puede abrir las vistas de candidato y reclutador. Las cuentas normales mantienen OTP; ocultar una ruta en React no reemplaza los permisos de Spring Security.

Ver [README general](../../README.md) para configuracion, migracion SQL, limites y comandos de pruebas. Las cuentas nuevas requieren acceso a su buzon para iniciar sesion.

## Prueba de navegador OTP

`tests/email-otp-browser.mjs` comprueba el modal real con respuestas HTTP simuladas. Requiere Vite en http://127.0.0.1:5173 y Chrome con perfil temporal y depuracion remota en 9238. Ejecutar con `node tests/email-otp-browser.mjs` desde frontend. No usa cuentas reales ni envia correos.

Verifica correo oculto, codigo incorrecto sin sesion, reenvio, redireccion tras verificar, recuperacion mediante /me, logout y cierre del modal. La recepcion y entrada de un codigo real requieren una prueba manual adicional.

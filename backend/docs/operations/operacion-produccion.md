# Operación y validación externa

## Configuración

Activar SPRING_PROFILES_ACTIVE=prod en el servidor. No copiar config/local.properties de desarrollo ni usar las claves del README como secretos de producción. El archivo application-prod.properties requiere:

| Variable | Uso |
|---|---|
| DB_URL | JDBC MySQL de la base del entorno |
| DB_USERNAME / DB_PASSWORD | Cuenta MySQL propia del servicio |
| JWT_SECRET / OTP_HASH_SECRET | Secretos distintos, aleatorios y privados; conservar los requisitos de longitud del servicio |
| MAIL_USERNAME / MAIL_PASSWORD | Remitente y contraseña de aplicación SMTP |
| FRONTEND_URL | Origen HTTPS exacto; varios orígenes separados por comas, sin comodines |
| RECOVERY_URL | URL HTTPS completa de /recuperar-acceso |

Este perfil deshabilita el acceso especial de pruebas, habilita notificaciones por correo y valida entidades JPA. La validación JPA no cubre todas las tablas consultadas por JDBC: revisar también las migraciones. El perfil no instala certificados ni un proxy. Configurar TLS en el punto de entrada, restringir el puerto interno del backend y comprobar CORS desde el navegador del dominio autorizado y desde uno no autorizado. No configurar variables de entorno que reactiven app.security.test-access-enabled en producción.

## Migraciones

En una base nueva usar database/schema/gtel_talento.sql. En una existente comparar sus objetos y aplicar únicamente las migraciones que faltan, en orden, con respaldo previo. No ejecutar indiscriminadamente todos los ALTER TABLE sobre una BD ya actualizada.

En DBeaver seleccionar gtel_talento y ejecutar database/check-schema.sql. Un cero señala ausencia del objeto comprobado; un uno no certifica todo el archivo de migración. Revisar columnas, restricciones e índices con SHOW CREATE TABLE para las tablas de cada migración.

Mantener por entorno una bitácora con archivo, SHA-256, fecha, responsable, respaldo y resultado de validación. Obtener las huellas desde backend:

~~~powershell
Get-ChildItem database/migrations/*.sql | Get-FileHash -Algorithm SHA256
~~~

No se incorporó ejecución automática ni una tabla de historial. Ese control sigue siendo un procedimiento operativo del equipo.

## Pruebas antes de integrar

Desde backend:

~~~powershell
mvn.cmd test
~~~

Desde frontend:

~~~powershell
npm.cmd ci
npm.cmd run lint
node --test tests/*.test.mjs
npm.cmd run build
~~~

Si Windows impide reemplazar dist dentro de Program Files, compilar en una carpeta nueva del usuario sin borrar la salida anterior:

~~~powershell
$qaBuild = Join-Path $env:TEMP ('gtel-build-' + [guid]::NewGuid().ToString())
npm.cmd run build -- --outDir $qaBuild
~~~

Para trabajo habitual conviene una carpeta de desarrollo escribible por el usuario. El informe documenta que el bloqueo local fue de permisos, no de compilación.

El workflow .github/workflows/quality.yml ejecuta además ModuleWiringTest con un MySQL desechable. Para reproducirlo localmente, preparar una base VACÍA con nombre gtel_qa_ seguido del identificador del ensayo; configurar QA_MYSQL_URL, QA_MYSQL_USER y QA_MYSQL_PASSWORD en la terminal y ejecutar mvn.cmd -Dtest=ModuleWiringTest test. Nunca señalar gtel_talento: el test crea tablas y datos sintéticos y rechaza nombres fuera de gtel_qa_* o una BD no vacía. Eliminar las variables QA al terminar. No usar credenciales reales en workflows.

La prueba de navegador frontend/tests/workflow-browser.mjs requiere una vista local en 127.0.0.1:5181 y Chrome con perfil temporal y depuración local en 9241. Intercepta HTTP; no sustituye un recorrido conectado al backend real.

## Respaldo y restauración

Instalar las herramientas cliente de MySQL y configurar un login-path sin incluir la contraseña en argumentos o archivos del repositorio:

~~~powershell
mysql_config_editor set --login-path=gtel --host=localhost --user=USUARIO_RESPALDO --password
~~~

Crear previamente una carpeta privada fuera del repositorio. Desde backend:

~~~powershell
.\scripts\backup.ps1 -LoginPath gtel -Database gtel_talento -Destination 'D:\Respaldos\GTEL\gtel-2026-10-08.sql'
~~~

El script no sobrescribe archivos. Si falla, la salida puede estar incompleta y no debe considerarse respaldo. Guardar el SHA-256 junto con la fecha y custodiar las copias: contienen datos personales y documentos. No ejecutarlo durante cambios de esquema. Definir frecuencia, retención, cifrado y acceso según el entorno.

Para comprobar una copia, crear una base independiente, por ejemplo gtel_restore_check. En el cliente MySQL, conectado a esa base de prueba, ejecutar SOURCE D:/Respaldos/GTEL/gtel-2026-10-08.sql; o abrir el SQL en DBeaver con esa base seleccionada. El respaldo generado no contiene CREATE DATABASE/USE de la base original. Revisar conteos, relaciones y lectura de documentos, y hacer un recorrido de la aplicación apuntando SOLO a la base restaurada. No declarar el respaldo validado antes de esta comprobación.

## Comprobación funcional real

1. Registro y login de una cuenta controlada, validación de OTP y recuperación por correo.
2. Editar perfil; cerrar sesión; entrar nuevamente y verificar datos persistidos.
3. Postular con PDF; cambiar después el contacto del perfil y verificar que la postulación conserva el contacto enviado.
4. Reclutador: filtrar directorio, abrir detalle, descargar CV y usar únicamente transiciones permitidas.
5. Cerrar sesión y confirmar que el JWT anterior devuelve 401; comprobar denegación por rol y por propietario del CV.
6. Admin: revisar auditoría y permisos con datos de prueba independientes.

Conservar fecha, versión desplegada, entorno, resultado y evidencia sin contraseñas, tokens, códigos ni datos personales innecesarios.

Actualización: backup.ps1 conserva fallos como .partial y genera un manifiesto SHA-256. Verificar con scripts/verify-backup.ps1; no sustituye restaurar. Consultar [Entrega 2](../deliveries/entrega-2-proteccion-recuperacion.md).

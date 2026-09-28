# Backend GTEL — Paso 1 aislado

## Objetivo actual

Comprobar primero la comunicación React ↔ Spring Boot con registro y login por correo/contraseña. El JWT se emite después de validar la contraseña y el rol real de MySQL. La verificación en dos pasos se incorporará después de validar este recorrido básico.

Registro y login de React ya están conectados con Spring y MySQL. AuthContext consulta /api/auth/me para recuperar la sesión. Los módulos de negocio mantienen su configuración anterior; la verificación por correo sigue pendiente. Para instalar desde cero, seguir el [README principal](../README.md), que incluye DBeaver y el [SQL inicial](database/gtel_talento.sql).

## Separación física del paso 2

Todo el material OTP se conserva en [step2-reference](step2-reference/README.md), fuera de src/main y src/test activos. Maven no compila esa carpeta, Spring no crea sus servicios y JPA no escanea OtpChallenge. El paso 1 no exige tabla otp_challenges, OTP_HASH_SECRET ni credenciales de WhatsApp/Gmail.

Se trasladaron servicios OTP/WhatsApp, entidad y repositorio OTP, enum, pruebas OTP y configuración específica. El controlador OTP anterior se conserva como referencia. No es otro servidor ejecutable ni un perfil listo para activar. Su reintegración debe hacerse en el paso 2 con pruebas y contratos explícitos, especialmente si se cambia a Gmail.

No se borraron tablas, usuarios ni secretos de index. No se ejecutaron migraciones. El esquema del paso 1 utiliza usuarios, roles y postulantes; el SQL suministrado incluye esas tablas. La documentación del diagnóstico previo se conserva como **histórica**, no como descripción del flujo activo: [docs/diagnostico-previo.md](docs/diagnostico-previo.md).

## Contratos activos del paso 1

| Endpoint | Entrada | Resultado |
| --- | --- | --- |
| POST /api/auth/register | nombres, apellidos, email, password, telefono internacional | 201 con message y user; crea candidato, sin correo ni sesión automática |
| POST /api/auth/login | email, password, rol | authenticated=true, requiresOtp=false, token, id de usuario, nombres, apellidos, email, telefono, rol y role |
| GET /api/auth/me | Authorization: Bearer token | Perfil actual consultado en MySQL, authenticated=true; sin nuevo token |
| POST /api/auth/logout | Sin cuerpo requerido | Mensaje para eliminar token local; revocación pendiente |
| GET /api/health | — | Salud básica |

Los endpoints resend-otp y verify-otp ya no tienen controladores activos; no deben llamarse en el paso 1. El backend no devuelve verified=true ni simula una confirmación de correo.

El campo role se mantiene como alias de rol para el contrato de React. El registro sigue devolviendo ID de postulante; el login/me devuelve ID de usuario. No intercambiarlos.

## Candidato y reclutador

- Registro público: candidato. El servicio asigna el rol desde MySQL y no permite elevar permisos enviando un rol de registro.
- Login: candidato y reclutador con cuentas existentes y contraseña válida. Ya no exige que un reclutador tenga perfil/teléfono de candidato.
- Reclutador: como no existe un perfil de reclutador en el esquema, el nombre visible permanece como correo y el teléfono es null; no inventar datos.
- Sigue pendiente confirmar si se habilitará un alta pública exclusiva para pruebas. Hasta entonces no se crean reclutadores desde el registro público. No se construyó un administrador nuevo para ello.
- /api/recruiter/** continúa protegido con RECLUTADOR en Spring Security.

## Secuencia histórica del paso 1 (autenticación ya acoplada)

1. Revisar esquema y variables de conexión sin reutilizar la BD de Node. Confirmar roles CANDIDATO y RECLUTADOR.
2. Ejecutar pruebas de backend sin mensajería ni MySQL real; luego autorizar prueba contra la BD de desarrollo.
3. Probar registro de candidato, duplicado, contraseña incorrecta, login candidato/reclutador y me mediante HTTP.
4. Con autorización, adaptar services/api y useOtpLogin para aceptar requiresOtp=false con token y perfil; conservar rechazo de respuestas inválidas. No marcar correo como confirmado.
5. Restaurar sesión en AuthContext consultando me; ProtectedRoute espera esa comprobación. Centralizar errores y logout.
6. Separar autenticación real de módulos aún demo antes de activar VITE_DATA_MODE=api, que actualmente deshabilita operaciones de perfil/postulación sin backend.
7. Verificar navegación y permisos desde React. El login por sí solo no integra edición de perfil, ofertas, postulaciones ni escrituras del reclutador.
8. Terminar y aprobar el paso 1 antes de reincorporar verificación por correo.

## Paso 2, posterior

Reutilizar la referencia OTP en Spring, añadir EmailService con credenciales privadas, distinguir confirmar correo de verificar login, persistir desafíos con consumo atómico, agregar fecha de confirmación por migración revisada y emitir JWT solo tras OTP válido. Adaptar React al nuevo contrato después de las pruebas del servidor. No copiar Node ni secretos de index.

## Ejecución

Java 21 y Maven. Spring no carga .env automáticamente; configurar variables de .env.example en el proceso/IDE.

```powershell
cd backend
mvn.cmd clean test
# Solo con base y variables configuradas:
mvn.cmd spring-boot:run
```

Si Maven usa una caché inaccesible:

```powershell
mvn.cmd "-Dmaven.repo.local=$env:USERPROFILE\.m2\repository" clean test
```

Después del traslado hacer clean para eliminar clases OTP antiguas de target. No cambiar ddl-auto a create/update ni borrar tablas para arrancar. La migración 001 de teléfono es histórica: el SQL proporcionado ya tiene la columna.

## Límites conocidos que no resuelve este aislamiento

JWT no se revoca al hacer logout. La política debe definirse aparte. usuarios.estado aún no está mapeado en la autenticación. Las reglas CORS están duplicadas y deben unificarse antes del acoplamiento final. Teléfono SQL VARCHAR(15) frente a longitud Java 16 requiere revisión. La recuperación por me comprueba existencia y rol actual, pero el filtro JWT sigue utilizando sus claims para el resto de endpoints.

Los tests unitarios no prueban el arranque contra una instancia MySQL ni el recorrido React. No se envían correos o WhatsApp durante esta etapa.

## Resultado de validación del aislamiento

`mvn clean test` con Java 21: BUILD SUCCESS, 9 pruebas activas aprobadas (3 de candidato y 6 del controlador del paso 1), sin fallos ni errores. Los tests del paso 2 están archivados y no cuentan como ejecutados. Sin modificaciones a frontend/index, sin SQL ni mensajería real. Sigue el aviso de carga dinámica Mockito/Byte Buddy, no bloqueante en esta ejecución.

### Configuración local de arranque

Para este equipo se creó `config/local.properties` con una clave JWT aleatoria persistente; application.properties la importa de forma opcional desde el directorio de trabajo backend. El archivo está excluido de Git. No contiene credenciales copiadas del laboratorio. Arrancar desde backend; en otros equipos crear su propia configuración privada o definir JWT_SECRET en el entorno. La clave JWT es para firmar sesiones, no activa OTP ni confirmación por correo.

Comprobación: ya hay un backend atendiendo en 8080; GET /api/health respondió 200 con status UP. El segundo arranque no pudo ocupar ese puerto. La configuración local nueva deberá comprobarse al reiniciar la instancia existente. Registro y login usan el backend independientemente del modo demo de los otros módulos. El flujo completo de navegador debe comprobarse con las cuentas locales de cada instalación.

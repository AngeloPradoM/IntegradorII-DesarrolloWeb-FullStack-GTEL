# GTEL Talento — backend oficial

## Alcance actual

Java 21, Spring Boot, Spring Security, JPA, JWT y MySQL. React/Vite permanece en `frontend/`; `index/` es un laboratorio, no un segundo backend oficial.

Etapa: limpieza conservadora y documentación para trabajar de manera aislada. No se modificaron frontend/index, contratos HTTP, autenticación ni configuración privada; no se ejecutó SQL. La fase 2 de alineación de contratos sigue pendiente de implementación. Cada etapa siguiente requiere informe y autorización antes de continuar.

## Limpieza realizada — 27/09/2026

- Eliminado `src/main/java/pe/com/gtel/talento/security/SecurityConfig.java`: solo contenía package y comentarios, sin clase. La configuración activa continúa en `config/SecurityConfig.java`.
- Eliminado `service/OtpSessionResult.java`: record sin referencias en producción ni pruebas; el servicio utiliza sus records internos. No se eliminó el servicio OTP.
- Añadido `.gitignore`: compilados, caché local opcional, logs y archivos privados; se conserva `.env.example`.
- Corregida documentación obsoleta de `otp-demo` y ejecución incondicional de la migración de teléfono.
- Conservados OtpChallenge, OtpChallengeRepository y OtpSessionStatus: JPA descubre la entidad y se reutilizará para persistencia; retirarla sí cambiaría el arranque.
- Conservados controladores, servicios, DTO activos, pruebas y WhatsApp. No eliminar módulos por estar incompletos.

`target/` es generado por Maven; clean lo elimina y test regenera los resultados. No debe versionarse.

## Revisión del SQL suministrado

Se revisó el texto compartido, no la instancia MySQL:

1. El prefijo `usuariosCREATE DATABASE` es inválido; debe comenzar en `CREATE DATABASE`.
2. La base oficial es `gtel_talento`; no es compatible automáticamente con `gtel_auth_pruebas` de Node.
3. Hay 12 tablas: roles, departamentos, usuarios, postulantes, requerimientos_personal, vacantes, postulaciones, postulacion_timeline, entrevistas, evaluaciones, evaluacion_detalle y auditoria.
4. Los CREATE TABLE no son repetibles sobre tablas existentes. No borrar tablas para repetir el script.
5. `postulantes.telefono` ya existe como VARCHAR(15). **No ejecutar la migración histórica 001 en ese esquema**: intenta añadir la misma columna. Java contempla 16 caracteres (+ y hasta 15 dígitos). Preparar posteriormente una ampliación revisada; el teléfono peruano cabe en ambas longitudes.
6. Falta `otp_challenges` en el SQL. La entidad existe y la validación JPA requiere su tabla aunque el servicio OTP use memoria. Preparar la migración correspondiente; no cambiar a ddl-auto=create/update para ocultar el problema.
7. El script no inserta roles. Confirmar CANDIDATO (necesario para registrar) y RECLUTADOR. No agregar ADMIN silenciosamente.
8. `usuarios.estado` existe en SQL pero no está mapeado ni comprobado por la autenticación actual. La desactivación necesita implementación posterior.
9. No hay fecha de confirmación del correo; añadirla en la fase correspondiente mediante migración.
10. Nombres y apellidos pertenecen a postulantes. IDs de usuario y postulante son diferentes.
11. No hay UNIQUE(postulante_id, vacante_id): definir duplicados y revisar datos antes de agregar esa restricción.
12. Las claves foráneas no tienen ON DELETE CASCADE. No copiar el borrado administrativo de Node: diseñar desactivación o borrado con dependencias y auditoría.
13. Ubicación, localidad, correo alternativo y foto del frontend no están modelados en las entidades actuales. No afirmar que persisten.

No se aplica ninguna de estas correcciones a la base en esta etapa.

## Contratos actuales

| Endpoint | Entrada | Respuesta/efecto |
| --- | --- | --- |
| POST /api/auth/register | nombres, apellidos, email, password, telefono | 201, message y user; BCrypt; usuario y postulante; sin confirmación de correo |
| POST /api/auth/login | email, password, rol | requiresOtp, sessionId, status, maskedPhone, expiresInSeconds, resendAfterSeconds, message; sin JWT |
| POST /api/auth/resend-otp | sessionId | Nuevo código al teléfono vinculado, invalida el anterior |
| POST /api/auth/verify-otp | sessionId, otp | verified, status, message, token, email, role; JWT solo después de OTP válido |
| GET /api/auth/me | Authorization Bearer | authenticated, email, role; no recupera perfil completo de MySQL |
| POST /api/auth/logout | Authorization opcional | message; no revoca JWT |
| GET /api/health | Sin autenticación | Salud básica |

El rol se recupera de MySQL y se compara con el solicitado; la selección visual no concede permisos. El flujo OTP actual solo completa el acceso de candidatos. Spring protege /api/recruiter/** con RECLUTADOR.

OTP utiliza HMAC-SHA256 en memoria con expiración, límites y consumo. Un reinicio pierde desafíos activos. Ver [OTP_SETUP.md](OTP_SETUP.md). No registrar códigos, tokens, contraseñas ni hashes.

## Referencias de React, sin modificarlo

- services/api.js: registro/login/OTP ya tienen rama API. No activar VITE_DATA_MODE=api globalmente: perfil y postulaciones siguen pendientes.
- RegistrationModal ya añade +51. Centralizar normalización idempotente, no duplicar prefijo.
- useOtpLogin espera requiresOtp/sessionId y adapta role a rol. Conservar compatibilidad.
- AuthContext, ProfileMenu y perfil necesitan ID estable, nombres, apellidos, correo y teléfono; verify-otp/me no entregan el perfil completo.
- Registro devuelve ID del postulante; AuthResponse usa ID de usuario. Distinguirlos explícitamente.
- AuthContext restaura desde almacenamiento sin comprobar me; ProtectedRoute debe esperar esa validación en su fase.
- Reclutador/candidates puede devolver filas repetidas por postulante al unir postulaciones. React rechaza IDs duplicados: definir qué representa cada fila antes de conectar.
- Entrevistas devuelve día/mes/año; el adaptador React necesita date ISO. Evaluaciones no devuelve candidateId. Alinear después de autenticación.
- Dashboard devuelve IDs de postulación en recientes; React enlaza a perfiles. Separar ambos identificadores.

## Secuencia de trabajo aislado

| Etapa | Trabajo | Criterio para avanzar |
| --- | --- | --- |
| 1. Esquema | Revisar columnas y preparar migraciones sin ejecución automática | Roles, teléfono y tabla OTP acordados |
| 2. Contratos | Completar verify-otp/me, IDs, teléfono y errores | Tests de servicios/DTO/controlador sin tocar React |
| 3. Auth existente | Registro, credenciales, OTP y JWT con proveedor simulado | Sin JWT antes de OTP, límites probados |
| 4. Sesión | Definir me y política logout/JWT | Contrato para futura restauración de AuthContext |
| 5. Gmail | Servicio SMTP Spring con variables privadas; conservar WhatsApp mientras se use | Pruebas simuladas; envío real solo autorizado |
| 6. OTP | EMAIL_CONFIRMATION y LOGIN_VERIFICATION; destinatario | Códigos separados por propósito |
| 7. Persistencia | Reutilizar JPA OTP, migraciones y transacciones | Consumo atómico, reenvío, reinicio y concurrencia |
| 8. Confirmación | Fecha de correo verificado, confirmar/reenviar | Confirmar no inicia sesión automáticamente |
| 9. Login correo | Credenciales, correo confirmado, OTP y JWT | Recorrido probado con cliente HTTP aislado |
| 10. Seguridad | Reclutador, estado de cuenta, CORS y logout | Permisos y 401/403 comprobados |
| 11. React, posterior | Acoplar servicios/contexto/hooks/modales con autorización | End-to-end, build y lint |
| 12. Módulos | Perfil, ofertas, postulaciones, reclutador y finalmente admin | Endpoint probado antes de retirar mock |

Detenerse al finalizar cada etapa, informar archivos, contratos, pruebas, riesgos y esperar autorización. No migrar a cookies ni implementar ADMIN durante la preparación de autenticación. No copiar Express ni secretos de index/.env.

## Inventario para futuro acoplamiento

| Módulo | React | Backend/API actual | Tablas en SQL compartido | Próximo paso |
| --- | --- | --- | --- | --- |
| Perfil | Sí | Entidad parcial; sin API de perfil completo | usuarios/postulantes | GET/PATCH del usuario autenticado |
| Ofertas | Sí | Sin API de listado/detalle de vacantes | vacantes | DTO, consulta y publicación autorizada |
| Postulaciones | Sí | Sin API de creación/mis postulaciones | postulaciones/timeline | Identidad JWT, duplicados y CV multipart |
| Reclutador | Sí | GET /api/recruiter/candidates | postulantes/postulaciones/vacantes | IDs, detalle y acceso |
| Entrevistas | Sí | GET /api/recruiter/interviews | entrevistas | Fecha ISO y luego escritura |
| Evaluaciones | Sí | GET /api/recruiter/evaluations | evaluaciones/evaluacion_detalle | candidateId, detalle y escritura |
| Dashboard | Sí | GET /api/recruiter/dashboard | Consultas agregadas | Contrato de métricas y navegación |
| Admin | Solo laboratorio | Sin API oficial | usuarios/roles/auditoria | Definir rol y gestión antes de implementar |

Existencia de tablas se refiere al SQL, no a una comprobación de MySQL en ejecución.

## Ejecución y comprobaciones

Java 21 y Maven 3.9+. MySQL es necesario para arrancar el servidor, no para los tests actuales con mocks. Spring no carga .env automáticamente: configurar las variables de .env.example en el proceso/IDE sin copiar secretos del laboratorio.

```powershell
cd backend
mvn.cmd clean test
# Solo después de revisar esquema y variables:
mvn.cmd spring-boot:run
```

Si Maven intenta usar C:\.m2\repository sin permisos, indicar una caché accesible:

```powershell
mvn.cmd "-Dmaven.repo.local=$env:USERPROFILE\.m2\repository" clean test
```

Las pruebas usan mocks y transporte simulado: no envían WhatsApp/Gmail ni ejecutan migraciones. Pasar tests no demuestra que el SQL suministrado permita arrancar con validación JPA.

No ejecutar git add/commit/push/merge ni cambiar de rama. No levantar frontend para esta validación aislada.

### Resultado de la limpieza

Verificación del 27/09/2026: `mvn.cmd -B -o "-Dmaven.repo.local=C:\Users\ASUS\.m2\repository" clean test` terminó con BUILD SUCCESS: 17 pruebas, 0 fallos, 0 errores, 0 omitidas. Se recompilaron las fuentes después de limpiar target. La ejecución necesitó permisos de entorno para limpiar los compilados y acceder a la caché; no se cambió configuración Maven global.

Permanece un aviso de Mockito/Byte Buddy por carga dinámica del agente en Java 21; no impidió los tests. No se validó el arranque contra MySQL ni se enviaron mensajes reales. Siguiente etapa propuesta: revisar y autorizar los contratos de la fase 2 antes de implementarlos.

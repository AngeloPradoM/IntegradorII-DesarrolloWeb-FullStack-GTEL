# Reporte de cambios — 5 de octubre de 2026

## 1. Trabajo realizado anteriormente

| Funcionalidad | Entrega |
|---|---|
| Autenticación | Login único por rol y verificación por correo; reenvío OTP a los 30 segundos |
| Recuperación | Enlace de un solo uso, expiración, cambio de contraseña y mostrar/ocultar contraseña |
| Perfil | Contacto, formación, experiencia, foto y ubicación persistentes |
| Vacantes | Creación, edición, publicación, pausa, cierre y papelera por 30 días |
| Postulaciones | PDF privado, validación multipart, prevención de duplicados y seguimiento |
| Selección | Seleccionar persona/oferta, historial, entrevistas, evaluaciones y notificaciones |
| Administración | Gestión de usuarios, roles, estados y consulta de auditoría |

Se prepararon las migraciones 004 (flujo) y 005 (papelera). Las pruebas usaron H2 y correo simulado; no se ejecutaron migraciones ni borrados sobre MySQL real.

## 2. Cambios de esta entrega

### Reenvío del código: 30 segundos

El backend ya imponía 30 segundos entre envíos. Se comprobó que React toma `resendAfterSeconds` del servidor y actualiza el contador cada segundo. No se redujo la vigencia del código: la espera de reenvío y la expiración son conceptos distintos. La prueba existente bloquea a los 29 999 ms y permite a los 30 000 ms. Se mantienen los límites de intentos y envíos.

### Eliminar cuenta desde ADMIN

- Botón **Eliminar cuenta** en Gestión de usuarios.
- Confirmación escribiendo el correo de la cuenta. Cancelar no envía la petición.
- Endpoint `DELETE /api/admin/users/{id}`, protegido por ADMIN, con respuesta 204.
- Comprobación adicional de administrador activo en el servicio.
- No permite eliminar la propia cuenta ni dejar el sistema sin administrador activo.
- Borrado en una sola transacción; un error revierte las operaciones previas.

| Datos | Tratamiento |
|---|---|
| Cuenta y perfil personal | Eliminados físicamente |
| Postulaciones del candidato y sus PDF, entrevistas, evaluaciones e historial | Eliminados físicamente |
| Desafíos OTP, recuperación de acceso y notificaciones propias | Eliminados físicamente |
| JWT emitidos | Dejan de autorizar porque la cuenta ya no existe; el token que quede en un navegador no sirve |
| Ofertas, requerimientos y papelera gestionados por la cuenta | Conservados y reasignados al administrador que elimina |
| Evaluaciones y cambios de estado hechos sobre otros candidatos | Conservados con referencia al autor eliminada |
| Auditoría | Conservada; identidad histórica del autor almacenada antes de quitar su referencia FK |

Este alcance elimina los datos personales y referencias de la cuenta en las tablas del sistema, conservando el trabajo compartido y la excepción de auditoría solicitada. No borra copias de seguridad, correos ya enviados ni archivos descargados en otros equipos.

Se registra quién eliminó la cuenta y cuál fue la cuenta afectada. La pantalla de auditoría muestra el correo histórico cuando el autor ya no existe. Las cuentas de desarrollo eliminadas expresamente no se recrean al reiniciar; se reconoce la eliminación registrada en auditoría.

## 3. Activación

1. Conservar un respaldo de la BD.
2. Tener aplicadas las migraciones 004 y 005.
3. Ejecutar **una sola vez** `backend/database/migrations/006_audit_deleted_users.sql`. Agrega `actor_id_historico` y `actor_email_historico` a auditoría.
4. Reiniciar backend y frontend.
5. Crear una cuenta desechable, generar una postulación y eliminarla desde ADMIN.
6. Comprobar que la cuenta y su postulación desaparecieron, mientras la auditoría continúa visible.

El esquema para una instalación nueva ya incluye los cambios. No volver a importar ese esquema sobre una BD existente.

## 4. Verificación

Se añadieron pruebas de eliminación de datos relacionados, conservación de identidad en auditoría, reasignación de ofertas, protección de la cuenta propia, rechazo a reclutadores, rollback ante fallos y no recreación de cuentas de prueba. El frontend prueba el contrato DELETE y los errores del servidor. Se conserva la prueba exacta del límite OTP de 30 segundos.

Las pruebas usan H2, credenciales ficticias y remitentes simulados. La eliminación sobre una cuenta de MySQL real queda para el recorrido de aceptación posterior a aplicar la migración 006.

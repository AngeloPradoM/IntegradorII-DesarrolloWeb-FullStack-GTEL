# Corrección del flujo de postulación

## Causa comprobada

En la BD local `gtel_talento`, `postulantes` contiene `tipo_documento` y `numero_documento`, no `dni`. La consulta de solo lectura `SELECT p.dni FROM postulantes p WHERE 1=0` produjo MySQL 1054, SQLState 42S22, `Unknown column 'p.dni' in 'field list'`. Las tablas necesarias sí existen. No se reprodujo el POST con datos reales ni se modificó la BD.

## Corrección aplicada

- `ApplicationService`: persiste el documento recibido como `tipo_documento='DNI'`, `numero_documento=<dni>`. La lectura expone el alias `dni` para conservar el contrato React; no presenta documentos CE/pasaporte como DNI. El formulario continúa admitiendo DNI, no otros tipos de documento.
- La oferta inexistente responde 404; cerrada, vencida o postulación repetida responde 409.
- `JwtAuthenticationFilter` y `AuthController`: distinguen un JWT inválido de un fallo de acceso a datos. Este último no se oculta como 401. El filtro responde 503 sin detalles internos; las excepciones inesperadas ya no se capturan como token inválido.
- `api.js` expone el estado HTTP de los errores de autenticación; `AuthContext` limpia la sesión ante 401/403, pero permite reintentar ante errores internos/red sin borrar el token ni conceder acceso.
- El esquema de instalación nueva usa las columnas documentales existentes. **No ejecutar ese esquema sobre la BD actual. No se necesita una migración para tu BD.** Instalaciones antiguas que aún usen solo `dni` requieren un diagnóstico y migración propios antes de usar esta versión.

El dashboard del reclutador consulta postulaciones reales, no todas las cuentas registradas. La consulta devuelve la nueva candidatura tras guardarse correctamente, independientemente de si la cuenta es de prueba o usa correo real.

## Validación

46 pruebas backend y 11 frontend aprobadas; ESLint y compilación frontend correctos. Las pruebas de integración H2 verifican guardado del documento, PDF, consulta del reclutador, aislamiento, duplicados y rollback. El filtro prueba la diferencia entre JWT inválido y error de acceso a datos. No se cambió la seguridad para permitir peticiones sin autenticar.

| Prueba | Antes | Después |
|---|---|---|
| Documento del candidato | SQL usa columna inexistente | SQL usa columnas existentes; integración H2 aprobada |
| Listado del reclutador | Consulta `p.dni` incompatible | Lectura del documento adaptada y probada |
| Oferta inexistente | 409 | 404 probado |
| JWT inválido | Autenticación rechazada | Continúa rechazado |
| Error de datos durante validación JWT | Se ocultaba como sesión inválida | 503 en filtro, sin datos sensibles |
| `/api/auth/me` con la sesión real afectada | 401 reportado | Pendiente de nuevo login y verificación en navegador |
| POST real y persistencia tras F5 | 500 reportado, BD sin postulaciones en diagnóstico | Pendiente de recorrido local tras reiniciar |

## Recorrido real pendiente

1. Reiniciar el backend para cargar el código corregido y mantener Vite activo.
2. Iniciar sesión con la cuenta real y completar OTP; no compartir el token.
3. Recargar y comprobar GET `/api/auth/me` → 200.
4. Postular a una oferta activa con PDF y comprobar POST `/api/candidate/applications/{idOferta}` → 201.
5. Recargar Mis postulaciones y confirmar que permanece.
6. Entrar como reclutador y comprobar la candidatura en dashboard y Proceso de selección.

La causa exacta del 401 original sigue sin atribuirse a una sesión concreta: no se tuvo acceso al token ni al detalle de esa petición. No se garantiza que un token antiguo/revocado vuelva a ser válido; requiere iniciar sesión de nuevo.

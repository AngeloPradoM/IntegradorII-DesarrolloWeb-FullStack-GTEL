# Informe de correcciones y validación

Fecha: 8 de octubre de 2026. Rama: refactor/backend-modular-architecture.

Se continuó el trabajo en la nueva ubicación del repositorio dentro de C:/Program Files/Microsoft Visual Studio 10.0. Esta entrega corrige los pendientes técnicos descritos abajo; no certifica todos los RF/RNF del proyecto ni un despliegue en producción.

## 1. Cambios aplicados

| Etapa | Problema | Solución aplicada | Alcance |
|---|---|---|---|
| Postulación | El correo de contacto y la fecha de nacimiento no llegaban al backend; la consulta podía mostrar datos actuales del perfil en lugar de los enviados | Se incluyen ambos campos en el multipart, se validan y se conserva la información enviada en datos_personales. Las consultas usan esa captura para nombre y contacto | No cambia el correo de acceso. Los registros antiguos sin captura conservan el comportamiento previo. No requiere otra columna |
| Estados | La interfaz ofrecía transiciones que el backend rechazaba | Regla compartida de estados en frontend; botones y selector restringidos a las transiciones permitidas | El servidor conserva la validación definitiva; aprobado/rechazado son terminales |
| Contraseñas | Registro permitía contraseñas más cortas que administración y recuperación | Registro exige mínimo 12 caracteres y máximo 72 bytes UTF-8 en servidor; formulario actualizado | No modifica contraseñas existentes. El indicador visual de fortaleza es orientativo |
| Login | No había límite de intentos de contraseña | Máximo de cinco intentos por correo normalizado en una ventana de 15 minutos; respuesta 429 al superar el límite; éxito limpia el contador | Contador en memoria de una instancia. No sustituye protección por IP o un contador compartido entre servidores |
| Logout | Solo se eliminaba el token del navegador | El endpoint incrementa auth_version; el frontend lo invoca al salir y elimina su sesión local | Revoca todos los JWT anteriores de la cuenta. Si falla la red, se informa que no se confirmó la revocación en servidor |
| Perfil | Al recuperar la sesión podían perderse los datos editados del reclutador | Login y /auth/me combinan identidad con el perfil guardado | Nombre, apellidos, foto y contacto se restauran desde la BD |
| Interactividad | Botones de CV desactivados y controles sin implementación | Descarga protegida de CV desde directorio/dashboard con errores visibles; controles de exportación, borrador y reportes pendientes ocultos | Ocultar no equivale a implementar exportaciones o borradores |
| Favoritos | Las ofertas guardadas se compartían entre usuarios del navegador | Clave de almacenamiento por ID de usuario y espacio separado para visitante | Persistencia local, sin sincronización entre equipos; no reutiliza el antiguo listado compartido |
| Consultas | Directorio descargaba todas las postulaciones y existían consultas repetidas por fila | Endpoint paginado con filtros, tamaño máximo 100 y detalle directo; consultas agrupadas de historiales y criterios | Directorio usa páginas de ocho. Dashboard y otras colecciones conservan endpoints anteriores |
| Diagnóstico | Errores SQL distintos podían confundirse con indisponibilidad | Fallos de conexión devuelven 503; otros fallos SQL inesperados 500; identificador X-Error-Id y registro de tipo de excepción sin SQL ni valores | Los conflictos de integridad siguen con su manejo específico |
| Automatización | Faltaba una ejecución reproducible en GitHub | Workflow con lint, pruebas y build de frontend; pruebas Java; contrato HTTP con MySQL 8.4 desechable | El workflow se ejecutará al subir la rama; no se publicó ni se ejecutó remotamente en esta sesión |
| Operación | Faltaban instrucciones de producción y respaldo | Perfil prod con variables externas y acceso de pruebas deshabilitado; script de respaldo; comprobación de objetos SQL y guía operativa | HTTPS, ejecución/restauración de respaldo y configuración del servidor requieren infraestructura real |

## 2. Rutas afectadas

| Método y ruta | Comportamiento |
|---|---|
| POST /api/auth/register | Política de contraseña reforzada |
| POST /api/auth/login | Limitación de intentos y perfil persistido |
| GET /api/auth/me | Perfil persistido y validación de versión de sesión |
| POST /api/auth/logout | Requiere Bearer token válido; revoca sesiones de la cuenta |
| GET /api/recruiter/applications/page?page=0&size=8&search=&state= | Devuelve items, total, page y size; filtros y paginación de servidor |
| GET /api/recruiter/applications/{id} | Detalle de una postulación; solo reclutador/administrador |

Las rutas de lista existentes se conservan. Los campos de correo y nacimiento añadidos a la postulación son opcionales para compatibilidad con clientes previos, pero se validan cuando se reciben.

## 3. Evidencia de pruebas

| Verificación | Resultado observado |
|---|---|
| Maven test | 58 pruebas, cero fallos, cero errores y cero omitidas; BD H2 aislada |
| Frontend: node --test tests/*.test.mjs | 12 pruebas aprobadas |
| Frontend: npm run lint | Sin errores |
| Frontend: compilación | Correcta en directorio temporal; 2.484 módulos transformados |
| Navegador Chrome, workflow-browser.mjs | Correcto: ofertas/detalle, recuperación, directorio paginado, detalle directo, selección, edición, papelera/restauración y notificaciones; HTTP simulado |
| Script backup.ps1 | Sintaxis PowerShell comprobada; no se ejecutó contra MySQL |
| MySQL real / CI remota / Gmail | No ejecutados en esta sesión |

Se añadieron verificaciones de captura inmutable de contacto, límites de contraseña e intentos, revocación de JWT, restauración del perfil, paginación/filtros/permisos y transiciones del frontend. Las pruebas de correo usan dobles de prueba: no se enviaron mensajes.

El build normal no pudo reemplazar frontend/dist/assets por un error EPERM de permisos de Windows. El mismo código compiló correctamente con --outDir hacia una carpeta temporal. No se borró dist ni se alteraron permisos. Vite también advierte de un paquete JavaScript mayor de 500 kB; no se ha medido aún su impacto con red móvil. Las pruebas Vite en paralelo mostraron avisos de puerto HMR ocupado, sin fallos de pruebas.

## 4. Cambios en base de datos y configuración

- No se modificó ni eliminó información de la BD real.
- Esta entrega reutiliza auth_version y datos_personales ya existentes; no añade migración 007.
- Las migraciones 001–006 y el esquema inicial se mantienen. check-schema.sql comprueba objetos representativos, no reemplaza la revisión completa de columnas/índices ni un historial de migraciones.
- No se editaron local.properties, los archivos .env ni la carpeta index.
- El perfil prod no debe distribuirse junto con config/local.properties de desarrollo. Los secretos se inyectan en el entorno del servidor.

## 5. Pendientes para afirmar que está listo para producción

1. Ejecutar el trabajo mysql-contract de GitHub y corregir cualquier diferencia real de dialecto/esquema antes de integrar la rama.
2. Probar una postulación real con PDF, consulta/descarga por reclutador y rechazo de acceso por otra cuenta; revisar la BD utilizada por el equipo.
3. Probar OTP, reenvío tras 30 segundos y recuperación con el remitente configurado y un destinatario autorizado. No se cambiaron tiempos SMTP en esta entrega.
4. Desplegar HTTPS, limitar CORS al dominio real, usar una cuenta MySQL con privilegios ajustados y retirar/habilitar según corresponda las cuentas de demostración existentes. Deshabilitar el bypass no borra esas cuentas.
5. Ejecutar respaldo y restauración en una BD separada; definir responsable, frecuencia, retención y protección de las copias.
6. Para varias instancias, reemplazar el limitador en memoria por almacenamiento compartido y sumar límites por IP en el punto de entrada. Medir tiempos con un volumen representativo.
7. Si forman parte del alcance final, implementar exportaciones/borradores, sincronización de favoritos y paginación en las restantes listas. Hoy no se presentan como funcionalidades terminadas.
8. Registrar la aplicación de migraciones de cada entorno y acordar automatización de versiones; no se incorporó un gestor automático de migraciones en esta entrega.

Ver [operación y validación externa](operacion-produccion.md). No se hizo commit, push ni despliegue.

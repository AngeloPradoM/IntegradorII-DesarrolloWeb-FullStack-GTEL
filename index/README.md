# GTEL · Prototipo frontend local

Esta carpeta funciona sin backend, MySQL, correo, login, sesiones ni tokens. Las carpetas frontend y backend del proyecto principal no se modificaron.

## Abrir

Abre index.html directamente o usa Live Server. Para mantener un origen estable entre páginas, también puedes ejecutar desde esta carpeta:

~~~powershell
npm.cmd start
~~~

Abre http://127.0.0.1:3001. Este comando solo sirve archivos estáticos usando Node.js; no requiere npm install, .env ni dependencias. No tiene endpoints API y no expone archivos .env ni código del servidor anterior.

## Funcionamiento

- Inicio: ofertas ficticias, postular y retirar postulaciones locales.
- Mi perfil: editar nombre, contacto, localidad y fotografía.
- Panel admin: crear, buscar y eliminar registros ficticios, sin contraseñas ni permisos.
- Los datos usan claves gtel-local-* en localStorage. No son usuarios reales ni se sincronizan entre equipos. Limpiar los datos del sitio elimina los cambios. El comportamiento del almacenamiento al abrir file:// puede variar por navegador; usa el servidor estático para compartir datos de forma consistente entre páginas.
- No se simula envío de correo ni verificación. No hay subida real de CV ni conexión a las ofertas del proyecto React.

## Archivos

| Archivo | Función |
|---|---|
| index.html, preview.js | Inicio y postulaciones de ejemplo |
| profile-store.js, profile.js | Perfil local y enlace en el encabezado |
| editar-perfil.html, editar-perfil.js | Editor persistido en el navegador |
| admin.html, admin.js | Registros locales de demostración |
| navigation.js | Menú adaptable |
| server/main.js | Alojamiento estático opcional, sin paquetes externos |

Los demás archivos históricos de server/ y la configuración .env ya no se cargan ni forman parte de los comandos de esta versión. Se conservan como referencia; sus dependencias se retiraron de package.json. No ejecutar manualmente ese servidor antiguo para usar este prototipo.

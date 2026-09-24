# Diseño GTEL Talento

Referencia: `Diseño UI para ATS GTEL Talento.zip`, entregado por el usuario.
Se reutilizaron el JSX, las clases Tailwind, las imágenes, la tipografía y los
layouts del diseño. No se ejecutaron scripts del ZIP ni se instalaron sus
dependencias. Las atribuciones se conservan en `DESIGN_ATTRIBUTIONS.md`.

## Pantallas

| Referencia | Página integrada |
| --- | --- |
| LandingPage | `/` |
| JobListings | `/ofertas` |
| ApplicationForm | `/postulacion/:id` |
| MyApplications | `/mis-postulaciones` |
| Login | `/login` y registro en `/login?registro=1` |
| RecruiterDashboard | `/reclutador/dashboard` |
| PublishJob | `/reclutador/publicar-oferta` |
| CandidateDirectory | `/reclutador/postulantes` |
| InterviewSchedule | `/reclutador/entrevistas` |
| Evaluations | `/reclutador/evaluaciones` |
| CandidateProfile | `/reclutador/postulantes/:id` |

Se conservan las páginas adicionales de perfil de cuenta y detalle de oferta.
El contacto con reclutamiento ahora ocupa una página independiente y prepara
un correo en el cliente del usuario, en lugar de confirmar un envío simulado.
Las rutas activas no montan los antiguos modales de acceso, registro o contacto.

## Funcionalidad conservada

- El login no utiliza la redirección simulada del ZIP. Reutiliza `useOtpLogin`,
  `AuthContext` y `api.js`: credenciales, OTP, reenvío, errores y JWT posterior.
- El registro sigue enviando `telefono` a Spring Boot.
- Se conservan las rutas protegidas y el cierre de sesión; la postulación vuelve
  a la oferta seleccionada después del login.
- Dashboard, candidatos, agenda y evaluaciones siguen usando sus endpoints.
  No se reemplazan sus datos por candidatos o indicadores ficticios del ZIP.
- La publicación mantiene `addJob` y su almacenamiento local existente, ahora
  incluyendo la descripción. Búsqueda, filtros y ordenación siguen disponibles.
- Favoritos conserva el diseño y persiste la selección en el navegador.

## Límites preexistentes y diferencias necesarias

El backend actual no tiene endpoints para publicar ofertas, subir CVs, aprobar,
descartar, descargar CV o guardar notas. Publicación y formulario de postulación
conservan su comportamiento local; la línea de tiempo conserva datos de ejemplo.
No se presentan estas operaciones como integraciones nuevas con el backend.
Las acciones nuevas del perfil sin endpoint se muestran deshabilitadas.

Los nombres, cifras, gráficos y contenido del CV dependen de los datos disponibles:
cuando el backend no entrega un dato se muestra vacío o con un guion. El perfil
de candidato toma la identidad del directorio y no copia la identidad ficticia
del ZIP. Los permisos del login de reclutador se mantienen como estaban.

Las imágenes son las URLs de Unsplash del ZIP y la fuente Inter se carga desde
Google Fonts, por lo que requieren conexión. Los tamaños pequeños incorporan
ajustes de adaptación sin modificar la distribución de escritorio.

## Comprobación

- `npm run build`
- Backend: `mvn test`
- `node scripts/review-design.mjs` con Vite en 5173 y Chrome headless en 9222.
  Usa respuestas API de prueba aisladas, revisa las 11 pantallas a 1440, 768 y
  390 px, busca errores de JavaScript y desbordamiento, y comprueba registro,
  OTP, rutas protegidas y persistencia local de ofertas. Guarda capturas y un
  informe en la carpeta temporal `gtel-ui-review` del sistema.

Estas pruebas no envían WhatsApp ni validan credenciales reales de Meta.

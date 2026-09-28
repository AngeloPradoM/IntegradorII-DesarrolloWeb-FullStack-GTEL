# Correcciones funcionales del frontend

## Archivos y cambios

| Archivo en `src/` | Corrección |
| --- | --- |
| `pages/candidato/FormularioPostulacionPage.jsx` | Estado controlado de datos personales, CV y términos; validaciones por pasos y antes del envío; confirmación y código reales; oferta inexistente bloqueada. |
| `pages/candidato/MisPostulacionesPage.jsx` | Sustituye la lista fija por el servicio del candidato actual. Contadores, estados de carga/error/vacío y enlaces por `jobId`. |
| `services/api.js` | Registros completos y separados por candidato, duplicados por candidato/oferta, comprobación de oferta y datos; publicación centralizada; errores explícitos para operaciones API pendientes. |
| `components/ui/RegistrationModal.jsx` | Conserva espacios durante la escritura y valida nombres recortados al finalizar. |
| `components/auth/AuthModal.jsx` | Un único cierre para X, Escape y fondo; limpia formulario, contraseña visible, arrastre y OTP. |
| `hooks/useOtpLogin.js` | Reinicio de tiempos, errores y carga; invalida respuestas asíncronas anteriores al cierre o desmontaje. |
| `hooks/useModalFocus.js` | El callback de cierre actualizado no reinicia el foco en cada pulsación. |
| `layouts/PublicLayout.jsx` | Desmonta el login al cerrarlo/cambiar de modal para descartar estados y peticiones anteriores. |
| `pages/candidato/ProfileEditor.jsx` | Bloquea navegación interna con cambios pendientes; mantiene protección de recarga/cierre y estado limpio tras guardar. La disponibilidad de guardado API se decide en el servicio. |
| `pages/reclutador/PublicarOfertaPage.jsx` | Valida campos y salarios antes de publicar, conserva los valores ante errores y controla los campos adicionales. |
| `routes/AppRoutes.jsx` | Mantiene rutas existentes mediante `createBrowserRouter` y `RouterProvider`, necesarios para `useBlocker` en React Router 7.18.3; añade catch-all. |

Nuevos archivos:

- `src/utils/formValidation.js`: validaciones reutilizadas por formularios y servicios.
- `src/utils/applications.js`: identidad del candidato, filtrado, duplicados y preparación de `FormData`.
- `src/components/ui/UnsavedChangesDialog.jsx`: confirmación accesible para continuar editando o salir sin guardar.
- `src/pages/NotFoundPage.jsx`: página 404 con enlaces a inicio y ofertas.
- `tests/validation.test.mjs`, `tests/application-service.test.mjs`, `tests/api-mode.test.mjs` y `tests/browser-flows.mjs`.

## Almacenamiento por usuario y CV

Se conserva `gtel-demo-v2-applications`. Cada registro nuevo tiene UUID propio, `candidateId`, `jobId`, `personalData`, metadatos `cv`, `termsAccepted`, `createdAt`, estado y código de seguimiento. Se prioriza el ID estable de la cuenta; las sesiones demo antiguas permiten recuperar ese ID del token. Solo si no existe ID se utiliza el correo normalizado.

Los registros antiguos sin propietario permanecen almacenados, pero nunca se muestran ni se asignan a una cuenta arbitraria. No bloquean nuevas postulaciones. Una oferta se considera duplicada solo para el mismo candidato.

El CV se conserva como `File` exclusivamente en el estado del formulario. En localStorage se guardan nombre, tipo, tamaño y fecha de modificación; no el archivo ni su contenido. Recargar o abandonar el formulario pierde ese archivo. `applicationFormData` permite preparar JSON + archivo para un futuro contrato multipart, sin enviar a endpoints inventados. Los CV admitidos son PDF/DOC/DOCX, no vacíos y de hasta 5 MB.

## Perfil y navegación

`useBlocker` protege las transiciones internas, incluidos enlaces y cambios de historial que abandonan la ruta. El diálogo ofrece “Seguir editando” y “Salir sin guardar”. `beforeunload` protege recarga/cierre con el aviso nativo del navegador. Guardar con éxito actualiza el estado base y desactiva el bloqueo. Cerrar sesión sigue siendo una acción explícita de autenticación, no un guardado automático.

## API y límites

`VITE_DATA_MODE=api` activa API; cualquier otro valor conserva el modo demo existente. No se encontraron implementaciones backend ni contratos adicionales en este workspace. Se preservan las llamadas API preexistentes de autenticación y lecturas del reclutador, sin certificar su disponibilidad en un servidor externo.

Guardar perfil, enviar/consultar postulaciones, actualizar estados y publicar ofertas devuelven errores controlados en modo API y no escriben datos locales. El catálogo de ofertas existente sigue siendo local; su integración remota queda pendiente. No se crearon endpoints, ni se modificó backend o `index/`.

El modo demo no transfiere el CV ni sincroniza automáticamente el nuevo registro con el directorio ficticio de reclutadores; ese flujo requiere una integración posterior. Los límites y fallos de localStorage se comunican como errores de guardado cuando pasan por estos formularios.

## Validación

Desde `frontend/`:

```text
node --test tests/validation.test.mjs
node tests/application-service.test.mjs
node tests/api-mode.test.mjs
npm run build
npm run lint
```

`browser-flows.mjs` usa Chrome DevTools Protocol con Node, sin dependencias añadidas. Requiere Vite en `127.0.0.1:5178` y un navegador de pruebas con depuración en `127.0.0.1:9238`. Utiliza una cuenta generada durante la prueba y los accesos demo ya existentes. Borra el almacenamiento **del origen de pruebas** al comenzar; debe ejecutarse con un perfil de navegador desechable.

```text
node tests/browser-flows.mjs
```

Comprueba registro con nombre compuesto; login/OTP; cierres X/Escape/fondo; rutas protegidas y logout; campos y CV obligatorios; retorno entre pasos; términos; confirmación real; aislamiento de candidatos; oferta inexistente; bloqueo del perfil y navegación después de guardar; publicación con título vacío, salario negativo o rango invertido; y 404.

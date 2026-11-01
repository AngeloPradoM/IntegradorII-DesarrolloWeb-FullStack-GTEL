# Gestión de cambios RFC

## Objetivo

El módulo separa una solicitud de servicio, una incidencia y un cambio. Las solicitudes e
incidencias continúan en la mesa de ayuda; los cambios utilizan un registro RFC persistente con
documento, evaluación técnica, decisión administrativa, ejecución, validación e historial.

## Clasificación

- **Solicitud:** acción prevista y repetible, como crear un usuario o restablecer acceso.
- **Incidente:** interrupción o degradación que requiere restaurar el servicio.
- **Cambio:** modificación de algo que funciona y que puede originar un incidente.

Los cambios son estándar, normales o de emergencia. Un cambio estándar corresponde a un
procedimiento preaprobado y no requiere reunión del CAB. Un cambio normal requiere evaluación y
aprobación. Un cambio de emergencia conserva la trazabilidad y la revisión posterior aunque su
autorización sea prioritaria.

## Flujo operativo

1. El reclutador abre `/reclutador/tickets`, selecciona **Cambio** y descarga `Formato_RFC.docx`.
2. Completa el documento, registra clasificación, impacto, urgencia, justificación y áreas
   afectadas, y adjunta el DOCX.
3. El backend valida el DOCX, calcula SHA-256, lo almacena como BLOB y genera el código
   `RFC-AAAA-NNNN`.
4. Administración recibe una notificación y asigna un técnico como responsable e implementador.
5. El técnico descarga el RFC y registra evaluación, implementación, pruebas, reversa y
   comunicación. La RFC pasa a aprobación.
6. Administración aplica la matriz probabilidad por impacto. Los cambios normales requieren que
   se identifiquen participantes del CAB. Aprobar habilita la ejecución; observar devuelve la RFC.
7. El técnico ejecuta el plan aprobado y registra evidencia, resultado y lecciones aprendidas.
8. El reclutador valida el resultado. Aceptar cierra la RFC; observarla la devuelve al
   implementador para corrección.

## Responsabilidades y controles

- Solicitante: explica la necesidad, adjunta el RFC y valida el resultado.
- Responsable del cambio: coordina evaluación, planes y ejecución.
- CAB o autoridad: evalúa riesgo y registra la decisión.
- Implementador: ejecuta únicamente el plan autorizado y conserva evidencia.
- Usuarios afectados: reciben comunicación y participan en la validación.
- Nadie puede aprobar su propio cambio. El backend compara al aprobador con solicitante,
  responsable e implementador antes de aceptar una decisión.

El plan de pruebas, el plan de retorno y el plan de comunicación son obligatorios para enviar una
RFC a aprobación. El sistema no impide automáticamente una ventana de viernes, porque una
emergencia puede requerirla; la programación debe revisarse administrativamente.

## Persistencia

La migración `014_change_management.sql` agrega `tipo_atencion` a soporte y crea:

- `solicitudes_cambio`: datos operativos, riesgo, planes, estado y resultado.
- `solicitud_cambio_documentos`: DOCX, versión, MIME, tamaño, SHA-256 y contenido.
- `solicitud_cambio_aprobaciones`: decisiones de la autoridad y el CAB.
- `solicitud_cambio_historial`: transiciones y actor responsable.

Las RFC no forman parte de la depuración semanal de tickets terminales. Se conservan como
evidencia administrativa. Cada operación sensible también se registra en `auditoria`.

## API

La API autenticada vive en `/api/change-management` y expone listado, creación multipart,
descarga de plantilla y documento, asignación, evaluación técnica, decisión, ejecución y
validación. Los permisos se comprueban en el servicio para `RECLUTADOR`, `TECNICO` y `ADMIN`.

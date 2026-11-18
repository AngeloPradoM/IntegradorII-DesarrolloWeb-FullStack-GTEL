# Pendientes de backend — Centro Administrativo

Este documento conserva las limitaciones detectadas durante el rediseño ejecutivo del frontend. No se modificaron el backend, MySQL, las consultas SQL, los roles ni los flujos de autorización.

## Prioridad alta

### Historial detallado de soporte y RFC

Las tablas `ticket_soporte_historial` y `solicitud_cambio_historial` almacenan eventos, pero los controladores actuales no exponen endpoints de consulta. El frontend solo puede mostrar fechas resumidas incluidas en los DTO actuales.

Endpoints sugeridos:

- `GET /api/support/tickets/{id}/history`
- `GET /api/change-management/requests/{id}/history`

La respuesta debería incluir actor, estado anterior, estado nuevo, detalle y fecha, respetando las mismas reglas de visibilidad de cada módulo.

### Archivos de evidencia

La evidencia de ejecución se recibe y almacena únicamente como texto. No existen carga, almacenamiento, metadatos ni descarga de archivos de evidencia.

Se requiere definir:

- Tipos y tamaños permitidos.
- Almacenamiento seguro fuera de rutas públicas.
- Metadatos y relación con ticket o RFC.
- Endpoints autenticados de carga y descarga.
- Validación de firma/magic bytes y autorización por propietario o rol.

Hasta contar con este contrato, el frontend no debe habilitar botones de adjuntar archivos.

## Prioridad media

### Paginación, búsqueda y filtros de tickets/RFC

Los listados de soporte y gestión de cambios devuelven colecciones completas. La búsqueda, los filtros y la paginación son locales.

Parámetros sugeridos:

- `q`
- `status`
- `priority`
- `assignedTo`
- `page`
- `size`
- `sort`

La respuesta debería incluir `items`, `total`, `page` y `pageSize`.

### Filtros de auditoría

Auditoría admite paginación, pero el frontend no dispone de filtros de servidor por responsable, entidad, acción o periodo. Los filtros actuales se aplican únicamente sobre la página cargada.

Parámetros sugeridos:

- `actor`
- `entity`
- `action`
- `from`
- `to`
- `q`

### Administración de usuarios

La API permite búsqueda y paginación, pero no filtros de servidor por rol o estado. Los filtros actuales solo afectan los registros de la página visible.

### Supervisión administrativa de ofertas

La ruta disponible es la consulta pública de ofertas. No existe un contrato administrativo confirmado que entregue convocatorias pausadas o vencidas, número de postulaciones y acciones autorizadas para un administrador. Por esta razón, Ofertas permanece como vista previa pública y no ofrece controles administrativos ficticios.

## Optimización recomendada

El Centro de control compone sus indicadores consultando las APIs existentes de usuarios, tickets, SLA, RFC, notificaciones y auditoría. Un endpoint agregado reduciría solicitudes y permitiría aplicar una misma fecha de corte:

- `GET /api/admin/dashboard`

Debe devolver únicamente métricas calculadas por fuentes reales y distinguir valores no disponibles de valores iguales a cero.

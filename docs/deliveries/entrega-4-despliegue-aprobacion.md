# Entrega 4 — Despliegue y aprobación

Fecha de preparación: 12/10/2026. Estado general: **Pendiente**. Esta entrega comienza cuando las entregas 1, 2 y 3 estén aprobadas con evidencia. Preparar archivos o escribir código no equivale a autorizar producción.

## Estado de los pasos 16 y 17

| Paso | Alcance | Estado | Criterio de salida |
|---|---|---|---|
| 16 | Despliegue controlado | Pendiente | Aplicación publicada por HTTPS, configuración segura, migraciones verificadas, respaldo restaurable, observabilidad activa y smoke tests aprobados |
| 17 | Aprobación y cierre | Pendiente | UAT firmada, riesgos críticos cerrados, evidencias archivadas, responsables asignados y decisión formal de liberación |

## Paso 16 — Despliegue controlado

### Preparación del entorno

- Usar `SPRING_PROFILES_ACTIVE=prod` y variables del gestor de secretos del entorno.
- Configurar una cuenta MySQL exclusiva para la aplicación con los permisos mínimos necesarios.
- Configurar `FRONTEND_URL` y `RECOVERY_URL` con direcciones HTTPS definitivas.
- Mantener `app.security.test-access-enabled=false` y no desplegar cuentas de prueba.
- Instalar TLS en el proxy o plataforma de entrada y mantener el puerto interno del backend restringido.
- Compilar frontend y backend desde un commit identificado y un workflow satisfactorio.

### Datos y recuperación

1. Crear y verificar un respaldo previo al despliegue.
2. Registrar las migraciones aplicadas, su SHA-256, fecha y responsable.
3. Ejecutar las migraciones primero en un entorno equivalente a producción.
4. Comprobar claves foráneas, índices, restricciones y conteos relevantes.
5. Realizar una restauración en una base aislada y conservar la evidencia.

### Smoke tests obligatorios

| ID | Comprobación | Resultado esperado | Evidencia |
|---|---|---|---|
| DEP-01 | `GET /api/health` | HTTP 200 sin detalles sensibles | Respuesta y fecha |
| DEP-02 | Frontend público | Carga por HTTPS sin errores de consola | Captura y versión |
| DEP-03 | Login y OTP | Correo recibido y sesión válida | Registro anonimizado |
| DEP-04 | Permisos | Rutas incorrectas responden 401/403 | Solicitud y respuesta |
| DEP-05 | Postulación con PDF | Persistencia y descarga protegida | IDs de prueba y resultado |
| DEP-06 | Flujo del reclutador | Oferta, estado, entrevista y evaluación persisten | Evidencia funcional |
| DEP-07 | Administración | Gestión y auditoría disponibles solo para ADMIN | Evidencia funcional |
| DEP-08 | CORS | Origen autorizado funciona y origen ajeno se rechaza | Respuestas comparadas |
| DEP-09 | Métricas y logs | Acceso restringido, recolección y alerta verificadas | Evento controlado |

### Plan de reversión

- Conservar el artefacto y la configuración de la versión anterior.
- Definir quién autoriza la reversión y el tiempo máximo de decisión.
- Ante un fallo crítico, detener escrituras, preservar logs y revertir la aplicación.
- Restaurar la base únicamente cuando el análisis determine que una migración alteró datos de forma incompatible.
- Ejecutar nuevamente DEP-01, DEP-02 y los recorridos afectados.

## Paso 17 — Aprobación y cierre

| Evidencia requerida | Estado |
|---|---|
| Entregas 1, 2 y 3 aprobadas | Pendiente |
| Workflow remoto asociado al commit | Pendiente |
| UAT firmada por responsable funcional | Pendiente |
| Pruebas de seguridad y autorización | Pendiente |
| Medición de rendimiento y SLA acordado | Pendiente |
| Respaldo y restauración comprobados | Pendiente |
| Matriz de riesgos sin riesgos críticos abiertos | Pendiente |
| Manual operativo, monitoreo y responsables | Pendiente |
| Acta de liberación o rechazo | Pendiente |

## Acta de despliegue

| Campo | Valor |
|---|---|
| Versión / commit | Pendiente |
| Entorno | Pendiente |
| Fecha y ventana | Pendiente |
| Responsable técnico | Pendiente |
| Responsable funcional | Pendiente |
| Respaldo y restauración | Pendiente |
| Migraciones aplicadas | Pendiente |
| Smoke tests | Pendiente |
| Incidencias conocidas | Pendiente |
| Decisión | Pendiente / Aprobado / Rechazado |

## Definición de terminado

La Entrega 4 solo pasa a **Aprobado** cuando el sistema desplegado completa los recorridos obligatorios, existe evidencia reproducible, los responsables aceptan los riesgos residuales y se firma la decisión. No debe declararse “Todo funcional” únicamente porque la compilación o el despliegue terminaron.

Consulta también la [guía de operación](../operations/operacion-produccion.md), el [control general](control-entregas.md) y la [Entrega 3](entrega-3-validacion-calidad.md).
# Entrega 2 — Protección y recuperación

Fecha: 12/10/2026. Estado: **En desarrollo**, no aprobada.

El usuario indicó continuar. Excepción explícita a la secuencia original: los pendientes de Entrega 1 permanecen abiertos.

## Seguimiento

| Paso | Objetivo | Estado | Evidencia y pendiente |
|---|---|---|---|
| 6 | Respaldo y restauración | En pruebas | Script y manifiesto SHA-256 probados con datos sintéticos. Falta programación, custodia cifrada y restauración MySQL |
| 7 | Recuperación y sesiones | En pruebas | HTTP: respuesta genérica, cambio de contraseña, JWT anterior rechazado y enlace no reutilizable. Falta navegador y Gmail real |
| 8 | Entradas y archivos | En desarrollo | Validaciones, 5 MB, cabecera/fin PDF y descarga protegida existentes. Falta parser PDF y evaluar contenido activo/malicioso |
| 9 | Clasificación de datos | En desarrollo | Matriz inicial abajo; falta validar responsables, plazos y controles operativos |
| 10 | Auditoría protegida | En desarrollo | Trazabilidad existente. Falta protección independiente contra manipulación; no se afirma irrefutabilidad |

## Cambios y evidencia

- backup.ps1 escribe en un archivo único .partial; si falla, no publica la copia final. Rechaza sobrescritura y salida vacía.
- Genera .sha256.json con tamaño, fecha UTC y hash; restoreVerified permanece false.
- verify-backup.ps1 contrasta nombre, tamaño y SHA-256. No ejecuta SQL ni modifica la copia.
- ModuleWiringTest añade passwordRecoveryHttpIsPrivateSingleUseAndRevokesOldJwt.
- Backend: 59 pruebas, sin fallos ni errores. Correo simulado y H2 aislado.
- Scripts: cuatro comprobaciones satisfactorias con mysqldump simulado: copia válida, sobrescritura rechazada, alteración detectada y fallo sin publicación final.
- La primera ejecución de scripts fue impedida por la política PowerShell; no es evidencia válida. Se verificó después el contenido en bloques PowerShell sin cambiar la política del equipo.
- No se modificaron frontend, credenciales ni bases de datos reales.

## Operación

Desde backend, con cliente MySQL y login-path configurados, ejecutar:

    .\scripts\backup.ps1 -LoginPath gtel -Database gtel_talento -Destination 'D:\RespaldosGTEL\gtel-2026-10-12.sql'
    .\scripts\verify-backup.ps1 -Backup 'D:\RespaldosGTEL\gtel-2026-10-12.sql'

Crear previamente un directorio privado fuera del repositorio. No ejecutar durante cambios de esquema. Usar la política de ejecución aprobada por el equipo.

SHA-256 detecta cambios si el manifiesto es confiable. No demuestra autenticidad si alguien puede sustituir ambos archivos. Custodiar también el manifiesto por separado.

Restaurar solo en una base vacía aislada, con cuenta sin permisos sobre la BD original. Revisar el SQL para descartar cambios de base o referencias al entorno original. Importar con herramientas MySQL; contrastar conteos, relaciones, CV y recorridos funcionales. Registrar fecha, versión, responsable, duración y evidencia. No marcar restauración verificada sin ensayo real.

Frecuencia propuesta: diaria y antes de migraciones. RPO/RTO, retención, cifrado y ubicación externa requieren decisión operativa. No se instaló una tarea programada ni se acreditó restauración.

## Clasificación inicial

| Información | Clasificación | Acceso y protección | Pendiente |
|---|---|---|---|
| Ofertas publicadas | Pública | Lectura pública; escritura autorizada | Política de archivo |
| Perfil, contacto, CV y postulaciones | Confidencial | Titular y equipo autorizado | Retención y eliminación en copias |
| Entrevistas y evaluaciones | Confidencial | Selección y vistas del candidato según endpoint | Validar campos expuestos |
| Contraseñas, OTP, tokens y claves | Secreta | Hash cuando corresponde; secretos fuera del repositorio; no logs | Rotación y custodia |
| Auditoría | Restringida | Administración; sin credenciales ni documentos en detalles | Retención y protección independiente |
| Respaldos | Confidencial/secreta | Cuenta dedicada y almacenamiento cifrado restringido | Custodia y recuperación verificables |

Propuesta técnica, no política institucional aprobada ni declaración de cumplimiento legal.

## Pilares y pendientes

- Integridad: transacciones existentes y hash de copias. Falta validación MySQL y autenticidad de registros.
- Confidencialidad: roles y propiedad del candidato; falta verificar despliegue y custodia de copias.
- Disponibilidad: herramientas preparadas; falta automatización y restauración medida.
- No repudio: la auditoría identifica actores, pero una cuenta privilegiada de BD puede alterarla. No equivale a firma digital ni garantiza irrefutabilidad.

Para proteger auditoría, inventariar todas sus escrituras y la actualización histórica al borrar usuarios; centralizar escritura y exportar a almacenamiento independiente protegido. Evitar introducir una cadena criptográfica que omita escritores actuales.

## Cierre

Se mantiene Pendiente → En desarrollo → Implementado → En pruebas → Aprobado.
Los pasos 6 y 7 recorrieron implementación y están en pruebas; no están aprobados integralmente.
No se declara Todo funcional. Faltan recorridos reales, restauración, endurecimiento de archivos/auditoría y validación operativa.
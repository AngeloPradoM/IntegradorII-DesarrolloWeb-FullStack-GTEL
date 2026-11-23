# Respaldo y recuperación para la migración 017

La migración no debe ejecutarse hasta confirmar el diseño, iniciar MySQL local y completar el preflight.

1. Detener el backend para impedir escrituras concurrentes.
2. Ejecutar `scripts/preflight-017-helpdesk-consolidation.sql` en MySQL Workbench. Debe informar 8 dependencias, una columna `tipo_atencion` y cero conflictos 017.
3. Exportar desde MySQL Workbench `gtel_talento` como **estructura y datos**, incluyendo rutinas y eventos, a un archivo fechado fuera del repositorio.
4. Verificar que el respaldo contenga `tickets_soporte`, `incidentes_produccion`, `incidente_ticket` y `db_migration_history`.
5. Aplicar 017 únicamente con autorización y conservar el log completo de ejecución.
6. Ejecutar `scripts/check-017-helpdesk-consolidation.sql`. Los dos catálogos deben seguir vacíos hasta BD-3.
7. Ante un error antes de BD-3, restaurar preferentemente el respaldo completo. El rollback 017 solo es aceptable si las nueve columnas nuevas y ambos catálogos permanecen sin datos.

No usar Docker, no guardar contraseñas en comandos y no ejecutar el rollback de 016.

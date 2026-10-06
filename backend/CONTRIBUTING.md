# Contribuir al backend

## Acuerdos del equipo

- Crear una rama feature/<tema> desde la rama de integracion acordada y enviar un pull request; no subir directamente a main.
- Mantener cada PR centrado en un cambio e indicar problema, comportamiento resultante, pruebas y cambios de BD.
- No incorporar secretos, dumps con datos personales, target o configuracion local.
- Mantener nombres de clases descriptivos y coherentes con el modulo existente; no renombrar contratos JSON sin coordinar con frontend.
- Controller: HTTP y validacion. Service: reglas y transacciones. Repository: persistencia. No introducir SQL en controladores.
- Usar inyeccion por constructor y DTO para nuevas entradas/salidas. Nunca devolver entidades que expongan password_hash.
- Colocar las pruebas en el mismo paquete de la clase probada, bajo src/test/java.
- Incluir pruebas de errores y permisos para cambios de autenticacion; ejecutar mvn clean test antes del PR.
- Para modificar el esquema, agregar un SQL nuevo numerado con requisitos y procedimiento de aplicacion. No editar migraciones ya aplicadas ni usar ddl-auto=update como sustituto.
- Actualizar README y contratos cuando cambien las instrucciones de instalacion o la API.

## Revision del PR

Comprobar compatibilidad del frontend, acceso por rol, validaciones, transacciones y ausencia de secretos. Registrar las pruebas ejecutadas y sus limites. La prueba unitaria no demuestra una conexion real con MySQL.

## Organizacion de paquetes

Agregar cada funcionalidad en su módulo. Reclutamiento se divide en `job`, `application`, `interview` y `evaluation`; perfil, notificaciones y auditoría tienen módulos propios. Dentro de cada módulo usar `controller`, `service`, `repository` y `dto` cuando sean necesarios. Los servicios mantienen las transacciones y reglas; el SQL pertenece a los repositorios. `config` y `security` contienen infraestructura compartida, y `shared/api` contratos comunes pequeños. Las tareas programadas pertenecen al módulo que ejecutan; `bootstrap` contiene la inicialización opcional de cuentas de prueba.

Las pruebas específicas replican el paquete de producción; `integration` comprueba relaciones entre módulos y rutas HTTP con H2. Evitar carpetas vacías o capas sin responsabilidad. No incorporar prototipos inactivos al backend; SQL inicial en `database/schema` y cambios incrementales en `database/migrations`. Consultar [arquitectura de SRC](docs/arquitectura-src.md).

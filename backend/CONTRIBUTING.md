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

Agregar cada funcionalidad en su modulo (auth, identity, recruitment o health). Dentro del modulo usar controller, service, repository y dto cuando sean necesarios. config y security contienen infraestructura compartida. Evitar carpetas vacias o capas sin responsabilidad. Las pruebas replican el paquete de produccion. No incorporar prototipos inactivos al backend; SQL inicial en database/schema y cambios incrementales en database/migrations.

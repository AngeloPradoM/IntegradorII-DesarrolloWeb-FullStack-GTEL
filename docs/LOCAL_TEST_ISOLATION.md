# Entorno local y prueba de aislamiento

## Incidente registrado

**Síntoma:** una cuenta que no existía en `gtel_talento_test` podía iniciar sesión durante las pruebas.

**Causa:** el frontend se comunicaba correctamente con `localhost:8080`, pero la instancia activa de Spring Boot seguía conectada a `gtel_talento`. Las variables definidas en otra terminal no modificaron el proceso Java que ya estaba iniciado.

**Diagnóstico concluyente:** `information_schema.PROCESSLIST` mostró el pool de conexiones de Spring Boot con `DB = gtel_talento` mientras DBeaver estaba inspeccionando `gtel_talento_test`.

**Resolución:** detener la instancia anterior y arrancar una sola instancia del backend con `SPRING_DATASOURCE_URL` apuntando al esquema deseado.

## Configuración local acordada

```text
Frontend http://localhost:5173
    -> Backend http://localhost:8080
        -> MySQL localhost:3306
```

El frontend conserva `VITE_API_URL=http://localhost:8080` en `frontend/.env`. Para cambiar de base solo debe reiniciarse el backend.

### Base principal

```powershell
$env:SERVER_PORT="8080"
$env:SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/gtel_talento?useSSL=false&serverTimezone=America%2FLima&allowPublicKeyRetrieval=true"
$env:SPRING_DATASOURCE_USERNAME="root"
$env:SPRING_DATASOURCE_PASSWORD="TU_CONTRASEÑA_MYSQL"
$env:TEST_ACCESS_ENABLED="false"
mvn.cmd spring-boot:run
```

### Base de pruebas

```powershell
$env:SERVER_PORT="8080"
$env:SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/gtel_talento_test?useSSL=false&serverTimezone=America%2FLima&allowPublicKeyRetrieval=true"
$env:SPRING_DATASOURCE_USERNAME="root"
$env:SPRING_DATASOURCE_PASSWORD="TU_CONTRASEÑA_MYSQL"
$env:TEST_ACCESS_ENABLED="true"
mvn.cmd spring-boot:run
```

## Verificación obligatoria antes de probar

```sql
SELECT DB AS base_datos, COUNT(*) AS conexiones
FROM information_schema.PROCESSLIST
WHERE COMMAND = 'Sleep'
  AND DB IN ('gtel_talento', 'gtel_talento_test')
GROUP BY DB
ORDER BY DB;
```

Las conexiones `Sleep` del pool deben aparecer únicamente en la base elegida.

## Plan de prueba de aislamiento

1. `reclutador1@gmail.com` crea una solicitud Nivel 1.
2. `reclutador2@gmail.com` reporta una incidencia Nivel 2.
3. El Administrador revisa ambos registros.
4. El Administrador asigna la solicitud y la incidencia a `tecnico1@gmail.com`.
5. `tecnico1@gmail.com` debe visualizar y gestionar exclusivamente los dos registros asignados.
6. `tecnico2@gmail.com` no debe visualizar ni modificar esos registros.
7. Se debe intentar también el acceso directo por identificador para comprobar que el backend lo deniega.
8. Cada Reclutador debe visualizar exclusivamente sus propios tickets y el seguimiento permitido de sus relaciones.
9. Confirmar en MySQL solicitante, responsable, estados e historial.

## Resultado esperado

- El Técnico 1 ve todo lo que se le asignó.
- El Técnico 2 no recibe información asignada al Técnico 1.
- Cada Reclutador ve únicamente sus propias solicitudes o incidencias.
- El Administrador conserva visibilidad y control conforme a sus permisos.
- La denegación debe aplicarse en el backend, no solamente ocultarse en la interfaz.

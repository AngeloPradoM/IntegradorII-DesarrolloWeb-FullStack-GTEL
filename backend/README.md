# GTEL Talento Backend

Backend Spring Boot con Java 21, Maven, JPA y MySQL.

## Ejecutar

Requisitos: Java 21, Maven 3.9+ y MySQL.

```powershell
cd backend
mvn clean test
mvn spring-boot:run
```

Endpoint de salud: `GET http://localhost:8080/api/health`

Registro: `POST http://localhost:8080/api/auth/register`

Login: `POST http://localhost:8080/api/auth/login`

La configuración se encuentra en `src/main/resources/application.properties` y usa variables de entorno para la conexión MySQL.

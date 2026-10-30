# Guía de Despliegue con Docker Compose - GTEL Talento ATS

Esta guía describe cómo desplegar la plataforma unificada **GTEL Talento ATS** utilizando Docker y Docker Compose para entornos de prueba, demostración o producción.

---

## 📋 Requisitos Previos

1. **Docker Desktop** (versión 20.10 o superior) instalado y en ejecución en Windows, Linux o macOS.
2. **Docker Compose** (versión v2.0 o superior, incluido con Docker Desktop).
3. Puertos libres en la máquina anfitriona:
   - `80` (Frontend Nginx)
   - `8080` (Backend Spring Boot API)
   - `3306` (Base de datos MySQL 8)

> [!NOTE]
> Si tienes XAMPP u otra instancia de MySQL corriendo localmente en el puerto `3306`, detenla temporalmente antes de iniciar el contenedor de MySQL para evitar conflictos de puerto.

---

## 🚀 Puesta en Marcha (1 Solo Comando)

En la raíz del proyecto, ejecuta en tu terminal:

```bash
docker compose up -d --build
```

### ¿Qué hace este comando?
1. **Compila el Backend:** Descarga dependencias Maven y compila el JAR con Java 21 en una imagen ligera Alpine JRE.
2. **Compila el Frontend:** Ejecuta la compilación de Vite y monta los archivos estáticos en un servidor Nginx optimizado con compresión Gzip.
3. **Inicia MySQL:** Inicializa la base de datos `gtel_talento` e importa automáticamente todas las tablas relacionales y datos semilla desde `database/gtel_talento.sql`.
4. **Conecta los servicios:** Configura la red privada `gtel-network` y espera a que MySQL esté saludable (`healthcheck`) antes de conectar el backend.

---

## 🌐 URLs de Acceso

| Servicio | URL | Descripción |
| :--- | :--- | :--- |
| **Aplicación Web (Frontend)** | [http://localhost](http://localhost) | Portal de postulantes, reclutador y administración |
| **Backend REST API** | [http://localhost:8080](http://localhost:8080) | API REST Spring Boot |
| **Health Check** | [http://localhost:8080/api/health](http://localhost:8080/api/health) | Estado del servicio backend |
| **Base de Datos MySQL** | `localhost:3306` | Base de datos `gtel_talento` |

---

## Cuentas para desarrollo

El esquema contiene cuatro cuentas de demostración con hashes BCrypt. Sus contraseñas no se
publican en el repositorio. No cargues esas semillas en producción. El bypass OTP efectivo está
desactivado por defecto y requiere `TEST_ACCESS_ENABLED=true`; el `docker-compose.yml` local define
esa variable explícitamente. No uses esa configuración de Compose en producción. Las demás cuentas
usan OTP por correo.

---

## 🛑 Detener y Reiniciar el Sistema

### Detener los contenedores:
```bash
docker compose down
```

### Detener y eliminar volúmenes (reinicio limpio de base de datos):
```bash
docker compose down -v
```

### Ver logs en tiempo real:
```bash
docker compose logs -f
# O de un servicio específico:
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

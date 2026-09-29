# GTEL Talento — Sistema de Reclutamiento

Plataforma de selección de personal para candidatos y reclutadores de GTEL.

| Información | Detalle |
|---|---|
| Curso | Curso Integrador II — Desarrollo de Páginas Web |
| Docente | Por completar |
| Integrantes y responsabilidades | Por completar por el equipo |
| Arquitectura | React → API REST Spring Boot → MySQL |

> Registro e inicio de sesión conectados con MySQL. La integración completa de los módulos de negocio y la verificación por correo siguen pendientes. El laboratorio `index/` no es necesario para ejecutar este proyecto.

# Frontend

Interfaz web para consultar ofertas, registrar candidatos, iniciar sesión y acceder a las pantallas de postulaciones y reclutamiento.

## Stack técnico

Versiones declaradas en `frontend/package.json`; `package-lock.json` fija las dependencias instaladas con `npm ci`.

| Tecnología | Versión declarada | Función |
|---|---|---|
| React | ^19.2.8 | Componentes y estado |
| Vite | ^8.2.2 | Desarrollo y compilación |
| React Router | ^7.18.3 | Navegación |
| Tailwind CSS | ^4.3.3 | Estilos |
| Lucide React | ^1.43.0 | Iconos |
| Recharts | ^3.10.1 | Gráficos |
| ESLint | ^10.9.0 | Revisión del código |

## Prerrequisitos

| Herramienta | Versión de referencia | Descarga oficial |
|---|---|---|
| Node.js | 22.x, desde 22.12 | [Node.js](https://nodejs.org/en/download) |
| npm | Incluido con Node.js | [Node.js](https://nodejs.org/en/download) |
| Git | 2.x | [Git](https://git-scm.com/downloads) |
| VS Code | Estable; el proyecto no fija versión | [VS Code](https://code.visualstudio.com/Download) |

Los comandos de esta guía usan PowerShell en Windows. En Linux/macOS, usar `npm` y `mvn` sin `.cmd`.

## 1. Obtener el proyecto e instalar dependencias

Si todavía no lo clonaste, utiliza el comando del apartado **Backend → 1. Clonar el repositorio**. No necesitas clonarlo dos veces.

Desde la raíz del repositorio:

```powershell
cd frontend
npm.cmd ci
```

## 2. Configurar la API

Crear opcionalmente `frontend/.env.local`:

```dotenv
VITE_API_URL=http://localhost:8080
VITE_DATA_MODE=demo
```

Son los valores predeterminados. Registro y login utilizan el backend incluso con los demás módulos en modo `demo`. Cambiar a `api` no implementa los endpoints pendientes. No guardar secretos en variables `VITE_*`, porque son públicas.

## 3. Levantar el frontend

Desde `frontend/`:

```powershell
npm.cmd run dev
```

Abrir http://localhost:5173 o la dirección indicada por Vite. El backend debe estar iniciado para registrarse e ingresar. Si cambia el puerto del frontend, ajustar también los orígenes CORS del backend.

## 4. Pruebas y compilación

```powershell
npm.cmd run lint
node --test --test-concurrency=1 tests/*.test.mjs
npm.cmd run build
```

La compilación genera `dist/`. Las pruebas automatizadas no sustituyen el recorrido real en navegador. `tests/browser-flows.mjs` conserva escenarios demo con OTP y requiere adaptación antes de reutilizarlo.

## 5. Estructura del frontend

```text
frontend/
├── src/
│   ├── components/      # Componentes, formularios y modales
│   ├── context/         # Estado de autenticación
│   ├── hooks/           # Lógica reutilizable
│   ├── layouts/         # Estructuras de página
│   ├── pages/           # Pantallas de candidato y reclutador
│   ├── routes/          # Navegación y rutas protegidas
│   ├── services/        # Comunicación con API y servicios demo
│   └── utils/           # Funciones auxiliares
├── public/              # Archivos estáticos
├── scripts/             # Herramientas de desarrollo
├── tests/               # Pruebas automatizadas
├── package.json         # Dependencias y comandos
└── vite.config.js       # Configuración de Vite
```

# Backend

API REST de GTEL Talento. Gestiona el registro, la autenticación por correo y contraseña, la emisión de tokens JWT y las consultas de reclutamiento. Utiliza MySQL para persistir los datos y organiza el código por funcionalidades.

## Stack técnico

| Tecnología | Versión | Función |
|---|---|---|
| Java | 21 | Lenguaje y runtime |
| Spring Boot | 3.5.5 | Servidor y configuración |
| Spring Web | Gestionada por Spring Boot | API REST |
| Spring Data JPA / Hibernate | Gestionada por Spring Boot | Persistencia y validación del esquema |
| Spring Security / BCrypt | Gestionada por Spring Boot | Autorización y hash de contraseñas |
| JJWT | 0.12.6 | Firma y validación de JWT |
| MySQL Connector/J | Gestionada por Spring Boot | Conexión JDBC |
| JUnit / Mockito | Gestionada por Spring Boot | Pruebas |

Las dependencias Java se descargan mediante Maven según `backend/pom.xml`; no se instalan manualmente.

## Prerrequisitos

| Herramienta | Versión requerida o de referencia | Descarga oficial |
|---|---|---|
| JDK | 21; seleccionar JDK 21 en la página | [Oracle JDK](https://www.oracle.com/java/technologies/downloads/#java21) |
| Apache Maven | 3.9.x; utilizado anteriormente: 3.9.16 | [Maven](https://maven.apache.org/download.cgi) |
| MySQL Server | 8.x para la instalación de referencia; SQL requiere al menos 8.0.13 | [MySQL Community](https://dev.mysql.com/downloads/) |
| DBeaver Community | 26.2.1 como referencia; no fijada por el proyecto | [DBeaver](https://dbeaver.io/download/) |
| VS Code | Versión estable; no fijada por el proyecto | [VS Code](https://code.visualstudio.com/Download) |
| Extension Pack for Java | Versión compatible con tu VS Code | [Extensión Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack) |
| Spring Boot Extension Pack | Versión compatible con tu VS Code | [Extensiones Spring](https://marketplace.visualstudio.com/items?itemName=vmware.vscode-boot-dev-pack) |
| Git | 2.x | [Git](https://git-scm.com/downloads) |

Las versiones de herramientas auxiliares son referencias, no una declaración de que todas se hayan probado juntas. DBeaver es un cliente: no reemplaza a MySQL Server. Cada integrante configura su propia instalación local.

Comprobar que Java y Maven estén disponibles en `PATH` y que Maven utilice Java 21:

```powershell
java -version
mvn.cmd -version
git --version
```

## 1. Clonar el repositorio

```powershell
git clone https://github.com/AngeloPradoM/IntegradorII-DesarrolloWeb-FullStack-GTEL.git
cd IntegradorII-DesarrolloWeb-FullStack-GTEL
```

Repositorio: [IntegradorII-DesarrolloWeb-FullStack-GTEL](https://github.com/AngeloPradoM/IntegradorII-DesarrolloWeb-FullStack-GTEL).

## 2. Crear la base de datos en DBeaver

### 2.1. Conectar MySQL

1. Iniciar el servicio MySQL y abrir DBeaver.
2. Seleccionar **New Database Connection** (ícono de conexión).
3. Elegir **MySQL → Next**.
4. Completar los datos siguientes.

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Port | `3306` |
| Username | `root`, o tu usuario MySQL local |
| Password | Contraseña de tu MySQL local |

5. En **Driver properties**, configurar `allowPublicKeyRetrieval=true` y `useSSL=false` para esta conexión de desarrollo local.
6. Seleccionar **Test Connection** y descargar el driver si DBeaver lo solicita. La conexión debe resultar satisfactoria.
7. Seleccionar **Finish**.

### 2.2. Crear la base de datos

Abrir un editor SQL asociado a la conexión y ejecutar:

```sql
CREATE DATABASE IF NOT EXISTS gtel_talento
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Ejecutar la sentencia con `Ctrl + Enter` o la acción **Execute SQL Statement**. Actualizar la conexión con **Refresh** y verificar que aparezca `gtel_talento`.

### 2.3. Crear las tablas y roles

Abrir [backend/database/schema/gtel_talento.sql](backend/database/schema/gtel_talento.sql) mediante **SQL Editor → Open SQL Script**, asociarlo a la conexión y ejecutar el script completo con **Execute SQL Script**.

El script incluye `CREATE DATABASE IF NOT EXISTS`, por lo que admite la base vacía creada en el paso anterior. Crea 12 tablas y los roles `CANDIDATO` y `RECLUTADOR`, pero no cuentas de usuario.

**Aplicar solo en una base sin tablas.** No volver a ejecutar el script inicial sobre una BD con datos. La migración histórica `001_postulante_telefono.sql` tampoco se aplica si ya existe la columna `telefono`.

```sql
USE gtel_talento;
SHOW TABLES;
SELECT id, nombre FROM roles;
```

## 3. Configurar el proyecto

`backend/src/main/resources/application.properties` define la configuración compartida: puerto, URL de MySQL, importación del archivo local y validación del esquema. Las credenciales privadas se configuran en `backend/config/local.properties`, que está excluido de Git.

Si no existe, copiar `backend/config/local.properties.example` como `backend/config/local.properties`. Si ya existe, editarlo conservando su clave JWT.

```properties
spring.datasource.username=root
spring.datasource.password=TU_PASSWORD_AQUI
jwt.secret=TU_CLAVE_ALEATORIA_PRIVADA_DE_AL_MENOS_32_BYTES
```

Sustituir `TU_PASSWORD_AQUI` por la contraseña de MySQL. Dejarla vacía únicamente si ese usuario MySQL realmente no tiene contraseña.

Generar una clave JWT con Node.js (instalado para el frontend) y copiar el resultado a `jwt.secret`:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

JWT identifica las solicitudes autenticadas; no verifica el correo. Conservar la clave entre reinicios. No publicar este archivo ni copiar claves privadas al README.

| Configuración | Valor predeterminado / uso |
|---|---|
| `DB_URL` | JDBC hacia `localhost:3306/gtel_talento` |
| `DB_USERNAME` | `root` |
| `DB_PASSWORD` | Contraseña MySQL si se utiliza variable de entorno |
| `JWT_SECRET` | Alternativa a `jwt.secret` local |
| `SERVER_PORT` | `8080` |
| `FRONTEND_URL` | `http://localhost:5173,http://127.0.0.1:5173` |
| `JWT_EXPIRATION_MS` | `3600000` (una hora) |
| `JPA_DDL_AUTO` | `validate` |

Spring no carga `.env` automáticamente. Usar variables del proceso/IDE o el archivo local anterior. Arrancar desde `backend/` para resolver `./config/local.properties`.

## 4. Levantar el servidor

### Opción A — VS Code con Spring Boot Dashboard

1. Instalar las extensiones Java y Spring indicadas en prerrequisitos.
2. Abrir **File → Open Folder** y seleccionar **la carpeta `backend`**.
3. Esperar que Maven importe el proyecto y descargue las dependencias.
4. Abrir **Spring Boot Dashboard**.
5. Seleccionar ▶ en la aplicación correspondiente a `gtel-talento-backend` / `GtelTalentoApplication`.
6. Comprobar que el log muestre `Started GtelTalentoApplication`.

Abrir directamente `backend/` facilita que el directorio de ejecución coincida con la ruta de configuración local. Si el IDE utiliza otro directorio, ajustar su configuración de ejecución.

### Opción B — Terminal

Desde la raíz del repositorio:

```powershell
cd backend
mvn.cmd spring-boot:run
```

Si Maven no puede acceder a su caché predeterminada:

```powershell
mvn.cmd "-Dmaven.repo.local=$env:USERPROFILE\.m2\repository" spring-boot:run
```

### Verificar

- Servidor: http://localhost:8080
- Salud básica: http://localhost:8080/api/health

**Hibernate no crea tablas ni inserta datos automáticamente en este proyecto:** `ddl-auto=validate` comprueba el esquema creado previamente mediante SQL. Actualizar DBeaver para consultar las tablas.

## 5. Comprobar el funcionamiento

1. Mantener MySQL, backend y frontend encendidos.
2. Registrar un candidato o utilizar las cuentas de prueba previamente creadas.
3. Iniciar sesión seleccionando el tipo de usuario correcto.
4. Recargar la página para comprobar la recuperación de sesión.
5. Cerrar sesión y verificar que una contraseña incorrecta sea rechazada.

Desde `backend/`, ejecutar pruebas unitarias:

```powershell
mvn.cmd clean test
```

Las pruebas no crean usuarios en MySQL y no sustituyen la comprobación real de conexión. El cierre de sesión elimina el token del navegador; la revocación del JWT en el servidor está pendiente.

| Error | Qué revisar |
|---|---|
| `JWT_SECRET` sin resolver | Configurar `jwt.secret` local y arrancar desde `backend/` |
| `Access denied ... using password: NO` | Falta la contraseña MySQL local |
| Tabla inexistente | Importar el esquema inicial en la base correcta |
| Rol CANDIDATO inexistente | Comprobar los registros de `roles` |
| Puerto 8080 ocupado | Detener la instancia duplicada o configurar otro puerto |
| Frontend no conecta | URL de API, puerto y orígenes CORS |

## 6. Credenciales de prueba

| Tipo de acceso | Rol | Correo | Contraseña de prueba |
|---|---|---|---|
| Candidato | `CANDIDATO` | `postulante1@gmail.com` | `Postulante2026!` |
| Reclutador | `RECLUTADOR` | `reclutador1@gmail.com` | `Reclutador2026!` |

Estas cuentas deben existir previamente en MySQL. El script inicial del esquema no las precarga. Guardar las contraseñas como hash BCrypt en `usuarios.password_hash`; el candidato también necesita un registro en `postulantes`. El registro público no crea reclutadores.

Los IDs de los roles se consultan en `roles`; no asumir que siempre serán 1 y 2. Son credenciales públicas de desarrollo, no de producción ni de Gmail. Antes de activar correos reales, utilizar direcciones controladas por el equipo.

## 7. Estructura del backend

```text
backend/
├── src/main/java/pe/com/gtel/talento/
│   ├── GtelTalentoApplication.java  # Punto de entrada Spring Boot
│   ├── auth/                       # Autenticación: controller, service, dto
│   ├── identity/                   # Usuarios y perfiles: entity, repository
│   ├── recruitment/                # Reclutamiento: controller, service, repository
│   ├── health/                     # Endpoint de salud
│   ├── config/                     # Configuración Spring y CORS
│   └── security/                   # Firma JWT y filtro de autenticación
├── src/main/resources/
│   └── application.properties      # Configuración compartida
├── src/test/java/                  # Pruebas por módulo
├── config/
│   ├── local.properties            # Configuración privada; no versionar
│   └── local.properties.example    # Plantilla para el equipo
├── database/
│   ├── schema/                     # Instalación inicial de la BD
│   └── migrations/                 # Cambios manuales históricos
├── target/                         # Generado por Maven; no versionar
├── CONTRIBUTING.md                 # Convenciones de colaboración
└── pom.xml                         # Dependencias y configuración Maven
```

Las solicitudes recorren Controller → Service → Repository → MySQL. La configuración local, las dependencias descargadas y los archivos compilados no deben subirse a GitHub.

## 8. Tablas MySQL

Esquema: `gtel_talento`, codificación `utf8mb4`.

| Tabla | Función | Relaciones principales |
|---|---|---|
| `roles` | Tipos de acceso | Referenciada por `usuarios` |
| `departamentos` | Áreas de trabajo | Referenciada por requerimientos y vacantes |
| `usuarios` | Cuentas, hash de contraseña y estado | `rol_id` → roles |
| `postulantes` | Perfil profesional del candidato | `usuario_id` → usuarios (único) |
| `requerimientos_personal` | Solicitudes de contratación | Departamento y usuario solicitante |
| `vacantes` | Ofertas laborales | Requerimiento, departamento y reclutador |
| `postulaciones` | Candidaturas a vacantes | Postulante y vacante |
| `postulacion_timeline` | Historial de estados | Postulación y usuario |
| `entrevistas` | Agenda de entrevistas | Postulación |
| `evaluaciones` | Resultados de evaluación | Postulación y usuario evaluador |
| `evaluacion_detalle` | Criterios y puntajes | Evaluación |
| `auditoria` | Registro de acciones | Usuario responsable |

La existencia de estas tablas no significa que todos sus módulos estén integrados con el frontend.

Consultar las cuentas sin exponer los hashes:

```sql
SELECT u.id, u.email, r.nombre AS rol,
       p.nombres, p.apellidos
FROM gtel_talento.usuarios u
JOIN gtel_talento.roles r ON r.id = u.rol_id
LEFT JOIN gtel_talento.postulantes p ON p.usuario_id = u.id
ORDER BY u.id;
```

## 9. Endpoints principales

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/health` | Salud básica |
| POST | `/api/auth/register` | Registro público de candidato |
| POST | `/api/auth/login` | Login con correo, contraseña y rol |
| GET | `/api/auth/me` | Perfil actual con Bearer token |
| POST | `/api/auth/logout` | Indicación de eliminar token local |
| GET | `/api/recruiter/candidates` | Consulta de candidatos |
| GET | `/api/recruiter/interviews` | Consulta de entrevistas |
| GET | `/api/recruiter/evaluations` | Consulta de evaluaciones |
| GET | `/api/recruiter/dashboard` | Resumen de reclutamiento |

Las rutas de reclutamiento requieren rol RECLUTADOR. Registro devuelve ID de postulante; login y `/me`, ID de usuario. La verificación por correo sigue pendiente.

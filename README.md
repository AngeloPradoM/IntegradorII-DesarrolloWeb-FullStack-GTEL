# GTEL Talento — Sistema de Reclutamiento (ATS)

Plataforma web para candidatos y reclutadores de un call center de telecomunicaciones, orientada a la gestión de ofertas y procesos de selección de personal.

> **Avance actual:** registro e inicio de sesión conectados con Spring Boot y MySQL. La verificación por correo y la integración completa de los módulos de negocio siguen pendientes.

## 1. Información del proyecto

| Campo | Información |
|---|---|
| Proyecto | GTEL Talento |
| Curso | Curso Integrador II — Desarrollo de Páginas Web |
| Universidad / ciclo | Por completar |
| Docente / responsable | Por completar |
| Repositorio | [GTEL en GitHub](https://github.com/AngeloPradoM/IntegradorII-DesarrolloWeb-FullStack-GTEL) |
| Arquitectura | React → API REST Spring Boot → MySQL |

### Alcance de esta versión

| Funcionalidad | Estado |
|---|---|
| Registro público | Crea usuario y postulante en MySQL; contraseña con hash BCrypt |
| Login | Valida credenciales y rol; emite JWT |
| Recuperación de sesión | Consulta `/api/auth/me` al recargar |
| Cierre de sesión | Elimina token local; no lo revoca en el servidor |
| Edición de perfil real | Bloqueada hasta conectar su endpoint |
| Ofertas y postulaciones | Interfaz disponible; integración completa con MySQL pendiente |
| Reclutamiento | Interfaz y consultas backend disponibles; integración completa pendiente |
| Verificación por correo | Pendiente; referencias aisladas del backend activo |

## 2. Stack tecnológico y herramientas

| Capa / herramienta | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, React Router 7 |
| Estilos e iconos | Tailwind CSS 4, Lucide React |
| Gráficos | Recharts 3 |
| Backend | Java 21, Spring Boot 3.5.5 |
| Persistencia | Spring Data JPA / Hibernate, MySQL Connector/J |
| Autenticación | Spring Security, BCrypt, JWT |
| Dependencias | npm y Maven 3.9.x |
| Runtime frontend | Node.js 22.12 o superior compatible con Vite |
| Base de datos | MySQL 8.x; mínimo 8.0.13 para el script suministrado |
| Cliente de BD | DBeaver |
| IDE | VS Code o IntelliJ IDEA |
| Versionado | Git / GitHub |

**DBeaver es un cliente:** MySQL Server debe estar instalado y ejecutándose por separado. Cada integrante puede usar su BD local. Clonar el repositorio no copia los datos de otro equipo.

## 3. Instalación y configuración

### 3.1. Prerrequisitos

Instalar las herramientas anteriores y comprobar:

```powershell
git --version
java -version
mvn.cmd -version
node --version
npm.cmd --version
```

Los comandos usan PowerShell en Windows. En Linux/macOS usar `mvn` y `npm` sin `.cmd`.

### 3.2. Clonar el repositorio

```powershell
git clone https://github.com/AngeloPradoM/IntegradorII-DesarrolloWeb-FullStack-GTEL.git
cd IntegradorII-DesarrolloWeb-FullStack-GTEL
```

### 3.3. Crear la BD con DBeaver

1. Iniciar MySQL Server.
2. Crear una conexión MySQL en DBeaver con los parámetros siguientes.
3. Probar la conexión; permitir la descarga del driver si se solicita.
4. Abrir [backend/database/gtel_talento.sql](backend/database/gtel_talento.sql) en el editor SQL de esa conexión.
5. Ejecutar el script completo sobre una instalación nueva, sin tablas previas.
6. Actualizar el navegador de bases y seleccionar `gtel_talento`.

| Parámetro | Valor local |
|---|---|
| Host | `localhost` |
| Puerto | `3306` |
| Usuario | Usuario configurado en MySQL |
| Contraseña | Contraseña de ese usuario |
| Base | `gtel_talento`, una vez creado el esquema |

El script, basado en el esquema compartido por el equipo, crea 12 tablas e inserta los roles `CANDIDATO` y `RECLUTADOR`. No contiene cuentas ni secretos. El teléfono admite 16 caracteres incluyendo `+`.

**No ejecutarlo sobre la BD de trabajo existente.** Es una instalación inicial, no una migración. La migración histórica `001_postulante_telefono.sql` tampoco se aplica a esta instalación: la columna ya existe.

```sql
USE gtel_talento;
SHOW TABLES;
SELECT id, nombre FROM roles;
```

Hibernate usa `ddl-auto=validate`: valida el esquema, pero no lo crea ni actualiza. Los scripts se ejecutan manualmente. El nuevo script de instalación no se ha ejecutado sobre la BD existente.

### 3.4. Configuración del backend

Desde la raíz:

```powershell
New-Item -ItemType Directory -Force backend/config
```

Crear `backend/config/local.properties`, sustituyendo los valores entre `<...>`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/gtel_talento?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=<usuario_mysql_local>
spring.datasource.password=<contrasena_mysql_local>
jwt.secret=<clave_aleatoria_privada_de_al_menos_32_bytes>
```

Generar una clave y copiar el resultado a `jwt.secret`:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

El archivo local está excluido de Git. Spring lo importa al arrancar desde `backend/`. Conservar la clave entre reinicios.

También pueden configurarse variables de entorno:

| Variable | Uso |
|---|---|
| `DB_URL` | URL JDBC |
| `DB_USERNAME` | Usuario MySQL |
| `DB_PASSWORD` | Contraseña MySQL |
| `JWT_SECRET` | Firma privada de JWT |
| `SERVER_PORT` | Puerto HTTP; por defecto `8080` |
| `FRONTEND_URL` | Origen permitido; por defecto `http://localhost:5173` |
| `JPA_DDL_AUTO` | Mantener `validate` |

Spring **no carga `.env` automáticamente**. Usar el archivo local o variables del proceso/IDE. No se necesitan credenciales de Gmail en esta etapa.

### 3.5. Instalar el frontend

```powershell
cd frontend
npm.cmd ci
```

Opcionalmente crear `frontend/.env.local`:

```dotenv
VITE_API_URL=http://localhost:8080
VITE_DATA_MODE=demo
```

Registro y login llaman al backend incluso con los demás módulos en `demo`. Cambiar globalmente a `api` no implementa las operaciones pendientes. Las variables `VITE_*` son públicas: no colocar secretos en ellas.

## 4. Cómo ejecutar el proyecto

Con MySQL encendido, abrir dos terminales desde la raíz.

**Terminal 1 — backend:**

```powershell
cd backend
mvn.cmd spring-boot:run
```

**Terminal 2 — frontend:**

```powershell
cd frontend
npm.cmd run dev
```

| Servicio | Dirección |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080 |
| Salud básica | http://localhost:8080/api/health |

Si Vite utiliza otro puerto, revisar el origen permitido en Spring. Reiniciar los procesos después de cambiar la configuración.

### Verificar el flujo

1. Registrar una cuenta desde el frontend.
2. Ingresar con correo, contraseña y tipo **Candidato**.
3. Comprobar el nombre del usuario en el encabezado.
4. Recargar y verificar la recuperación de sesión.
5. Cerrar sesión y comprobar que una contraseña incorrecta sea rechazada.
6. Consultar los registros en DBeaver sin mostrar hashes:

```sql
SELECT u.id, u.email, r.nombre AS rol,
       p.nombres, p.apellidos, p.telefono
FROM usuarios u
JOIN roles r ON r.id = u.rol_id
LEFT JOIN postulantes p ON p.usuario_id = u.id
ORDER BY u.id DESC;
```

### Pruebas y compilación

Desde `frontend/`:

```powershell
npm.cmd run lint
node --test --test-concurrency=1 tests/*.test.mjs
npm.cmd run build
```

Desde `backend/`:

```powershell
mvn.cmd clean test
```

El build genera `frontend/dist/`. Las pruebas automatizadas no sustituyen el recorrido de navegador con una BD real. `browser-flows.mjs` conserva escenarios demo anteriores con OTP y requiere adaptación.

### Problemas frecuentes

| Síntoma | Revisar |
|---|---|
| Conexión MySQL rechazada | Servicio, puerto y credenciales |
| Tabla ausente al iniciar | Importación del SQL y nombre de BD |
| Rol CANDIDATO inexistente | Datos iniciales de `roles` |
| Error JWT | Clave privada y arranque desde `backend/` |
| Puerto 8080 ocupado | Otra instancia del backend |
| Frontend no conecta | URL de API, origen permitido y arranque de Spring |
| Cuenta demo no ingresa | Registrar cuenta real; localStorage no se migra a MySQL |
| Caché Maven inaccesible | Usar el comando siguiente desde `backend/` |

```powershell
mvn.cmd "-Dmaven.repo.local=$env:USERPROFILE\.m2\repository" spring-boot:run
```

## 5. Credenciales de prueba

**El script no precarga usuarios.**

| Tipo | Acceso |
|---|---|
| Candidato | Registrarse y usar las credenciales elegidas |
| Reclutador | Cuenta existente en MySQL con rol `RECLUTADOR` y hash BCrypt válido; el registro público no crea reclutadores |
| Administrador del laboratorio | Pertenece a `index/`, no al backend Spring |

No reutilizar los antiguos accesos demo como credenciales reales ni guardar contraseñas en texto plano en `password_hash`.

## 6. Endpoints principales y módulos

Base: `http://localhost:8080`.

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/health` | Salud básica |
| POST | `/api/auth/register` | Crear candidato: nombres, apellidos, email, password, telefono |
| POST | `/api/auth/login` | Autenticar: email, password, rol |
| GET | `/api/auth/me` | Perfil con `Authorization: Bearer <token>` |
| POST | `/api/auth/logout` | Mensaje para eliminación local del token; sin revocación |
| GET | `/api/recruiter/candidates` | Consulta de candidatos para reclutador |
| GET | `/api/recruiter/interviews` | Consulta de entrevistas para reclutador |
| GET | `/api/recruiter/evaluations` | Consulta de evaluaciones para reclutador |
| GET | `/api/recruiter/dashboard` | Datos del panel para reclutador |

Registro responde `201`. Login devuelve perfil, token, `authenticated=true` y `requiresOtp=false`. El ID de registro es de postulante; el de login y `/me` es de usuario. Los endpoints OTP no están activos.

| Ruta frontend | Pantalla |
|---|---|
| `/` | Inicio y modales de autenticación |
| `/ofertas` | Ofertas laborales |
| `/ofertas/:id` | Detalle de oferta |
| `/mis-postulaciones` | Postulaciones del candidato |
| `/perfil` | Perfil |
| `/reclutador/dashboard` | Panel de reclutamiento |

## 7. Estructura y arquitectura

```text
IntegradorII-DesarrolloWeb-FullStack-GTEL/
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes y modales
│   │   ├── context/         # Estado de autenticación
│   │   ├── hooks/           # Comportamiento reutilizable
│   │   ├── layouts/         # Estructuras de página
│   │   ├── pages/           # Candidato y reclutador
│   │   ├── routes/          # Rutas y protección
│   │   └── services/        # Comunicación con API
│   ├── tests/
│   └── docs/
├── backend/
│   ├── src/main/java/       # Controllers, services, repositories y entities
│   ├── src/main/resources/  # Configuración Spring
│   ├── src/test/            # Pruebas
│   ├── config/             # Configuración local privada
│   ├── database/           # SQL de instalación inicial
│   ├── migrations/         # Migraciones históricas manuales
│   ├── docs/               # Diagnósticos
│   └── step2-reference/    # Referencia OTP fuera de compilación
└── index/                  # Laboratorio independiente
```

`index/` no es necesario para ejecutar React + Spring. Su servidor, configuración y BD son independientes.

Documentación: [backend](backend/README.md), [autenticación React](frontend/docs/registro-spring.md), [paso 2](backend/step2-reference/README.md).

## 8. Integrantes del equipo y roles

Completar los datos confirmados antes de la entrega académica.

| Integrante | Responsabilidad |
|---|---|
| Por completar | Coordinación |
| Por completar | Frontend |
| Por completar | Backend y base de datos |
| Por completar | Pruebas y documentación |

### Trabajo colaborativo

- `main`: rama estable.
- `develop`: integración del equipo.
- `feature/<descripcion>`: trabajo individual con pull request.

Compartir el esquema SQL y archivos de ejemplo; conservar claves JWT, contraseñas y configuración local fuera de Git. Cada integrante crea su propia instalación sin publicar datos personales.

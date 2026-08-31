# GTEL Talento - Sistema Web de Reclutamiento y ATS

Plataforma web responsiva desarrollada para centralizar la gestión de postulantes, ofertas laborales y procesos de selección (ATS) de **GTEL Telecomunicaciones E.I.R.L.** (campañas de Claro Hogar y Portabilidad). El sistema está estructurado mediante una arquitectura modular basada en **Atomic Design**, utilizando React para el frontend y una base de datos relacional MySQL.

---

##Estructura del Repositorio

El proyecto se encuentra dividido en dos entornos principales ubicados en la raíz del repositorio:
* `/frontend`: Aplicación cliente desarrollada en React.
* `/backend`: Servidor y lógica de conexión con MySQL Workbench.

---

## Guía de Flujo de Trabajo Colaborativo (Git Branching Strategy)

Este proyecto utiliza un modelo de ramas basado en `develop` para asegurar la estabilidad del código y un control de cambios ordenado antes de llegar a producción (`main`).

### 1. Preparación Inicial
Antes de comenzar a programar cualquier tarea o característica, asegúrate de tener tu entorno local sincronizado con la rama de desarrollo:

```bash
git checkout develop
git pull origin develop

## Subir avances al repositorio

Todos los avances deben realizarse mediante una rama propia y posteriormente integrarse a la rama `develop` mediante un Pull Request.

### 1. Actualizar la rama `develop`

Antes de comenzar cualquier tarea, actualizar la versión local del proyecto:

```bash
git checkout develop
git pull origin develop
```

### 2. Crear una rama para el avance

Crear una nueva rama a partir de `develop`:

```bash
git checkout -b feature/nombre-del-avance
```

Ejemplo:

```bash
git checkout -b feature/login
```

La rama debe tener un nombre descriptivo y no debe contener espacios.

### 3. Realizar los cambios

Desarrollar la tarea correspondiente dentro de la nueva rama.

Para verificar los archivos modificados:

```bash
git status
```

### 4. Agregar los cambios

Cuando el avance esté listo:

```bash
git add .
```

### 5. Crear el commit

Registrar los cambios con un mensaje descriptivo:

```bash
git commit -m "feat: descripcion del avance"
```

Ejemplo:

```bash
git commit -m "feat: agregar formulario de login"
```

### 6. Subir la rama a GitHub

Subir la rama al repositorio remoto:

```bash
git push -u origin feature/nombre-del-avance
```

Ejemplo:

```bash
git push -u origin feature/login
```

### 7. Crear el Pull Request

Ingresar al repositorio en GitHub y crear un Pull Request con la siguiente configuración:

```text
Base: develop
Compare: feature/nombre-del-avance
```

La rama de trabajo siempre debe solicitar la integración hacia `develop`.

### 8. Revisión del Pull Request

El Pull Request debe ser revisado por otro integrante del equipo.

Si se solicitan cambios, realizar las modificaciones en la misma rama:

```bash
git add .
git commit -m "fix: corregir observaciones del pull request"
git push
```

Los nuevos cambios se agregarán automáticamente al Pull Request existente.

### 9. Integrar los cambios a `develop`

Una vez aprobado el Pull Request, se realizará el Merge hacia `develop`.

El flujo será:

```text
develop
   |
   | crear rama
   v
feature/nombre-del-avance
   |
   | desarrollo
   v
commit
   |
   | push
   v
GitHub
   |
   | Pull Request
   v
develop
```

### 10. Después del Merge

Una vez integrado el avance, actualizar nuevamente la rama `develop` local:

```bash
git checkout develop
git pull origin develop
```

La rama utilizada para el avance puede eliminarse después de completar el Merge.

```bash
git branch -d feature/nombre-del-avance
```

### Flujo completo

```bash
git checkout develop
git pull origin develop

git checkout -b feature/nombre-del-avance

# Realizar cambios

git status
git add .
git commit -m "feat: descripcion del avance"

git push -u origin feature/nombre-del-avance
```

Posteriormente:

```text
GitHub
   ↓
Pull Request
   ↓
feature/nombre-del-avance → develop
   ↓
Revisión
   ↓
Aprobación
   ↓
Merge
```

### Importante

No realizar commits directamente sobre `develop`.

No realizar Pull Requests directamente hacia `main`.

El flujo establecido es:

```text
feature → develop → main
```

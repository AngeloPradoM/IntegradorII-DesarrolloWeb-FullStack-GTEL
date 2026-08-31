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

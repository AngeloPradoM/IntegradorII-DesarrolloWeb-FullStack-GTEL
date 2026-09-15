# GTEL Talento — Sistema de Reclutamiento (ATS)

**Curso:** Curso Integrador II - Desarrollo de Páginas Web
**Docente:** [nombre del docente]
**Stack Frontend:** React + Vite + Tailwind CSS v4 + React Router
**Stack Backend:** Spring Boot (Java) + MySQL *(en desarrollo)*

> GTEL Talento es un sistema ATS (Applicant Tracking System) para un call
> center de telecomunicaciones. Permite a candidatos postular a ofertas
> laborales y dar seguimiento a sus procesos, y a reclutadores gestionar
> vacantes, candidatos, entrevistas y evaluaciones desde un panel
> administrativo.

---

## 1. Prerequisitos

| Herramienta | Versión |
|---|---|
| Node.js | 20+ |
| npm | 10+ |

---

## 2. Instalación

```bash
git clone https://github.com/AngeloPradoM/IntegradorII-DesarrolloWeb-FullStack-GTEL.git
cd IntegradorII-DesarrolloWeb-FullStack-GTEL/frontend
npm install
```

---

## 3. Levantar en desarrollo

```bash
npm run dev
```

Abrir `http://localhost:5173`.

---

## 4. Build de producción

```bash
npm run build
```

Salida en `frontend/dist/`.

---

## 5. Backend

El backend se está desarrollando en `backend/` con **Spring Boot + MySQL**
(diseñado con MySQL Workbench). Actualmente en construcción — la
integración con el frontend (Axios → Spring Boot → JPA/Hibernate → MySQL)
se documentará aquí una vez esté disponible.

---

## 6. Estructura
frontend/src/
├── components/
│ ├── common/ # Componentes reutilizables (Button, Badge, SearchBar)
│ ├── layout/ # Piezas estructurales (Footer)
│ └── sections/ # Bloques grandes propios de una pantalla (Hero, JobCard, etc.)
├── layouts/ # Moldes de página (PublicLayout, DashboardLayout)
├── pages/
│ ├── candidato/ # Home, Ofertas, Postulación, Mis Postulaciones
│ ├── reclutador/ # Panel ATS (Dashboard, Publicar Oferta, etc.)
│ └── auth/ # Login unificado
├── routes/ # Rutas centralizadas (AppRoutes.jsx)
├── hooks/
├── services/ # Llamadas a la API (cuando el backend esté listo)
├── context/
└── utils/

---

## 7. Pantallas del sistema

**Vista Candidato**
- Landing Page (Home)
- Ofertas Laborales
- Formulario de Postulación
- Mis Postulaciones

**Acceso común**
- Login Unificado (Soy Candidato / Soy Reclutador)

**Vista Reclutador (Panel ATS)**
- Dashboard
- Publicar Oferta
- Directorio de Postulantes
- Agenda de Entrevistas
- Evaluaciones
- Perfil del Candidato

---

## 8. Guía de estilo

| Elemento | Valor |
|---|---|
| Fondo general | `#F8FAFC` |
| Tarjetas | `#FFFFFF` |
| Acento / botones | `#D32F2F` (rojo corporativo) |
| Textos / menús | `#1E293B` (azul marino) |
| Texto secundario | `#475569` |
| Tipografía | Inter |

---

## 9. Convenciones de Git

- `main`: rama estable, solo recibe merges desde `develop`.
- `develop`: rama de integración del equipo.
- Trabajo individual: ramas `feature/<descripcion>` creadas desde `develop`,
  con Pull Request de vuelta a `develop`. Nunca se trabaja directo sobre
  `main` ni `develop`.

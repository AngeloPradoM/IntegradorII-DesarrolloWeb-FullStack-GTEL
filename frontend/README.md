# Frontend GTEL Talento

Aplicación React 19 + Vite para candidatos, reclutadores y administradores. Consume la API Spring Boot de GTEL Talento y no almacena credenciales privadas en el navegador.

## Estructura

```text
frontend/
├── public/                 Recursos públicos
├── src/
│   ├── assets/             Imágenes importadas por la aplicación
│   ├── components/         Componentes reutilizables y elementos de interfaz
│   ├── context/            Estado global de autenticación
│   ├── hooks/              Lógica reutilizable
│   ├── layouts/            Estructuras de páginas públicas y privadas
│   ├── mocks/              Datos limitados para pruebas y compatibilidad
│   ├── pages/              Vistas por actor: admin, candidato y reclutador
│   ├── routes/             Rutas públicas y protegidas
│   ├── services/           Comunicación y adaptación de la API
│   └── utils/              Validaciones y funciones auxiliares
├── docs/                   Diseño, integración e historial técnico
├── scripts/                Herramientas de revisión visual
├── tests/                  Pruebas de contratos y recorridos de navegador
├── .env.example            Plantilla pública de configuración
├── package.json            Dependencias y comandos
└── vite.config.js          Configuración de Vite
```

Consulta el [índice de documentación](docs/README.md) para distinguir guías vigentes de informes históricos.

## Requisitos

- Node.js 24.x.
- npm 11.x.
- Backend disponible en `http://localhost:8080` para los recorridos integrados.

## Instalación

Desde `frontend/`:

```powershell
npm.cmd ci
```

## Configuración local

Crear el archivo privado a partir de la plantilla:

```powershell
Copy-Item .env.example .env
```

Valores principales:

```dotenv
VITE_DATA_MODE=api
VITE_API_URL=http://localhost:8080
VITE_RECRUITER_EMAIL=talento@gtel.com.pe
```

Las variables `VITE_*` son visibles en el navegador y nunca deben contener contraseñas, tokens o secretos. Reiniciar Vite después de cambiar el archivo.

## Ejecución

```powershell
npm.cmd run dev
```

Abrir la URL indicada por Vite, normalmente `http://localhost:5173`. No abrir `index.html` directamente ni utilizar Live Server porque Vite debe procesar JSX y las variables de entorno.

## Validación

```powershell
npm.cmd run check
```

El comando ejecuta, en orden:

1. ESLint.
2. Las pruebas `tests/*.test.mjs`.
3. La compilación de producción con Vite.

La salida de producción se genera en `dist/` y no se versiona. Los recorridos `*-browser.mjs` requieren un navegador de prueba y se documentan en `docs/`.

## Comandos disponibles

| Comando | Función |
|---|---|
| `npm.cmd run dev` | Servidor de desarrollo |
| `npm.cmd run lint` | Análisis estático |
| `npm.cmd run test` | Pruebas automatizadas de contratos |
| `npm.cmd run build` | Compilación de producción |
| `npm.cmd run check` | Validación completa |
| `npm.cmd run preview` | Vista previa de `dist/` |
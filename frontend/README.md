# Frontend GTEL

## Iniciar en Windows (PowerShell)

Desde la raíz del repositorio:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Abre la URL que muestra Vite en la terminal (normalmente http://localhost:5173).
Mantén esa terminal abierta mientras usas la página. No abras `index.html`
directamente ni mediante Live Server: el proyecto necesita Vite para procesar JSX.

Si PowerShell indica que no puede cargar `npm.ps1` porque la ejecución de scripts
está deshabilitada, usa `npm.cmd` como en los comandos anteriores. No hace falta
cambiar la política de ejecución de Windows.

Para comprobar la compilación: `npm.cmd run build`.

Actualmente, sin `VITE_DATA_MODE=api`, la aplicación usa datos demo y puede
iniciarse sin el backend. Para conectarla a la API, crea `frontend/.env` con:

```dotenv
VITE_DATA_MODE=api
VITE_API_URL=http://localhost:8080
```

En ese modo, inicia también el backend y reinicia Vite después de cambiar `.env`.

## Referencia de la plantilla React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

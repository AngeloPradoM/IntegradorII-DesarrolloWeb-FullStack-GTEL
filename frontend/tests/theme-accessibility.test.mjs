import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveEffectiveTheme, THEME_STORAGE_KEY } from '../src/utils/theme.js';
import { getContrastRatio, meetsWcagAA } from '../src/utils/contrast.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

test('ThemeContext: THEME_STORAGE_KEY y resolución de temas', () => {
  assert.equal(THEME_STORAGE_KEY, 'gtel_theme');

  // Tema forzado 'light' siempre retorna 'light'
  assert.equal(resolveEffectiveTheme('light', false), 'light');
  assert.equal(resolveEffectiveTheme('light', true), 'light');

  // Tema forzado 'dark' siempre retorna 'dark'
  assert.equal(resolveEffectiveTheme('dark', false), 'dark');
  assert.equal(resolveEffectiveTheme('dark', true), 'dark');

  // Tema 'system' delega en la preferencia del sistema operativo
  assert.equal(resolveEffectiveTheme('system', false), 'light');
  assert.equal(resolveEffectiveTheme('system', true), 'dark');
});

test('Accesibilidad WCAG 2.2 AA: Contrastes de color de la paleta GTEL', () => {
  // 1. Blanco sobre Rojo Primario GTEL (#D32F2F)
  const redButton = meetsWcagAA('#FFFFFF', '#D32F2F', false);
  assert.ok(redButton.passes, `El botón rojo GTEL debe cumplir WCAG AA (Ratio: ${redButton.ratio})`);
  assert.ok(redButton.ratio >= 4.5, `Ratio esperado >= 4.5:1, obtenido: ${redButton.ratio}`);

  // 2. Blanco sobre Cabecera Navy GTEL (#1E293B)
  const navyHeader = meetsWcagAA('#FFFFFF', '#1E293B', false);
  assert.ok(navyHeader.passes, `La cabecera navy GTEL debe cumplir WCAG AA (Ratio: ${navyHeader.ratio})`);
  assert.ok(navyHeader.ratio >= 7.0, `Ratio con alto contraste obtenido: ${navyHeader.ratio}`);

  // 3. Texto claro sobre Slate-900 (#0F172A) en Modo Oscuro
  const darkCard = meetsWcagAA('#F8FAFC', '#0F172A', false);
  assert.ok(darkCard.passes, `Texto en tarjeta oscura debe cumplir WCAG AA (Ratio: ${darkCard.ratio})`);
  assert.ok(darkCard.ratio >= 10.0, `Ratio en dark mode obtenido: ${darkCard.ratio}`);

  // 4. Texto claro sobre Fondo Slate-950 (#020617)
  const darkBackground = meetsWcagAA('#F1F5F9', '#020617', false);
  assert.ok(darkBackground.passes, `Texto sobre fondo oscuro profundo debe cumplir WCAG AA (Ratio: ${darkBackground.ratio})`);
  assert.ok(darkBackground.ratio >= 14.0, `Ratio obtenido: ${darkBackground.ratio}`);

  // 5. Acento rojo claro sobre tarjeta oscura
  const darkAccent = meetsWcagAA('#F87171', '#0F172A', false);
  assert.ok(darkAccent.passes, `El acento rojo en modo oscuro debe cumplir WCAG AA (Ratio: ${darkAccent.ratio})`);

  // 6. Texto secundario sobre tarjeta oscura
  const darkSecondary = meetsWcagAA('#94A3B8', '#0F172A', false);
  assert.ok(darkSecondary.passes, `El texto secundario oscuro debe cumplir WCAG AA (Ratio: ${darkSecondary.ratio})`);

  // 7. Blanco sobre acción principal oscura
  const darkAction = meetsWcagAA('#FFFFFF', '#DC2626', false);
  assert.ok(darkAction.passes, `El botón rojo oscuro debe cumplir WCAG AA (Ratio: ${darkAction.ratio})`);
});

test('Accesibilidad WCAG 2.2 AA: Skip Links hacia #contenido', () => {
  const publicLayoutPath = path.join(frontendDir, 'src/layouts/PublicLayout.jsx');
  const recruiterLayoutPath = path.join(frontendDir, 'src/layouts/RecruiterLayout.jsx');

  const publicContent = fs.readFileSync(publicLayoutPath, 'utf8');
  const recruiterContent = fs.readFileSync(recruiterLayoutPath, 'utf8');

  // Skip links accesibles para lectores de pantalla y teclado
  assert.ok(
    publicContent.includes('href="#contenido"') && publicContent.includes('skip-link'),
    'PublicLayout debe contener un skip link a #contenido'
  );
  assert.ok(
    publicContent.includes('id="contenido"'),
    'PublicLayout debe contener el ancla id="contenido" en el main'
  );

  assert.ok(
    recruiterContent.includes('href="#contenido"') && recruiterContent.includes('skip-link'),
    'RecruiterLayout debe contener un skip link a #contenido'
  );
  assert.ok(
    recruiterContent.includes('id="contenido"'),
    'RecruiterLayout debe contener el ancla id="contenido" en el main'
  );
});

test('Componente ThemeToggle: Atributos ARIA y roles accesibles', () => {
  const togglePath = path.join(frontendDir, 'src/components/ui/ThemeToggle.jsx');
  const toggleContent = fs.readFileSync(togglePath, 'utf8');

  assert.ok(
    toggleContent.includes('aria-label') && toggleContent.includes('aria-expanded'),
    'ThemeToggle debe tener atributos aria-label y aria-expanded'
  );
  assert.ok(
    toggleContent.includes('role="menu"'),
    'ThemeToggle debe definir role="menu" en el menú desplegable'
  );
  assert.ok(
    toggleContent.includes('role="menuitem"'),
    'ThemeToggle debe definir role="menuitem" en las opciones seleccionables'
  );
  assert.ok(
    toggleContent.includes('Escape'),
    'ThemeToggle debe soportar cierre mediante la tecla Escape'
  );
});

test('Tailwind CSS v4: Soporte de clase .dark y estilos base', () => {
  const cssPath = path.join(frontendDir, 'src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert.ok(
    cssContent.includes('@custom-variant dark'),
    'index.css debe configurar @custom-variant dark para Tailwind v4'
  );
  assert.ok(
    cssContent.includes('.skip-link'),
    'index.css debe incluir estilos accesibles para .skip-link'
  );

  for (const token of [
    '--color-app-bg',
    '--color-app-surface',
    '--color-app-primary',
    '--color-app-secondary',
    '--color-app-border',
    '--color-app-accent',
    '--color-app-action',
    '--color-app-action-hover',
  ]) {
    assert.ok(cssContent.includes(token), `La paleta debe declarar el token semántico ${token}`);
  }
});

test('Tema inicial: se aplica antes de cargar React para evitar destellos', () => {
  const htmlPath = path.join(frontendDir, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const themeScriptPosition = htmlContent.indexOf('localStorage.getItem("gtel_theme")');
  const appScriptPosition = htmlContent.indexOf('src="/src/main.jsx"');

  assert.ok(themeScriptPosition >= 0, 'index.html debe leer el tema almacenado antes del montaje');
  assert.ok(appScriptPosition > themeScriptPosition, 'El tema inicial debe aplicarse antes de cargar React');
  assert.ok(htmlContent.includes('prefers-color-scheme: dark'), 'El tema inicial debe respetar el modo del sistema');
});

test('Landing pública: usa la paleta semántica y conserva el acordeón accesible', () => {
  const landingPath = path.join(frontendDir, 'src/pages/candidato/LandingPage.jsx');
  const guidePath = path.join(frontendDir, 'src/components/ui/CandidateGuide.jsx');
  const landingContent = fs.readFileSync(landingPath, 'utf8');
  const guideContent = fs.readFileSync(guidePath, 'utf8');

  for (const className of ['bg-app-bg', 'bg-app-surface', 'text-app-primary', 'text-app-body', 'text-app-secondary']) {
    assert.ok(
      landingContent.includes(className) || guideContent.includes(className),
      `La landing debe utilizar el token semántico ${className}`
    );
  }
  assert.ok(guideContent.includes('<details'), 'Las preguntas frecuentes deben conservar controles details nativos');
  assert.ok(guideContent.includes('<summary'), 'Las preguntas frecuentes deben conservar controles summary nativos');
  assert.ok(guideContent.includes('focus-visible:'), 'Las preguntas frecuentes deben mostrar foco de teclado');
});

test('Administración: encabezado, tablas y soporte usan la paleta semántica', () => {
  const headerCss = fs.readFileSync(path.join(frontendDir, 'src/components/layout/admin-header.css'), 'utf8');
  const workspaceCss = fs.readFileSync(path.join(frontendDir, 'src/pages/admin/admin-workspace.css'), 'utf8');
  const ticketsContent = fs.readFileSync(path.join(frontendDir, 'src/pages/support/AdminTicketsPage.jsx'), 'utf8');
  const slaContent = fs.readFileSync(path.join(frontendDir, 'src/pages/reclutador/SupportDashboardPage.jsx'), 'utf8');

  for (const token of ['--color-app-surface', '--color-app-primary', '--color-app-secondary', '--color-app-border']) {
    assert.ok(headerCss.includes(`var(${token})`), `El encabezado administrador debe utilizar ${token}`);
    assert.ok(workspaceCss.includes(`var(${token})`), `El espacio administrador debe utilizar ${token}`);
  }
  for (const className of ['bg-app-surface', 'text-app-primary', 'text-app-secondary', 'border-app-border']) {
    assert.ok(ticketsContent.includes(className), `Tickets administrativos debe utilizar ${className}`);
    assert.ok(slaContent.includes(className), `El tablero SLA debe utilizar ${className}`);
  }
});

test('Ofertas compartidas: administrador y candidato heredan el tema activo', () => {
  const offers = fs.readFileSync(path.join(frontendDir, 'src/pages/candidato/OfertasLaboralesPage.jsx'), 'utf8');

  for (const className of ['bg-app-bg', 'bg-app-surface', 'bg-app-muted', 'text-app-primary', 'text-app-body', 'text-app-secondary', 'border-app-border', 'bg-app-action']) {
    assert.ok(offers.includes(className), `La página compartida de ofertas debe utilizar ${className}`);
  }
  for (const fixedLightClass of ['min-h-screen bg-[#F8FAFC]', 'className="bg-white rounded-xl', 'border border-gray-100', 'text-[#1E293B]', 'text-[#475569]']) {
    assert.ok(!offers.includes(fixedLightClass), `Ofertas no debe conservar el estilo claro fijo ${fixedLightClass}`);
  }

  assert.ok(offers.includes('aria-expanded={filterOpen}'), 'El panel de filtros debe comunicar su estado');
  assert.ok(offers.includes('aria-pressed={typeFilter === t}'), 'Los filtros seleccionados deben comunicar su estado');
  assert.ok(offers.includes('toggleSave(job.id)'), 'La corrección visual debe conservar los favoritos');
  assert.ok(offers.includes('setSortBy(e.target.value)'), 'La corrección visual debe conservar el ordenamiento');
});

test('Reclutador: navegación accesible y nombre real bajo el logo', () => {
  const layoutPath = path.join(frontendDir, 'src/layouts/RecruiterLayout.jsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');

  assert.ok(layoutContent.includes('const displayName ='), 'El layout debe calcular el nombre de la cuenta autenticada');
  assert.ok(layoutContent.includes('{displayName}'), 'El nombre registrado debe mostrarse en el menú lateral');
  assert.ok(layoutContent.includes('aria-current={active ? "page" : undefined}'), 'La pestaña activa debe exponerse a tecnologías de asistencia');
  assert.ok(layoutContent.includes('bg-app-action'), 'La pestaña activa debe utilizar el color de acción semántico');
  assert.ok(layoutContent.includes('text-slate-300'), 'Las pestañas inactivas deben conservar contraste sobre el menú oscuro');
});

test('Reclutador: publicar oferta utiliza la paleta clara y oscura', () => {
  const pageContent = fs.readFileSync(path.join(frontendDir, 'src/pages/reclutador/PublicarOfertaPage.jsx'), 'utf8');
  const pickerContent = fs.readFileSync(path.join(frontendDir, 'src/components/ui/pickerElements.js'), 'utf8');

  for (const className of ['bg-app-surface', 'bg-app-muted', 'bg-app-bg', 'text-app-primary', 'text-app-secondary', 'border-app-border', 'bg-app-action']) {
    assert.ok(pageContent.includes(className), `Publicar oferta debe utilizar ${className}`);
  }
  for (const fixedLightClass of ['bg-white rounded-xl', 'text-[#1E293B]', 'bg-[#F8FAFC]']) {
    assert.ok(!pageContent.includes(fixedLightClass), `Publicar oferta no debe conservar el color claro fijo ${fixedLightClass}`);
  }
  for (const token of ['--color-app-bg', '--color-app-surface', '--color-app-primary', '--color-app-secondary', '--color-app-border-strong', '--color-app-action']) {
    assert.ok(pickerContent.includes(`var(${token}`), `El selector de fecha debe heredar ${token}`);
  }
});

test('Reclutador: páginas operativas comparten superficies y controles semánticos', () => {
  const files = [
    'src/pages/reclutador/OfertasPage.jsx',
    'src/pages/reclutador/PostulantesPage.jsx',
    'src/components/recruiter/CandidateKanbanBoard.jsx',
    'src/pages/reclutador/EntrevistasPage.jsx',
    'src/pages/reclutador/EvaluacionesPage.jsx',
    'src/pages/support/RecruiterTicketsPage.jsx',
    'src/pages/reclutador/JobTrash.jsx',
    'src/pages/reclutador/JobEditor.jsx',
    'src/pages/reclutador/PerfilCandidatoPage.jsx',
  ];
  const contents = files.map(file => [file, fs.readFileSync(path.join(frontendDir, file), 'utf8')]);

  for (const [file, content] of contents) {
    assert.ok(
      content.includes('recruiter-') || content.includes('bg-app-') || content.includes('text-app-') || content.includes('dark:'),
      `${file} debe responder a la paleta del tema`
    );
  }

  const kanban = contents.find(([file]) => file.includes('CandidateKanbanBoard'))[1];
  assert.ok(kanban.includes('overflow-x-auto'), 'El Kanban debe permitir desplazamiento horizontal controlado');
  assert.ok(kanban.includes('bg-app-surface'), 'Las tarjetas Kanban deben usar la superficie semántica');

  const tickets = contents.find(([file]) => file.includes('RecruiterTicketsPage'))[1];
  assert.ok(tickets.includes('aria-pressed={mode===value}'), 'El tipo de atención seleccionado debe exponerse de forma accesible');
  assert.ok(tickets.includes('bg-app-danger-soft'), 'La selección de atención no debe depender de un fondo claro fijo');
});

test('Reclutador: proceso de selección y controles globales heredan variables oficiales', () => {
  const selectionCss = fs.readFileSync(path.join(frontendDir, 'src/pages/reclutador/selection.css'), 'utf8');
  const globalCss = fs.readFileSync(path.join(frontendDir, 'src/index.css'), 'utf8');

  for (const token of ['--color-app-bg', '--color-app-surface', '--color-app-primary', '--color-app-body', '--color-app-secondary', '--color-app-border', '--color-app-action']) {
    assert.ok(selectionCss.includes(`var(${token}`), `Selección debe utilizar ${token}`);
  }
  for (const componentClass of ['.recruiter-card', '.recruiter-field', '.recruiter-table-head', '.recruiter-empty']) {
    assert.ok(globalCss.includes(componentClass), `Los estilos compartidos deben declarar ${componentClass}`);
  }
  assert.ok(globalCss.includes(':-webkit-autofill'), 'Los campos oscuros deben controlar el autofill del navegador');
});

test('Panel técnico: tickets y RFC utilizan superficies semánticas sin alterar autorizaciones', () => {
  const tickets = fs.readFileSync(path.join(frontendDir, 'src/pages/support/TechnicianTicketsPage.jsx'), 'utf8');
  const changes = fs.readFileSync(path.join(frontendDir, 'src/pages/support/TechnicianChangePanel.jsx'), 'utf8');
  const layout = fs.readFileSync(path.join(frontendDir, 'src/layouts/TechnicianLayout.jsx'), 'utf8');
  const globalCss = fs.readFileSync(path.join(frontendDir, 'src/index.css'), 'utf8');

  for (const content of [tickets, changes, layout]) {
    assert.ok(content.includes('bg-app-') || content.includes('technical-'), 'El panel técnico debe usar la paleta semántica');
    assert.ok(content.includes('text-app-primary'), 'El texto principal debe responder al tema activo');
  }
  for (const componentClass of ['.technical-card', '.technical-field', '.technical-list-item', '.technical-button-secondary']) {
    assert.ok(globalCss.includes(componentClass), `Los estilos compartidos deben declarar ${componentClass}`);
  }

  assert.ok(tickets.includes('aria-pressed={ticket.id === selectedId}'), 'La solicitud seleccionada debe exponerse sin depender solo del color');
  assert.ok(changes.includes('aria-pressed={change.id === selectedId}'), 'La RFC seleccionada debe exponerse sin depender solo del color');
  assert.ok(tickets.includes("const approved = selected?.proposalStatus === 'APROBADA'"), 'La ejecución de tickets debe conservar la aprobación administrativa');
  assert.ok(tickets.includes('disabled={busy || !approved || !assigned}'), 'Actualizar estado debe continuar bloqueado sin autorización');
  assert.ok(changes.includes("const reviewEnabled = assigned && ['ASIGNADO', 'AJUSTES_SOLICITADOS'].includes(selected?.status)"), 'La evaluación RFC debe conservar sus estados permitidos');
  assert.ok(changes.includes("const executionEnabled = assigned && ['APROBADO', 'OBSERVADO'].includes(selected?.status)"), 'La ejecución RFC debe conservar sus estados autorizados');
  assert.ok(tickets.includes('role="tablist"'), 'Solicitudes y RFC deben estar separadas mediante pestañas accesibles');
  assert.ok(tickets.includes('Volver a la bandeja'), 'La vista móvil debe permitir regresar al listado');
  assert.ok(tickets.includes('TechnicalStageProgress'), 'Las solicitudes deben mostrar su progreso por etapas');
  assert.ok(changes.includes('TechnicalStageProgress'), 'Las RFC deben mostrar su progreso por etapas');
  assert.ok(layout.includes('<aside'), 'El centro técnico debe conservar una navegación lateral en escritorio');
  assert.ok(layout.includes("event.key === 'Escape'"), 'El menú técnico móvil debe cerrarse con Escape');
});

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
});

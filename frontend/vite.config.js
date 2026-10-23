import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export default defineConfig({
  // Program Files blocks Vite's default node_modules/.vite writes on Windows.
  cacheDir: join(tmpdir(), 'gtel-vite-cache'),
  plugins: [
    react(),
    tailwindcss(),
  ],
})

import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const projectPath = fileURLToPath(new URL('.', import.meta.url))
const projectId = createHash('sha256').update(projectPath).digest('hex').slice(0, 16)

export default defineConfig({
  // Keep dependency cache writable even when the project is in Program Files.
  cacheDir: join(tmpdir(), 'gtel-vite', projectId),
  plugins: [
    react(),
    tailwindcss(),
  ],
})

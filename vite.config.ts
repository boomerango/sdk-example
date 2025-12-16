import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { applicationWorkers } from '@telemetryos/vite-plugin-application-workers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    applicationWorkers({
      backgroundWorkers: [
        {
          entry: 'src/workers/background.ts',
          outPath: 'workers/background.js',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false,
  },
})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// IMPORTANT: outDir points to FastAPI static
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  root: '.',                          // keep default
  build: {
    outDir: '../manager/static',      // FastAPI will serve this dir
    emptyOutDir: true,                // clean before build
  },
  // If you fetch /api from dev server, setup proxy to FastAPI (optional):
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
  // If your app is served under / (FileResponse index.html), base can stay '/'
  // If you mount static under /static and reference assets relatively, leave base default
})
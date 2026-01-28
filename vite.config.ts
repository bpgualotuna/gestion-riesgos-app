import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: parseInt(process.env.PORT || '5173'),
    strictPort: false,
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT || '4173'),
    strictPort: false,
    allowedHosts: [
      'gestion-riesgos-app.onrender.com',
      '.onrender.com', // Permite todos los subdominios de Render
      'localhost',
    ],
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }
            if (id.includes('@mui')) {
              return 'mui';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})

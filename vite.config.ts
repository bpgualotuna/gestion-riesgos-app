import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prevenir que Rolldown intente resolver @mui/material/Grid2 que no existe
    // Redirigir cualquier intento de importar Grid2 desde @mui/material a nuestro wrapper
    alias: {
      '@mui/material/Grid2': path.resolve(__dirname, 'src/utils/Grid2.tsx'),
    },
  },
  server: {
    host: '0.0.0.0', // Permitir conexiones desde cualquier IP
    port: 5173,
    strictPort: false, // Permitir usar otro puerto si 5173 está ocupado
    open: false, // No abrir automáticamente
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
    watch: {
      usePolling: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
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
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
})

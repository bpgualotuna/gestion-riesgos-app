import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno desde .env (sin sufijos de modo)
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    // Exponer variables de entorno que empiezan con VITE_
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME),
      'import.meta.env.VITE_ENV': JSON.stringify(env.VITE_ENV),
    },
    // Configurar para que use solo .env (sin .env.production o .env.development)
    envPrefix: 'VITE_',
    resolve: {
      // Prevenir que Rolldown intente resolver @mui/material/Grid2 que no existe
      // Redirigir cualquier intento de importar Grid2 desde @mui/material a nuestro wrapper
      alias: {
        '@mui/material/Grid2': path.resolve(__dirname, 'src/utils/Grid2.tsx'),
      },
    },
    server: {
      host: 'localhost', // Solo localhost para evitar problemas de WebSocket
      port: 5173,
      strictPort: false,
      open: false,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
      watch: {
        usePolling: false,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
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
  }
})

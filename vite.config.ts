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
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: Number(process.env.VITE_PORT) || 5173,
    hmr: {
      clientPort: Number(process.env.FRONTEND_PORT) || 5000,
    },
    proxy: {
      '/api': {
        target: process.env.BACKEND_API_URL || 'http://backend:3000',
        changeOrigin: true,
      },
    },
  },
})

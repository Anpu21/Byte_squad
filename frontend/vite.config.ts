import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const backendTarget =
  process.env.BACKEND_API_URL ||
  `http://127.0.0.1:${process.env.BACKEND_PORT || process.env.PORT || 5000}`

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
        target: backendTarget,
        changeOrigin: true,
      },
      // socket.io for live notifications + customer-request:created broadcasts
      '/socket.io': {
        target: backendTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

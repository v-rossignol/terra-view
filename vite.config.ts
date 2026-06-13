import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/terra-view/',
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ['infinity-dev.home.rh', 'localhost'],
    origin: 'http://infinity-dev.home.rh',
    hmr: {
      host: 'infinity-dev.home.rh',
      clientPort: 80,
    },
    proxy: {
      '/infinity': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})

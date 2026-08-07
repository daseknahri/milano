import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: Object.fromEntries(['/api', '/uploads'].map((route) => [route, {
      // Keep local development on IPv4; Windows may resolve localhost to ::1
      // while the Express server is intentionally bound to 0.0.0.0.
      target: 'http://127.0.0.1:3008',
      changeOrigin: true,
      configure(proxy) {
        // The browser Origin belongs to Vite's port, not the internal API port.
        // Removing it here keeps the server's same-origin guard active in production.
        proxy.on('proxyReq', (request) => request.removeHeader('origin'))
      },
    }]))
  }
})

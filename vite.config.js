import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // El panel usa el 5174 porque la aplicación de usuario ya usa el 5173 (Django permite ambos por CORS).
    port: 5174,
    strictPort: true,
    proxy: {
      // El inicio de sesión se valida en el backend de usuario (Spring Boot, puerto 8080).
      // Con este reenvío el navegador llama a su propio origen y no hace falta configurar CORS en Spring.
      '/spring': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (ruta) => ruta.replace(/^\/spring/, ''),
        // Spring solo acepta peticiones desde los orígenes de su lista (5173 y 3000) y responde 403 al 5174.
        // Como esta petición ya la hace el servidor de Vite, se quita el encabezado Origin del navegador.
        configure: (proxy) => {
          proxy.on('proxyReq', (peticion) => peticion.removeHeader('origin'))
        },
      },
    },
  },
})

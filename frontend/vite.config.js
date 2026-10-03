import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['maplibre-gl']
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/proxy-osrm1': {
        target: 'https://routing.openstreetmap.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-osrm1/, '')
      },
      '/proxy-osrm2': {
        target: 'https://router.project-osrm.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-osrm2/, '')
      }
    }
  }
});

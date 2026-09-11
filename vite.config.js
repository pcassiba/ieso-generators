import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/ieso-reports': {
        target: 'https://reports-public.ieso.ca/public/GenOutputCapability/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ieso-reports/, ''),
      },
    },
  },
});

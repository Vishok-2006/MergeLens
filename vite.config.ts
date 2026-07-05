import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Not strictly required since the Express server hosts Vite in middleware
    // mode during `npm run dev`, but kept for anyone running `vite` standalone.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: 'localhost',
    port: 5179,
  },
  preview: {
    host: 'localhost',
    port: 4179,
  },
});

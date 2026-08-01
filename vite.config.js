import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // The old webpack build emitted sourcemaps for production too.
    sourcemap: true,
  },
});

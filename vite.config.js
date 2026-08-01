/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // The old webpack build emitted sourcemaps for production too.
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Shader sources and static resume data aren't executable logic —
      // everything else (components, hooks, utils) is expected to be
      // covered.
      exclude: ['src/shaders/**', 'src/data/**', 'src/main.jsx', 'src/test/**'],
      // A little below the current numbers (branches especially — a few
      // genuinely hard-to-trigger paths remain, like a lost WebGL context
      // or a tainted-canvas texture upload) so incidental drift fails CI
      // without requiring every last defensive catch block to be hit.
      thresholds: {
        statements: 85,
        branches: 65,
        functions: 80,
        lines: 85,
      },
    },
  },
});

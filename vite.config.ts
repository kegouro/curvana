import { defineConfig } from 'vite';

// base relativa para que funcione en GitHub Pages (sitio de proyecto /Curvana/).
export default defineConfig({
  base: './',
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    environmentMatchGlobs: [
      ['src/e2e/**/*.test.ts', 'jsdom'],
    ],
    setupFiles: ['src/e2e/setup.ts'],
  },
});


import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    // Exclude ALL files in tests/ directory (those are Playwright E2E tests)
    // Only run unit tests in src/ directory
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules/**',
      '.next/**',
      'tests/**', // ALL Playwright E2E tests are in tests/
      '*.spec.js', // Root-level Playwright tests
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

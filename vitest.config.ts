import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    // Exclude Playwright E2E tests (they use .spec.ts)
    // Only run unit tests (they use .test.ts)
    exclude: [
      'node_modules/**',
      '.next/**',
      'tests/**/*.spec.ts', // Playwright E2E tests
      'test-hyperlink-workflow.spec.js', // Playwright E2E test
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

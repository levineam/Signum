import { defineConfig, devices } from '@playwright/test'

// Simplified config for testing against existing dev server
const baseURL = 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
    baseURL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})

import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001'
const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1'

const config = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  // Auto-start Next.js server before tests unless explicitly skipped
  webServer: shouldStartWebServer
    ? {
        command: 'npm run build && PORT=3001 npm run start',
        url: baseURL,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
})

export default config

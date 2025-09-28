// playwright.config.js
const { devices } = require('@playwright/test');

module.exports = {
  testDir: '.',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
  ],
};
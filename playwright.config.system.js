// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * Configuration that uses system Chrome instead of downloading browsers
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Use system Chrome browser
  projects: [
    {
      name: 'chromium',
      use: {
        channel: 'chrome', // Use system Chrome
      },
    },
  ],

  /* Run local dev server before starting tests */
  webServer: {
    command: 'python3 -m http.server 8000',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
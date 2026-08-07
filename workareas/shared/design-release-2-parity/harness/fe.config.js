const path = require('path')
const { defineConfig, devices } = require('@playwright/test')

// The workspace stack's test-target frontend (docker/stack/frontend.compose.yml,
// profile `test-target`, LIVE_ANIMALS_MODE=real). Its OIDC redirect URL is
// registered on localhost:3100, so the whole dance must stay on that host.
const BASE_URL = 'http://localhost:3100'

module.exports = defineConfig({
  testDir: path.join(__dirname, 'fe'),
  testMatch: '**/*.spec.js',
  workers: 1,
  timeout: 600_000,
  expect: { timeout: 20_000 },
  outputDir: path.join(__dirname, 'fe-test-results'),
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    actionTimeout: 20_000,
    navigationTimeout: 40_000,
    viewport: { width: 1280, height: 1200 },
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 1200 } } }
  ]
})

const path = require('path')
const { defineConfig, devices } = require('@playwright/test')

const PROTOTYPE_ROOT = '/Users/samfarrington/git/defra/defra-design/GB-notification-service'
// 3014: this worker's own kit. The kit dev server races journey/session state,
// so every worker boots its own on its own port.
const PORT = 3014

module.exports = defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  testMatch: '**/commodities-live.spec.js',
  // The kit dev server races journey/session state across concurrent requests.
  workers: 1,
  timeout: 600_000,
  expect: { timeout: 15_000 },
  outputDir: path.join(__dirname, 'test-results'),
  reporter: [
    ['html', { open: 'never', outputFolder: path.join(__dirname, 'report') }],
    ['list']
  ],
  use: {
    baseURL: `http://localhost:${PORT}`,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    viewport: { width: 1280, height: 1200 },
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 1200 } } }
  ],
  webServer: {
    // Dev mode, not `serve`: production mode forces https on a plaintext server
    // and sets secure-only cookies, which breaks the kit's sessions over http.
    command: `node ${path.join(PROTOTYPE_ROOT, 'journey-demo', 'serve-prototype.js')}`,
    cwd: PROTOTYPE_ROOT,
    env: { PORT: String(PORT) },
    // Wait on the TCP port: the kit accepts connections before an HTTP probe
    // settles under Node 24.
    port: PORT,
    timeout: 180_000,
    reuseExistingServer: true
  }
})

//
// Phase 0 canary for the DESIGN RELEASE 2.1 side of the parity capture.
//
// Not the walker. It proves three things before Phase 1 commits to writing the
// full DR2.1 suite: the kit boots on 3010 under this config, the /design-release-2.1
// mount serves pages, and the salvaged extractor produces a page model from them.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')

const BASE = '/design-release-2.1'

// Pages the mount serves without journey state, so the canary needs no fill steps.
const STANDALONE = [
  { path: '/', name: 'dr21-dashboard', heading: /live animals & germinal products/i },
  { path: '/what-are-you-importing', name: 'dr21-what-are-you-importing', heading: /what are you importing/i },
  { path: '/notification-hub', name: 'dr21-notification-hub', heading: /.+/ }
]

for (const { path, name, heading } of STANDALONE) {
  test(`captures ${name}`, async ({ page }) => {
    await page.goto(`${BASE}${path}`)
    await expect(page.locator('main h1')).toHaveText(heading)

    const model = await capture(page, name)

    expect(model.url, `${name} should stay on the DR2.1 mount`).toContain(BASE)
    expect(model.h1, `${name} should have captured an h1`).toBeTruthy()
  })
}

//
// Cartographer for the REAL frontend (workspace stack test target, :3100).
//
// Same extractor as the DR2 walk, so the two sides produce model JSON that can
// be diffed directly. Captures are prefixed `fe-` and land in the same
// capture root under a `model-fe` subdirectory.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('../e2e/page-model')

// The stack's defra-id stub accepts the tests repo's canned Government Gateway
// user (repos/trade-imports-animals-tests/page-objects/auth/sign-in-page.ts).
const USER_ID = '2100010101'
const PASSWORD = process.env.AUTH_PASSWORD ?? 'Password123'

async function signIn (page) {
  await page.goto('/')
  const userIdBox = page.getByRole('textbox', { name: 'Government Gateway user ID' })
  if (await userIdBox.count()) {
    await userIdBox.fill(USER_ID)
    await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
  }
  await expect(page, 'should land on the dashboard after sign-in')
    .toHaveURL(/localhost:3100\/?$/)
}

// Captures the current screen under a fe- prefix.
const grab = (page, name) => capture(page, `fe-${name}`)

test.describe.configure({ mode: 'serial' })

test('frontend journey map', async ({ page }) => {
  await signIn(page)
  await grab(page, '00-dashboard')

  await page.getByRole('button', { name: /start a new notification/i }).click()
  await grab(page, '01-import-type')

  await page.locator('input[name="importType"][value="live-animals"]').check()
  await page.getByRole('button', { name: /continue/i }).click()
  await grab(page, '02-origin')

  // Remember the journey id so later pages can be reached directly.
  const journeyId = new URL(page.url()).pathname.split('/')[2]
  test.info().annotations.push({ type: 'journeyId', description: journeyId })

  const at = (slug) => `/notifications/${journeyId}/${slug}`

  // Walk the spine by direct navigation and capture whatever renders. Pages the
  // entry guard refuses will land elsewhere; the capture records where.
  const slugs = [
    'origin',
    'commodities',
    'consignment-details',
    'commodities/identification',
    'import-reason',
    'import-purpose',
    'destination-country',
    'port-of-exit',
    'exit-date',
    'additional-details',
    'accompanying-documents',
    'addresses',
    'cph-number',
    'port-of-entry',
    'transit-countries',
    'transporters',
    'transporters/select',
    'transporters/private',
    'consignment/contact/select',
    'notification-view',
    'declaration',
    'confirmation'
  ]

  for (const [index, slug] of slugs.entries()) {
    await page.goto(at(slug))
    const name = `${String(index + 3).padStart(2, '0')}-${slug.replace(/\//g, '-')}`
    await grab(page, name)
  }

  await page.goto(`/notifications/${journeyId}`)
  await grab(page, '90-hub')
})

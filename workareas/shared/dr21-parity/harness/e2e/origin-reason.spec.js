//
// DR2.1 cartographer slice: origin-of-the-import, reason-for-import, cph-number.
//
// A capture harness, not an assertion suite — but every step asserts the journey
// landed where it should, so a silently-rejected page can never leave a
// mislabelled capture behind.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')
const journeyHelpers = require('/Users/samfarrington/git/defra/defra-design/GB-notification-service/journey-demo/e2e/journey.js')

const BASE = '/design-release-2.1'

// The prototype's own demo helpers drive the bespoke widgets (the country
// autocomplete, the commodity checkbox control) — reuse them rather than
// re-deriving the selectors.
const { fillOrigin, fillCommodity } = journeyHelpers

// Cattle: the journey whose commodity activates the CPH consignment-address
// section, which is what gates /cph-number.
const CATTLE = journeyHelpers.JOURNEYS[0]

// Each reason radio that renders a conditional reveal, with a control that only
// exists inside that reveal so the revealed state can be asserted rather than
// assumed.
const REASON_REVEALS = [
  {
    reason: 'Internal market',
    name: 'dr21-reason-for-import-internal-market-revealed',
    revealedField: 'input[name="internalMarketPurpose"]'
  },
  {
    reason: 'Transhipment or onward travel',
    name: 'dr21-reason-for-import-transhipment-revealed',
    revealedField: 'select[name="transhipmentDestinationCountry"]'
  },
  {
    reason: 'Transit',
    name: 'dr21-reason-for-import-transit-revealed',
    revealedField: 'select[name="transitDestinationCountry"]'
  },
  {
    reason: 'Temporary admission horses',
    name: 'dr21-reason-for-import-temporary-admission-horses-revealed',
    revealedField: 'input[name="temporaryAdmissionExitDate"]'
  }
]

// Not every DR2.1 page carries the action=continue button group — some use a
// plain submit — so fall back to the button's accessible name.
async function clickContinue (page) {
  const action = page.locator('button[name="action"][value="continue"]')
  if (await action.count()) {
    await action.first().click()
    return
  }
  await page.getByRole('button', { name: /save and continue|continue/i }).first().click()
}

// Starts a fresh notification and asserts the mount put us on a rendered
// origin-of-the-import, not the dashboard and not the kit's error page.
//
// The kit rewrites its shadow-nunjucks layouts (where it auto-imports every
// plugin macro, govukPhaseBanner among them) and recompiles its Sass while the
// server is up, bouncing nodemon. A request landing in that window either
// refuses the connection or renders "Unable to call `govukPhaseBanner`" instead
// of the page. Re-request until it settles, rather than capture the kit's own
// error page under a DR2.1 name.
async function startJourney (page) {
  await expect(async () => {
    await page.goto(`${BASE}/create-notification`)
    await expect(page, 'create-notification should open origin-of-the-import')
      .toHaveURL(new RegExp(`${BASE}/origin-of-the-import$`), { timeout: 5_000 })
    await expect(page.locator('main h1'), 'origin-of-the-import should render, not error')
      .toHaveText(/origin of the import/i, { timeout: 5_000 })
  }).toPass({ timeout: 240_000 })
}

test.describe.configure({ mode: 'serial' })

test('captures dr21-origin-of-the-import', async ({ page }) => {
  await startJourney(page)

  const model = await capture(page, 'dr21-origin-of-the-import')

  expect(model.url, 'origin should stay on the DR2.1 mount').toContain(BASE)
  expect(model.h1, 'origin should have captured an h1').toBeTruthy()
})

test('captures dr21-reason-for-import, collapsed and with each reveal open', async ({ page }) => {
  await startJourney(page)
  await fillOrigin(page, CATTLE)
  await expect(page, 'origin should advance to what-are-you-importing')
    .toHaveURL(/what-are-you-importing$/)

  await fillCommodity(page, CATTLE)
  await expect(page, 'commodity should advance to reason-for-import')
    .toHaveURL(/reason-for-import$/)
  await expect(page.locator('main h1')).toHaveText(/main reason for import/i)

  const collapsed = await capture(page, 'dr21-reason-for-import')
  expect(collapsed.h1, 'reason-for-import should have captured an h1').toBeTruthy()

  for (const { reason, name, revealedField } of REASON_REVEALS) {
    await page.locator(`input[name="importReason"][value="${reason}"]`).check()
    // Assert the reveal is actually on screen before capturing it — the model is
    // otherwise indistinguishable from the collapsed one.
    await expect(page.locator(revealedField).first(), `"${reason}" should open its conditional reveal`)
      .toBeVisible()

    const model = await capture(page, name)
    expect(model.h1, `${name} should have captured an h1`).toBeTruthy()
  }
})

test('captures dr21-reason-for-import error state', async ({ page }) => {
  await startJourney(page)
  await fillOrigin(page, CATTLE)
  await fillCommodity(page, CATTLE)
  await expect(page).toHaveURL(/reason-for-import$/)

  // Choose the reason but leave its revealed purpose blank.
  await page.locator('input[name="importReason"][value="Internal market"]').check()
  await clickContinue(page)

  await expect(page.locator('.govuk-error-summary'), 'a blank revealed purpose should be rejected')
    .toBeVisible()
  const model = await capture(page, 'dr21-reason-for-import-error')
  expect(model.errorSummary.items.length, 'the error state should list at least one error')
    .toBeGreaterThan(0)
})

test('captures dr21-cph-number', async ({ page }) => {
  await startJourney(page)
  await fillOrigin(page, CATTLE)
  await fillCommodity(page, CATTLE)
  await expect(page).toHaveURL(/reason-for-import$/)

  // /cph-number is gated on the CPH consignment-address section being active for
  // the chosen commodity; when it isn't, the route redirects to
  // /roles-and-addresses. Assert we stayed, so the capture can't be mislabelled.
  await page.goto(`${BASE}/cph-number`)
  await expect(page, 'cph-number should be active for cattle, not redirect to roles-and-addresses')
    .toHaveURL(new RegExp(`${BASE}/cph-number$`))
  await expect(page.locator('main h1')).toHaveText(/county parish holding number/i)

  const model = await capture(page, 'dr21-cph-number')

  expect(model.url, 'cph-number should stay on the DR2.1 mount').toContain(BASE)
  expect(model.h1, 'cph-number should have captured an h1').toBeTruthy()
})

//
// DESIGN RELEASE 2.1 cartographer — the live-animal commodity branch.
//
// Walks what-are-you-importing → consignment-details →
// animal-identification-details → additional-animal-details with cattle
// (CN 0102, which carries ear-tag/passport identifiers so the identification
// page is in the journey) and captures a page model for each.
//
// Capture harness, not an assertion suite — but every step asserts the journey
// actually advanced, so a silently-rejected page cannot leave a mislabelled
// capture behind.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')
const journeyHelpers = require('/Users/samfarrington/git/defra/defra-design/GB-notification-service/journey-demo/e2e/journey.js')

const BASE = '/design-release-2.1'

// The prototype's own demo helpers drive its bespoke widgets (country
// autocomplete, commodity search) — reuse them rather than re-deriving
// selectors.
const {
  fillOrigin,
  fillCommodity,
  fillConsignmentDetails,
  fillAdditionalAnimalDetails
} = journeyHelpers

const CATTLE = {
  ...journeyHelpers.JOURNEYS[0],
  // DR2 onwards asks the internal-market purpose on reason-for-import as a
  // conditional reveal rather than on additional-animal-details.
  internalMarketPurpose: 'Slaughter'
}

// Not every DR2.1 page carries the action=continue button group, so fall back
// to the button's accessible name.
async function clickContinue (page) {
  const action = page.locator('button[name="action"][value="continue"]')
  if (await action.count()) {
    await action.first().click()
    return
  }
  await page.getByRole('button', { name: /save and continue|continue/i }).first().click()
}

// reason-for-import reveals the internal-market purpose radios conditionally.
async function fillReasonForImport (page, journey) {
  await page.locator(`input[name="importReason"][value="${journey.reason}"]`).check()
  await page
    .locator(`input[name="internalMarketPurpose"][value="${journey.internalMarketPurpose}"]`)
    .check()
  await clickContinue(page)
}

// what-are-you-importing renders a search box, not a checkbox list: the species
// rows only exist once the commodity-search widget has rendered results.
async function searchForCommodity (page, journey) {
  const search = page.locator('#commodity-search')
  await search.click()
  await search.fill('')
  await search.pressSequentially(journey.species.search, { delay: 30 })
  await expect(
    page.locator(`#commodity-species-${journey.species.id}`),
    `searching "${journey.species.search}" should render the ${journey.species.id} row`
  ).toBeVisible()
}

// Fills identifiers for every animal. The page renders one entry panel at a
// time with a "Save and add another"-style button until the last animal, so
// drive off whichever control the page actually offers.
async function fillAnimalIdentification (page, journey) {
  const maxPasses = Number(journey.animalCount) || 1

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const fields = page.locator('input[name^="identifiers["]')
    const count = await fields.count()
    if (count === 0) break

    for (let i = 0; i < count; i += 1) {
      await fields.nth(i).fill(`UK-${journey.species.id}-${pass + 1}-${i + 1}`)
    }

    const saveAnother = page.locator('button[name="action"][value^="save:"]')
    if (pass < maxPasses - 1 && (await saveAnother.count())) {
      await saveAnother.first().click()
      continue
    }
    break
  }

  await page.locator('button[name="action"][value="continue"]').first().click()
}

// Captures the screen and asserts the capture is usable — a green run that
// captured an empty model is a failure.
async function captureScreen (page, name) {
  const model = await capture(page, name)
  expect(model.url, `${name} should stay on the DR2.1 mount`).toContain(BASE)
  expect(model.h1, `${name} should have captured an h1`).toBeTruthy()
  return model
}

test.describe.configure({ mode: 'serial' })

test('DR2.1 live-animal commodity branch — cattle', async ({ page }) => {
  const journey = CATTLE

  await page.goto(`${BASE}/create-notification`)
  await expect(page).toHaveURL(/origin-of-the-import$/)

  await fillOrigin(page, journey)
  await expect(page, 'origin should advance to what-are-you-importing')
    .toHaveURL(/what-are-you-importing$/)

  // First load: the search box with no results rendered.
  const searchState = await captureScreen(page, 'dr21-what-are-you-importing')
  expect(
    searchState.forms.some((form) =>
      form.fields.some((field) => field.name === 'commoditySearch')
    ),
    'the first-load capture should show the commodity search box'
  ).toBe(true)

  // Post-search: the widget's species checkbox list.
  await searchForCommodity(page, journey)
  const resultsState = await captureScreen(page, 'dr21-what-are-you-importing-results')
  expect(
    resultsState.forms.some((form) =>
      form.fields.some((field) => field.kind === 'checkboxes' && field.name === 'commodity-selection')
    ),
    'the results capture should show the species checkbox list'
  ).toBe(true)

  await fillCommodity(page, journey)
  await expect(page, 'what-are-you-importing should advance to reason-for-import')
    .toHaveURL(/reason-for-import$/)

  await fillReasonForImport(page, journey)
  await expect(page, 'reason-for-import should advance to consignment-details')
    .toHaveURL(/consignment-details$/)

  await captureScreen(page, 'dr21-consignment-details')
  await fillConsignmentDetails(page, journey)
  await expect(page, 'consignment-details should advance to animal-identification-details')
    .toHaveURL(/animal-identification-details$/)

  await captureScreen(page, 'dr21-animal-identification-details')
  await fillAnimalIdentification(page, journey)
  await expect(page, 'animal-identification-details should advance to additional-animal-details')
    .toHaveURL(/additional-animal-details$/)

  await captureScreen(page, 'dr21-additional-animal-details')
  await fillAdditionalAnimalDetails(page, journey)
  await expect(page, 'additional-animal-details should advance to arrival-details')
    .toHaveURL(/arrival-details$/)
})

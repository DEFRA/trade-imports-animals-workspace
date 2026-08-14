//
// DESIGN RELEASE 2.1 cartographer — germinal products branch, part 2.
//
// Captures /animal-identification-details and /additional-animal-details as they
// render for a germinal-product commodity rather than a live animal. Germinal
// products are new in DR2.1 and branch both pages: identifiers come from the CN
// code (donor ID / collection date / identification number) instead of the
// species, and the additional-details page swaps the certification-purpose
// question for a storage-temperature one.
//
// The journey has to be built through what-are-you-importing and
// consignment-details with a germinal commodity first, because those pages are
// what put the germinal species into the session.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')
const journeyHelpers = require('/Users/samfarrington/git/defra/defra-design/GB-notification-service/journey-demo/e2e/journey.js')

const BASE = '/design-release-2.1'

const { fillOrigin, fillCommodity } = journeyHelpers

// Cattle semen (CN 05111000). Its identifier fields come from the commodity
// code, so a single species is enough to render every germinal identifier.
const GERMINAL = {
  speciesId: 'cattle-semen-bos-taurus',
  // The commodity search matches on whole-word prefixes, so "semen" surfaces
  // every germinal semen commodity; the checkbox id picks the species.
  species: { search: 'semen', id: 'cattle-semen-bos-taurus' },
  country: { search: 'France', option: 'France' },
  reference: 'DR21-GERMINAL-001',
  reason: 'Internal market',
  internalMarketPurpose: 'Breeding',
  netWeight: '12.5',
  packageType: 'Vial',
  numberOfPackages: '4',
  storageTemperature: 'Frozen',
  identifiers: {
    'donor-id': 'DONOR-0042',
    'collection-date': '27/3/2026',
    'identification-number': 'ID-99887766'
  }
}

// Not every DR2.1 page carries the action=continue button group, so fall back to
// the button's accessible name.
async function clickContinue (page) {
  const action = page.locator('button[name="action"][value="continue"]')
  if (await action.count()) {
    await action.first().click()
    return
  }
  await page.getByRole('button', { name: /save and continue|continue/i }).first().click()
}

async function fillReasonForImport (page, journey) {
  await page.locator(`input[name="importReason"][value="${journey.reason}"]`).check()
  await page
    .locator(`input[name="internalMarketPurpose"][value="${journey.internalMarketPurpose}"]`)
    .check()
  await clickContinue(page)
}

// Germinal consignment details ask for net weight, package type and number of
// packages per species instead of a number of animals.
async function fillGerminalConsignmentDetails (page, journey) {
  const id = journey.speciesId
  await page.locator(`input[name="netWeight[${id}]"]`).fill(journey.netWeight)
  await page.locator(`select[name="packageType[${id}]"]`).selectOption(journey.packageType)
  await page.locator(`input[name="numberOfPackages[${id}]"]`).fill(journey.numberOfPackages)
  await clickContinue(page)
}

// One identifier set per germinal species — there is no "save and add another"
// multi-animal loop, because the entry count is fixed at 1.
async function fillGerminalIdentifiers (page, journey) {
  const id = journey.speciesId

  await page.locator(`input[name="identifiers[${id}][donor-id]"]`).fill(journey.identifiers['donor-id'])

  const collectionDate = page.locator(`input[name="identifiers[${id}][collection-date]"]`)
  await collectionDate.fill(journey.identifiers['collection-date'])
  // The MOJ date picker's calendar overlays the next control until dismissed.
  await collectionDate.press('Escape')

  await page
    .locator(`input[name="identifiers[${id}][identification-number]"]`)
    .fill(journey.identifiers['identification-number'])

  await clickContinue(page)
}

async function fillGerminalAdditionalDetails (page, journey) {
  await page.locator(`input[name="storageTemperature"][value="${journey.storageTemperature}"]`).check()
  await clickContinue(page)
}

test.describe.configure({ mode: 'serial' })

test('DR2.1 germinal branch — identification and additional details', async ({ page }) => {
  const journey = GERMINAL

  await page.goto(`${BASE}/create-notification`)
  await expect(page).toHaveURL(/origin-of-the-import$/)

  await fillOrigin(page, journey)
  await expect(page, 'origin should advance to what-are-you-importing')
    .toHaveURL(/what-are-you-importing$/)

  await fillCommodity(page, journey)
  await expect(page, 'a germinal commodity should advance to reason-for-import')
    .toHaveURL(/reason-for-import$/)

  await fillReasonForImport(page, journey)
  await expect(page, 'reason-for-import should advance to consignment-details')
    .toHaveURL(/consignment-details$/)

  // Prove we are on the germinal branch of consignment-details before going on:
  // a live-animal commodity would render numberOfAnimals here instead.
  await expect(
    page.locator(`input[name="numberOfPackages[${journey.speciesId}]"]`),
    'germinal consignment-details should ask for a number of packages'
  ).toBeVisible()

  await fillGerminalConsignmentDetails(page, journey)
  await expect(page, 'germinal consignment-details should advance to animal-identification-details')
    .toHaveURL(/animal-identification-details$/)

  const identification = await capture(page, 'dr21-animal-identification-details-germinal')
  expect(identification.h1, 'identification page should have captured an h1').toBeTruthy()
  expect(identification.url).toContain(BASE)

  // The germinal identifier set is driven by the CN code, not the species.
  for (const field of ['donor-id', 'collection-date', 'identification-number']) {
    await expect(
      page.locator(`input[name="identifiers[${journey.speciesId}][${field}]"]`),
      `identification page should render the ${field} identifier`
    ).toBeVisible()
  }

  await fillGerminalIdentifiers(page, journey)
  await expect(page, 'identification should advance to additional-animal-details')
    .toHaveURL(/additional-animal-details$/)

  const additional = await capture(page, 'dr21-additional-animal-details-germinal')
  expect(additional.h1, 'additional-details page should have captured an h1').toBeTruthy()
  expect(additional.url).toContain(BASE)

  // Germinal-only consignments swap the certification-purpose question for a
  // storage-temperature one.
  await expect(
    page.locator('input[name="storageTemperature"]').first(),
    'germinal additional-animal-details should ask for a storage temperature'
  ).toBeVisible()
  await expect(
    page.locator('input[name="certificationPurpose"]'),
    'germinal additional-animal-details should not ask what the animals are certified for'
  ).toHaveCount(0)

  await fillGerminalAdditionalDetails(page, journey)
  await expect(page, 'additional-animal-details should advance to arrival-details')
    .toHaveURL(/arrival-details$/)
})

//
// DESIGN RELEASE 2.1 cartographer — consignment addresses slice.
//
// Walks the address half of the DR2.1 journey and captures a page model for
// each screen: the /roles-and-addresses hub, the consignment-address-select
// screen for each of the five selectable parties, the permanent-address
// sub-journey and the contact address for the consignment.
//
// A capture harness, not an assertion suite — but every navigation asserts the
// page actually landed, because the address routes silently redirect back to
// /roles-and-addresses when the section is not active for the chosen commodity,
// and a mislabelled capture is worse than a missing one.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')
const journeyHelpers = require('/Users/samfarrington/git/defra/defra-design/GB-notification-service/journey-demo/e2e/journey.js')

const BASE = '/design-release-2.1'

const { fillOrigin, fillCommodity, fillConsignmentDetails } = journeyHelpers

// The five selectable parties, each served by the shared
// consignment-address-select view under its own route.
const SELECTABLE_SECTIONS = [
  { id: 'place-of-origin', path: '/place-of-origin', field: 'placeOfOriginAddressId', heading: 'Place of origin' },
  { id: 'consignor-or-exporter', path: '/consignor-or-exporter', field: 'consignorAddressId', heading: 'Consignor' },
  { id: 'consignee', path: '/consignee', field: 'consigneeAddressId', heading: 'Consignee' },
  { id: 'importer', path: '/importer', field: 'importerAddressId', heading: 'Importer' },
  { id: 'place-of-destination', path: '/place-of-destination', field: 'placeOfDestinationAddressId', heading: 'Place of destination' }
]

// Cattle (0102) activates the five selectable parties plus CPH.
const CATTLE = { ...journeyHelpers.JOURNEYS[0], internalMarketPurpose: 'Slaughter' }

// Cat (01061900) is the only commodity that activates the permanent-address
// sub-journey.
const CAT = {
  ...journeyHelpers.JOURNEYS[2],
  internalMarketPurpose: 'Companion animal not for resale or rehoming'
}

// Not every DR2.1 page carries the action=continue button group — the address
// select pages use a plain "Save and continue" submit — so fall back to the
// button's accessible name.
async function clickContinue (page) {
  const action = page.locator('button[name="action"][value="continue"]')
  if (await action.count()) {
    await action.first().click()
    return
  }
  await page.getByRole('button', { name: /save and continue|continue/i }).first().click()
}

// DR2.1 asks the internal-market purpose on reason-for-import as a conditional
// reveal, and refuses to advance without it.
async function fillReasonForImport (page, journey) {
  await page.locator(`input[name="importReason"][value="${journey.reason}"]`).check()
  await page
    .locator(`input[name="internalMarketPurpose"][value="${journey.internalMarketPurpose}"]`)
    .check()
  await page.locator('button[name="action"][value="continue"]').first().click()
}

// Walks far enough to make the address sections active and the animal list
// non-empty: the section routes gate on the selected commodity, and the
// permanent-address animal list is built from numberOfAnimals.
async function walkToAddresses (page, journey) {
  await page.goto(`${BASE}/create-notification`)
  await expect(page, 'create-notification should open the journey').toHaveURL(/origin-of-the-import$/)

  await fillOrigin(page, journey)
  await expect(page, 'origin should advance to what-are-you-importing').toHaveURL(/what-are-you-importing$/)

  await fillCommodity(page, journey)
  await expect(page, 'commodity should advance to reason-for-import').toHaveURL(/reason-for-import$/)

  await fillReasonForImport(page, journey)
  await expect(page, 'reason should advance to consignment-details').toHaveURL(/consignment-details$/)

  await fillConsignmentDetails(page, journey)
  await expect(page, 'consignment-details should advance off itself').not.toHaveURL(/consignment-details$/)
}

async function goToAddressHub (page) {
  await page.goto(`${BASE}/roles-and-addresses`)
  await expect(page, 'the address hub should not redirect').toHaveURL(/roles-and-addresses$/)
  await expect(page.locator('main h1')).toHaveText(/consignment addresses/i)
}

test.describe.configure({ mode: 'serial' })

test('roles-and-addresses hub and the five selectable parties (cattle)', async ({ page }) => {
  await walkToAddresses(page, CATTLE)

  await goToAddressHub(page)
  const hub = await capture(page, 'dr21-roles-and-addresses')
  expect(hub.h1, 'the address hub should have captured an h1').toBeTruthy()

  for (const section of SELECTABLE_SECTIONS) {
    await page.goto(`${BASE}${section.path}`)
    // An inactive section redirects to the hub — assert we are still on the
    // section route before capturing, so a redirect cannot be mislabelled.
    await expect(page, `${section.path} should not redirect to the hub`)
      .toHaveURL(new RegExp(`${section.path}$`))
    await expect(page.locator('main h1')).toHaveText(section.heading)

    const model = await capture(page, `dr21-address-select-${section.id}`)
    expect(model.h1, `${section.id} should have captured an h1`).toBeTruthy()
    expect(model.forms.some((form) => form.fields.some((field) => field.name === section.field)),
      `${section.id} should offer its ${section.field} radios`).toBe(true)
  }

  // Complete every party so the hub's populated state is captured too. The
  // "Same as consignee" shortcut only exists once a consignee is chosen and the
  // section that offers it is still empty, so capture that window on the way
  // through.
  for (const section of SELECTABLE_SECTIONS) {
    await page.goto(`${BASE}${section.path}`)
    await page.locator(`input[name="${section.field}"]`).first().check()
    await clickContinue(page)
    await expect(page, `${section.path} should return to the hub`).toHaveURL(/roles-and-addresses$/)

    if (section.id === 'consignee') {
      await expect(
        page.getByRole('button', { name: /same as consignee/i }).first(),
        'a chosen consignee should unlock the same-as-consignee shortcut'
      ).toBeVisible()
      await capture(page, 'dr21-roles-and-addresses-same-as-consignee')
    }
  }

  await capture(page, 'dr21-roles-and-addresses-complete')

  await page.goto(`${BASE}/contact-address-for-consignment`)
  await expect(page, 'contact address should not redirect')
    .toHaveURL(/contact-address-for-consignment$/)
  const contact = await capture(page, 'dr21-contact-address-for-consignment')
  expect(contact.h1, 'contact address should have captured an h1').toBeTruthy()
})

test('permanent-address sub-journey (pet cat)', async ({ page }) => {
  await walkToAddresses(page, CAT)

  await goToAddressHub(page)
  await expect(
    page.getByRole('heading', { name: 'Permanent address', level: 2 }),
    'the cat journey should activate the permanent-address section'
  ).toBeVisible()

  // /permanent-address holds no view of its own in DR2.1: it clears the saved
  // answer and redirects straight to /permanent-address/select. Capture where it
  // actually lands rather than pretending the entry route renders a page.
  await page.goto(`${BASE}/permanent-address`)
  await expect(page, '/permanent-address should redirect to its select page')
    .toHaveURL(/permanent-address\/select$/)
  const entry = await capture(page, 'dr21-permanent-address')
  expect(entry.h1, 'permanent address entry should have captured an h1').toBeTruthy()

  await page.goto(`${BASE}/permanent-address/select`)
  await expect(page, 'permanent-address select should not redirect')
    .toHaveURL(/permanent-address\/select$/)
  const select = await capture(page, 'dr21-permanent-address-select')
  expect(select.h1, 'permanent address select should have captured an h1').toBeTruthy()

  // The view rendered at /permanent-address/select is permanent-address-animals,
  // so capture it under the view name as well — the models record the URL, so the
  // collapse is visible in the corpus rather than hidden by it.
  const animals = await capture(page, 'dr21-permanent-address-animals')
  expect(animals.h1, 'permanent address animals should have captured an h1').toBeTruthy()
  expect(
    animals.forms.some((form) => form.fields.some((field) => /^permanentAddressChoice/.test(field.name || ''))),
    'permanent address animals should offer a per-animal address choice'
  ).toBe(true)
})

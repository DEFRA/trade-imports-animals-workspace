//
// DESIGN RELEASE 2.1 cartographer — transport slice.
//
// Captures the six transport screens of the DR2.1 spine: arrival details, the
// overland-only transit-countries page, the transporter picker and the three
// "add a transporter" pages.
//
// Not an assertion suite: the page models are the deliverable. Every step still
// asserts the journey landed where the DR2.1 route table says it should, so a
// silently-rejected page cannot leave a mislabelled capture behind.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')
const journeyHelpers = require('/Users/samfarrington/git/defra/defra-design/GB-notification-service/journey-demo/e2e/journey.js')

const BASE = '/design-release-2.1'

// The prototype's own demo helpers drive the bespoke widgets (country
// autocomplete, commodity checkbox) — reuse them rather than re-deriving the
// selectors. The transport pages themselves are filled locally below, because
// the DR1-era helpers predate DR2's transport document reference and the
// internal-market purpose reveal.
const { fillOrigin, fillCommodity } = journeyHelpers

// Railway is one of the two means of transport that put /transit-countries on
// the spine (the other is Road Vehicle), so this journey reaches every screen
// in the slice. Port is added on top of the fixture: DR2.1's port-of-entry
// control offers UK airports whatever the means of transport, and arrival
// details only counts as complete once one is chosen.
const OVERLAND = {
  ...journeyHelpers.JOURNEYS[1],
  internalMarketPurpose: 'Slaughter',
  port: { search: 'Heathrow', option: 'London Heathrow' },
  transportDocumentReference: 'RWB-77-0001'
}

function urlEndingIn (path) {
  return new RegExp(`${path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}$`)
}

// `npm run dev` puts browsersync on the port straight away and only then boots
// the kit behind it, so the first request of a run can be answered with an
// empty response rather than a page. Retry the opening navigation until the kit
// is actually serving.
async function gotoWhenServing (page, path) {
  await expect
    .poll(async () => {
      try {
        const response = await page.goto(path)
        return response ? response.status() : 0
      } catch {
        return 0
      }
    }, { timeout: 180_000, intervals: [1000] })
    .toBe(200)
}

// Not every DR2.1 page carries the action=continue button group — a few use a
// plain submit — so fall back to the button's accessible name.
async function clickContinue (page) {
  const action = page.locator('button[name="action"][value="continue"]')
  if (await action.count()) {
    await action.first().click()
    return
  }
  await page.getByRole('button', { name: /save and continue|continue/i }).first().click()
}

// Drives one of the kit's type-and-pick autocompletes (country of origin, port
// of entry, transit country). The widget renders its option list on each input
// event and closes it on a blur timer, so retype the last character if the list
// has already gone when we reach for it.
async function pickFromAutocomplete (page, inputId, field) {
  const input = page.locator(`#${inputId}`)
  const option = page
    .locator('button.app-country-search__option', { hasText: field.option })
    .first()

  await input.click()
  await input.fill('')
  await input.pressSequentially(field.search, { delay: 30 })
  try {
    await option.waitFor({ state: 'visible', timeout: 4000 })
  } catch {
    await input.press('Backspace')
    await input.pressSequentially(field.search.slice(-1), { delay: 30 })
    await option.waitFor({ state: 'visible', timeout: 8000 })
  }
  await option.click()
}

// DR2.1 asks the internal-market purpose as a conditional reveal under the main
// reason, and refuses to advance while it is blank.
async function fillReasonForImport (page, journey) {
  await page.locator(`input[name="importReason"][value="${journey.reason}"]`).check()
  await page
    .locator(`input[name="internalMarketPurpose"][value="${journey.internalMarketPurpose}"]`)
    .check()
  await clickContinue(page)
}

// Number of animals is now mandatory per species, and germinal products swap it
// for net weight / package type / number of packages — so fill whichever inputs
// the page actually renders rather than assuming the live-animal shape.
async function fillConsignmentDetails (page, journey) {
  const numbered = [
    ['input[name^="numberOfAnimals["]', journey.animalCount || '2'],
    ['input[name^="numberOfPackages["]', '4'],
    ['input[name^="netWeight["]', '25']
  ]

  for (const [selector, value] of numbered) {
    const fields = page.locator(selector)
    for (let i = 0; i < (await fields.count()); i += 1) {
      await fields.nth(i).fill(String(value))
    }
  }

  const packageTypes = page.locator('select[name^="packageType["]')
  for (let i = 0; i < (await packageTypes.count()); i += 1) {
    await packageTypes.nth(i).selectOption({ index: 1 })
  }

  await clickContinue(page)
}

// Which questions appear here depends on the species, so answer whatever radio
// groups the page renders rather than naming them.
async function fillAdditionalAnimalDetails (page) {
  const groups = await page
    .locator('form input[type="radio"]')
    .evaluateAll((inputs) => [...new Set(inputs.map((input) => input.name))])

  for (const name of groups) {
    await page.locator(`input[type="radio"][name="${name}"]`).first().check()
  }

  await clickContinue(page)
}

async function fillArrivalDetails (page, journey) {
  const date = page.locator('input[name="arrivalDateAtPort"]')
  await date.fill('27/8/2026')
  // The MoJ date picker's calendar overlays the port control until dismissed.
  await date.press('Escape')

  if (journey.port) {
    await pickFromAutocomplete(page, 'port-of-entry', journey.port)
  }

  await page.locator('select[name="meansOfTransport"]').selectOption(journey.meansOfTransport)
  await page.locator('input[name="transportIdentification"]').fill(journey.transportId)
  await page.locator('input[name="transportDocumentReference"]').fill(journey.transportDocumentReference)
  await clickContinue(page)
}

test.describe.configure({ mode: 'serial' })

test('DR2.1 transport spine — arrival details, transit countries, transporter', async ({ page }) => {
  const journey = OVERLAND

  await gotoWhenServing(page, `${BASE}/create-notification`)
  await expect(page).toHaveURL(urlEndingIn('/origin-of-the-import'))

  await fillOrigin(page, journey)
  await expect(page).toHaveURL(urlEndingIn('/what-are-you-importing'))

  await fillCommodity(page, journey)
  await expect(page).toHaveURL(urlEndingIn('/reason-for-import'))

  await fillReasonForImport(page, journey)
  await expect(page).toHaveURL(urlEndingIn('/consignment-details'))

  await fillConsignmentDetails(page, journey)
  // Poultry carries no per-animal identifiers, so the spine skips that page —
  // but tolerate it appearing rather than assuming the branch.
  if (/animal-identification-details/.test(page.url())) {
    await page.locator('button[name="action"][value="continue"]').first().click()
  }
  await expect(page).toHaveURL(urlEndingIn('/additional-animal-details'))

  await fillAdditionalAnimalDetails(page)
  await expect(page).toHaveURL(urlEndingIn('/arrival-details'))

  const arrival = await capture(page, 'dr21-arrival-details')
  expect(arrival.h1, 'arrival details should have captured an h1').toBeTruthy()

  await fillArrivalDetails(page, journey)
  await expect(page, 'an overland means of transport should route via transit countries')
    .toHaveURL(urlEndingIn('/transit-countries'))

  const transit = await capture(page, 'dr21-transit-countries')
  expect(transit.h1, 'transit countries should have captured an h1').toBeTruthy()

  // The chosen-country summary only renders once a country is picked, so
  // capture that state too.
  await pickFromAutocomplete(page, 'transit-country-search', journey.transitCountry)
  await capture(page, 'dr21-transit-countries-selected')

  await clickContinue(page)
  await expect(page).toHaveURL(urlEndingIn('/transporter'))

  const transporter = await capture(page, 'dr21-transporter')
  expect(transporter.h1, 'transporter should have captured an h1').toBeTruthy()

  // Prove the captured transporter page is the live one, not a stale render.
  await page.locator(`input[name="transporterId"][value="${journey.transporterId}"]`).check()
  await clickContinue(page)
  await expect(page).toHaveURL(urlEndingIn('/upload-documents'))
})

test('DR2.1 add-a-transporter sub-journey', async ({ page }) => {
  await gotoWhenServing(page, `${BASE}/transporter/add`)
  await expect(page.locator('main h1')).toHaveText(/choose a transporter type/i)

  const add = await capture(page, 'dr21-transporter-add')
  expect(add.h1, 'transporter add should have captured an h1').toBeTruthy()

  // /transporter/add/private and /commercial bounce back to /transporter/add
  // unless the session already records the chosen type, so drive the choice
  // rather than navigating straight to them.
  await page.locator('input[name="transporterType"][value="private"]').check()
  await page.getByRole('button', { name: /^continue$/i }).first().click()
  await expect(page).toHaveURL(urlEndingIn('/transporter/add/private'))

  const priv = await capture(page, 'dr21-transporter-add-private')
  expect(priv.h1, 'private transporter should have captured an h1').toBeTruthy()

  await page.goto(`${BASE}/transporter/add`)
  await page.locator('input[name="transporterType"][value="commercial"]').check()
  await page.getByRole('button', { name: /^continue$/i }).first().click()
  await expect(page).toHaveURL(urlEndingIn('/transporter/add/commercial'))

  const commercial = await capture(page, 'dr21-transporter-add-commercial')
  expect(commercial.h1, 'commercial transporter should have captured an h1').toBeTruthy()
})

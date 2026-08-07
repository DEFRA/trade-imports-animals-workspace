//
// Cartographer for DESIGN RELEASE 2 of the designer prototype.
//
// Not an assertion suite: it walks every DR2 screen and captures a normalised
// structural model (plus HTML, PNG and a Playwright trace) so the real
// frontend's UI can be diffed against it screen by screen. Each step asserts
// the journey actually advanced, so a silently-rejected page can't leave a
// mislabelled capture behind.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')
const journeyHelpers = require('/Users/samfarrington/git/defra/defra-design/GB-notification-service/journey-demo/e2e/journey.js')

const BASE = '/design-release-2'

// The prototype's own demo helpers drive the bespoke widgets (autocompletes,
// MOJ date picker, commodity checkbox) — reuse them rather than re-deriving the
// selectors.
const {
  fillOrigin,
  fillCommodity,
  fillConsignmentDetails,
  fillAnimalIdentification,
  fillAdditionalAnimalDetails,

  fillTransitCountries,
  fillTransporter,
  fillUploadDocuments,
  fillDeclaration
} = journeyHelpers

// Not every DR2 page carries the action=continue button group — a few use a
// plain submit — so fall back to the button's accessible name.
async function clickContinue (page) {
  const action = page.locator('button[name="action"][value="continue"]')
  if (await action.count()) {
    await action.first().click()
    return
  }
  await page.getByRole('button', { name: /save and continue|continue|accept and submit/i })
    .first()
    .click()
}

// Same story as the address sub-pages: pick the first offered address rather
// than a DR1 fixture id.
async function fillContactAddress (page) {
  await page.locator('input[name="contactAddressId"]').first().check()
  await clickContinue(page)
}

const CATTLE = {
  ...journeyHelpers.JOURNEYS[0],
  // DR2 splits the internal-market purpose out of additional-animal-details and
  // asks it on reason-for-import as a conditional reveal.
  internalMarketPurpose: 'Slaughter',
  addressSections: journeyHelpers.JOURNEYS[0].addressSections.map((s) => ({
    ...s,
    href: `${BASE}${s.href}`
  }))
}

async function capturePath (page, path, name) {
  await page.goto(`${BASE}${path}`)
  return capture(page, name)
}

// Captures the current screen, runs its fill, then asserts the journey landed
// where the DR2 spine says it should.
async function step (page, name, fill, expectedNextPath) {
  await capture(page, name)
  await fill()
  await expect(page, `${name} should advance to ${expectedNextPath}`)
    .toHaveURL(new RegExp(`${expectedNextPath.replace(/\//g, '\\/')}$`))
}

// Fills identifiers for every animal. Some species render a "Save and add
// another" button and some don't (a single animal completes in one pass), so
// drive off whichever control the page actually offers.
async function fillAnimalIdentificationDr2 (page, journey) {
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

// DR2 adds a transport document reference to arrival details, and the review
// page refuses to advance until it is filled.
async function fillArrivalDetailsDr2 (page, journey) {
  const date = page.locator('input[name="arrivalDateAtPort"]')
  await date.fill('27/8/2026')
  // The MOJ date picker's calendar overlays the port dropdown until dismissed.
  await date.press('Escape')

  if (journey.port) {
    const portInput = page.locator('#port-of-entry')
    await portInput.click()
    await portInput.pressSequentially(journey.port.search, { delay: 30 })
    await page
      .locator('button.app-country-search__option', { hasText: journey.port.option })
      .first()
      .click()
  }

  await page.locator('select[name="meansOfTransport"]').selectOption(journey.meansOfTransport)
  await page.locator('input[name="transportIdentification"]').fill(journey.transportId)
  await page.locator('input[name="transportDocumentReference"]').fill('AWB-125-98765432')
  await clickContinue(page)
}

// DR2 rebuilt the address sub-pages around a search + "Select <name>" radio
// list whose option ids are role-suffixed, so pick by position rather than by
// the DR1 fixture ids.
async function fillAddressSectionsDr2 (page, journey) {
  for (const section of journey.addressSections) {
    await page.goto(section.href)

    if (section.kind === 'cph') {
      await page.locator('input[name="cphNumber-county"]').fill('12')
      await page.locator('input[name="cphNumber-parish"]').fill('345')
      await page.locator('input[name="cphNumber-holding"]').fill('6789')
    } else if (section.kind === 'permanent') {
      const sameAsPod = page.locator('input[value="same-as-pod"]')
      for (let i = 0; i < (await sameAsPod.count()); i += 1) {
        await sameAsPod.nth(i).check()
      }
    } else {
      await page.locator(`input[name="${section.field}"]`).first().check()
    }

    await page.getByRole('button', { name: /save and continue/i }).first().click()
    await expect(page, `${section.href} should return to roles-and-addresses`)
      .toHaveURL(/roles-and-addresses$/)
  }
}

async function fillReasonForImport (page, journey) {
  await page.locator(`input[name="importReason"][value="${journey.reason}"]`).check()
  await page
    .locator(`input[name="internalMarketPurpose"][value="${journey.internalMarketPurpose}"]`)
    .check()
  await page.locator('button[name="action"][value="continue"]').first().click()
}

test.describe.configure({ mode: 'serial' })

test('DR2 dashboard surfaces', async ({ page }) => {
  await capturePath(page, '', 'dr2-dashboard')
  await capturePath(page, '/?additionalFilters=open', 'dr2-dashboard-filters-open')
  await capturePath(page, '/actions', 'dr2-dashboard-actions')
  await capturePath(page, '/changes', 'dr2-dashboard-changes')
  await capturePath(page, '/inspection', 'dr2-dashboard-inspection')
  await capturePath(page, '/templates', 'dr2-templates')
  await capturePath(page, '/templates/create', 'dr2-template-create')

  // A real template card's view link — not /templates/create.
  await page.goto(`${BASE}/templates`)
  const templateHref = await page
    .locator(`a[href^="${BASE}/templates/"]:not([href$="/create"]):not([href$="/use"])`)
    .first()
    .getAttribute('href')
  await page.goto(templateHref)
  await capture(page, 'dr2-template-view')
})

test('DR2 address book (shared, unprefixed)', async ({ page }) => {
  await page.goto(`${BASE}`)
  await capturePath(page, '/address-book'.replace(BASE, ''), 'dr2-address-book-via-nav')
  await page.goto('/address-book')
  await capture(page, 'dr2-address-book')
  await page.goto('/address-book/add')
  await capture(page, 'dr2-address-book-add')

  // The lookup screen is only reachable by submitting the add form, so drive it.
  const firstCategory = page.locator('input[type="radio"]').first()
  if (await firstCategory.count()) {
    await firstCategory.check()
    await page.getByRole('button', { name: /continue|save/i }).first().click()
    await capture(page, 'dr2-address-book-after-add-submit')
  }
  await page.goto('/address-book/add/lookup')
  await capture(page, 'dr2-address-book-lookup')
  await page.goto('/address-book/add/usage')
  await capture(page, 'dr2-address-book-usage')
})

test('DR2 reason-for-import error state', async ({ page }) => {
  await page.goto(`${BASE}/create-notification`)
  await fillOrigin(page, CATTLE)
  await fillCommodity(page, CATTLE)
  await expect(page).toHaveURL(/reason-for-import$/)
  // Submit with the main reason chosen but the revealed purpose left blank.
  await page.locator(`input[name="importReason"][value="${CATTLE.reason}"]`).check()
  await page.locator('button[name="action"][value="continue"]').first().click()
  await capture(page, 'dr2-error-reason-for-import')
})

test('DR2 full journey — cattle by air', async ({ page }) => {
  const journey = CATTLE

  await page.goto(`${BASE}/create-notification`)
  await expect(page).toHaveURL(/origin-of-the-import$/)

  await step(page, 'dr2-01-origin-of-the-import',
    () => fillOrigin(page, journey), '/what-are-you-importing')
  await step(page, 'dr2-02-what-are-you-importing',
    () => fillCommodity(page, journey), '/reason-for-import')
  await step(page, 'dr2-03-reason-for-import',
    () => fillReasonForImport(page, journey), '/consignment-details')
  await step(page, 'dr2-04-consignment-details',
    () => fillConsignmentDetails(page, journey), '/animal-identification-details')
  await step(page, 'dr2-05-animal-identification-details',
    () => fillAnimalIdentificationDr2(page, journey), '/additional-animal-details')
  await step(page, 'dr2-06-additional-animal-details',
    () => fillAdditionalAnimalDetails(page, journey), '/arrival-details')
  // Cattle by air skips transit countries; capture that screen standalone below.
  await step(page, 'dr2-07-arrival-details',
    () => fillArrivalDetailsDr2(page, journey), '/transporter')
  await step(page, 'dr2-09-transporter',
    () => fillTransporter(page, journey), '/upload-documents')
  await step(page, 'dr2-10-upload-documents',
    () => fillUploadDocuments(page), '/roles-and-addresses')

  await capture(page, 'dr2-11-roles-and-addresses')
  // Capture each address sub-page empty before the fill loop completes them.
  for (const section of journey.addressSections) {
    await page.goto(section.href)
    await capture(page, `dr2-11${section.href.replace(BASE, '').replace(/\//g, '-')}`)
  }
  await fillAddressSectionsDr2(page, journey)
  await capture(page, 'dr2-11-roles-and-addresses-complete')

  await page.locator('button[name="action"][value="continue"]').first().click()
  await expect(page).toHaveURL(/contact-address-for-consignment$/)
  await step(page, 'dr2-12-contact-address-for-consignment',
    () => fillContactAddress(page), '/review-notification')

  await capturePath(page, '/notification-hub', 'dr2-13-notification-hub-complete')

  await page.goto(`${BASE}/review-notification`)
  await capture(page, 'dr2-14-review-notification')
  await page.locator('button[name="action"][value="continue"], form button[type="submit"]')
    .first().click()
  await expect(page).toHaveURL(/declaration$/)

  await step(page, 'dr2-15-declaration',
    () => fillDeclaration(page), '/notification-submitted')
  await capture(page, 'dr2-16-notification-submitted')

  // Post-submission: the dashboard now carries a submitted notification, which
  // unlocks the amend / copy-as-new / create-template surfaces.
  await capturePath(page, '', 'dr2-17-dashboard-after-submission')
})

test('DR2 transit-countries branch (rail via transit)', async ({ page }) => {
  const journey = { ...journeyHelpers.JOURNEYS[1], internalMarketPurpose: 'Slaughter' }

  await page.goto(`${BASE}/create-notification`)
  await fillOrigin(page, journey)
  await fillCommodity(page, journey)
  await fillReasonForImport(page, journey)
  await fillConsignmentDetails(page, journey)
  if (/animal-identification-details/.test(page.url())) {
    await fillAnimalIdentificationDr2(page, journey)
  }
  await fillAdditionalAnimalDetails(page, journey)
  await fillArrivalDetailsDr2(page, journey)
  await expect(page).toHaveURL(/transit-countries$/)
  await capture(page, 'dr2-08-transit-countries')
  await fillTransitCountries(page, journey)
  await capture(page, 'dr2-08b-transit-countries-after-add')
})

test('DR2 permanent-address branch (pet cat)', async ({ page }) => {
  const journey = {
    ...journeyHelpers.JOURNEYS[2],
    internalMarketPurpose: 'Companion animal not for resale or rehoming'
  }

  await page.goto(`${BASE}/create-notification`)
  await fillOrigin(page, journey)
  await fillCommodity(page, journey)
  await fillReasonForImport(page, journey)
  await fillConsignmentDetails(page, journey)
  if (/animal-identification-details/.test(page.url())) {
    await fillAnimalIdentificationDr2(page, journey)
  }
  await fillAdditionalAnimalDetails(page, journey)
  await fillArrivalDetailsDr2(page, journey)
  await fillTransporter(page, journey)
  await fillUploadDocuments(page)
  await capturePath(page, '/permanent-address', 'dr2-11-permanent-address')
  await capturePath(page, '/permanent-address/select', 'dr2-11-permanent-address-select')
  await capturePath(page, '/permanent-address/enter-address', 'dr2-11-permanent-address-enter')
  await capturePath(page, '/cph-number', 'dr2-11-cph-number')
  await capturePath(page, '/transporter/add', 'dr2-09-transporter-add')
  await capturePath(page, '/transporter/add/private', 'dr2-09-transporter-add-private')
  await capturePath(page, '/transporter/add/commercial', 'dr2-09-transporter-add-commercial')
  await capturePath(page, '/consignment-address-select', 'dr2-11-consignment-address-select')
})

test('DR2 view submitted, amend and cancel-amend', async ({ page }) => {
  await page.goto(`${BASE}`)
  const viewHref = await page
    .locator(`a[href^="${BASE}/review-notification?reference="]`)
    .first()
    .getAttribute('href')

  await page.goto(viewHref)
  await capture(page, 'dr2-18-view-draft-notification')

  // Amend is only offered on a submitted / action-required notification, so walk
  // the dashboard's view links until one renders the amend control.
  await page.goto(`${BASE}`)
  const viewHrefs = await page
    .locator(`a[href^="${BASE}/review-notification?reference="]`)
    .evaluateAll((links) => links.map((a) => a.getAttribute('href')))

  const openAmendModal = page.locator('[data-amend-modal-open]')
  let foundAmendable = false
  for (const href of viewHrefs) {
    await page.goto(href)
    if (await openAmendModal.count()) {
      foundAmendable = true
      break
    }
  }
  expect(foundAmendable, 'a submitted notification should offer "Amend this notification"').toBe(true)
  await capture(page, 'dr2-18a-view-submitted-notification')

  // Amend is gated behind a confirmation modal opened by a JS button, not a link.
  await openAmendModal.click()
  await capture(page, 'dr2-18b-amend-confirmation-modal')

  await page.getByRole('link', { name: /yes, amend consignment/i }).click()
  await capture(page, 'dr2-19-review-notification-amend')

  // A journey page in amend state renders a different action group.
  await capturePath(page, '/origin-of-the-import', 'dr2-19b-journey-page-amend-state')
  await capturePath(page, '/notification-hub', 'dr2-19c-notification-hub-amend-state')

  await page.goto(`${BASE}/review-notification`)
  const openCancelModal = page.locator('[data-modal-open="cancel-amend-modal"]')
  // The review page repeats the trigger at the top and bottom of the page.
  await expect(openCancelModal.first(), 'review in amend state should offer cancel-amend')
    .toBeVisible()
  await openCancelModal.first().click()
  await capture(page, 'dr2-19d-cancel-amend-modal')

  await page.getByRole('link', { name: /yes, cancel amendment/i }).click()
  await capture(page, 'dr2-19e-after-cancel-amend')

  // The create-template surface hangs off a submitted notification.
  await capturePath(page, '/templates/create', 'dr2-19f-create-template-from-notification')
})

test('DR2 empty-journey hub and review', async ({ page }) => {
  await page.goto(`${BASE}/create-notification`)
  await capturePath(page, '/notification-hub', 'dr2-20-notification-hub-empty')
  await capturePath(page, '/review-notification', 'dr2-21-review-notification-empty')
})

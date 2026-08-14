//
// DESIGN RELEASE 2.1 cartographer — notification spine.
//
// Walks the tail of the notification journey (hub, review, declaration,
// submitted) and the post-submission notification actions (delete, copy as new,
// amend, cancel amend), capturing a page model for each.
//
// Not an assertion suite: the models are the deliverable. But every step asserts
// the journey actually landed where it should, so a silently-rejected page can
// never leave a mislabelled capture behind.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')
const journeyHelpers = require('/Users/samfarrington/git/defra/defra-design/GB-notification-service/journey-demo/e2e/journey.js')

const BASE = '/design-release-2.1'

// The prototype's own demo helpers drive the bespoke widgets (autocompletes,
// MOJ date picker, commodity checkbox) — reuse them rather than re-deriving the
// selectors. The rest is filled locally, because DR2.1 moved the goalposts.
const { fillOrigin, fillCommodity, fillTransporter } = journeyHelpers

const CATTLE = {
  ...journeyHelpers.JOURNEYS[0],
  // Reason-for-import reveals the internal-market purpose as a conditional and
  // refuses to advance without it.
  internalMarketPurpose: 'Slaughter',
  addressSections: journeyHelpers.JOURNEYS[0].addressSections.map((section) => ({
    ...section,
    href: `${BASE}${section.href}`
  }))
}

// Not every DR2.1 page carries the action=continue button group — review uses a
// plain submit — so fall back to the button's accessible name.
async function clickContinue (page) {
  const action = page.locator('button[name="action"][value="continue"]')
  if (await action.count()) {
    await action.first().click()
    return
  }
  await page
    .getByRole('button', { name: /save and continue|continue|accept and submit|confirm|submit/i })
    .first()
    .click()
}

// Fills every empty visible text box in the page's form, and picks the first
// real option in every select. DR2.1 added per-species packaging questions to
// consignment-details whose names vary by commodity, so drive off what the page
// renders rather than a fixed field list.
async function fillPendingFields (page, value) {
  const inputs = page.locator(
    'form input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]):not([type="submit"]):not([type="button"]):not([type="file"])'
  )

  for (let i = 0; i < (await inputs.count()); i += 1) {
    const input = inputs.nth(i)
    if (!(await input.isVisible())) continue
    if (await input.inputValue()) continue

    const id = (await input.getAttribute('id')) || ''
    if (/date/i.test(id)) {
      await input.fill('27/3/2026')
      // The MOJ date picker's calendar overlays whatever comes next.
      await input.press('Escape')
      continue
    }

    await input.fill(value)
  }

  const selects = page.locator('form select')
  for (let i = 0; i < (await selects.count()); i += 1) {
    const select = selects.nth(i)
    if (!(await select.isVisible())) continue
    if (await select.inputValue()) continue

    const firstReal = await select.evaluate((el) => {
      const option = [...el.options].find((o) => o.value)
      return option ? option.value : null
    })
    if (firstReal) await select.selectOption(firstReal)
  }
}

// Checks the first option of every radio group the page renders that has no
// choice yet.
async function pickPendingRadios (page) {
  const names = await page.locator('form input[type="radio"]').evaluateAll((radios) => {
    const grouped = new Map()
    radios.forEach((radio) => {
      if (!grouped.has(radio.name)) grouped.set(radio.name, [])
      grouped.get(radio.name).push(radio)
    })
    return [...grouped.entries()]
      .filter(([, group]) => !group.some((radio) => radio.checked))
      .map(([name]) => name)
  })

  for (const name of names) {
    const group = page.locator(`form input[type="radio"][name="${name}"]`)
    const visible = group.locator('visible=true')
    if (await visible.count()) await visible.first().check()
  }
}

async function fillReasonForImport (page, journey) {
  await page.locator(`input[name="importReason"][value="${journey.reason}"]`).check()
  await page
    .locator(`input[name="internalMarketPurpose"][value="${journey.internalMarketPurpose}"]`)
    .check()
  await clickContinue(page)
}

// DR2.1 validates net weight, package type and package counts alongside the
// animal count, so fill everything the page asks for.
async function fillConsignmentDetails (page, journey) {
  const animalCounts = page.locator('input[name^="numberOfAnimals["]')
  for (let i = 0; i < (await animalCounts.count()); i += 1) {
    await animalCounts.nth(i).fill(journey.animalCount)
  }
  await fillPendingFields(page, '10')
  await clickContinue(page)
}

// Fills identifiers for every animal. Some species render a "Save and add
// another" button and some don't (a single animal completes in one pass), so
// drive off whichever control the page actually offers.
async function fillAnimalIdentification (page, journey) {
  const maxPasses = Number(journey.animalCount) || 1

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const fields = page.locator('input[name^="identifiers["]')
    const count = await fields.count()
    if (count === 0) break

    for (let i = 0; i < count; i += 1) {
      const field = fields.nth(i)
      const id = (await field.getAttribute('id')) || ''
      if (/date/i.test(id)) {
        await field.fill('27/3/2026')
        await field.press('Escape')
        continue
      }
      await field.fill(`UK-${journey.species.id}-${pass + 1}-${i + 1}`)
    }

    const saveAnother = page.locator('button[name="action"][value^="save:"]')
    if (pass < maxPasses - 1 && (await saveAnother.count())) {
      await saveAnother.first().click()
      continue
    }
    break
  }

  await clickContinue(page)
}

async function fillAdditionalAnimalDetails (page) {
  await pickPendingRadios(page)
  await clickContinue(page)
}

async function fillArrivalDetails (page, journey) {
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

async function fillTransitCountries (page, journey) {
  if (journey.transitCountry) {
    const input = page.locator('#transit-country-search')
    await input.click()
    await input.pressSequentially(journey.transitCountry.search, { delay: 30 })
    await page
      .locator('button.app-country-search__option', { hasText: journey.transitCountry.option })
      .first()
      .click()
  }
  await clickContinue(page)
}

// The address sub-pages are a search + "Select <name>" radio list whose option
// ids are role-suffixed, so pick by position rather than by a DR1 fixture id.
async function fillAddressSections (page, journey) {
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

  await clickContinue(page)
}

async function fillContactAddress (page) {
  await page.locator('input[name="contactAddressId"]').first().check()
  await clickContinue(page)
}

// The DR2.1 journey spine, keyed by the page each step lands on. Driving off the
// current URL rather than a hardcoded order means the walk survives DR2.1
// reordering a step, and records the order it actually took.
const SPINE = [
  { match: /\/origin-of-the-import$/, fill: (page, journey) => fillOrigin(page, journey) },
  { match: /\/what-are-you-importing$/, fill: (page, journey) => fillCommodity(page, journey) },
  { match: /\/reason-for-import$/, fill: fillReasonForImport },
  { match: /\/consignment-details$/, fill: fillConsignmentDetails },
  { match: /\/animal-identification-details$/, fill: fillAnimalIdentification },
  { match: /\/additional-animal-details$/, fill: fillAdditionalAnimalDetails },
  { match: /\/arrival-details$/, fill: fillArrivalDetails },
  { match: /\/transit-countries$/, fill: fillTransitCountries },
  { match: /\/transporter$/, fill: (page, journey) => fillTransporter(page, journey) },
  { match: /\/upload-documents$/, fill: (page) => clickContinue(page) },
  { match: /\/roles-and-addresses$/, fill: fillAddressSections },
  { match: /\/contact-address-for-consignment$/, fill: fillContactAddress }
]

function currentPath (page) {
  return new URL(page.url()).pathname
}

// Walks the journey from wherever it stands until it reaches `destination`,
// asserting each step advances to a page the spine recognises. Returns the
// order of pages it actually visited.
async function walkJourneyTo (page, journey, destination) {
  const visited = []

  for (let step = 0; step < SPINE.length * 2; step += 1) {
    const before = currentPath(page)
    if (destination.test(before)) return visited

    const spineStep = SPINE.find((candidate) => candidate.match.test(before))
    expect(spineStep, `${before} should be a page the DR2.1 spine defines`).toBeTruthy()

    visited.push(before)
    await spineStep.fill(page, journey)
    await expect(page, `${before} should advance`).not.toHaveURL(new RegExp(`${before}$`))
  }

  throw new Error(`journey never reached ${destination} — visited ${visited.join(' → ')}`)
}

async function captureAt (page, path, name) {
  await page.goto(`${BASE}${path}`)
  return capture(page, name)
}

test.describe.configure({ mode: 'serial' })

test('DR2.1 notification spine — hub, review, declaration, submitted', async ({ page }) => {
  await page.goto(`${BASE}/create-notification`)
  await expect(page).toHaveURL(/origin-of-the-import$/)

  // The hub on a freshly started, entirely empty notification.
  const emptyHub = await captureAt(page, '/notification-hub', 'dr21-notification-hub')
  expect(emptyHub.h1, 'notification-hub should have an h1').toBeTruthy()

  await page.goto(`${BASE}/origin-of-the-import`)
  const visited = await walkJourneyTo(page, CATTLE, /\/review-notification$/)
  // eslint-disable-next-line no-console
  console.log(`DR2.1 spine order: ${visited.join(' → ')}`)

  const completeHub = await captureAt(page, '/notification-hub', 'dr21-notification-hub-complete')
  // DR2.1's hub is a bespoke app-notification-hub tasklist, not a govuk-task-list,
  // so the extractor's taskLists is empty — assert on the section headings instead.
  expect(
    completeHub.headings.map((heading) => heading.text),
    'the populated hub should render its tasklist sections'
  ).toContain('Notification tasklist')

  await page.goto(`${BASE}/review-notification`)
  const review = await capture(page, 'dr21-review-notification')
  // DR2.1's review page is built from bespoke app-dr2-review-card sections, not
  // govuk-summary-list, so the extractor files them under cards.
  expect(review.cards.length, 'review should render its summary cards').toBeGreaterThan(0)

  await clickContinue(page)
  await expect(page, 'a complete review should advance to the declaration').toHaveURL(/declaration$/)
  const declaration = await capture(page, 'dr21-declaration')
  expect(declaration.h1, 'declaration should have an h1').toBeTruthy()

  await page.locator('#declaration-confirmed').check()
  await clickContinue(page)
  await expect(page, 'a confirmed declaration should submit').toHaveURL(/notification-submitted$/)
  const submitted = await capture(page, 'dr21-notification-submitted')
  expect(submitted.h1, 'notification-submitted should have an h1').toBeTruthy()
})

test('DR2.1 notification actions — delete, copy as new, amend, cancel amend', async ({ page }) => {
  // Bare routes carry no source notification. Capture wherever each lands: that
  // redirect target is itself part of the DR2.1 route map.
  for (const [path, name] of [
    ['/notifications/copy-as-new', 'dr21-notifications-copy-as-new-bare'],
    ['/notifications/amend', 'dr21-notifications-amend-bare'],
    ['/notifications/cancel-amend', 'dr21-notifications-cancel-amend-bare'],
    ['/notifications/delete', 'dr21-notifications-delete-bare']
  ]) {
    const model = await captureAt(page, path, name)
    expect(model.h1, `${name} should land on a page with an h1`).toBeTruthy()
  }

  // Amend and delete are only offered on a submitted notification, so walk the
  // dashboard's view links until one renders the amend control.
  await page.goto(BASE)
  const viewHrefs = await page
    .locator(`a[href^="${BASE}/review-notification?"]`)
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  expect(viewHrefs.length, 'the dashboard should link to at least one notification').toBeGreaterThan(0)

  const amendButton = page.locator('[data-amend-modal-open]')
  let amendableHref = null
  for (const href of viewHrefs) {
    await page.goto(href)
    if (await amendButton.count()) {
      amendableHref = href
      break
    }
  }
  expect(amendableHref, 'a submitted notification should offer "Amend this notification"').toBeTruthy()
  await capture(page, 'dr21-review-notification-submitted')

  const deleteHref = await page
    .getByRole('link', { name: /^delete$/i })
    .first()
    .getAttribute('href')
  expect(deleteHref, 'a submitted notification should offer a Delete link').toContain('/notifications/delete')

  await page.goto(deleteHref)
  await expect(page, 'the Delete link should reach the delete confirmation').toHaveURL(/notifications\/delete/)
  const deleteModel = await capture(page, 'dr21-delete-notification')
  expect(deleteModel.h1, 'delete-notification should have an h1').toBeTruthy()

  // Amend is gated behind a confirmation modal opened by a JS button, not a link.
  await page.goto(amendableHref)
  await amendButton.first().click()
  await capture(page, 'dr21-amend-confirmation-modal')

  await page.getByRole('link', { name: /yes, amend/i }).click()
  await expect(page, 'confirming amend should open the notification in amend state')
    .toHaveURL(/review-notification/)
  const amend = await capture(page, 'dr21-notifications-amend')
  expect(amend.h1, 'the amend landing page should have an h1').toBeTruthy()

  await captureAt(page, '/notifications/cancel-amend', 'dr21-notifications-cancel-amend')

  await page.goto(amendableHref)
  const copyHref = await page
    .getByRole('link', { name: /copy as new/i })
    .first()
    .getAttribute('href')
  expect(copyHref, 'a submitted notification should offer Copy as new').toContain('/notifications/copy-as-new')

  await page.goto(copyHref)
  const copy = await capture(page, 'dr21-notifications-copy-as-new')
  expect(copy.h1, 'the copy-as-new landing page should have an h1').toBeTruthy()
})

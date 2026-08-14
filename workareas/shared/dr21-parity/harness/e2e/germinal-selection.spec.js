//
// DESIGN RELEASE 2.1 cartographer — germinal products branch, part 1.
//
// Germinal products (semen and embryos/ova) are a commodity domain the real
// frontend does not model at all, so these captures are the primary evidence
// for the largest parity backlog band. Two screens carry the branch here:
// /what-are-you-importing (the commodity search now serves a germinal
// catalogue alongside live animals) and /consignment-details (germinal species
// ask net weight + type of package + number of packages instead of number of
// animals).
//
// Capture harness, not an assertion suite — but every step asserts the journey
// actually advanced, so a silently-rejected page cannot leave a mislabelled
// capture behind.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')
const journeyHelpers = require('/Users/samfarrington/git/defra/defra-design/GB-notification-service/journey-demo/e2e/journey.js')

const BASE = '/design-release-2.1'

const { fillOrigin } = journeyHelpers

// Every germinal commodity but "Cattle, Semen" shares CN code 05119985, and the
// search matches a commodity code by prefix — so this one query renders almost
// the whole germinal catalogue into the results list.
const GERMINAL_CODE = '05119985'

const ORIGIN = {
  country: { search: 'France', option: 'France' },
  reference: 'DR21-GERMINAL-001'
}

// "Cattle, Semen" is the only germinal commodity on CN code 05111000 and the
// only one carrying a species without a common name ("Bovidae"), which renders
// a differently-formatted option label — worth having in the corpus.
const GERMINAL_SPECIES = [
  'cattle-semen-bos-taurus',
  'cattle-semen-bovidae'
]

const LIVE_ANIMAL_SPECIES = 'cattle-bos-taurus'

// The kit builds its client bundle on the first request, so a page served
// mid-build carries no working JavaScript and every bespoke widget (the country
// autocomplete, the commodity search) stays inert. Wait for the kit's own entry
// point, and reload once if this page was the unlucky one.
async function waitForKitJavaScript (page) {
  const kitIsReady = () => Boolean(window.GOVUKPrototypeKit)

  try {
    await page.waitForFunction(kitIsReady, null, { timeout: 20_000 })
  } catch {
    await page.reload()
    await page.waitForFunction(kitIsReady, null, { timeout: 120_000 })
  }
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

// Types into the bespoke commodity search and waits for the results list to
// render. The widget renders on each input event and needs three characters
// before it will open at all.
async function searchCommodities (page, query) {
  const search = page.locator('#commodity-search')
  await search.click()
  await search.fill('')
  await search.pressSequentially(query, { delay: 20 })
  await expect(page.locator('#commodity-search-results')).toBeVisible()
}

// Checks a species row and waits for the change handler to write the selection
// into the hidden selectedSpecies field, which is what the POST actually
// carries.
async function selectSpecies (page, speciesIds) {
  for (const speciesId of speciesIds) {
    await page.locator(`#commodity-species-${speciesId}`).check()
    await expect(
      page.locator('input.app-commodity-search__species-value'),
      `selecting ${speciesId} should reach the hidden selectedSpecies field`
    ).toHaveValue(new RegExp(speciesId))
  }
}

// DR2.1 asks the internal-market purpose as a conditional reveal on
// reason-for-import, and refuses to advance until it is answered.
async function fillReasonForImport (page) {
  await page.locator('input[name="importReason"][value="Internal market"]').check()
  await page.locator('input[name="internalMarketPurpose"][value="Breeding"]').check()
  await clickContinue(page)
}

// Germinal species ask for net weight, a package type from the shared
// package-types list, and a number of packages — never a number of animals.
async function fillGerminalConsignmentDetails (page, speciesIds) {
  for (const [index, speciesId] of speciesIds.entries()) {
    await page.locator(`#net-weight-${speciesId}`).fill(`${12 + index}.5`)
    await page.locator(`#package-type-${speciesId}`).selectOption('Vial')
    await page.locator(`#number-of-packages-${speciesId}`).fill(String(3 + index))
  }
}

test.describe.configure({ mode: 'serial' })

test('DR2.1 germinal products — commodity selection and commodity details', async ({ page }) => {
  await page.goto(`${BASE}/create-notification`)
  await expect(page).toHaveURL(/origin-of-the-import$/)
  await waitForKitJavaScript(page)

  await fillOrigin(page, ORIGIN)
  await expect(page, 'origin should advance to what-are-you-importing')
    .toHaveURL(/what-are-you-importing$/)

  // The germinal catalogue as the search surfaces it: commodity header rows
  // plus a species checkbox row per donor species.
  await searchCommodities(page, GERMINAL_CODE)
  await expect(
    page.locator('#commodity-search-results .app-commodity-search__row--commodity-header'),
    'the germinal code should surface a multi-commodity result set'
  ).not.toHaveCount(0)
  const catalogue = await capture(page, 'dr21-what-are-you-importing-germinal-catalogue')
  expect(catalogue.h1).toBeTruthy()

  // Then the selection state the screen is really about: two donor species of
  // one germinal commodity, results list open and the selected panel populated.
  await searchCommodities(page, 'cattle semen')
  await selectSpecies(page, GERMINAL_SPECIES)
  await expect(
    page.locator('#commodity-search-selected-heading'),
    'the selected panel should count both germinal species'
  ).toHaveText('2 selected')

  const importing = await capture(page, 'dr21-what-are-you-importing-germinal')
  expect(importing.url, 'the capture should stay on the DR2.1 mount').toContain(BASE)
  expect(importing.h1, 'what-are-you-importing should have captured an h1').toBeTruthy()

  // Checking a species reopens the results list over the submit button.
  await page.locator('#commodity-search').press('Escape')
  await clickContinue(page)
  await expect(page, 'what-are-you-importing should advance to reason-for-import')
    .toHaveURL(/reason-for-import$/)

  await fillReasonForImport(page)
  await expect(page, 'reason-for-import should advance to consignment-details')
    .toHaveURL(/consignment-details$/)

  const consignment = await capture(page, 'dr21-consignment-details-germinal')
  expect(consignment.url, 'the capture should stay on the DR2.1 mount').toContain(BASE)
  expect(consignment.h1, 'consignment-details should have captured an h1').toBeTruthy()

  // The germinal validation surface has no frontend equivalent either, so
  // capture it from an empty submit before filling anything in.
  await clickContinue(page)
  await expect(page, 'an empty germinal submit should stay on consignment-details')
    .toHaveURL(/consignment-details$/)
  await expect(
    page.locator('.govuk-error-summary__list li'),
    'an empty germinal submit should raise per-species errors'
  ).not.toHaveCount(0)
  const errors = await capture(page, 'dr21-consignment-details-germinal-errors')
  expect(errors.h1).toBeTruthy()

  await fillGerminalConsignmentDetails(page, GERMINAL_SPECIES)
  await clickContinue(page)
  // Germinal commodity codes carry donor-ID / collection-date identifiers, so
  // the branch continues into animal identification rather than skipping it.
  await expect(page, 'a complete germinal consignment should advance to animal identification')
    .toHaveURL(/animal-identification-details$/)
})

test('DR2.1 germinal products — mixed with a live animal commodity', async ({ page }) => {
  await page.goto(`${BASE}/create-notification`)
  await expect(page).toHaveURL(/origin-of-the-import$/)
  await waitForKitJavaScript(page)

  await fillOrigin(page, ORIGIN)
  await expect(page).toHaveURL(/what-are-you-importing$/)

  // One query spans both domains: "Cattle" (0102) and "Cattle, Semen".
  await searchCommodities(page, 'cattle')
  await selectSpecies(page, [LIVE_ANIMAL_SPECIES, GERMINAL_SPECIES[0]])
  const mixedSearch = await capture(page, 'dr21-what-are-you-importing-germinal-mixed')
  expect(mixedSearch.h1).toBeTruthy()

  await page.locator('#commodity-search').press('Escape')
  await clickContinue(page)
  await expect(page).toHaveURL(/reason-for-import$/)

  await fillReasonForImport(page)
  await expect(page).toHaveURL(/consignment-details$/)

  // Both question sets on one page: number of animals for the live commodity,
  // net weight / package type / number of packages for the germinal one.
  await expect(
    page.locator(`#number-of-animals-${LIVE_ANIMAL_SPECIES}`),
    'the live-animal commodity should still ask for a number of animals'
  ).toBeVisible()
  await expect(
    page.locator(`#package-type-${GERMINAL_SPECIES[0]}`),
    'the germinal commodity should ask for a package type'
  ).toBeVisible()

  const mixed = await capture(page, 'dr21-consignment-details-germinal-mixed')
  expect(mixed.url, 'the capture should stay on the DR2.1 mount').toContain(BASE)
  expect(mixed.h1, 'the mixed consignment-details should have captured an h1').toBeTruthy()
})

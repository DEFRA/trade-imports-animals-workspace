//
// DESIGN RELEASE 2.1 cartographer — dashboard surfaces and the templates
// sub-domain.
//
// Not an assertion suite: it walks the four dashboard tabs and the whole
// templates sub-domain and captures a normalised structural model (plus HTML,
// PNG and a Playwright trace) so the real frontend can be diffed against it
// screen by screen. Every step asserts the page actually landed where it
// should, so a redirect can't leave a mislabelled capture behind.
//
// No journey fills are needed here: the mount middleware stamps
// `_isDesignRelease21Version` on the session for every request under
// /design-release-2.1, which is the only gate the templates routes check.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')

const BASE = '/design-release-2.1'

// Captures a screen and asserts the extractor found a heading — a green run
// that captured an empty model is a failure, not a pass.
async function capturePath (page, path, name, heading) {
  await page.goto(`${BASE}${path}`)
  await expect(page.locator('main h1'), `${name} should render its heading`).toHaveText(heading)

  const model = await capture(page, name)

  expect(model.url, `${name} should stay on the DR2.1 mount`).toContain(BASE)
  expect(model.h1, `${name} should have captured an h1`).toBeTruthy()

  return model
}

test.describe.configure({ mode: 'serial' })

test('DR2.1 dashboard tabs', async ({ page }) => {
  await capturePath(page, '', 'dr21-dashboard', /live animals & germinal products/i)
  await capturePath(page, '/?additionalFilters=open', 'dr21-dashboard-filters-open',
    /live animals & germinal products/i)
  await capturePath(page, '/actions', 'dr21-dashboard-actions', /tasks requiring your attention/i)
  await capturePath(page, '/changes', 'dr21-dashboard-changes', /changes in past 24 hours/i)
  await capturePath(page, '/inspection', 'dr21-dashboard-inspection',
    /consignments due at the border control post/i)
})

test('DR2.1 templates sub-domain', async ({ page }) => {
  const list = await capturePath(page, '/templates', 'dr21-dashboard-templates', /manage templates/i)
  expect(list.cards.length, 'the templates list should render template cards').toBeGreaterThan(0)

  await capturePath(page, '/templates/create', 'dr21-create-template', /enter template name/i)

  // A real template card's view link — not /templates/create or /use.
  await page.goto(`${BASE}/templates`)
  const viewHrefs = await page
    .locator(`a[href^="${BASE}/templates/"]:not([href$="/create"]):not([href$="/use"])`)
    .evaluateAll((links) => links.map((a) => a.getAttribute('href')))
  expect(viewHrefs.length, 'each template card should offer a view link').toBeGreaterThan(0)

  await page.goto(viewHrefs[0])
  await expect(page.locator('main h1')).toHaveText(/review your template/i)
  const template = await capture(page, 'dr21-view-template')
  expect(template.h1, 'dr21-view-template should have captured an h1').toBeTruthy()

  // Every other template id must render the same screen, or the capture above
  // is not representative of the sub-domain.
  for (const href of viewHrefs.slice(1)) {
    await page.goto(href)
    await expect(page.locator('main h1'), `${href} should render the template review`)
      .toHaveText(/review your template/i)
  }
})

test('DR2.1 use-a-template lands on the notification hub', async ({ page }) => {
  await page.goto(`${BASE}/templates`)
  const useHref = await page
    .locator(`a[href$="/use"][href^="${BASE}/templates/"]`)
    .first()
    .getAttribute('href')
  expect(useHref, 'a template card should offer a "use this template" link').toBeTruthy()

  // /templates/:id/use has no view of its own: it seeds the journey session
  // from the template and redirects. Capture where it actually lands.
  await page.goto(useHref)
  await expect(page, '/templates/:id/use should redirect to the notification hub')
    .toHaveURL(new RegExp(`${BASE.replace(/[./]/g, '\\$&')}/notification-hub$`))

  const model = await capture(page, 'dr21-use-template-landing')
  expect(model.h1, 'dr21-use-template-landing should have captured an h1').toBeTruthy()
})

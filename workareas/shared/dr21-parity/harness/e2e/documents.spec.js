//
// Cartographer slice for the DESIGN RELEASE 2.1 documents screen, plus the
// DR2.1 routes that belong to no journey step (the prototype picker at /index
// and the redirect-only entry points).
//
// Not an assertion suite: the page models are the deliverable. The assertions
// exist so a silently-rejected submit cannot leave a mislabelled capture behind.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('./page-model')

const BASE = '/design-release-2.1'

const UPLOAD_DOCUMENTS_URL = /\/design-release-2\.1\/upload-documents$/
const ORIGIN_URL = /\/design-release-2\.1\/origin-of-the-import$/
const REASON_FOR_IMPORT_URL = /\/design-release-2\.1\/reason-for-import$/
const DASHBOARD_URL = /\/design-release-2\.1$/

// The only document type DR2.1 adds on top of the shared list — the page's own
// intro copy is written around it.
const DOCUMENT = {
  reference: 'ITAHC-2026-0001',
  type: 'itahc',
  typeLabel: 'Intra Trade Animal Health Certificate (ITAHC)',
  dateOfIssue: '27/3/2026',
  fileName: 'itahc-certificate.pdf'
}

// The MOJ date picker's calendar overlays the controls below it until dismissed.
async function fillDateOfIssue (page, value) {
  const dateOfIssue = page.locator('#date-of-issue')
  await dateOfIssue.fill(value)
  await dateOfIssue.press('Escape')
}

// The form is not multipart — the server reads the file name out of a hidden
// field that the prototype's own file-upload module writes on the input's
// change event. So selecting an in-memory file is what populates the row; the
// bytes are never sent anywhere.
async function chooseAttachment (page, fileName) {
  await page.locator('#attachment').setInputFiles({
    name: fileName,
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 dr21 capture harness')
  })

  await expect(
    page.locator('.app-upload-documents-card__dropzone-status'),
    'choosing a file should write the name into the dropzone status and hidden field'
  ).toHaveText(fileName)
}

async function fillDocumentForm (page, document) {
  await page.locator('#document-reference').fill(document.reference)
  await page.locator('#document-type').selectOption(document.type)
  await fillDateOfIssue(page, document.dateOfIssue)
  await chooseAttachment(page, document.fileName)
}

test.describe.configure({ mode: 'serial' })

test('captures dr21-upload-documents (empty)', async ({ page }) => {
  await page.goto(`${BASE}/upload-documents`)
  await expect(page.locator('main h1')).toHaveText(/upload documents/i)
  await expect(
    page.locator('.app-upload-documents-table'),
    'a fresh session should render no saved-documents table'
  ).toHaveCount(0)

  const model = await capture(page, 'dr21-upload-documents')

  expect(model.url, 'upload-documents should stay on the DR2.1 mount').toContain(BASE)
  expect(model.h1, 'upload-documents should have captured an h1').toBeTruthy()
})

test('captures dr21-upload-documents-populated', async ({ page }) => {
  await page.goto(`${BASE}/upload-documents`)
  await fillDocumentForm(page, DOCUMENT)

  // The virus-check simulation fires 2.5s after the saved row renders. Settle it
  // before capturing so the tag state in the model is deterministic rather than
  // a race between the timer and the screenshot.
  const virusCheck = page.waitForResponse((response) =>
    response.url().includes('/upload-documents/virus-check/')
  )

  await page.locator('button[name="action"][value="add-another"]').click()
  await expect(page, 'save and add another should return to upload-documents')
    .toHaveURL(UPLOAD_DOCUMENTS_URL)

  const savedRows = page.locator('.app-upload-documents-table tbody tr')
  await expect(savedRows, 'the saved document should appear as one table row').toHaveCount(1)
  await expect(savedRows.first()).toContainText(DOCUMENT.reference)
  await expect(savedRows.first()).toContainText(DOCUMENT.typeLabel)
  await expect(savedRows.first()).toContainText(DOCUMENT.dateOfIssue)

  // The simulation's fetch URL is hardcoded root-relative in the static asset, so
  // under the mount it posts to DR1's route against DR1's session — which holds no
  // such document. The tag therefore never clears. Captured as-is: this is the
  // DR2.1 end state, not a harness timing artefact.
  const virusCheckResponse = await virusCheck
  expect(new URL(virusCheckResponse.url()).pathname,
    'the virus-check POST is not prefixed onto the DR2.1 mount').not.toContain(BASE)
  await expect(
    savedRows.first().locator('.app-upload-documents-table__status'),
    'the virus-check tag stays blue because DR1 has no record of the DR2.1 document'
  ).toHaveText('Scanning for virus')

  const model = await capture(page, 'dr21-upload-documents-populated')

  expect(model.url, 'the populated page should stay on the DR2.1 mount').toContain(BASE)
  expect(model.h1, 'the populated page should have captured an h1').toBeTruthy()
  expect(model.tables.some((table) => table.head.includes('Document reference')),
    'the populated model should carry the saved-documents table').toBe(true)
})

test('captures dr21-upload-documents-error', async ({ page }) => {
  await page.goto(`${BASE}/upload-documents`)

  // Every field is mandatory once you ask to save a row, so an empty submit
  // renders the full error summary.
  await page.locator('button[name="action"][value="add-another"]').click()
  // The error render is a POST response, not a redirect, so wait on the summary
  // rather than a URL change — otherwise the extractor runs against a half-parsed
  // document and quietly writes an empty model.
  await expect(page.locator('.govuk-error-summary')).toBeVisible()

  const model = await capture(page, 'dr21-upload-documents-error')

  expect(model.url, 'the error state should stay on the DR2.1 mount').toContain(BASE)
  expect(model.h1, 'the error state should have captured an h1').toBeTruthy()
  expect(model.errorSummary.items, 'an empty submit should report every mandatory field')
    .toEqual([
      'Enter a document reference',
      'Select a document type',
      'Enter a date of issue',
      'Upload a document'
    ])
})

test('captures dr21-index (the DR2.1 service-navigation "service" destination)', async ({ page }) => {
  await page.goto(`${BASE}/index`)

  const model = await capture(page, 'dr21-index')

  expect(model.url, 'index should stay on the DR2.1 mount').toContain(BASE)
  expect(model.h1, 'index should have captured an h1').toBeTruthy()
})

test('captures dr21-create-notification and asserts the redirect-only routes', async ({ page }) => {
  await page.goto(`${BASE}/create-notification`)
  await expect(page, 'create-notification should hand off to origin-of-the-import')
    .toHaveURL(ORIGIN_URL)

  const model = await capture(page, 'dr21-create-notification')

  expect(model.url, 'create-notification should stay on the DR2.1 mount').toContain(BASE)
  expect(model.h1, 'create-notification should have captured an h1').toBeTruthy()

  // /dashboard is a redirect alias for the mount root, which the canary already
  // captures as dr21-dashboard — assert it rather than capture it twice.
  await page.goto(`${BASE}/dashboard`)
  await expect(page, 'dashboard should redirect to the mount root').toHaveURL(DASHBOARD_URL)
})

test('captures dr21-prototype-reason-for-import (the seeded shortcut)', async ({ page }) => {
  await page.goto(`${BASE}/prototype/reason-for-import`)
  await expect(page, 'the shortcut should seed a session and land on reason-for-import')
    .toHaveURL(REASON_FOR_IMPORT_URL)

  const model = await capture(page, 'dr21-prototype-reason-for-import')

  expect(model.url, 'the seeded shortcut should stay on the DR2.1 mount').toContain(BASE)
  expect(model.h1, 'the seeded shortcut should have captured an h1').toBeTruthy()
})

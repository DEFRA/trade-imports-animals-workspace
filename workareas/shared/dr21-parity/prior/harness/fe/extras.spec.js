//
// Second pass over the real frontend: the dashboard (which the first walk
// captured mid-navigation) and the surfaces that hang off a notification —
// delete and cancel-amend.
//
const { test, expect } = require('@playwright/test')
const { capture } = require('../e2e/page-model')

const USER_ID = '2100010101'
const PASSWORD = process.env.AUTH_PASSWORD ?? 'Password123'

async function signIn (page) {
  await page.goto('/')
  const userIdBox = page.getByRole('textbox', { name: 'Government Gateway user ID' })
  if (await userIdBox.count()) {
    await userIdBox.fill(USER_ID)
    await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
  }
}

const grab = (page, name) => capture(page, `fe-${name}`)

test('frontend dashboard and notification-level surfaces', async ({ page }) => {
  await signIn(page)
  await page.goto('/')
  // The first walk captured this page before its content settled.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await grab(page, '00-dashboard')

  const journeyLink = page.locator('a[href^="/notifications/"]').first()
  const journeyId = (await journeyLink.count())
    ? (await journeyLink.getAttribute('href')).split('/')[2]
    : null

  expect(journeyId, 'dashboard should list at least one notification').not.toBeNull()

  await page.goto(`/notifications/${journeyId}/delete`)
  await grab(page, '91-delete-notification')

  await page.goto(`/notifications/${journeyId}/cancel-amend`)
  await grab(page, '92-cancel-amend')
})

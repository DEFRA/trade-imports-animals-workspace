# Repository Review: trade-imports-animals-tests

**PR:** #90
**Commit:** 631e185fdf0a8da5c0acd3e3981de9b8210c81e3
**Files Changed:** 4

## Summary

Adds a five-case e2e spec for dashboard search, two new axe scans covering
the search-match and search-no-match views, and the page-object surface to
drive them (`searchForReference`, `inputReferenceSearch`, `btnSearch`,
`filterHeading`, `searchForm`, `resultsLabel`). It also de-flakes the
existing dashboard spec by seeding one notification in `beforeAll` and
adding explicit card-visibility waits, and introduces a
`waitForNotificationList()` readiness gate used by `open()` and the
auth-retry path.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `page-objects/notification/notification-dashboard-page.ts` | NEEDS ATTENTION | 0 | 1 | 2 |
| `tests/a11y/notification-dashboard-views.spec.ts` | SAFE | 0 | 0 | 2 |
| `tests/e2e/features/notification-dashboard-search.spec.ts` | SAFE | 0 | 0 | 4 |
| `tests/e2e/pages/notification-dashboard.spec.ts` | NEEDS ATTENTION | 0 | 1 | 1 |

## Positive Observations

- `searchForReference` uses the correct `Promise.all([waitForURL, click])`
  ordering, so the URL listener is registered before the navigation
  starts — no race, no fixed wait.
- Test data is seeded via the API (`apiJourney.createSubmittedNotification()`),
  giving each search test a reference that provably exists and is unique,
  so AC1 is deterministic rather than dependent on ambient environment data.
- The free-text case asserts *both* that no results appear *and* that no
  error summary is shown — that negative assertion is what pins the
  "free text is not an error" product decision.
- New selectors lean on role and label (`getByRole('button', { name:
  'Search' })`, `getByLabel('Keyword or reference')`) scoped inside the
  form's testid, which is the pattern the best-practices guide prescribes.
- The a11y spec scans the new filter panel in both its populated and empty
  states, which is where a bespoke layout is most likely to regress.

## Test Coverage

- **Unit tests:** N/A for this repo.
- **Integration tests:** Both acceptance criteria are covered here and
  independently at the unit and integration level in the other two repos —
  a well-formed pyramid for this feature, with no obvious duplication of
  backend logic into the e2e layer.
- **Gaps:** Search combined with real pagination is not covered. The one
  paging test uses a reference with zero matches, so pagination never
  renders — which is precisely why the backend's `page > 1` defect
  survived all three test suites.

## Risk Assessment

**Overall Risk:** Low
**Rationale:** This is additive test code with sound data setup and correct
waiting. The risks are a hardcoded 10s timeout that can mask a slow
dashboard, a CSS-class locator that would fail open (zero cards, assertions
still pass) if the frontend renames its wrapper, and the untested
search-plus-pagination path.

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | page-objects/notification/notification-dashboard-page.ts | 145 | Major | flakiness | waitForNotificationList hardcodes timeout: 10000, overriding the project's expect/action timeouts — the guide's 'never use fixed timeouts' rule applies, and a hardcoded value here silently masks a slow dashboard rather than failing against the configured budget | Drop the explicit timeout and let the Playwright config's expect timeout apply, or move the value into the config if the dashboard genuinely needs a longer budget |  |  |  |
| 2 | page-objects/notification/notification-dashboard-page.ts | 140 | Minor | locators | notificationCards is now scoped by two CSS class selectors ('.notification-list__main .govuk-summary-card'), coupling the suite to the frontend's new BEM wrapper — the guide explicitly lists CSS class selectors under 'Avoid' | Add a data-testid to the results container in index.njk (a notification-list testid already exists for the label) and scope with getByTestId(...).locator('.govuk-summary-card') |  |  |  |
| 3 | page-objects/notification/notification-dashboard-page.ts | 211 | Minor | duplication | The auth-retry block now repeats 'heading.waitFor({ timeout: 5000 }) then waitForNotificationList()' in both the try and the catch, with the same magic 5000 duplicated | Extract a private awaitDashboardReady() helper and call it from both arms |  |  |  |
| 4 | tests/a11y/notification-dashboard-views.spec.ts | 21 | Minor | isolation | The two test.steps share state — the second step searches for a no-match reference on the page left behind by the first step, so a failure in step one cascades and the no-match scan is not independently runnable | Split into two tests, or start the no-match step from journey.toNotificationDashboard() so it does not depend on the previous step's page state |  |  |  |
| 5 | tests/a11y/notification-dashboard-views.spec.ts | 25 | Minor | redundancy | The shared beforeEach already lands on the dashboard, then the test calls journey.toNotificationDashboard() again after createSubmittedNotification, and follows searchForReference (which already waits for the URL) with a redundant heading.waitFor() | Drop the duplicate navigation and the redundant heading wait; searchForReference plus the resultsLabel wait is sufficient |  |  |  |
| 6 | tests/e2e/features/notification-dashboard-search.spec.ts | 27 | Minor | readability | Three tests build URL assertions with new RegExp and referenceNumber.replace(/-/g, '\\-'); escaping a hyphen outside a character class is a no-op, so the escape is cargo-cult and the regexes are hard to read | Assert with a predicate — await expect(pages.page).toHaveURL((url) => url.searchParams.get('referenceNumber') === created.referenceNumber) — which is exact and needs no escaping |  |  |  |
| 7 | tests/e2e/features/notification-dashboard-search.spec.ts | 30 | Minor | assertion | The AC1 test asserts resultsLabel is exactly 'Showing 1 Results', locking in ungrammatical copy as expected behaviour and coupling the search feature's test to the pre-existing label wording | Assert the card count and reference (already done) and relax the label assertion to /1/ or raise a separate ticket for the 'Showing 1 Results' wording |  |  |  |
| 8 | tests/e2e/features/notification-dashboard-search.spec.ts | 18 | Minor | redundancy | The beforeEach already navigates to the dashboard, then two tests call journey.toNotificationDashboard() again after seeding — the extra navigation doubles the page load for no assertion benefit | Move the seeding into the tests that need it and drop the redundant second navigation, or drop the shared beforeEach for the seeding tests |  |  |  |
| 9 | tests/e2e/features/notification-dashboard-search.spec.ts | 60 | Minor | coverage | 'preserves referenceNumber in the URL when a page param is present' only exercises the no-match case, so it never checks that the frontend's pagination links actually carry referenceNumber — which is the behaviour the buildPaginationLinks change added and where the backend's page>1 defect surfaces | Add a case that searches, lands on a result set with more than one page (or asserts pagination is absent for a single match) and follows the next-page link, asserting referenceNumber survives |  |  |  |
| 10 | tests/e2e/pages/notification-dashboard.spec.ts | 45 | Major | ticket-scope | The ticket's only comment asks that, once search exists, the flaky status-dependent tests select a notification by search instead of taking card 0 — this PR instead adds seedNotifications(1) plus visibility waits and leaves the TODO and the commented-out copyAsNew assertion in place | Use searchForReference on a seeded notification of a known status so 'displays actions on the first notification card' asserts against a deterministic status, and remove the TODO and the commented-out assertion |  |  |  |
| 11 | tests/e2e/pages/notification-dashboard.spec.ts | 5 | Minor | test-data | seedNotifications(1) in beforeAll adds a permanent throwaway DRAFT to the shared environment on every run and does not guarantee it lands on page one under the default arrivalDate,desc sort — it only guarantees the collection is non-empty | State that intent in a comment (guarantees a non-empty list, not a specific first card), or seed with an arrival date that deterministically sorts first |  |  |  |

## Repository Verdict

**Status:** SAFE

No Critical items and two Major, neither of which threatens correctness of
the suite: the hardcoded readiness timeout, and the ticket comment's
de-flake request being answered with seeding rather than search. Both AC are
genuinely covered.

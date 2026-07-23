# Consistency Check: trade-imports-animals-tests

**Ticket:** EUDPA-73
**All repos in scope:** trade-imports-animals-backend, trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #90 | **Commit:** 631e185

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| `referenceNumber` query param name | backend ✅, frontend ✅ | ✅ asserted in `waitForURL` and three `toHaveURL` regexes | CONSISTENT |
| `data-testid="notification-search-form"` | frontend ✅ emitted in `index.njk` | ✅ `searchForm` getter | CONSISTENT |
| `data-testid="notification-results-label"` | frontend ✅ emitted in `index.njk` | ✅ `resultsLabel` getter + `waitForNotificationList()` | CONSISTENT |
| `.notification-list__main` scoping | frontend ✅ introduced in `index.njk` | ✅ `notificationCards` locator updated in the same PR set | CONSISTENT — but CSS-class coupling, see below |
| Label "Keyword or reference" / button "Search" / h2 "Filter notifications" | frontend ✅ | ✅ role- and label-based getters | CONSISTENT |
| AC1 — search by complete reference returns only that notification | backend ✅ `NotificationIT.findAll_shouldReturnMatchingNotification_...`, frontend ✅ controller test | ✅ e2e `returns matching notification when searching by complete reference number` | CONSISTENT — covered at all three levels |
| AC2 — no match shows "No notifications found" | backend ✅ IT empty-page test, frontend ✅ controller test | ✅ e2e `shows no notifications found when search has no matches` | CONSISTENT — covered at all three levels |
| Free-text (non-reference) search behaviour | backend ✅ expects 200 + empty, frontend ⚠️ has both a 200-empty test *and* a 400-fallback test | ✅ e2e asserts empty results **and** no error summary — i.e. agrees with the backend | CONSISTENT with backend; the frontend's 400 test is the odd one out |
| Reference search combined with paging | backend ⚠️ `PageImpl` mis-reports totals for `page > 1`, frontend ✅ threads `referenceNumber` into pagination links | ⚠️ `preserves referenceNumber in the URL when a page param is present` only exercises the **no-match** case, so the defect is not caught | **GAP** |
| API-first test data seeding | n/a | ✅ `apiJourney.createSubmittedNotification()` and `seedNotifications(1)` | CONSISTENT with the repo's own conventions |
| a11y scan for new UI | frontend ✅ new filter panel markup | ✅ two new axe scans (match + no-match views) | CONSISTENT |

## Missing Changes

1. **No coverage of search + pagination.** The frontend added
   `referenceNumber` threading to `buildPaginationLinks` and the backend's
   `PageImpl` construction is wrong for `page > 1`. The one paging-adjacent
   test here (`preserves referenceNumber in the URL when a page param is
   present`) uses a reference with zero matches, so pagination never renders
   and the defect is invisible. A test that searches for something with a
   result and then walks to page 2 would have caught
   `totalElements = 26 / totalPages = 2` for a single match.

2. **The ticket comment's follow-up is unaddressed.** Martyn Nevers'
   comment on EUDPA-73 asks that, once search exists, the flaky
   status-dependent tests select a notification *by search* rather than
   taking card 0. `tests/e2e/pages/notification-dashboard.spec.ts` instead
   gained `seedNotifications(1)` and two `toBeVisible()` waits; the
   `// TODO: once dashboard filtering exists...` comment and the
   commented-out `copyAsNew` assertion both survive verbatim. This is a
   defensible split (de-flake now, use search later) but it should be an
   explicit decision, not silence.

3. **No search-term encoding case.** Neither this repo nor the backend IT
   helper exercises a search term needing URL encoding (space, `&`,
   unicode). The frontend client uses `URLSearchParams` so it is safe, but
   nothing proves it end to end.

## Unique Changes

1. **`notificationCards` locator now depends on a frontend CSS class**
   (`.notification-list__main .govuk-summary-card`). This is the one place
   the suite hard-couples to the frontend's BEM naming rather than a
   `data-testid`, and the surrounding PR already adds two testids to the
   same template — an inconsistency within this PR itself. Any rename of
   `notification-list__main` silently zeroes the card count and every
   dashboard assertion passes vacuously against `toHaveCount(0)`.

2. **`waitForNotificationList()` with a hardcoded `timeout: 10000`** —
   the only hardcoded timeout added by this PR set. The repo's Playwright
   config already owns the expect timeout.

3. **`test.beforeAll(seedNotifications(1))` in the dashboard spec** —
   mirrors the existing pattern in `notification-dashboard-pagination.spec.ts`
   and `admin-notifications.spec.ts`, so it is consistent with the repo, but
   it permanently adds a throwaway DRAFT to the shared environment on every
   run and only guarantees the list is non-empty (not that the seeded
   notification is card 0 under the default `arrivalDate,desc` sort).

## Verdict

**Status:** INCONSISTENCIES FOUND
**Issues:** 2 inconsistencies found (no search+pagination coverage for a
defect that exists in the backend; CSS-class locator coupling where the same
PR adds testids), plus 1 unaddressed ticket comment
**Summary:** Both acceptance criteria are covered at all three test levels
with deterministic API-seeded data, and every selector matches the markup the
frontend PR emits — but the search-with-pagination path, which is exactly
where the backend defect lives, is only exercised with a zero-result search.
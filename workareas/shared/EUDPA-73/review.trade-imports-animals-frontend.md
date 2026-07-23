# Repository Review: trade-imports-animals-frontend

**PR:** #157
**Commit:** 5c778bd064c6f889aebc9d8b3ebf2c5c5b703ea2
**Files Changed:** 10

## Summary

Adds a server-rendered search panel to the dashboard: a `govukInput`
labelled "Keyword or reference" inside a GET form that reloads `/` with a
`referenceNumber` query parameter. The controller parses and trims the
term, forwards it to the backend, and substitutes "No notifications found"
for the usual results label when a search returns nothing. Search state is
preserved across the sort control and pagination links, and the dashboard
gains a two-column layout (filter panel plus results) via new BEM blocks in
`_notification-list.scss`. The PR also carries an unrelated `hapi-pulse`
3.0.1 → 4.0.0 major bump and a `@defra/cdp-auditing` patch bump.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `package-lock.json` | SAFE | 0 | 0 | 1 |
| `package.json` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/client/stylesheets/components/_notification-list.scss` | SAFE | 0 | 0 | 2 |
| `src/server/common/clients/notification-client.js` | SAFE | 0 | 0 | 0 |
| `src/server/common/clients/notification-client.test.js` | SAFE | 0 | 0 | 1 |
| `src/server/common/helpers/notification-helper.js` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/server/common/helpers/notification-helper.test.js` | SAFE | 0 | 0 | 1 |
| `src/server/home/controller.js` | NEEDS ATTENTION | 0 | 2 | 2 |
| `src/server/home/controller.test.js` | NEEDS ATTENTION | 0 | 1 | 2 |
| `src/server/home/index.njk` | NEEDS ATTENTION | 0 | 1 | 3 |

## Positive Observations

- The search is a plain GET form with no client-side JavaScript, so it
  works with JS disabled and produces a shareable, bookmarkable URL —
  exactly the progressive-enhancement approach GDS asks for.
- Search state survives both the sort control (hidden `referenceNumber`
  input) and the pagination links (`buildPaginationLinks` now threads it
  through), so the trader never loses their search by changing sort.
- `parseReferenceNumber` correctly returns `undefined` for non-strings,
  which defends against Hapi handing back an array when the query
  parameter is repeated.
- `notificationClient.findAll` builds the URL with `URLSearchParams`, so
  a free-text search term is properly encoded before it leaves the
  frontend.
- The `data-testid` hooks added for the search form and results label give
  the Playwright suite stable anchors instead of copy-dependent selectors.

## Test Coverage

- **Unit tests:** Strong. New cases in `notification-client.test.js`
  (parameter reaches the URL), `notification-helper.test.js`
  (`referenceNumber` in both the query-string and pagination builders) and
  `controller.test.js` (search-match, no-match, trimming, free text, and
  the 400 fallback).
- **Integration tests:** Covered in the tests repo (PR #90) — two new
  a11y scans and a five-case e2e search spec.
- **Gaps:** No test exercises `buildPaginationLinks`' relocated `baseUrl`
  parameter, nor the controller producing pagination links that carry
  `referenceNumber`, nor a search term that needs URL encoding.

## Risk Assessment

**Overall Risk:** Medium
**Rationale:** No correctness defect in the search path itself. The risk is
concentrated in the error path — a blanket "any 400 becomes an empty search
result" rule that both hides genuine failures and, against the current
backend, never fires — plus an unrelated dependency major that widens the
blast radius of the PR well beyond the AC.

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | package-lock.json | 10406 | Minor | scope | The lockfile carries far more than the two declared bumps — body-parser, js-yaml, brace-expansion, fast-uri, immutable, shell-quote, svgo and @hapi/tlds all drift, and hapi-pulse's nested joi 17 tree is removed — none of it verified by this PR's tests | Regenerate the lockfile from a clean install on the dependency-only PR so the search PR's lock diff is limited to what the feature needs |  |  |  |
| 2 | package.json | 66 | Major | scope | hapi-pulse is bumped 3.0.1 to 4.0.0 (a major, with a node engine change to >=22 and a joi 17 to 18 swap) inside a feature PR for dashboard search — unrelated to the AC and untested by anything in this PR | Split the hapi-pulse major and the @defra/cdp-auditing bump into their own dependency PR so a graceful-shutdown regression is not attributed to the search feature |  |  |  |
| 3 | src/client/stylesheets/components/_notification-list.scss | 15 | Minor | gds-styles | The filter panel uses a hand-rolled grey background and padding block rather than a govuk-frontend construct, and the two-column layout is a bespoke flex arrangement instead of govuk-grid-row/govuk-grid-column-one-third | Use the govuk grid classes for the layout and drop the custom flex/media-query block, keeping only the panel background if design requires it |  |  |  |
| 4 | src/client/stylesheets/components/_notification-list.scss | 116 | Minor | maintainability | The desktop breakpoint block hardcodes a 280px filter column width in two places, duplicating a magic number that has no named variable | Extract the width to a named SCSS variable, or use a govuk grid column class so the width comes from the design system |  |  |  |
| 5 | src/server/common/clients/notification-client.test.js | 1223 | Minor | coverage | The new findAll test only covers a plain reference; no case asserts that a value needing encoding (spaces, ampersand, unicode) is escaped in the outgoing URL, which is the main risk of forwarding free-text search to the backend | Add a case with referenceNumber: 'a b&c' asserting the URL contains referenceNumber=a+b%26c |  |  |  |
| 6 | src/server/common/helpers/notification-helper.js | 142 | Major | api-design | buildPaginationLinks gained referenceNumber as the SECOND positional parameter, silently demoting baseUrl from position 2 to 4 — any existing call passing a base URL now sets referenceNumber instead, with no type error and no runtime failure | Take a single options object (pagination, { referenceNumber, sort, baseUrl }) so callers cannot mis-order, or append referenceNumber last |  |  |  |
| 7 | src/server/common/helpers/notification-helper.js | 183 | Minor | noise | buildPageResultsRangeLabel's destructuring order was changed (size moved ahead of page) with no behavioural effect, adding unrelated churn to a search PR | Revert the reorder to keep the diff scoped to the search feature |  |  |  |
| 8 | src/server/common/helpers/notification-helper.test.js | 300 | Minor | test-fidelity | The updated 'Should include sort in pagination links' test now passes undefined in the new referenceNumber slot but no test asserts the baseUrl parameter still works from its new fourth position, so the reorder is untested | Add a case passing an explicit baseUrl as the fourth argument and assert the hrefs are prefixed with it |  |  |  |
| 9 | src/server/home/controller.js | 99 | Major | error-handling | Any backend 400 is converted into a 200 'No notifications found' page whenever referenceNumber is set, so a genuine bad request (malformed sort, out-of-range page, contract drift) is silently presented to the trader as an empty search result | Narrow the branch — check the ProblemDetail type/field before swallowing, and log at warn level so the swallowed 400 is still observable |  |  |  |
| 10 | src/server/home/controller.js | 99 | Major | dead-code | The 400 fallback is unreachable against the current backend — NotificationController accepts referenceNumber with no @Pattern and NotificationIT asserts free text returns 200 with an empty page, so no 400 is ever produced for a search | Either add the @Pattern constraint backend-side so the branch is real, or drop the branch and rely on the empty-page response |  |  |  |
| 11 | src/server/home/controller.js | 30 | Minor | duplication | renderEmptySearchResult repeats the full happy-path view model (pageTitle, heading, sortOptions, listQuerySuffix) rather than sharing it, so the two render paths can drift — it already omits notifications-count fields the catch-all path sets | Extract a buildHomeViewModel({ notifications, resultsLabel, pagination, ... }) helper used by all three h.view calls |  |  |  |
| 12 | src/server/home/controller.js | 62 | Minor | readability | The conditional spread ...(referenceNumber ? { referenceNumber } : {}) is redundant — notificationClient.findAll already guards with if (referenceNumber) before setting the search param, and parseReferenceNumber already returns undefined for blank input | Pass { page, sort, referenceNumber } directly |  |  |  |
| 13 | src/server/home/controller.test.js | 552 | Major | test-fidelity | 'Should show No notifications found when backend rejects search with bad request' hand-builds an error with status 400, but the current backend never returns 400 for a search — the test proves the branch works without proving the branch is ever reached | Once the backend contract is settled, replace with a test asserting the real behaviour (200 + empty page) or keep it and add a comment naming the backend constraint it depends on |  |  |  |
| 14 | src/server/home/controller.test.js | 472 | Minor | assertion | 'Should render search form and pass referenceNumber to findAll' asserts on raw HTML substrings ('data-testid=...', 'Filter notifications', 'Keyword or reference'), which couples the controller test to markup wording and will break on any copy change | Keep the findAll call assertion here and move the markup assertions to the Playwright dashboard-search spec, which already covers them |  |  |  |
| 15 | src/server/home/controller.test.js | 500 | Minor | coverage | No test covers pagination links carrying referenceNumber end-to-end through the controller (buildPaginationLinks arg reorder), nor the empty-string referenceNumber case where parseReferenceNumber must return undefined | Add a multi-page search fixture asserting the next-page href contains referenceNumber, and a '/?referenceNumber=%20%20' case asserting findAll is called without the param |  |  |  |
| 16 | src/server/home/index.njk | 34 | Major | accessibility | The search input has no hint text or accessible description explaining that only a complete GBN-AG reference matches, so a trader entering a keyword (as the 'Keyword or reference' label invites) gets 'No notifications found' with no explanation of why | Add a govukInput hint, e.g. 'Enter a complete notification reference, for example GBN-AG-26-ABC123', and consider echoing the searched term in the no-results message |  |  |  |
| 17 | src/server/home/index.njk | 31 | Minor | semantics | The filter panel is marked up as <aside>, which announces a complementary landmark for content tangential to the page — the primary search control for the dashboard is not complementary content | Use <div> with the existing heading, or <search>/<form role="search"> which is the correct landmark for a search region |  |  |  |
| 18 | src/server/home/index.njk | 35 | Minor | consistency | The search form always emits a hidden sort input because sort is defaulted by parseNotificationSort, so every search URL carries sort=arrivalDate%2Cdesc even at the default — contradicting buildHomeListQueryString, which deliberately omits the default sort | Guard with {% if sort and sort != defaultSort %} or expose a pre-built query suffix from the controller |  |  |  |
| 19 | src/server/home/index.njk | 55 | Minor | review-hygiene | The whole notification-card block was re-indented by two levels to sit inside the new layout wrappers, so ~100 lines show as changed when nothing about the cards changed — this hides any real edit inside the block from reviewers | Split the wrapper introduction and any content change into separate commits, or confirm in the PR description that the card block is pure re-indentation |  |  |  |

## Repository Verdict

**Status:** NEEDS ATTENTION

No Critical items. Five Major: the two facets of the 400-swallowing branch,
the `buildPaginationLinks` positional-parameter reorder, the missing hint
text on a search box whose label invites keyword input it cannot serve, and
the unrelated `hapi-pulse` major. All are addressable without reworking the
feature.

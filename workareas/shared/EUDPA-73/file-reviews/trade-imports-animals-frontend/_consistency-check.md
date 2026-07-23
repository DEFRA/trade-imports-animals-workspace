# Consistency Check: trade-imports-animals-frontend

**Ticket:** EUDPA-73
**All repos in scope:** trade-imports-animals-backend, trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #157 | **Commit:** 5c778bd

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| `referenceNumber` query param name | backend ✅ (`@RequestParam String referenceNumber`), tests ✅ (`url.searchParams.get('referenceNumber')`) | ✅ `?referenceNumber=` on `/` and forwarded to the backend | CONSISTENT |
| Trim-before-use of the search term | backend ✅ (`StringUtils.trimToNull`) | ✅ `parseReferenceNumber` | CONSISTENT — the double trim is harmless belt-and-braces |
| "No notifications found" copy (AC2) | tests ✅ asserted in both the e2e search spec and the a11y spec | ✅ set in `controller.js` for both the empty-result and 400 paths | CONSISTENT |
| `data-testid="notification-search-form"` | tests ✅ `searchForm` page-object getter | ✅ on the `<form>` in `index.njk` | CONSISTENT |
| `data-testid="notification-results-label"` | tests ✅ `resultsLabel` getter + `waitForNotificationList()` | ✅ on the results `<p>` | CONSISTENT |
| `.notification-list__main` wrapper class | tests ✅ `notificationCards` locator now scopes on it | ✅ introduced in `index.njk` + `_notification-list.scss` | CONSISTENT but brittle — see below |
| Label text "Keyword or reference" | tests ✅ `getByLabel('Keyword or reference')` | ✅ `govukInput` label | CONSISTENT |
| Heading "Filter notifications" (h2) | tests ✅ `getByRole('heading', { level: 2, name: 'Filter notifications' })` | ✅ `<h2 class="govuk-heading-m">` | CONSISTENT |
| **Backend 400 for malformed reference** | backend ❌ — no `@Pattern`, `NotificationIT` asserts 200 + empty page | ✅ `err.status === statusCodes.badRequest` branch + a test for it | **INCONSISTENT** |
| Reference search combined with paging | backend ⚠️ `PageImpl` mis-reports `totalElements` when `page > 1` | ✅ `buildPaginationLinks` now threads `referenceNumber` into next/prev hrefs | **INCONSISTENT** — the frontend faithfully renders links the backend will answer wrongly |
| Dependency bumps | backend ❌ no `pom.xml` change, tests ❌ no `package.json` change | ⚠️ `hapi-pulse` 3.0.1→4.0.0 (major) and `@defra/cdp-auditing` 0.6.0→0.6.1 | Unique — unrelated to the AC |
| Test changes accompany logic changes | backend ✅, tests ✅ | ✅ client, helper, controller all have new tests | CONSISTENT |

## Missing Changes

*None identified* — every contract the backend exposes for this feature is
consumed here, and every selector the Playwright suite depends on is present
in the markup.

One soft gap: the frontend does not cap the length of the forwarded
`referenceNumber`. The backend does not cap it either (no `@Size`), so an
arbitrarily long search term travels the full path into a Mongo query and
into two `log.debug` statements. Neither repo owns the guard; one of them
should.

## Unique Changes

1. **`hapi-pulse` 3.0.1 → 4.0.0 and `@defra/cdp-auditing` 0.6.0 → 0.6.1**,
   plus a wide transitive lockfile drift (`body-parser`, `js-yaml`,
   `brace-expansion`, `fast-uri`, `immutable`, `shell-quote`, `svgo`,
   `@hapi/tlds`). No corresponding change in the other two repos and no AC
   references it. `hapi-pulse@4` raises its own engine floor to node >=22
   and swaps joi 17 → 18; the repo's `engines.node` is `>=24` and `.nvmrc`
   is `v24.11.1`, so it is compatible — but graceful-shutdown behaviour is
   not exercised by anything in this PR. This belongs in a separate
   dependency PR.

2. **`buildPaginationLinks` positional-parameter reorder** —
   `(pagination, baseUrl, sort)` became `(pagination, referenceNumber, sort,
   baseUrl)`. The only production caller was updated, but the change is
   silently breaking for any future or out-of-tree caller passing a base URL
   second. No other repo has an equivalent helper to compare against.

3. **`renderEmptySearchResult` as a second render path** — the backend has no
   analogous "pretend it succeeded" fallback; it returns 200 + empty page
   directly. Once the backend contract is confirmed, this path is redundant.

4. **Bespoke two-column filter layout in SCSS** — `notification-list__layout`
   / `__filters` / `__main` reimplement `govuk-grid-row` +
   `govuk-grid-column-one-third` with raw flexbox and a hardcoded 280px
   desktop width. No cross-repo peer, but it diverges from the design system
   the rest of the file leans on.

## Verdict

**Status:** INCONSISTENCIES FOUND
**Issues:** 3 inconsistencies found (400-handling that the backend never
triggers, pagination links that the backend answers incorrectly beyond page
1, an unrelated dependency major bundled into the feature)
**Summary:** Selector, copy and query-param contracts with both peer repos
line up exactly, but the frontend defends against a backend 400 that does not
exist and emits search-scoped pagination links the backend cannot serve
correctly.
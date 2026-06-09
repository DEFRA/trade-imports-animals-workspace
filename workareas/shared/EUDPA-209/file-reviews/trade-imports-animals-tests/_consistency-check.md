# Consistency Check: trade-imports-animals-tests

**Ticket:** EUDPA-209
**All repos in scope:** trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #56 | **Commit:** c330fae

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| Caption class change `govuk-caption-m` → `govuk-caption-l` for the page-title caption | trade-imports-animals-frontend ✅ (`heading/template.njk` now emits `span.govuk-caption-l` for `pageTitle`) | ✅ `captionTransport` locator switched to `span.govuk-caption-l` | CONSISTENT |
| `appHeading` API change (`pageTitle` rendered as `govuk-caption-l` inside the `h1`) | trade-imports-animals-frontend ✅ (component + all views) | ✅ Page object follows the new rendered DOM | CONSISTENT |

## Missing Changes

The frontend PR migrates ~17 view templates to `{% block pageContent %}` and the new `appHeading({ pageTitle, heading })` shape. Only the transporter page object is touched here. Worth confirming during file review whether other E2E page objects assert on `span.govuk-caption-m`, the removed per-page `govuk-grid-column-two-thirds` wrappers, or the old `appHeading` caption DOM — if any do, they would break against the new frontend and should have been updated in this PR.

The diff in scope shows only one selector relied on the old caption class, and the frontend change to `govuk-caption-l` is matched here, so no concrete gap is evidenced by the diffs. Flagged as a verification item rather than a confirmed inconsistency.

*No confirmed missing changes within the reviewed diff.*

## Unique Changes

The locator predicate also loosened from an anchored regex `/^Transport$/` to a substring `'Transport'` match. This is a test-robustness tweak unrelated to the grid/layout change and not present (nor needed) in the frontend repo; intentional and low-risk, though it slightly weakens the assertion (would now also match e.g. "Transport details"). Note for the per-file reviewer.

## Verdict

**Status:** CONSISTENT
**Issues:** 0 inconsistencies found
**Summary:** The single page-object/locator update correctly tracks the frontend's `govuk-caption-m` → `govuk-caption-l` heading-caption change; only open question is whether other E2E page objects assert on the old heading DOM, flagged for file review.

# Repository Review: trade-imports-animals-frontend

**PR:** #126
**Commit:** 2ddf65ec55e7722334e42fdfa687b202c1103523 (originally reviewed at 1d810fbad0b9718d034a9244637f85dc94f74cb4)
**Files Changed:** 26
**Refreshed:** 2026-06-10

## Summary

Centralises GDS column-width ownership in the shared parent layout. `layouts/page.njk` now wraps an inner `{% block pageContent %}` in `govuk-grid-row` > `govuk-grid-column-full`, and 16 view templates were migrated from `{% block content %}` to `{% block pageContent %}`, each dropping its own `govuk-grid-row` / `govuk-grid-column-two-thirds` wrapper. The `appHeading` component was rewritten in the same PR — its params were renamed (`text`→`heading`, `caption`→`pageTitle`) and its own grid wrapper removed — and every call site was updated to match. The param rename is a latent-bug fix: the old `text:` key was never read by the macro, so headings passed via `text` rendered empty.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `src/server/accompanying-documents/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/additional-details/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/addresses/consignment/contact/select/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/addresses/consignors/select/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/addresses/destinations/select/index.njk` | SAFE | 0 | 0 | 1 |
| `src/server/addresses/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/commodities/details/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/commodities/identification/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/commodities/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/commodities/select/index.njk` | SAFE | 0 | 0 | 3 |
| `src/server/common/components/heading/template.njk` | NEEDS ATTENTION | 0 | 2 | 0 |
| `src/server/common/components/heading/template.test.js` | SAFE | 0 | 0 | 0 |
| `src/server/common/templates/layouts/page.njk` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/server/cph-number/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/declaration/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/home/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/import-reason/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/notification-view/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/origin/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/port-of-entry/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/transporters/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/transporters/select/index.njk` | SAFE | 0 | 0 | 0 |

## Positive Observations

- The core refactor is clean and consistent: width ownership genuinely moves to one place, exactly as the ticket asks.
- The `text:`→`heading:` rename incidentally fixes pages where the heading was silently rendering empty.
- The page-object change in the tests repo (`govuk-caption-m`→`govuk-caption-l`) is correctly synchronised with the caption DOM change here.

## Test Coverage

- Unit tests: `heading/template.test.js` was updated to match the new macro shape (param rename, caption-inside-h1 isolation, new `pageTitle` branch). Controller tests assert on view context / rendered text, not on grid markup, so the layout migration doesn't break them. Adequate for a layout-only change.
- Integration tests: E2E coverage updated in the tests repo (PR #56) for the caption size change.

## Risk Assessment

**Overall Risk:** Medium
**Rationale:** All 7 first-pass findings were fixed in the a11y commit (2ddf65e), but that commit introduced a new unconditional caption wrapper in `reference-number-caption/macro.njk` — an empty styled `<p>` on every page without a reference number, untested — which should be resolved or consciously accepted before merge.

## Refresh Summary (2026-06-10)

**Files refreshed:** 7 (3 re-reviewed deltas + 4 coverage-gap fresh reviews)
**New items added:** 3
**Spot-check (Fix+Done items in refreshed files):** 0
**Prior items auto-resolved:** 7 of 7 — commit 2ddf65e ("fixed a11y issues") addressed every first-pass finding, verified per file by the refresh reviewers.

| # | Change | File:Line | Severity | Issue |
|---|--------|-----------|----------|-------|
| 1 | ➕ New (#8) | `src/server/common/components/reference-number-caption/macro.njk:2` | Major | Unconditional wrapper `<p>` emits an empty 30px-margin paragraph on pages with no reference number |
| 2 | ➕ New (#9) | `src/server/common/components/reference-number-caption/macro.njk:2` | Major | New wrapper behaviour untested — empty-paragraph regression passes silently |
| 3 | ➕ New (#10) | `src/server/error/index.njk:6` | Minor | Bare `<p>{{ message }}</p>` without `govuk-body` class |

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/server/addresses/destinations/select/index.njk | 11 | Minor | maintainability | appHeading hardcodes heading: "Search for a place of destination", duplicating the controller's pageTitle value; the old code passed the pageTitle variable, so the <title> and h1 can now drift if the controller string changes | Pass the context variable instead: appHeading({ pageTitle: "Address", heading: pageTitle }) | Auto-Resolved | — | Fixed in 2ddf65e: appHeading({ pageTitle: 'Address', heading: pageTitle }) — verified by refresh reviewer |
| 2 | src/server/commodities/select/index.njk | 15 | Minor | content-change | appHeading lost its caption: old call passed caption: 'Description of the goods' (rendered as govuk-caption-m); new call is { heading: 'Commodity' } only, so the 'Description of the goods' caption is dropped — a content change in a layout-only ticket, and inconsistent with sibling commodities/details/index.njk which keeps pageTitle: 'Description of the goods'. | If the caption was intended to stay, use { pageTitle: 'Description of the goods', heading: 'Commodity' } to match commodities/details; otherwise confirm the removal is intended. | Auto-Resolved | — | Fixed in 2ddf65e: caption restored via pageTitle: 'Description of the goods' — verified by refresh reviewer |
| 3 | src/server/commodities/select/index.njk | 17 | Minor | formatting | After removing the govuk-grid-row / govuk-grid-column-two-thirds wrapper divs, lines 17-82 keep the old two-level indentation that those divs justified, leaving the block body over-indented relative to the new structure. | Re-indent the block body (the govuk-body div, form, table, selects) to match the removed wrapper nesting. | Auto-Resolved | — | Fixed in 2ddf65e: block body re-indented — verified by refresh reviewer |
| 4 | src/server/commodities/select/index.njk | 15 | Minor | content-change | appHeading call dropped the caption "Description of the goods" (old: { caption, text: "Commodity" } -> new: { heading: "Commodity" }); the rename text->heading is a fix since the macro reads params.heading, but the caption removal is user-visible content unrelated to the layout-width goal. | Confirm the caption removal is intentional; if not, pass caption: "Description of the goods" alongside heading. | Auto-Resolved | — | Fixed in 2ddf65e: duplicate of #2, caption restored — verified by refresh reviewer |
| 5 | src/server/common/components/heading/template.njk | 10 | Major | invalid-html | Empty <p> spacer (line 10) sits inside the <h1> (opened line 3, closed line 14); a <p> is flow content and is invalid nested inside a heading element, producing a malformed DOM on every appHeading call that passes a caption. | Move the caption out of the <h1>; render the caption <span> after the heading and drop the nested <p> spacer, using a margin utility on the heading/caption instead. | Auto-Resolved | — | Fixed in 2ddf65e: empty <p> spacer removed from inside <h1>; caption span is valid phrasing content — verified by refresh reviewer |
| 6 | src/server/common/components/heading/template.njk | 1 | Major | accessibility | Empty <p> elements on lines 1 and 10 are used purely as vertical spacers; non-semantic empty paragraphs are an accessibility smell (screen readers may announce an empty element) and GDS spacing guidance applies margin utilities to real content, not empty tags. | Remove the empty spacer <p>s and apply a govuk-!-margin-* utility (or govuk-caption spacing) to the heading/caption elements themselves. | Auto-Resolved | — | Fixed in 2ddf65e: spacer <p>s replaced with govuk-!-margin-* utilities on real content — verified by refresh reviewer |
| 7 | src/server/common/templates/layouts/page.njk | 54 | Major | consistency | Renaming the inner block to pageContent leaves 3 pages (about/index.njk, error/index.njk, auth/unauthorised.njk) still overriding {% block content %}, so they bypass the new govuk-grid-column-full wrapper and keep their own two-thirds grid — width is no longer 'defined in one place' for them. | Migrate about, error and unauthorised templates to {% block pageContent %} and drop their local govuk-grid-row/two-thirds wrappers, or record in the ticket that these pages intentionally stay two-thirds. | Auto-Resolved | — | Fixed in 2ddf65e: about, error and unauthorised migrated to {% block pageContent %}; reviewer verified all 23 templates now use pageContent |
| 8 | src/server/common/components/reference-number-caption/macro.njk | 2 | Major | layout-bug | Wrapper <p class="govuk-body govuk-!-margin-bottom-6"> is unconditional, but template.njk renders nothing without params.referenceNumber - macro now emits an empty paragraph with a 30px bottom margin, adding a stray vertical gap on pages with no reference number (a state the component's own tests treat as supported) | Make the spacing conditional with the content: move the wrapper (or a govuk-!-margin-bottom-6 class on the span) inside template.njk's {% if params.referenceNumber %} block so nothing renders when there is no reference number |  |  |  |
| 9 | src/server/common/components/reference-number-caption/macro.njk | 2 | Major | test-coverage | New wrapper paragraph behaviour is untested - template.test.js renders via the macro but only queries [data-testid=app-reference-number-caption], so the 'Without a reference number' suite still passes despite the new empty styled <p> being emitted | Extend template.test.js: assert the macro output contains no <p> when referenceNumber is absent, and that the caption span is wrapped in p.govuk-body.govuk-\!-margin-bottom-6 when present |  |  |  |
| 10 | src/server/error/index.njk | 6 | Minor | govuk-styles | Error message paragraph is a bare <p>{{ message }}</p> with no govuk-body class, so it renders without GDS typography; the surrounding markup was fully restructured by this PR | Use <p class="govuk-body">{{ message }}</p> |  |  |  |

## Repository Verdict

**Status:** NEEDS ATTENTION

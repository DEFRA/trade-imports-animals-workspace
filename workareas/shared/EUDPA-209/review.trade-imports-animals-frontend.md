# Repository Review: trade-imports-animals-frontend

**PR:** #126
**Commit:** 1d810fbad0b9718d034a9244637f85dc94f74cb4
**Files Changed:** 22

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
**Rationale:** Two Major findings on `heading/template.njk` (a `<p>` nested inside `<h1>` — invalid HTML emitted on every captioned heading) and the orphaned-pages consistency gap on `page.njk` should be resolved or consciously accepted before merge.

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/server/addresses/destinations/select/index.njk | 11 | Minor | maintainability | appHeading hardcodes heading: "Search for a place of destination", duplicating the controller's pageTitle value; the old code passed the pageTitle variable, so the <title> and h1 can now drift if the controller string changes | Pass the context variable instead: appHeading({ pageTitle: "Address", heading: pageTitle }) |  |  |  |
| 2 | src/server/commodities/select/index.njk | 15 | Minor | content-change | appHeading lost its caption: old call passed caption: 'Description of the goods' (rendered as govuk-caption-m); new call is { heading: 'Commodity' } only, so the 'Description of the goods' caption is dropped — a content change in a layout-only ticket, and inconsistent with sibling commodities/details/index.njk which keeps pageTitle: 'Description of the goods'. | If the caption was intended to stay, use { pageTitle: 'Description of the goods', heading: 'Commodity' } to match commodities/details; otherwise confirm the removal is intended. |  |  |  |
| 3 | src/server/commodities/select/index.njk | 17 | Minor | formatting | After removing the govuk-grid-row / govuk-grid-column-two-thirds wrapper divs, lines 17-82 keep the old two-level indentation that those divs justified, leaving the block body over-indented relative to the new structure. | Re-indent the block body (the govuk-body div, form, table, selects) to match the removed wrapper nesting. |  |  |  |
| 4 | src/server/commodities/select/index.njk | 15 | Minor | content-change | appHeading call dropped the caption "Description of the goods" (old: { caption, text: "Commodity" } -> new: { heading: "Commodity" }); the rename text->heading is a fix since the macro reads params.heading, but the caption removal is user-visible content unrelated to the layout-width goal. | Confirm the caption removal is intentional; if not, pass caption: "Description of the goods" alongside heading. |  |  |  |
| 5 | src/server/common/components/heading/template.njk | 10 | Major | invalid-html | Empty <p> spacer (line 10) sits inside the <h1> (opened line 3, closed line 14); a <p> is flow content and is invalid nested inside a heading element, producing a malformed DOM on every appHeading call that passes a caption. | Move the caption out of the <h1>; render the caption <span> after the heading and drop the nested <p> spacer, using a margin utility on the heading/caption instead. |  |  |  |
| 6 | src/server/common/components/heading/template.njk | 1 | Major | accessibility | Empty <p> elements on lines 1 and 10 are used purely as vertical spacers; non-semantic empty paragraphs are an accessibility smell (screen readers may announce an empty element) and GDS spacing guidance applies margin utilities to real content, not empty tags. | Remove the empty spacer <p>s and apply a govuk-!-margin-* utility (or govuk-caption spacing) to the heading/caption elements themselves. |  |  |  |
| 7 | src/server/common/templates/layouts/page.njk | 54 | Major | consistency | Renaming the inner block to pageContent leaves 3 pages (about/index.njk, error/index.njk, auth/unauthorised.njk) still overriding {% block content %}, so they bypass the new govuk-grid-column-full wrapper and keep their own two-thirds grid — width is no longer 'defined in one place' for them. | Migrate about, error and unauthorised templates to {% block pageContent %} and drop their local govuk-grid-row/two-thirds wrappers, or record in the ticket that these pages intentionally stay two-thirds. |  |  |  |

## Repository Verdict

**Status:** NEEDS ATTENTION

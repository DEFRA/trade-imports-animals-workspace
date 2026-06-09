# Consistency Check: trade-imports-animals-frontend

**Ticket:** EUDPA-209
**All repos in scope:** trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #126 | **Commit:** 1d810fb

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| `appHeading` API change: `text` → `heading`, `caption` → `pageTitle` rendered as `span.govuk-caption-l` inside `h1` | trade-imports-animals-tests ✅ (page object + locator updated) | ✅ Source of the change (component `heading/template.njk` + all view templates) | CONSISTENT |
| Caption class change `govuk-caption-m` → `govuk-caption-l` for the page-title caption | trade-imports-animals-tests ✅ (`captionTransport` locator switched to `span.govuk-caption-l`) | ✅ Emitted by `heading/template.njk` via `pageTitle` | CONSISTENT |
| Parent layout owns column width via `govuk-grid-column-full` in `layouts/page.njk`; per-page `govuk-grid-row`/`govuk-grid-column-two-thirds` wrappers removed | N/A — frontend-only concern (Nunjucks layout) | ✅ Applied in `layouts/page.njk` + every `index.njk`; pages now use `{% block pageContent %}` | CONSISTENT (within repo) |
| Component test updated to match new heading DOM (`pageTitle` caption nested in title) | trade-imports-animals-tests ✅ (E2E page object) | ✅ `heading/template.test.js` updated + new "With page title" case | CONSISTENT |

## Missing Changes

*None identified.* The component-contract change in this repo is fully matched by the E2E page-object update in the tests repo. No config, dependency, or Helm/Bicep surface is touched, so no peer-repo propagation is expected.

## Unique Changes

Several changes in this PR go beyond the literal ticket title ("update parent layout to use `govuk-grid-column-full`") but are within the refinement scope of centralising layout/heading ownership:

- **`appHeading` API rename** (`text`→`heading`, `caption`→`pageTitle`) and a new DOM shape (caption nested inside the `h1` as `govuk-caption-l`). This is the load-bearing cross-repo change and is correctly mirrored in the tests repo — not suspicious, but it is the reason the tests PR exists.
- **`import-reason/index.njk`**: the radios `fieldset.legend` was changed from an `html` blob carrying its own caption + `govuk-heading-xl` (legend `--l`) to plain `text` with legend `--m`, relying on `appHeading` for the title. Consistent with moving title ownership into `appHeading`; intentional.
- **Input width utilities added**: `cph-number` input gains `govuk-!-width-two-thirds`, `origin` internal-reference input gains `govuk-!-width-three-quarters`. These compensate for inputs no longer being constrained by the removed two-thirds column wrapper. Reasonable and within scope, though applied per-page rather than via a shared rule — these two are the only inputs given an explicit width, so other text inputs now render full-width. Flag for the per-file reviewer to confirm that is intended.
- **`notification-view/index.njk`** previously used `govuk-grid-column-full` and is now unwrapped to rely on the parent layout — consistent with the centralisation goal.

## Verdict

**Status:** CONSISTENT
**Issues:** 0 inconsistencies found
**Summary:** The `appHeading`/caption-class contract change here is correctly mirrored by the tests repo's page-object and locator updates; the layout centralisation is frontend-only with no missed peer-repo propagation.

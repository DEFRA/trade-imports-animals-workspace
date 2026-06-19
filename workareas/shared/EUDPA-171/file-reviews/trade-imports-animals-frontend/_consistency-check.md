# Consistency Check: trade-imports-animals-frontend

**Ticket:** EUDPA-171
**All repos in scope:** trade-imports-animals-backend, trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #138 | **Commit:** 9b2c969

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| Amend HTTP contract `POST /notifications/{ref}/amend` | backend ✅ (endpoint), tests ✅ (UI exercise) | ✅ `notificationClient.amend` POSTs to it | CONSISTENT |
| `AMEND` status handling | backend ✅ (enum), tests ✅ (status tag locator) | ✅ Templates branch on `status === 'AMEND'` | CONSISTENT |
| Amend status pill colour `govuk-tag--yellow` | tests ✅ (asserts `govuk-tag--yellow` + `Amend`) | ✅ `index.njk` + `notification-view/index.njk` set yellow tag | CONSISTENT |
| Amend UI entry points (dashboard action + view button) | tests ✅ (`btnAmend` dashboard + view locators) | ✅ Dashboard form action + view-page `id="amend-btn"` | CONSISTENT |
| Save/resubmit CTA from AMEND view | backend ✅ (submit accepts AMEND), tests ✅ (lifecycle → declaration) | ✅ `id="save-amendments-btn"` → `/declaration` | CONSISTENT |
| New route registration in `router.js` | n/a (frontend-only convention) | ✅ `notificationAmend` registered | CONSISTENT |

## Missing Changes

*None identified.* Every UI element the tests repo locates
(`btnAmend` on dashboard and view page, `amendStatusTag`,
`save-amendments-btn`, Change links) exists in the templates, and the
backend endpoint the client targets matches the route the backend exposes.

## Unique Changes

- **New `notification-amend/` route module** (controller + index + tests)
  and `router.js` registration — frontend-only, the expected home for the
  amend trigger. Follows the existing `notification-copy` / `notification-delete`
  sibling pattern. Not suspicious.
- **Status-tag refactor in `home/index.njk`** — inline ternary replaced
  with an `if/elif/else` `set statusTagClass` block to add the yellow AMEND
  tag. Localised; mirrors the view-page tag treatment. Consistent.
- **Amend trace-id propagation** — `amend` client method sends the
  `tracingHeader`, matching the existing `submit`/`softDelete` client
  methods. Consistent with peer methods.

## Verdict

**Status:** CONSISTENT
**Issues:** 0 inconsistencies found
**Summary:** Frontend consumes the backend amend contract and renders every
AMEND-state UI element the tests repo asserts against; route, client,
helper, and template changes are internally and cross-repo consistent.

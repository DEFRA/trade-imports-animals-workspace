# Consistency Check: trade-imports-animals-frontend

**Ticket:** EUDPA-48
**All repos in scope:** trade-imports-animals-backend, trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #110 | **Commit:** 56e25c9c

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| `consignment.contact` data shape | backend `Consignment{contact: ContactAddress{name, Address}}`; tests-repo `NotificationDocument.consignment?.contact{name, address{addressLine1, addressLine2, addressLine3?, country}}` | `mock-contacts.json` entries shaped `{ name, address: { addressLine1, addressLine2, addressLine3, country } }` | CONSISTENT |
| Address `postcode` collapsed into `addressLine3` | backend `Address` has no `postcode` field; tests-repo `NotificationDocument` has no `postcode` and Mongo seed uses merged form ("Addlestone, KT15 3NB") | `mock-contacts.json` drops `postcode`, merges into `addressLine3` ("Addlestone, KT15 3NB" / "Hyattmouth, 72183" / "Kesslerbury, 528272") | CONSISTENT |
| Pre-selection of stored contact on GET | backend has no view-layer concern; tests-repo asserts post-submit DB shape only | `index.njk` now sets `checked: loop.index0 == selectedContactId` per radio (replacing top-level `value: selectedContactId`); `controller.test.js` adds case for index-0 hydration | CONSISTENT (frontend-only concern) |
| Session key for stored contact | backend reads from DTO directly (no session); tests-repo asserts via Mongo doc | `sessionHelpers.getSessionValue(_, sessionKeys.consignmentContactAddress)` in controller test (existing wiring, unchanged in this PR) | CONSISTENT |
| No new dependencies | backend no new pom.xml deps; tests-repo no new deps | No changes in `package.json` / `package-lock.json` | CONSISTENT |
| No new config / env vars | backend no `application.yml` changes; tests-repo no env changes | No changes in `config/`, `.env*`, Helm values | CONSISTENT |
| Mock data parity (three sample contacts) | backend `NotificationTestData.consignments()` exposes two (APHA, EuroStore — missing Laiterie); tests-repo Mongo seed has three (APHA, EuroStore, Laiterie) | `mock-contacts.json` has three entries (APHA, EuroStore, Laiterie) | INCONSISTENT (backend fixture set is a subset; not blocking — see backend report) |

## Missing Changes

- **No controller / route additions in this PR.** The contact-select page (`controller.js`, `index.njk`, `mock-contacts.json`) was introduced in earlier work; this PR is scoped to the pre-selection bug-fix on `index.njk`, its test, and the mock data postcode merge. That matches `files=3` in `.review-meta.json` and matches the ticket-skeleton scope. No missing peer-repo mirror.

*Otherwise none identified.*

## Unique Changes

- **`mock-contacts.json` postcode merge** (`"addressLine3": "Kesslerbury, 528272"` — the original was `"postcode": "528274"`; the merged entry uses `528272`, matching the tests-repo Mongo seed). The tests-repo seed is the authoritative value used by the E2E persistence assertion, so the new value is correct.
- **Pre-selection refactor**: switching from `govukRadios({ value: selectedContactId })` to per-item `checked: loop.index0 == selectedContactId` is a frontend-only nunjucks pattern; peers have no equivalent. Intentional fix for the index-0 hydration case (the new controller test exercises this).

## Verdict

**Status:** CONSISTENT
**Issues:** 0 blocking; 1 minor noted (backend test-data set is a 2-of-3 subset)
**Summary:** The frontend's contact data shape (no `postcode`, merged `addressLine3`) is identical to the tests-repo `NotificationDocument` type and Mongo seed and matches the backend `Address` model; the PR's scope is the index-0 pre-selection fix only, which is correctly a frontend-only concern.

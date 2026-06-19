# Consistency Check: trade-imports-animals-tests

**Ticket:** EUDPA-171
**All repos in scope:** trade-imports-animals-backend, trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #64 | **Commit:** e4be28b

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| Outbox event wire string `…NotificationSubmissionAmended` | backend ✅ (`OutboxEventType` value) | ✅ `NOTIFICATION_SUBMISSION_AMENDED_EVENT_TYPE` constant matches byte-for-byte | CONSISTENT |
| Amend UI locators (dashboard + view `btnAmend`, `amendStatusTag`) | frontend ✅ (`id="amend-btn"`, dashboard form, yellow tag) | ✅ Page objects target the rendered elements | CONSISTENT |
| AMEND status pill | frontend ✅ (`govuk-tag--yellow`) | ✅ `amendStatusTag` = `.govuk-tag` hasText 'Amend' | CONSISTENT |
| Full lifecycle SUBMITTED → AMEND → SUBMITTED | backend ✅ (submit accepts AMEND), frontend ✅ (CTAs) | ✅ `notification-amend.spec.ts` walks the round-trip | CONSISTENT |
| Outbox aggregate-version increment on amend | backend ✅ (unit test + `findTopBy…` refactor) | ✅ `outbox-event-notification.spec.ts` asserts v1 SUBMITTED, v2 AMENDED | CONSISTENT |

## Missing Changes

*None identified.* The E2E suite covers both new amend entry points
(dashboard + view), the AMEND-state Change links / CTAs, and the outbox
event sequence — aligning with the frontend UI and the backend event
contract.

## Unique Changes

- **`admin-notifications-page.ts` `getTotalElements` wait fix** — adds
  `await this.heading.waitFor({ state: 'visible' })` before reading the
  results count. This is an **admin page object touching unrelated test
  infrastructure**, not part of the amend feature. The
  `trade-imports-animals-admin` repo is **not in this review's scope**
  (`.review-meta.json` lists only backend/frontend/tests). Flag: confirm
  this flake fix is intentionally bundled into the amend PR rather than
  scope creep, and that no corresponding admin-repo change was
  needed/omitted. Low risk (test-side stability only), but out of the
  ticket's stated scope.
- **Rewrite of the "resubmit" step → amend step** in
  `outbox-event-notification.spec.ts` — replaces the old temporary
  re-submit-from-declaration hack with the real amend flow. Expected: the
  backend now produces a distinct `NotificationSubmissionAmended` event, so
  the second outbox doc's `eventType` assertion changed accordingly.
  Consistent with the backend event-type split.

## Verdict

**Status:** CONSISTENT
**Issues:** 0 inconsistencies found (1 out-of-scope unique change flagged)
**Summary:** Tests-repo assertions match the backend event contract and the
frontend UI exactly; the only non-amend change is an unrelated admin
page-object flake fix worth confirming as intentional.

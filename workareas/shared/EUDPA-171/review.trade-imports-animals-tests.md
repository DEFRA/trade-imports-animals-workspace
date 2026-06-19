# Repository Review: trade-imports-animals-tests

**PR:** #64
**Commit:** e4be28b49f259e6c1d011e36048dbe44ee0d4535
**Files Changed:** 5

## Summary
Adds E2E coverage for the amend journey: a new `notification-amend.spec.ts`
covering amend entry points and the SUBMITTED → AMEND → SUBMITTED lifecycle,
updates the outbox-event spec to assert the second event is
`NOTIFICATION_SUBMISSION_AMENDED`, and adds `btnAmend` / `amendStatusTag`
locators to the dashboard and view page objects (plus a `waitFor` flake fix on
the admin notifications page object).

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `tests/e2e/features/notification-amend.spec.ts` | NEEDS ATTENTION | 0 | 1 | 0 |
| `tests/e2e/features/outbox-event/outbox-event-notification.spec.ts` | SAFE | 0 | 0 | 0 |
| `ui/page-objects/admin/admin-notifications-page.ts` | SAFE | 0 | 0 | 0 |
| `ui/page-objects/notification/notification-dashboard-page.ts` | NEEDS ATTENTION | 0 | 1 | 0 |
| `ui/page-objects/notification/notification-view-page.ts` | SAFE | 0 | 0 | 1 |

## Positive Observations
- New locators use role-based selectors (`getByRole('button', ...)`) consistent
  with existing page-object style.
- Outbox-event spec asserts the amended event wire string byte-for-byte against
  the backend's `OutboxEventType` value, and version increment across both events.
- `admin-notifications-page` `waitFor` addition removes a real race condition
  (auto-wait over fixed timeout) — a sound stability fix.

## Test Coverage
- E2E: Covers amend entry points, lifecycle round-trip, and outbox events.
- Note: the admin page-object flake fix is unrelated to amend and touches an
  area served by the out-of-scope `trade-imports-animals-admin` repo — low risk
  (test stability only), flagged by the consistency reviewer as possible scope
  creep. Worth confirming it's intentionally bundled here.

## Risk Assessment
**Overall Risk:** Low
**Rationale:** Findings are a test-isolation cleanup (shared `referenceNumber`
in `beforeAll`), a page-object API-completeness gap (no `amend` in
`notificationCard.actions`), and a CSS-selector resilience nit — none affect
correctness of what's covered.

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | tests/e2e/features/notification-amend.spec.ts | 8 | Major | test-isolation | beforeAll shares mutable referenceNumber across tests, violating test isolation. Tests at lines 24-30 depend on this shared state, but tests at lines 34-111 create their own data. | Move the submitNotification() into beforeEach() for the nested describe at line 19, removing the beforeAll. For the remaining tests (lines 34, 57, 73), they already create their own data correctly. |  |  |  |
| 2 | ui/page-objects/notification/notification-dashboard-page.ts | 143 | Major | completeness | notificationCard.actions is missing amend action. The notificationCard.actions object includes copyAsNew and view, but the newly-added btnAmend should also be exposed here for API consistency and discoverability. | Add 'amend: card.getByRole("button", { name: /Amend/ })' to the actions object in notificationCard() method (line ~158) |  |  |  |
| 3 | ui/page-objects/notification/notification-view-page.ts | 92 | Minor | locator-selector | Status tag uses CSS class selector '.govuk-tag' which may break if styling changes; no Playwright role for badges but consider using getByText() for better resilience | Consider replacing '.govuk-tag' with page.getByText('Amend', { exact: true }) if the text is unique on the page, or use a data-testid attribute on the tag in the frontend code for more stable selection |  |  |  |

## Repository Verdict
**Status:** NEEDS ATTENTION (low — test-isolation + page-object polish)

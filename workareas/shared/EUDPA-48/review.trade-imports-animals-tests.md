# Repository Review: trade-imports-animals-tests

**PR:** #44
**Commit:** 94735f2c
**Files Changed:** 7

## Summary

Adds Mongo seed data for `consignment.contact`, extends the `NotificationDocument` TS type and the persistence spec to assert the new shape round-trips end-to-end, strengthens the contact-select navigation spec, and unblocks three sibling TODOs (`addresses`, `transporters`, `declaration`) that depended on the new contact-address step being wired through.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `docker/scripts/mongodb/20-seed-notifications.js` | SAFE | 0 | 0 | 0 |
| `domain/models/db/notification-document.ts` | SAFE | 0 | 0 | 0 |
| `tests/e2e/journeys/notification-persistence.spec.ts` | SAFE | 0 | 0 | 0 |
| `tests/e2e/pages/addresses.spec.ts` | SAFE | 0 | 0 | 0 |
| `tests/e2e/pages/consignment-contact-select.spec.ts` | SAFE | 0 | 0 | 0 |
| `tests/e2e/pages/declaration.spec.ts` | SAFE | 0 | 0 | 0 |
| `tests/e2e/pages/transporters.spec.ts` | SAFE | 0 | 0 | 0 |

## Positive Observations

- `notification-persistence.spec.ts` asserts both the contact name (via the shared `CONTACT_ADDRESS_NAME` constant) and the four address fields against the Mongo seed — a real round-trip check, not a tautology.
- `consignment-contact-select.spec.ts` strengthens the back-nav test to verify transporter selection persists via `TRANSPORTER_NAME` — a genuine new assertion.
- Three previously-TODO/skipped specs (`addresses` back-link + save flow, `transporters` save-and-continue, `declaration` comment refresh) are unblocked using auto-waiting `expect.toHaveURL` / `toBeVisible` and role-based locators.
- `NotificationDocument.consignment?.contact` typed as optional matches the backend's non-required field — assertion uses optional-chaining correctly.

## Test Coverage

- **E2E:** Full round-trip — UI selects → submit → Mongo doc carries the field.
- **Page coverage:** Three sibling specs unblocked, restoring the full transporter → contact-address → declaration navigation chain.

## Risk Assessment

**Overall Risk:** Low
**Rationale:** All additions follow existing patterns; assertions are behaviour-focused and tied to fixture values; PR is still open and ready for merge once frontend Item #2 is decided.

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|

## Repository Verdict

**Status:** SAFE

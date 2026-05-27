# Repository Review: trade-imports-animals-frontend

**PR:** #110
**Commit:** 56e25c9c
**Files Changed:** 3

## Summary

Fixes index-0 pre-selection on the consignment contact-select radios and merges the mock-contacts postcode into `addressLine3`. Three files: the view (`index.njk`), its controller test, and the mock data.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `src/server/addresses/consignment/contact/select/controller.test.js` | SAFE | 0 | 0 | 0 |
| `src/server/addresses/consignment/contact/select/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/addresses/consignment/contact/select/mock-contacts.json` | NEEDS ATTENTION | 0 | 1 | 1 |

## Positive Observations

- `index.njk` swap from macro-level `value: selectedContactId` to per-item `checked: loop.index0 == selectedContactId` correctly handles `selectedContactId === 0` (which the previous form may have rendered ambiguously against the macro's stringly-typed comparison).
- New `controller.test.js` case pins the index-0 hydration with a behaviour-pinning regex against the rendered DOM, not a mock-state check.
- Mock-contacts shape (`{ name, address: { addressLine1..3, country } }`) is now structurally identical to the backend `ContactAddress` model and the tests-repo `NotificationDocument` type.

## Test Coverage

- **Unit tests:** Adequate — controller test now covers index-0, index-1, and no-prior-selection cases.
- **E2E:** Covered in tests repo via `consignment-contact-select.spec.ts` and `notification-persistence.spec.ts`.

## Risk Assessment

**Overall Risk:** Low–Medium
**Rationale:** Behaviour fix is well-tested. Postcode-shape change is open for discussion (Item #2) — non-blocking but worth a deliberate decision before merge given `index.njk` still has a `postcode` rendering line.

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/server/addresses/consignment/contact/select/mock-contacts.json | 25 | Minor | data-typo | Postcode value changed from '528274' to '528272' alongside the postcode-into-addressLine3 merge, looking like an accidental typo introduced during the edit rather than a deliberate data change | Restore the original digits (528274) unless the value was meant to change — keep mock edits limited to structure when the intent is structural |  |  |  |
| 2 | src/server/addresses/consignment/contact/select/mock-contacts.json | 7 | Major | data-shape | Postcode merged into addressLine3 ('Addlestone, KT15 3NB') drops the structured postcode field that the view template at index.njk:38 still renders on its own line — UK addresses conventionally show postcode on a separate line, and the controller's contact-shape contract now loses a field that downstream/real API integration likely returns separately | Keep postcode as its own field on each contact and rely on index.njk's existing postcode line; if the visual goal was 'city, postcode on one line' adjust the template rather than the data shape |  |  |  |

**Reviewer note on Item #1:** the consistency check found that `528272` matches the tests-repo Mongo seed value used by the E2E persistence assertion, so this may be a deliberate alignment rather than a typo. Worth confirming in the walker.

## Repository Verdict

**Status:** NEEDS ATTENTION

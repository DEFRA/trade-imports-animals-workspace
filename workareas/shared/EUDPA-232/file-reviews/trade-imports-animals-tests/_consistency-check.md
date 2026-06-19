# Consistency Check: trade-imports-animals-tests

**Ticket:** EUDPA-232
**All repos in scope:** trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #66 | **Commit:** c9b4e74

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| Addresses heading "Consignment addresses" | frontend ✅ (`addresses/index.njk` heading) | ✅ `addresses-page.ts` heading locator updated to "Consignment addresses" | CONSISTENT |
| Addresses → Port of Entry direct redirect | frontend ✅ (`addresses/controller.js` POST → `/port-of-entry`) | ✅ `addresses.spec.ts` asserts `entryPoint.expectedUrl` after Save and continue | CONSISTENT |
| Port of Entry back link → `/addresses` | frontend ✅ (`port-of-entry/index.njk` back href) | ✅ `port-of-entry.spec.ts` "can navigate back to addresses" | CONSISTENT |
| CPH "Add a CPH number" link / sub-page | frontend ✅ (`addresses/index.njk` CPH section → `/cph-number`) | ✅ `addresses-page.ts` `linkAddCphNumber`; `journeys.ts` clicks it | CONSISTENT |
| CPH page back link → `/addresses` | frontend ✅ (`cph-number/index.njk` back href, unchanged this PR) | ✅ `cph-number.spec.ts` "can navigate back to addresses" (unchanged this PR) | CONSISTENT |

## Missing Changes

*None identified.* Every frontend route/label change in PR #141 has a matching
assertion or locator update here.

## Unique Changes

The `toEntryPoint` helper in `ui/flows/journeys.ts` was restructured. Previously it
delegated to `toCphNumber` (which itself walked Addresses → fill consignor/destination
→ Save and continue → CPH page). Now `toEntryPoint` inlines the Addresses steps,
clicks "Add a CPH number" to reach the CPH sub-page, fills CPH, and clicks the CPH
page's "Save and continue" to land on Port of Entry. `toCphNumber` was simplified to
go Addresses → "Add a CPH number" → CPH page (no longer requiring consignor/destination
selection).

This is consistent with the frontend: the CPH page POST still redirects to
`/port-of-entry`, so the flow lands correctly.

## Cross-cutting question resolution (forward journey vs new wiring)

**Finding: CONSISTENT — no contradiction, but one coverage observation.**

The forward `toEntryPoint` journey reaching Port of Entry *via* the CPH sub-page and
the new direct Addresses ↔ Port of Entry wiring are **not** in conflict. After
EUDPA-232 the CPH page is a retained optional sub-page (reachable from the Addresses
"Add/Change CPH number" link), and its own back link (`/addresses`) and POST redirect
(`/port-of-entry`) already slot it between Addresses and Port of Entry. So clicking
the CPH page's "Save and continue" legitimately lands on Port of Entry — the journey
passes against the frontend implementation. The renamed `addresses.spec.ts` tests
separately cover the new *primary* path (Addresses' own Save and continue →
Port of Entry).

**Coverage observation (not a defect):** `toEntryPoint` is the shared helper that
downstream specs (e.g. `port-of-entry.spec.ts`) build on. It routes through the CPH
sub-page rather than the new primary direct path, so most downstream journeys do not
exercise the Addresses → Port of Entry direct redirect — only `addresses.spec.ts`
does. This is a reasonable design choice (the helper deliberately seeds CPH state for
downstream assertions), but reviewers may want to confirm the team is comfortable
that the new primary path has coverage only in `addresses.spec.ts` and is not the
route taken by the reusable journey helper. No change is required for correctness.

## Verdict

**Status:** CONSISTENT
**Issues:** 0 inconsistencies found (1 coverage observation noted for reviewer discretion)
**Summary:** All frontend route/label changes have matching test updates, and the CPH-via-sub-page journey is consistent with the retained CPH page wiring; the only note is that the shared `toEntryPoint` helper exercises the CPH path rather than the new direct Addresses → Port of Entry redirect.

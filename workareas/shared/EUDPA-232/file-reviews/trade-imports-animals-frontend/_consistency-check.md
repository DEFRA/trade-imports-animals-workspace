# Consistency Check: trade-imports-animals-frontend

**Ticket:** EUDPA-232
**All repos in scope:** trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #141 | **Commit:** b47b656

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| Addresses page heading "Consignment addresses" | tests ✅ (`addresses-page.ts` heading locator updated to "Consignment addresses") | ✅ `index.njk` `appHeading` + page title set to "Consignment addresses" | CONSISTENT |
| Addresses → Port of Entry direct redirect | tests ✅ (`addresses.spec.ts` asserts `entryPoint.expectedUrl` after Save and continue) | ✅ `addresses/controller.js` POST redirects to `/port-of-entry` | CONSISTENT |
| Port of Entry back link → `/addresses` | tests ✅ (`port-of-entry.spec.ts` asserts back goes to `addresses.expectedUrl`) | ✅ `port-of-entry/index.njk` `govukBackLink` href `/addresses` | CONSISTENT |
| CPH retained as optional sub-page (Add/Change CPH link → `/cph-number`) | tests ✅ (`addresses-page.ts` `linkAddCphNumber`; `journeys.ts` clicks "Add a CPH number") | ✅ `addresses/index.njk` CPH section links to `/cph-number` | CONSISTENT |
| New operator session keys (placeOfOrigin, consignee, importer) | tests — N/A (no equivalent fixtures needed) | ✅ `session-keys.js` adds keys; controller reads + passes to view | CONSISTENT (frontend-only by scope) |
| `undici` 8.0.2 → 8.5.0 bump | tests — not present (different lockfile) | ✅ `package.json` / `package-lock.json` | CONSISTENT (unrelated to ticket scope) |

## Missing Changes

The standalone `/cph-number` page (`cph-number/controller.js`, `cph-number/index.njk`)
was **not** modified in this PR — and correctly so. It was already wired for the
new flow on a prior commit: its back link points to `/addresses` and its POST
redirects to `/port-of-entry`. The ticket (AC2 note) says the standalone CPH
**step** is removed from the linear journey, not that the CPH **page** is deleted.
This PR achieves that by making the Addresses page's own "Save and continue" jump
straight to `/port-of-entry`, while keeping the CPH page reachable as an optional
Add/Change sub-page — mirroring how Place of origin, Consignor, Consignee, Importer
and Destination each link out to their own select sub-pages. No missing change.

*None identified.*

## Unique Changes

- `undici` dependency bump (8.0.2 → 8.5.0) plus transitive `@babel/*`, `joi`,
  `js-yaml` lockfile churn — unrelated to the ticket's user-facing scope. Likely a
  routine refresh that rode along on the branch. Low risk, but worth noting it is
  out of scope for EUDPA-232; flag to the author so it is intentional rather than
  an accidental merge artifact.
- Warning text "Providing a false address is an act of fraud" was moved from the
  Place of destination fieldset up to the top of the form (and the trailing full
  stop dropped). Frontend-only presentational change; no test-repo counterpart
  needed.

## Cross-cutting question resolution (forward journey vs new wiring)

**Finding: CONSISTENT — no contradiction.**

The per-file reviewers flagged an apparent conflict: the `toEntryPoint` test flow
still reaches Port of Entry *through* the CPH page, while the Addresses POST and the
Port of Entry back link now wire Addresses ↔ Port of Entry directly.

These are not in conflict because the standalone CPH page was retained as an
**optional sub-page**, with both its back link (`/addresses`) and its POST redirect
(`/port-of-entry`) already pointing at the new neighbours. So two valid paths to
Port of Entry now exist:

1. **Primary linear path** — Addresses "Save and continue" → `/port-of-entry`
   (this PR's `addresses/controller.js` change). Covered by the renamed
   `addresses.spec.ts` tests.
2. **Via the CPH sub-page** — Addresses "Add a CPH number" → `/cph-number` →
   CPH "Save and continue" → `/port-of-entry`. This is what `toEntryPoint` exercises
   in the tests repo, and it works precisely because the CPH page POST still
   redirects to `/port-of-entry`.

The `index.njk` CPH section linking to `/cph-number`, the CPH page's own wiring, and
the test journey are therefore mutually consistent. The only nuance (not a defect):
the reusable `toEntryPoint` helper does not exercise the new *primary* direct path —
that coverage lives in `addresses.spec.ts`. See the tests-repo consistency check for
the coverage observation.

## Verdict

**Status:** CONSISTENT
**Issues:** 0 inconsistencies found (1 out-of-scope dependency bump noted for the author)
**Summary:** The new Addresses → Port of Entry wiring and the retained optional CPH sub-page are internally consistent and align with the tests repo; the apparent forward-journey contradiction is resolved by the CPH page being a sub-page rather than a removed page.

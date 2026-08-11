# Repository Review: trade-imports-animals-tests

**PR:** #106
**Commit:** b1f165eaa1138decaa64009f7db624d281df1974
**Files Changed:** 6

## Summary

This repo supplies the cross-repo proof the frontend PR omits. Both EUDPA-317 test obligations the ticket set are met and exceeded: `notification-dashboard.spec.ts` now returns to the dashboard after a copy, searches the copied reference and asserts the card is visible, is a Draft and matches the source field for field; `notification-view-states.spec.ts` opens the copy, edits an answer, saves, submits and re-checks the status. `promoted-lifecycle.spec.ts` adds the API-level proof — the paired Notification exists at the fulfilments copy's id, is DRAFT, carries the source's sections, and an Idempotency-Key replay yields a byte-identical notification (the retry-stability contract the ticket's gate demanded under option (b)).

Supporting changes: `getNotification(id)` added to the API client (the only way to observe the aggregate the backend now writes), `copyFromDashboard` flow, and a `cancelAmend` page-object locator. As with the frontend, **three of the four PR commits are the bundled EUDPA-325 branch**; EUDPA-317's contribution is one commit across four files.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `adapters/http/notification-api-client.ts` | SAFE | 0 | 0 | 1 |
| `flows/notification-actions.ts` | SAFE | 0 | 0 | 1 |
| `page-objects/notification/notification-dashboard-page.ts` | SAFE | 0 | 0 | 0 |
| `tests/e2e/features/promoted-lifecycle.spec.ts` | NEEDS ATTENTION | 0 | 2 | 1 |
| `tests/e2e/pages/notification-dashboard.spec.ts` | NEEDS ATTENTION | 0 | 1 | 3 |
| `tests/e2e/pages/notification-view-states.spec.ts` | NEEDS ATTENTION | 0 | 1 | 4 |

## Positive Observations

- **The assertions match the shipped behaviour, not the old semantics.** With `NotificationCopyMapper` deleted and copy now verbatim, the specs' equality assertions on transport, origin, consignor and consignee are correct rather than pinning the reset rules the PR removed.
- **`copyFromDashboard` is a valid regression detector.** The Overview heading it waits for is distinct from the dashboard heading, so a failed copy that redirects dashboard-to-dashboard — the reported snag — still fails rather than passing spuriously.
- **The idempotency replay assertion is sound**: `copy()` returns early on the key lookup, so no second notification write occurs, and the byte-identical comparison pins it.
- **Locator and page-object hygiene is good** — no `waitForTimeout`, no CSS or XPath selectors, no assertions in page objects, correct role choice (`link` for `href` actions, `button` for `postAction` ones), and every accessible name verified against the frontend's rendered markup.
- **The EUDPA-325 block is unusually candid**, recording which specs were verified red-first (copy, amend) and which pass even unfixed (delete, cancel-amend — their confirmation GET adopts the journey before the guard is reached). Good practice, and worth preserving.
- Banner strings are asserted verbatim against the frontend's `copy.en.js`, keeping the two repos in step.

## Test Coverage

- **E2E:** Strong on the copy contract and the strongest of the three repos on the verbatim ruling. The gaps are that three of the six new/changed assertions can pass without proving what their names claim — the source seed is never asserted to have landed before the copy comparison (item 3), the "saves an edited answer" test never asserts the edit persisted (item 10), and the new delete test deletes a fresh draft rather than a copy, leaving AC 4 uncovered while duplicating an existing spec (item 6).
- **Test data:** `promoted-lifecycle.spec.ts` seeds invented lookalike values (`'LIVE'`, `'GBFXT'`, `'Live bovine animals'`) where the repo already has real canned constants (item 4), so the copy contract is proved against shapes no journey produces.

## Risk Assessment

**Overall Risk:** Low
**Rationale:** The coverage is real and the contract is proved end-to-end; the findings are assertion-strength and test-data-fidelity issues that weaken the guard rather than break it.

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | adapters/http/notification-api-client.ts | 76 | Minor | typing | getNotification is typed Promise<Notification> but GET /notifications/{ref} returns NotificationResponse, which also carries id and accompanyingDocuments; the extra fields are invisible to callers and to the deep-equality assertion at promoted-lifecycle.spec.ts:76 | Model the GET response explicitly - either extend the Notification type in domain/models/api/notification.ts with optional id and accompanyingDocuments, or add a NotificationResponse type and return that from getNotification |  |  |  |
| 2 | flows/notification-actions.ts | 18 | Minor | test-api | copyFromDashboard returns Promise<void>, so its only caller (notification-dashboard.spec.ts:146-149) re-scrapes the copied reference with a regex over notificationView.referenceNumberCaption, duplicating the same scrape at lines 100-104 | Return Promise<string>: after overview.heading.waitFor(), read the new reference via this.pages.overview.journeyIdFromUrl() (BasePage helper) and return it, mirroring journey.startNotification(): Promise<string> |  |  |  |
| 3 | tests/e2e/features/promoted-lifecycle.spec.ts | 66 | Major | test-assertions | The copy-vs-source equality block (lines 66-70) can pass vacuously: both sides are read back from the API, so if the seed at line 19 never persisted a section, null.toEqual(null) still passes; only origin has a real-value guard (internalReference) and transport's guard is a weak toBeTruthy, while commodity, consignor and consignee have none. | Assert the seed actually landed before copying - expect(source).toMatchObject({ commodity: {...}, consignor: {...}, consignee: {...} }) - and pin the date with toBe('2026-09-01') instead of toBeTruthy (the backend echoes transport verbatim, so the exact value is stable). |  |  |  |
| 4 | tests/e2e/features/promoted-lifecycle.spec.ts | 20 | Major | test-data | The new seed payload uses invented lookalike values the product never writes: typeOfCommodity 'LIVE' (real canned value is 'Domestic' - see commodityTypes.domestic, seeds/mongodb/20-seed-notifications.js.example:42 and the frontend notification-mapper), portOfEntry 'GBFXT' (real values are space-separated, e.g. 'GB ABD'/'GB DYC' in pointOfEntries), and commodity.name 'Live bovine animals' (real is 'Cow' per commodityCodes), so the copy contract is proved against shapes no journey produces. | Build the payload from the repo's canned data in domain/constants - commodityTypes.domestic, pointOfEntries.<port>.value, commodityCodes.cow, commoditySpecies.bosTaurus - keeping the species value '1148346', which is already the real code. |  |  |  |
| 5 | tests/e2e/features/promoted-lifecycle.spec.ts | 7 | Minor | test-naming | The test title still excludes copy from the dual-write list and frames it as fulfilments-only ('notification-fulfilments copy stays idempotent'), but the test now asserts that copy writes both aggregates at one shared reference - the ticket's headline behaviour - so the name no longer describes the scenario. | Rename to include copy in the dual-write list, e.g. 'dual-writes create/submit/amend/cancel/copy/soft-delete to both /notifications and /notification-fulfilments, and copy stays idempotent under one key'. |  |  |  |
| 6 | tests/e2e/pages/notification-dashboard.spec.ts | 165 | Major | coverage | The added delete test deletes a freshly seeded draft, not a copy, so AC 'a copied notification can be deleted and no longer appears on the dashboard' stays untested; as written it duplicates notification-delete.spec.ts:19-31 (same deleteNotification flow, same dashboard assertion) and the block comment concedes it passes against the unfixed frontend | Seed the subject by copying first (copyFromDashboard or notificationApi.copyNotificationFulfilments) and delete the copy, so the test covers the untested AC instead of re-covering notification-delete.spec.ts |  |  |  |
| 7 | tests/e2e/pages/notification-dashboard.spec.ts | 206 | Minor | page-object | The cancel-amend test inlines getByRole('button', { name: 'Yes, cancel amendment' }) although NotificationCancelAmendPage.confirm is exactly that locator, so the button copy is now pinned in two places | Use pages.notificationCancelAmend.confirm.click() instead of the raw locator |  |  |  |
| 8 | tests/e2e/pages/notification-dashboard.spec.ts | 146 | Minor | duplication | The reference-caption regex extraction is copy-pasted from lines 100-102 into the new test, and the same five lines land a third time in notification-view-states.spec.ts, so the caption format is pinned in three places | Add a NotificationViewPage helper (e.g. async referenceNumber(): Promise<string>) that reads the caption and matches the pattern, and call it from all three sites |  |  |  |
| 9 | tests/e2e/pages/notification-dashboard.spec.ts | 133 | Minor | comments | The block comments at 133-137 and 175-177 narrate this PR's own verification history ('Verified red-first against an unfixed frontend', 'Before the fix this redirected dashboard to dashboard') — once merged there is no 'unfixed frontend' to compare against and the notes rot | Drop the before/after narration; keep only what a future reader needs (that the delete and cancel-amend cases route through a confirmation GET that adopts the journey into the session, so they cannot detect the guard) |  |  |  |
| 10 | tests/e2e/pages/notification-view-states.spec.ts | 100 | Major | test-assertion | Test is named 'saves an edited answer' but nothing asserts the edit persisted — filling internalReference with 'Imports789GB' is only followed by an error-page absence check, so a save that silently discarded the value would still pass | After landing on check-your-answers (line 105) assert the 'Import details' card's 'Internal reference number' row reads 'Imports789GB', using the row-value helper pattern from tests/e2e/features/hub-groups-and-cya-rows.spec.ts:41-59 |  |  |  |
| 11 | tests/e2e/pages/notification-view-states.spec.ts | 102 | Minor | dead-assertion | Both 'Sorry, there is a problem with the service' toHaveCount(0) checks (lines 102 and 113) can never fail — the preceding overview.heading.waitFor() and the confirmation-heading toBeVisible() already fail the test if the recoverable-error page rendered | Drop the two toHaveCount(0) lines; the positive page assertions that precede them already pin 'the journey continues rather than landing on the error page' |  |  |  |
| 12 | tests/e2e/pages/notification-view-states.spec.ts | 91 | Minor | locator | The copied reference is scraped by regex from '.app-journey-strip' text via pages.notificationView.referenceNumberCaption while the browser is actually on the Overview page, duplicating the same regex block a third time in this PR | Use pages.overview.journeyIdFromUrl() (page-objects/base/base-page.ts:87) — it reads the reference from the URL and throws a named error if absent — keeping only the not-equal-to-source assertion |  |  |  |
| 13 | tests/e2e/pages/notification-view-states.spec.ts | 89 | Minor | coverage | AC 'the copied notification carries the source answers — its hub shows the same completed sections and the same answer values' is unasserted: this is the only spec that opens a copy's hub and check-your-answers, and it checks no carried-over content | After the copy lands on the hub, assert a source answer survived — e.g. on the check-your-answers page assert summaryCard('Import details') contains 'France' and summaryCard('Cow (0102) — Bos taurus') is visible, as lines 76-77 already do for the source |  |  |  |
| 14 | tests/e2e/pages/notification-view-states.spec.ts | 97 | Minor | regression-guard | This spec would go green against the unfixed frontend: replaceFulfilment upserts the notification via POST /notifications with referenceNumber in the body (frontend real/lifecycle/mutate.js:36-46), so the first save heals a missing notification document before submit is ever reached — the snag guard lives only in notification-dashboard.spec.ts | If this spec is meant to guard the snag, assert the copied reference is listed on the dashboard immediately after the copy and before the first save; otherwise accept it as AC-behaviour coverage only and leave the guard to notification-dashboard.spec.ts |  |  |  |

## Consistency Notes

Full analysis in `file-reviews/trade-imports-animals-tests/_consistency-check.md` — verdict **CONSISTENT**, 0 inconsistencies. All three repos state the copy contract in the same words, the retired endpoint has no caller left, the `INTERNAL-REF-1` fixture literal matches the backend ITs, and idempotency semantics agree.

One gap is a deliberate division of labour rather than an omission: the frontend-owned E2E (`notification-actions.e2e.spec.js`) runs in stub mode where copied answers were already preserved, so it neither contradicts nor covers the verbatim ruling. Real-stack proof lives here.

The bundled EUDPA-325 branch is the same scope question raised on the frontend PR — it should be ruled once, not twice.

## Repository Verdict

**Status:** NEEDS ATTENTION

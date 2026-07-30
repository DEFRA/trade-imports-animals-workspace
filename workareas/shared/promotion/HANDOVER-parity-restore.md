# Handover — finish the Stream C tests-repo restore to FULL PARITY (EUDPA-288)

> **UPDATE 2026-07-30 (tests tip `8b5a58b`): the 14 journey-page specs are DONE + VERIFIED, and
> the "parity recipe" below was WRONG on its central point.** The continue-tests did NOT fail from
> partial input — the inputs already matched `journey.ts`. They failed because an API-seeded
> notification (`apiJourney.createUpToPage()` + `resumeInUi`) **cannot be saved through the UI**
> (first save → service error; frontend journey state is only hydrated for UI-created journeys;
> visiting overview first does not help — verified). FIX: reach each page through the real journey
> flow. Added per-page `to*` reach helpers to `flows/journey.ts` (mirroring the existing to* pattern)
> and rewrote all 13 interactive page specs to render+default+validation+accepts-valid via UI flow.
> Also fixed `notification-dashboard.spec.ts` (eventually-consistent, reference-sorted, paginated
> read-model → sort newest-first + poll). Full integration lane green (74 pass; dashboard recovers
> on retry as at baseline). The apiJourney/resumeInUi read-only pattern is fine ONLY for
> render/default/validation, never for a page that submits. See memory
> `project_parity_restore_apiseed_cannot_save`.
>
> **Remaining below: items 2–7 (documents behaviours, lifecycle amend/copy/cancel-amend, party-picker,
> notification-view, a11y, all-operators). Item 1 (journey pages) is DONE.**
> **OPEN QUESTION for Sam:** the authoritative `frontend/e2e/live-animals.spec.js` is BEHAVIOURAL
> (~40 tests: validation + happy-path + conditional-visibility + wipe-on-change combined per concept),
> not per-page render/validate. Decide whether the tests-repo duplicates should mirror those richer
> behaviours or whether the current per-page parity is sufficient belt-and-braces.


You are the orchestrator for the tail of the live-animals promotion. **Streams D and C's genuine work are
DONE and verified.** What remains is Sam's belt-and-braces requirement: **full-parity restore of the
frontend-canned journey coverage into the tests repo**, tagged `@duplicated-in-frontend`. This is a
per-spec re-engineering effort (NOT paste-and-tag), and it is the ONLY thing left. Run headless; verify
every spec against the live stack before committing; Codex implements, you verify.

## State (all on `spike/EUDPA-288-model-retrofit`, all clean + in sync)
- frontend `repos/trade-imports-animals-frontend` tip **7d83a3d** (Stream D complete).
- tests `repos/trade-imports-animals-tests` tip **39d6590** — the committed integration lane is GREEN.
- workspace (this repo) tip ~**1a4af39** — docker/stack test-target + docs.
- **A WIP stash is waiting in the tests repo:** `git -C repos/trade-imports-animals-tests stash list` shows
  `parity-batch-wip` — 14 rich per-page specs (render + default + validation = **31 tests PASS**; 11
  "accepts valid X" continue-tests FAIL). `git stash pop` to recover them. See "The parity recipe" below to
  finish them, OR redo cleanly from the recipe (you have the full recipe, so recreating is fast + clean).

## What's already DONE + verified (do not redo)
- **Stream D** — JS best-practices R1–R10, 12 increments, frontend `4ceb534`→`7d83a3d`.
- **Stream C inc-0..7** — harness (:3100 real-mode `test-target`) + all 6 genuine integration seams
  (persistence-notification, persistence-document, submit→outbox, DLQ [surviving spec], auth [re-tagged],
  admin outbox-events + notifications, cross-browser) — all green.
- **inc-8** deployed-a11y — SKIPPED (needs a deployed env, not the local stack).
- **inc-9 restore — 6 duplicates DONE + verified** (committed): notification-delete, origin, cph-number,
  transited-countries, port-of-entry, declaration (these 5 per-page ones are THIN — empty→error only; the
  stash has RICHER replacements for them, see recipe).

## How to run / verify (do this first)
1. Base stack up + the test-target: `scripts/stack/run-stack.sh -d --profile test-target` (test-target is
   the real-mode frontend on **:3100**; it attaches to the running base stack — bring the base up first if
   down). Confirm `docker ps` shows `...frontend-test-1` healthy + backend/mongo/reference-data/defra-id-stub/
   cdp-uploader/admin up.
2. Verify a single spec fast: `npm --prefix repos/trade-imports-animals-tests run _test_integration -- <path>`
   (no reseed; creates its own data). Full lane: `npm --prefix … run test:integration` (reseeds + all
   @integration). The lane currently passes 32 + 3 known-flaky (dashboard/lifecycle recover on retry).

## The parity recipe (learned the hard way — obey this)
The deleted specs (`git show c996502~1:tests/e2e/pages/<name>.spec.ts`) test the PRE-PROMOTION journey and
are largely OBSOLETE (commodity was a dropdown → now a SEARCH; `speciesSelection`/`commodityDetails`/
`entryPoint` pages are gone; pages have no `referenceNumber`/`linkBack`). Use them only as intent-reference.
Author FRESH specs against the CURRENT page-objects + `flows/journey.ts` (the ground truth for option
labels + page order). Tag every describe `{ tag: ['@integration', '@duplicated-in-frontend'] }`.

- **Setup — reachable pages:** `const c = await apiJourney.createUpToPage(); await apiJourney.resumeInUi(c.id,
  pages.<page>)`. NOTE: `Fulfilment` has `.id` only (NO `.referenceNumber`). `createUpToPage()` takes NO arg;
  it sets origin+commodity+count+species (unlocks the FIRST page of each section, unanswered).
- **Setup — DEEP pages** (additional-details needs reason+purpose; animal-identification needs the commodity
  line): resumeInUi REDIRECTS away (unreachable). Instead use the UI flow: `journey.startNotification()` then
  replicate `flows/journey.ts`'s `answer*` navigation UP TO the page (stop before filling it).
- **Validation (empty→error `heading "There is a problem"`) — ONLY these pages validate on empty:**
  origin, cph-number, transited-countries, arrival-details (port-of-entry), declaration. The others
  (import-reason, import-purpose, additional-details, commodity-selection, transporter, transporter-selection,
  contact-address) ACCEPT an empty submit via this path — do NOT assert an error there.
- **"accepts valid X" continue-tests (the 11 that failed):** the fix is a COMPLETE valid input matching
  `journey.ts`'s exact `answer*` sequence for that page (Codex's partial input was why they errored), then
  assert `await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0)`
  (accepted, no error — robust; do NOT assert a specific next-page heading, the promoted journey returns to
  Overview after most saves). If a page's full valid input is fiddly, drop the continue-test — render +
  default + validation is solid parity coverage on its own.
- **Lifecycle specs** (delete DONE): use a UI-created journey + DIRECT-URL nav (`/notifications/{id}/delete`
  → confirm). NEVER hunt the owner-scoped, paginated dashboard (it hangs 90s). amend/copy are POST actions —
  find their direct routes or the view/dashboard buttons with care.

## Remaining parity work (author + verify + commit, batch via Codex)
1. **Journey pages (14)** — finish the stash (or redo): origin, commodities (SEARCH not dropdown),
   consignment-details, animal-identification, import-reason, import-purpose, additional-details, cph-number,
   arrival-details, transited-countries, transporter, transporter-selection, declaration, contact-address.
   Overwrite the 5 committed THIN per-page specs with the rich versions.
2. **Documents behaviours** — `promoted-documents.spec.ts` ALREADY covers upload/scan/download/remove +
   file-type reject; NET-new to add: file-size-limit (oversize) + no-js (progressive enhancement).
3. **Lifecycle** — amend, cancel-amend, copy (delete done).
4. **Addresses / party-picker** — one spec over the generic party-picker covers the 6 deleted party-selects
   (consignees/consignors/consignment-contact/destinations/importers/place-of-origin).
5. **notification-view** — draft + submitted (CYA read-only render).
6. **Journey a11y** — error/filled/initial/view states, tag `@a11y` (there is an a11y lane/config; run axe).
7. **all-operators** — confirm no operator role is unasserted.
- DROP: `origin-of-import.visual` (pixel regression owned nowhere post-promotion).

## Codex-offload (Sam is near Claude limits — offload, you verify)
`codex exec -C repos/trade-imports-animals-tests -s workspace-write --add-dir <scratch> -c
model_reasoning_effort=high -o <report> < <brief>`. Codex typechecks but CANNOT run the browser E2E — YOU
run `_test_integration` against :3100, triage (~50-60% first-pass yield), fix/strip, commit green.
GOTCHA: a `codex exec` on the tests repo is BLOCKED if tracked files differ from HEAD — commit or stash the
working tree before invoking Codex.

## Trackers + design calls
`workareas/shared/promotion/{refactor-backlog.json, stream-c-readiness.md}` are current (stream D per-item;
Stream C status). Headless design calls already made + flagged there: R2 live-animals-local status module,
R3 discriminated-result redesign, R7b + state-queries parked, Q4 admin = tests-repo lane, Q6 cross-browser =
local Chromium/Firefox/WebKit (BrowserStack out).

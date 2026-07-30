# Dual-frontend parity harness — durable plan (EUDPA-288 Stream C)

**This is the load-bearing architecture decision. Do not lose it again.**
Owner decision (Sam, 2026-07-30), confirmed twice.

## The goal (Sam's words, R1–R5)
1. **R1** Every E2E test in the tests-repo `main` that *needed to remain* passes against a fresh copy
   of the frontend stood up in the workspace.
2. **R2** Equivalent tests written for the reworked (promoted) journey.
3. **R3** `npm test` on this branch stands up **two frontends** and confirms **feature parity**.
4. **R4** The create-from-API notification route is mirrored/extended/improved.
5. **R5** The reworked journey persists **three shapes per save** — (a) fulfilment, (b) EXISTING
   notification shape (Mapper A), (c) NEW/proposed notification shape (Mapper B). An API seed for the
   reworked journey must seed **all three at once**, and the tests must handle that.

## The architecture (THE decision)
Two frontends run **simultaneously** in the workspace:
- **REWORKED frontend** = the local branch (`spike/EUDPA-288-model-retrofit`) built from
  `repos/trade-imports-animals-frontend` in **dev mode** (the reworked journey).
- **MAIN frontend** = a **sibling container pulling `:latest`** from Dockerhub (the pre-rework/main
  journey — `:latest` is built from frontend `main`, which the promotion has NOT merged into).

Two test suites, each against its own frontend:
- **reworked suite** (my new `@duplicated-in-frontend` specs) → the reworked frontend (local dev).
- **main suite** (the retained tests-repo `main` E2E specs) → the `:latest` frontend.

`npm test` stands up both frontends and runs both suites. **Both green = feature parity** — the
reworked journey delivers the same features as main, each verified by its own journey-appropriate suite.
(The journeys differ in UI — dropdown→search, pages added/removed — so it is NOT the same spec on both;
it is main-suite-on-main-FE + reworked-suite-on-reworked-FE, both passing.)

## Why the current branch fails this (adversarial review wf_c6c96516-3d9, 2026-07-30)
- `npm test` → default `playwright.config.ts` → **deployed CDP cloud**, not two local frontends. No
  `webServer` in any config. Both docker frontends (:3000/:3100) build the SAME reworked checkout in
  dev mode → no main-journey frontend exists. Branch ADDED `@integration|@cross-browser` to `test`'s
  grep-invert → `npm test` EXCLUDES the whole new suite.
- main's page/feature E2E specs were **rewritten in place** onto the reworked journey, not retained.
  4 behaviours dropped with no equivalent: outbox-event REPLAY, journey a11y, all-operators view,
  origin visual regression.
- The tests' API create route (`flows/api-journey.ts` / `NotificationApiClient`) seeds shape (a) only
  → `/fulfilments` PUT; no `/notifications` (Mapper A) or `/proposed-notifications` (Mapper B). The
  "API-seed can't save via UI" symptom = incomplete seed; the fix is to EXTEND the seed, not abandon
  it. Production 3-shape persistence IS cleanly built (`frontend real/lifecycle/mutate.js:38-70`,
  atomic w/ recoverable error) — that is the real strength to mirror.
- `createSubmittedNotification` writes a submitted fulfilment with NO notification projection →
  `FulfilmentService` skips the cascade (`:174,325-334`) → admin can't see it.

## Task list (sequence flexible; durable — tick as done)
- [ ] **T1 Stack: two frontends at once.** Extend the workspace stack so the local-dev reworked
  frontend AND a `:latest` sibling frontend run on distinct ports simultaneously. (docker/stack —
  add a `main-frontend` service on `:latest`, distinct port; keep dev reworked on its port.)
- [ ] **T2 Parity playwright config + projects.** A `playwright.parity.config.ts` with two projects:
  `reworked` (base-URL = local dev FE) runs the reworked suite; `main` (base-URL = :latest FE) runs the
  restored main suite. Each project scoped by testDir or tag.
- [ ] **T3 Rewire `npm test`.** `npm test` brings up both frontends (or asserts they are up) then runs
  the parity config. Remove `@integration|@cross-browser` from the default grep-invert so the suite is
  what `npm test` RUNS, not what it filters out.
- [ ] **T4 Restore the main suite.** Bring the tests-repo `origin/main` E2E specs (+ their page objects
  where the branch overwrote them) back as the `main` project's suite, routed to the `:latest` FE. Keep
  them distinct from the reworked specs (separate dir/tag). Confirm each "needed to remain" spec has a
  home; record any deliberately-dropped ones with a reason.
- [x] **T5 Extend the 3-shape API seed. DONE + verified 2026-07-30 (tests `5814a8f`).**
  `NotificationApiClient` now has `replaceNotification` + `replaceProposedNotification` (both upsert,
  need only `{ referenceNumber }`); `api-journey` seeds both projections on create;
  `createSubmittedNotification` seeds them before submit so the cascade fires (admin sees it — admin-
  filled-state green). Two root causes found + fixed: (1) POST /fulfilments never creates the projection
  docs → GET /notifications 404 → the "service error" I'd misdiagnosed; (2) the invented UNLOCKED_
  FULFILMENT had the commodity code as an array `['749313']`, so Mapper A's PUT /notifications failed
  "String from Array" — replaced with a fulfilment captured VERBATIM from a real UI unlock. **Proven:
  API-seed (3 shapes + real fulfilment) → resume → save now works in ~0.6s (vs ~8s UI walk).** This
  overturns the earlier "API-seed can't save via UI" conclusion. STILL TODO: convert the reworked
  render/default specs back to fast API-seed+resume where a full UI walk isn't the behaviour under test
  (currently they use the slower journey.to* UI-flow reach helpers — correct, just slower).
- [ ] **T6 Restore dropped reworked coverage.** outbox-event replay; journey a11y (initial/filled/
  error/view); all-operators view; view-page draft+submitted rendering; hub six-group + CYA answered-
  rows; contact-address add-new + blank-save; change-from-CYA threading. Re-check the 3 documents
  scan-lifecycle specs: my empirical run showed the real uploader REJECTS EICAR at upload; the review
  claims it's reproducible (EICAR writer unused). Verify against the stack before restoring or
  documenting the drop.
- [ ] **T7 CI parity gate.** Wire the dual-frontend parity run into CI as a required gate
  (tests-repo `.github` test job is currently commented out).

## Run recipe (target end-state)
`npm test` → both frontends up (local dev reworked + `:latest` sibling) → parity config runs main
suite vs `:latest` + reworked suite vs local dev → both green.

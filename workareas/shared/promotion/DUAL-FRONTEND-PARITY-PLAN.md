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
- [x] **T0 (NEW prerequisite) Rip out owner-scoping. DONE + verified 2026-07-30.** Empirical T1
  finding overturned the plan's assumption that the `:latest` main FE works against the branch
  backend: it does NOT — the rework made `X-Owner-Id` REQUIRED on `GET /notifications` (+ scoped
  findAll/assertOwner), so the old FE's dashboard 400'd. Sam's call: "there's no proper user/auth
  yet — rip it all out, back to how it was on main." Physically removed all owner-scoping across 3
  repos via a parallel subagent workflow (`wf_95af696e-aea`): backend (commit `03b3d5c` — deleted
  ownership pkg, owner field/indexes, required headers, assertOwner, owner-filtered findAll; kept
  the branch's non-owner T5 additions), FE real-mode header path (`3ba33e9`), tests harness
  (`64e225d` — dropped `ownership.spec.ts` + auth.spec owner-scoped test). Verified: backend `mvn
  verify` 172 ITs green; FE units 1422 green; reworked integration suite green (4 deep-reach specs
  are parallel-load-flaky but pass serially — want the T5 fast-path); :3200 main FE dashboard now
  renders against the branch backend.
- [x] **T1 Stack: two frontends at once. DONE + verified 2026-07-30 (workspace `f51fcdf`).** Added
  `trade-imports-animals-frontend-main` on :3200 to the `test-target` profile, pinned to
  `:latest`, NOT in `dev.compose.yml`. `run-stack.sh -d --profile test-target` brings up BOTH the
  local-dev reworked FE (:3100) and the :latest main FE (:3200) against the one workspace backend.
  Empirical unknowns resolved: (a) new-port OIDC works — the defra-id stub echoes `redirect_uri`
  verbatim, no whitelist; (b) the main FE works against the branch backend AFTER T0. Base stack via
  `tim docker dev` (Docker bumped to 32 GiB — the full stack + two frontends now fits).
- [x] **T2 Parity playwright config. DONE 2026-07-30 (tests `b99ec33`).** `playwright.parity.config.ts`
  with three projects: `reworked` (:3100, tests/e2e minus admin), `main` (:3200, main-suite/tests/e2e
  minus admin), `admin` (:3001). KEY CONSTRAINT found: page objects navigate via the process-global
  `TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL` env var (withProjectBaseUrls), so one process can serve ONE
  frontend URL — the two frontend suites run as two sequential invocations, not two projects in one run.
- [x] **T3 Rewire `npm test`. DONE 2026-07-30 (tests `b99ec33`).** `npm test` → `test:parity`: clean →
  reseed → reworked+admin vs :3100 → reseed → main vs :3200. The `@integration|@cross-browser`
  grep-invert is gone from the default; the old CDP-cloud run is preserved as `test:cdp`.
- [x] **T4 Restore the main suite. DONE + verified 2026-07-30 (tests `b99ec33`).** The origin/main
  harness (fixtures/flows/page-objects/adapters/domain/config/utils/resources/tests) is FROZEN verbatim
  under `main-suite/` on an isolated `@main-*` alias namespace (tsconfig paths) — the retained main
  specs run untouched vs :3200 and cannot be broken by reworked-side drift. Full-suite result vs :3200:
  **244 passed, 7 flaky (recovered), 1 pre-existing conditional skip, 0 real failures** (the 2 first-run
  fails re-ran green: one load flake; the visual baseline regenerated because the Playwright project
  name changed — stale `frontend-chromium` PNGs deleted; **linux visual baseline still to generate in
  CI**). origin/main a11y specs are also frozen under `main-suite/tests/a11y/` (not yet wired to a lane).
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
- [ ] **T6 Restore dropped reworked coverage.** IN PROGRESS 2026-07-30 — authoring fanned out via
  workflow `wf_fe9706a9-1f7` (8 items), parent verifying serially.
  - [x] **Documents scan-lifecycle — RESTORED, green (tests `9560ebb`). The "un-reproducible"
    conclusion was WRONG:** the earlier probe was confounded twice (EICAR bytes fail file-TYPE
    sniffing; hyphenated document references fail the backend's `^[a-zA-Z0-9]*$` validation). With a
    valid PDF + alphanumeric ref, the mock scanner (filename-with-"virus" trigger, 3s delay) delivers
    the full lifecycle: Checking (no view link) → Safe + view link, or Virus found + error summary.
    2/2 green vs :3100.
  - [x] **All wave items RESTORED, verified green vs :3100, committed (tests `ff16310`).** outbox
    replay (admin replay + REPLAY_EVENTS audit; api-journey gained a bounded retry — submit's outbox
    write holds a short per-aggregate lock and an immediate API amend can 500 inside it); journey
    a11y ×3 + view a11y (WCAG 2.2 AA; one narrow commented exclusion — govuk-frontend conditional-
    reveal radios set aria-expanded on the radio input, axe's aria-allowed-attr rejects it, upstream
    disagreement also present on main's origin page); all-operators (moved surface: CYA Roles-and-
    addresses card); view-page DRAFT+SUBMITTED rendering; hub six-group + CYA answered rows;
    contact-address add-new + blank-save (**blank save is empirically ALLOWED → exits to hub** — the
    section is optional; the agent's imagined rejection was corrected to the real behaviour);
    change-from-CYA threading (?change=1 → save → CYA shows edited value). Verification found+fixed:
    toContainText(array) misuse, CPH renders normalised on CYA.
- [x] **T7 CI parity gate. DONE 2026-07-30 (workspace `b75d645`+`3333485`).** The workspace reusable
  `e2e-tests.yml` gains a `parity` job: stack up with all profiles + `test-target` (branch images;
  `run-stack.sh` now exports `FRONTEND_TEST_TAG` in lockstep so :3100 runs the BRANCH frontend, not
  :latest), run the tests image `_test_parity_reworked` vs :3100, reseed on the runner via
  `bounce-mongo.sh` with `STACK_BRANCH` (the image has no docker/workspace checkout), then
  `_test_parity_main` vs :3200. A red parity job fails the reusable workflow → the tests repo's
  `report-e2e-status` check goes red. CAVEATS: needs the branch tests image (parity scripts aren't in
  :latest until the tests branch merges); the linux visual baseline for project `main` must be
  generated via the branch tests image after the next push (the gitignore fix now allows committing it).

## Adversarial review (wf_55c9dbde-0db, 2026-07-30) — 39 agents, 25 confirmed findings
**All 1 blocking + 7 major findings FIXED and verified:**
- BLOCKING gitignored main-suite binaries (`*.png` rule; root-anchored negation): upload fixture +
  darwin visual baseline were untracked → fresh clone/CI would ENOENT. Fixed: negations for
  `main-suite/resources/file-upload/**` + `main-suite/tests/e2e/visual/**`, both PNGs committed
  (tests `94f69ca`).
- Tests image entrypoint ignored `npm test`'s exit code → a run dying pre-Playwright reported
  "test suite passed". Fixed: non-zero exits append to the FAILED marker (`94f69ca`).
- `npm test` mass-connection-refused failure mode: preflight `bin/assert-parity-stack.sh` fails fast
  with the stack recipe; README updated (`94f69ca`).
- CI mid-run reseed staged default-branch fixtures: `STACK_BRANCH` env added (workspace `3333485`).
- Lost coverage restored + verified green 10/10 (tests `c887457`): four admin-notifications scenarios
  (cancel-checkbox / checkbox-delete+audit / select-all+audit / invalid-ref FAILURE audit);
  amend RESUBMISSION (SUBMITTED→AMEND→SUBMITTED, dashboard-Amend entry — the reworked FE has no
  view-page Amend); cancel-amend through the UI (No keeps, Yes discards the edit).
- Rejected after empirical test: `depends_on` guards on the test-target frontends — compose refuses
  cross-profile depends_on under the documented `--profile test-target`-only invocation.

**Parked minors (17, documented, none load-bearing):** main-suite `tests/a11y` + admin e2e specs are
frozen-but-unwired (deliberate: admin covered by restored branch specs; a11y equivalents live on the
branch side); reworked visual-regression equivalent not authored; a11y walks sit outside `npm test`
(matches main's lane model — run via `_test_integration --grep @a11y`); parity runs share
test-results/report dirs (second run overwrites the first's HTML report); `test:docker-compose:visual`
now matches zero specs; ${{ }} branch-name interpolations in the CI job copied from the pre-existing
pattern; dead frozen playwright helpers in main-suite/utils; stale owner-era FE test titles +
journey.js comment; API seed projections are `{referenceNumber}`-only stubs (submit cascades them
verbatim — fine for current specs, worth enriching if admin content assertions appear).

## Run recipe (ACHIEVED 2026-07-30, tests `4a0a513`)
Stack: `tim docker dev` (base) + `scripts/stack/run-stack.sh -d --profile test-target` (both
frontends). Then `npm test` → clean → reseed → reworked+admin vs :3100 → reseed → main suite vs
:3200. **VERIFIED GREEN end-to-end: reworked 125 passed (1 flaky-recovered), main 248 passed
(5 flaky-recovered, 1 conditional skip), 0 failures, exit 0.** Parity lane workers bounded to 4
locally (shared-stack ceiling — unbounded workers overwhelm the auth stub).

Open follow-ups: generate `origin-of-import-main-linux.png` via the branch tests image after the
next push (CI visual baseline); parity CI job needs the branch tests image until the tests branch
merges to main.

# Handover — build the dual-frontend parity harness (EUDPA-288 Stream C, T1–T4/T6/T7)

You are the orchestrator taking over the tail of the live-animals promotion test work. Your job is to
finish the **dual-frontend parity harness**. The design is DECIDED and committed — do not re-open it.

## NON-NEGOTIABLES (read first)
1. **USE WORKFLOWS.** The parallelizable chunks (T4 restore-main-suite, T6 restore-dropped-coverage) MUST
   be fanned out with the `Workflow` tool — one agent per spec/behaviour, authoring in parallel. You have
   explicit standing opt-in for multi-agent orchestration; do not ask for it.
2. **RUN HEADLESS. DO NOT STOP FOR APPROVAL.** Make every design call yourself and flag it in a commit
   message or the plan doc — never pause for a pat on the back, a "shall I proceed?", or a checkpoint.
   The only reason to stop is a genuine external blocker you cannot resolve (e.g. Docker won't start).
3. **VERIFY EVERYTHING against the live stack before committing.** Never commit a spec you haven't run
   green. Never claim done without a verified run. Commit incrementally, one task at a time.
4. **Verification is SERIAL against the single shared stack** — parallel Playwright runs collide
   (shared mongo/user11/ports). Workflows AUTHOR in parallel; YOU verify serially in the main loop.

## The goal (Sam's R1–R5 — the rubric)
Two frontends run at once in the workspace and `npm test` confirms feature parity:
- **REWORKED** frontend = the local branch in **dev mode** (reworked journey), on :3100.
- **MAIN** frontend = a sibling pulling **`:latest`** from Dockerhub (the pre-rework/main journey).
- `npm test` runs the **main E2E suite vs the :latest frontend** AND the **reworked equivalents vs the
  local dev frontend**. Both green = parity. (Journeys DIFFER in UI, so it is NOT the same spec on both.)
- The API create route seeds all THREE persistence shapes (fulfilment + current-notification +
  proposed-notification). **This part (T5) is DONE.**

Full detail + task list: `workareas/shared/promotion/DUAL-FRONTEND-PARITY-PLAN.md`.
Adversarial review that set this scope: workflow `wf_c6c96516-3d9` (findings in that plan).

## DONE (do not redo) — all on `spike/EUDPA-288-model-retrofit`
- **Journey-page parity** (14 specs) + **behavioural parity** (18 specs: conditional scope/wipe,
  autocomplete, no-JS, address picker, animal identifiers, task-page exits, reference strip, import-type
  routing, documents oversize) — committed, green (tests `f11bb48`).
- **T5 — 3-shape API seed. DONE + verified (tests `5814a8f`).** `NotificationApiClient` has
  `replaceNotification` + `replaceProposedNotification` (upserts, need only `{referenceNumber}`);
  `api-journey` seeds both projections on create + before submit. `UNLOCKED_FULFILMENT` is now a
  fulfilment **captured verbatim from a real UI unlock** (the invented `['749313']` array broke Mapper A).
  **API-seed → resumeInUi → save now works in ~0.6s.** Use this fast path for render/default specs.
- Durable plan + review committed (workspace tip ~`8d74742`).

## Ground-truth facts you WILL need
- **Stack is currently UP** (base + test-target). If it dies: `open -a Docker`, wait for the daemon,
  then `scripts/stack/run-stack.sh -d` (base — brings up backend/mongo/reference-data/defra-id-stub/
  cdp-uploader/admin/stub/dynamics-gateway), THEN `scripts/stack/run-stack.sh -d --profile test-target`
  (adds frontend-test on :3100). `--profile test-target` ALONE does NOT bring up the base — base first.
  If frontend-test crashes on boot with ENETUNREACH :3007, defra-id-stub wasn't up yet — `docker restart`
  the frontend-test container once the base is healthy.
- **Verify a spec:** `npm --prefix repos/trade-imports-animals-tests run _test_integration -- <path>
  --workers=1 --retries=0`. Full lane: `npm --prefix … run test:integration` (reseeds). Read
  test-results/**/error-context.md for failures. Pre-commit runs eslint+prettier — run
  `npm --prefix … run format` before staging or the hook reverts the commit.
- **The stack lane is auth-stub load-sensitive:** the full `test:integration` shows ~7 flaky (recover on
  retry) + occasionally hard-fails the heaviest spec (promoted-notification) on "unable to sign you in".
  A green-with-flaky run is a pass. (This is itself a reason to give @duplicated-in-frontend its own lane.)
- **Compose (docker/stack/):** `frontend.compose.yml` defines `frontend` (:3000, image `:latest` by
  default) + `frontend-test` (:3100). `dev.compose.yml` overrides BOTH to build from local source
  (that's why both are currently the reworked journey). To get a `:latest` main sibling: EITHER add a new
  `frontend-main` service (own port e.g. :3200, image pinned `:latest`, profile `[parity]`, NOT in the
  dev overlay) OR remove `frontend` from `dev.compose.yml` so :3000 pulls `:latest`. Adding a sibling has
  the smaller blast radius. **Two unknowns to resolve EMPIRICALLY, not by assumption:** (a) the defra-id
  stub accepting a new port's OIDC redirect (DEFRA_ID_REDIRECT_URL=http://localhost:<port>/auth/
  sign-in-oidc) — check repos/trade-imports-defra-id-stub for redirect whitelisting; (b) whether the
  `:latest` old-journey frontend works against the branch backend (likely yes — backend is additive:
  /fulfilments unchanged, /notifications + /proposed-notifications added). STAND IT UP AND SEE.
- **Backend persistence (Explore-verified):** POST /fulfilments creates ONLY the fulfilment; both
  projection PUTs are create-or-replace upserts; owner headers (X-Owner-Id/X-Owner-Organisation) must
  match the UI session — they already do (`defaultOwner` == test.user11). Submit cascade only fires if the
  notification projection exists.
- **NEVER invent seed data.** If you need a fulfilment/notification shape, capture it from a real UI
  journey (`journey.unlockSections()` → `notificationApi.getFulfilment(id)`), like T5 did.

## Tasks (do them; sequence is yours — verify + commit each)
- **T1 Two frontends.** Add the `:latest` main-journey sibling (see compose notes). Bring both up; prove
  the main frontend serves the OLD journey and auth works. Resolve OIDC/backend-compat empirically.
- **T2 Parity playwright config.** `playwright.parity.config.ts` with TWO projects: `reworked` (base-URL
  = local dev FE, runs the reworked suite) + `main` (base-URL = :latest FE, runs the restored main suite).
  Scope each by testDir or grep. Follow the existing `withProjectBaseUrls`/`withServiceBaseUrls` pattern
  in utils/playwright/.
- **T3 Rewire `npm test`.** Make `npm test` bring up both frontends (or assert up) then run the parity
  config. REMOVE `@integration|@cross-browser` from the default `test` grep-invert so the suite is what
  `npm test` RUNS, not what it filters out. (Consider giving @duplicated-in-frontend its own lane to keep
  the core-seam lane lean — the load-sensitivity above.)
- **T4 Restore the main suite** — WORKFLOW. Fan out over the tests-repo `origin/main` E2E specs
  (`git -C repos/trade-imports-animals-tests ls-tree -r --name-only origin/main | grep tests/e2e`). For
  each still-relevant one, restore it (+ its main-journey page objects where the branch overwrote them)
  as the `main` project's suite, routed to the :latest FE. Keep separate from the reworked specs (dir or
  tag). Verify each against the :latest frontend; record deliberately-dropped ones with a reason.
- **T6 Restore dropped reworked coverage** — WORKFLOW. outbox-event replay; journey a11y (initial/filled/
  error/view); all-operators view; view-page draft+submitted rendering; hub six-group + CYA answered-rows;
  contact-address add-new + blank-save; change-from-CYA threading. Use the fast T5 API-seed where a full
  UI walk isn't the behaviour under test. **Re-check the 3 documents scan-lifecycle specs: my empirical
  run showed the real cdp-uploader REJECTS an EICAR file at upload ("could not be uploaded") and settles
  clean scans instantly — so virus-found/scan-status/view-while-checking may be legitimately
  un-reproducible in real mode. VERIFY on the stack before restoring; document the drop if confirmed.**
- **T7 CI parity gate.** Wire the dual-frontend parity run into CI as a required gate (tests-repo
  `.github/workflows` test job is currently commented out).

## Workflow discipline (from hard-won memory)
- Author-only in workflows; NO test execution inside workflow agents (shared stack). Verify serially.
- Do NOT let parallel agents edit `flows/journey.ts` or `page-objects/**` — conflicts. Have them use raw
  `pages.page.getByRole/getByLabel` locators and FLAG needed helpers; you add shared helpers in the main
  loop between waves.
- Brief agents: import from `@fixtures`; tag correctly; ONE command per Bash call; absolute paths for
  Read/Write, `~/` for Bash; no `cd`; write to an exact path; return a structured report.
- After building, run an **adversarial review workflow** (find → refute → synthesize, like
  `wf_c6c96516-3d9`) against R1–R5 to confirm the harness actually meets the goal before declaring done.

## Definition of done
`npm test` on this branch stands up both frontends and runs both suites (main vs :latest, reworked vs
local dev), both green (flaky-recover allowed), with the API seed writing all three shapes. Trackers
(`DUAL-FRONTEND-PARITY-PLAN.md`, this file) updated. CI gate wired. Then — and only then — report.

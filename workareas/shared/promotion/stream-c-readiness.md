# Stream C (tests-repo rebuild) — readiness assessment (2026-07-29)

Written after Stream D (JS best-practices R1–R10) completed. Records what the orchestrator resolved before
Stream C's build so the §6 open questions in `tests-repo-fresh-approach.md` are narrowed to the genuine ones.

## Current state
- Tests repo `repos/trade-imports-animals-tests` on `spike/EUDPA-288-model-retrofit`, tip `701b8f5` (parity OK).
- Nuke commit `c996502` deleted 44 specs / added 5; deleted specs recoverable via `git show c996502~1:<path>`.
- `package.json`: `test` grep-inverts `@agent|@compose|@a11y` (runs almost nothing journey-related now);
  **no `test:local` and no `test:integration`** — the standard-runner contract drifted (restore in inc-0).

## §6 questions — RESOLVED by the orchestrator (no longer blockers)
- **Q1 (OIDC redirect allow-list for `localhost:3100`) — NON-ISSUE.** `repos/trade-imports-defra-id-stub/src/routes/open-id.js` validates `redirect_uri` as `Joi.string().uri().required()` with **no allow-list** — any valid URI is accepted and echoed back (`routes/auth.js:183`). So `:3100` needs no registration. The only real constraint is OIDC-single-origin consistency (keep redirect / sign-out / WELL_KNOWN_HOST_OVERRIDE on ONE hostname for the :3100 target, same rule as :3000).
- **Q8 (fix-first blockers) — RESOLVED by Stream B.** `LIVE_ANIMALS_MODE=real` is now set in the stack (`docker/stack/frontend.compose.yml:52`, committed 696a3e5) + the frontend `depends_on reference-data (service_healthy)` cold-start race was fixed (e11a100). Sign-out-clears-session was fixed earlier in the programme (per REFACTOR-LOOP-HANDOVER "sign-out … done"). So the integration lane's "real mode not actually delivered" premise no longer holds.

## §6 questions — sensible defaults (decidable, low-risk)
- **Q3 (test-target ownership):** lean WORKSPACE-owned profile — add a `test-target` service under the existing `docker/stack/frontend.compose.yml` (the SOURCE file, not generated `.staged/`), beside the frontend service + real-mode flag that already live there. Editing the source compose is allowed; only `.staged/` is off-limits.
- **Q5 (visual regression):** default DROP the origin visual baseline (pixel regression owned nowhere post-promotion); re-home to a frontend `@visual` project only if product wants it.

## §6 questions — GENUINELY need Sam (gate inc-0 or late increments)
- **Q2 (pinned image for the :3100 test-target) — GATES inc-0 + not defaultable.** The doc wants a STABLE PINNED real-mode frontend image (a deploy-readiness digest), explicitly NOT a hot-reload dev container. The orchestrator has no deploy-readiness digest to pin to. Options: (a) build the test-target from local `repos/` source [works locally now, but loses the stable-pinned intent], (b) pin to a specific published digest [Sam provides], (c) floating branch/`:latest` tag. inc-0 cannot be verified without a concrete image running real mode.
- **Q4 (admin operator specs ownership):** tests-repo integration vs a new admin-repo canned suite. Affects inc-6 only (late) — deferrable.
- **Q6 (cross-browser / BrowserStack):** which browser set; the `wdio.browserstack.*` stubs are unimplemented. Affects inc-7 only (late) — deferrable.

## Scope (per Sam's amendment in HANDOVER-streams-CD.md)
RESTORE the ~35 already-frontend-canned specs (recover from `c996502~1`, re-port against the kept
page-objects/`flows/*` + `/notifications/{journeyId}/…` routes) and tag each `@duplicated-in-frontend`
(belt-and-braces — the seam to remove them later); rebuild the ~6 genuine integration seams; harness =
real-mode `test-target` on :3100. This amendment overrides the fresh-approach doc's "do NOT restore".

## Progress
- **inc-0 (harness) — DONE + VERIFIED (2026-07-29).** Real-mode `test-target` on :3100 as a workspace
  `docker/stack` profile (opt-in via `run-stack.sh -d --profile test-target`), dev-built from local source
  for branch work + `:latest` reference default (`${FRONTEND_TEST_TAG:-latest}`) per Sam. Tests-repo
  integration lane: `playwright.integration.config.ts` (frontend-chromium -> :3100) + `test:integration` /
  restored `test:local`. Commits: workspace `eba7097` (service+dev-override+profile-wiring) + `b2c3b95`
  (drop depends_on so it attaches to a running stack); tests `3cd5aad`. VERIFIED: target boots healthy on
  :3100 real mode; **11 @integration specs pass green** against it incl. real Defra ID sign-in on :3100
  (`npm run test:integration`). Note: the dev-built target also sidesteps the stale-webpack `:latest` crash.
  How to run: base stack up, then `run-stack.sh -d --profile test-target`, then tests-repo `npm run test:integration`.
- **inc-1 (persistence round-trip — notification) — DONE + VERIFIED (2026-07-29).** tests `fccf2e1`,
  `tests/e2e/journeys/persistence/persistence-notification.spec.ts` (@integration @mongodb). Authored FRESH
  (not a verbatim restore): the deleted spec doesn't re-port — the current `flows/journey.ts` is hardcoded
  (no options param) and the promoted model changed the persisted shape (cphNumber normalises to digits;
  transport has no meansOfTransport/transitedCountries). Grounded against the live Mongo doc (inspected via
  `docker exec … mongosh`). 2 tests green on :3100: draft persists as DRAFT; submitted persists a
  representative field per section (round-trip proof; exact payload stays the frontend Mapper A units) +
  reloads read-only. Pattern proven: recover ref → ground real shape → author vs current flow → verify :3100.
- **inc-2..9 — NOT STARTED (next phase).** 2 doc-persistence, 3 submit->outbox, 4 DLQ replay, 5 auth harden,
  6 admin operator UI, 7 cross-browser (Lane A stub smoke), 8 deployed a11y, 9 restore+tag the ~35
  frontend-canned specs (Sam's belt-and-braces amendment) + frontend-canned parity audit.
  **inc-2 grounding note:** the `accompanying_documents` collection is empty (promoted-documents
  uploads-then-removes), so the persisted doc shape must be observed from a fresh upload run; the deleted
  reference asserts a `documentType` SELECT the promoted model dropped (type now derived from filename), so
  it too is a fresh authoring. Current upload pattern: `journey.toAccompanyingDocuments()` +
  `pages.accompanyingDocuments.fillDocument(ref, date, filePath)` + `saveAndAddAnother` (see
  promoted-documents.spec.ts). Deleted refs recovered to scratchpad for reference.

## Also outstanding (stack hygiene, not Stream C)
- Cold `run-stack.sh` down+up re-verify of the e11a100 depends_on fix — never run (structurally certain; low priority).
- The frontend CONTAINER is currently Exited(1) on a STALE BAKED webpack.config (its image predates decomp-14's `client.js -> client/` move; webpack.config.js lives at repo root, outside the mounted `src/`). Not a code bug — the worktree/repos code is correct (decomp-14 E2E passed). A `run-stack.sh -d` rebuild fixes it and would double as the cold-stack re-verify.

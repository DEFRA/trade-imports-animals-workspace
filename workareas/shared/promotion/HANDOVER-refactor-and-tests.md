# Handover — orchestrate the live-animals frontend decomposition + tests rebuild (EUDPA-288)

You are the orchestrator for an ongoing refactoring/decomposition programme on the **promoted
live-animals frontend**, plus a rebuild of the gutted tests repo. Run **headless**: make design
calls yourself and flag them after landing; do NOT gate on confirmations. Offload implementation to
Codex, verify every increment yourself, commit → push → pull.

## First moves (read these — they hold the detail; don't re-derive)

1. `workareas/shared/promotion/REFACTOR-LOOP-HANDOVER.md` — **STILL AUTHORITATIVE for HOW to run the
   loop**: Codex offload command + brief rules, the git worktree mechanics
   (worktree `workareas/promotion-loop/frontend` on branch `spike/EUDPA-288-promotion-loop` →
   push to `spike/EUDPA-288-model-retrofit` → pull `repos/…` --ff-only), verification discipline
   (read Codex's diff yourself; unit + full browser E2E per increment; roll back with `git stash
   push -u`, never `reset --hard`), one-command-per-Bash, `~` not `/Users/`.
2. `workareas/shared/promotion/refactor-proposals/structural-decomposition.md` — **the primary work.**
3. `workareas/shared/promotion/refactor-proposals/js-best-practices-audit.md` — secondary (R1–R10).
4. `workareas/shared/promotion/tests-repo-fresh-approach.md` + `tests-repo-forensics.md` — tests rebuild.
5. `workareas/shared/promotion/refactor-backlog.json` — the tracker; keep it current (add items for
   the streams below).

Confirm state: frontend branch `spike/EUDPA-288-model-retrofit` tip ~`4470fc7`; worktree synced;
both checkouts match; stack up (`docker ps`, else `scripts/stack/run-stack.sh -d`). Baselines:
unit **1420 passed / 8 skipped**, E2E **~37 journeys + 3 a11y**, `npm run lint:arch` clean (depcruise
baseline = 1 readiness edge).

## Landed this programme (context, all pushed)
R1 (`obligation-source` flow→bridge); depcruise INC-1..6 (**layering gate live** — `model < bridge <
engine < flow < features`, rules at `error`, baseline grandfathers 1 readiness + the spine edges;
`assertModelImportBoundary` retired; readiness seam moved engine→bridge); shared-stub-data A/B/C
(countries/ports stubs seed from the committed `_capture` fixtures); `docs/test-approach.md`.

## Work streams (with Sam's directives from the prior session)

### B — LIVE_ANIMALS_MODE inversion  ·  DO THIS FIRST (cross-cutting; unblocks C)
Sam: **the flag is backwards. Default to REAL mode; the frontend Playwright suite opts into STUB via
the flag.** Invert `services/mode.js` default `stub`→`real`; make the frontend `e2e:start` /
`playwright.config.js` (and any canned-E2E entry) set `LIVE_ANIMALS_MODE=stub` explicitly; audit
everywhere that assumed stub-by-default (stack compose, tests). The canned E2E must still run stub
and stay byte-DOM-identical; real-mode boot must still work. This also removes the "real mode set
nowhere" fragility the tests harness hit (verified: `LIVE_ANIMALS_MODE` is set nowhere in
`docker/stack`/`scripts/stack`). Verify: full unit + E2E green; confirm real-mode container boots.

### A — Structural decomposition  ·  PRIMARY (resume the loop here)
Per `structural-decomposition.md`: **21 behaviour-preserving increments** (`git mv` + re-export +
import repoint, DOM-identical, gate stays green, no new baseline exception) splitting crammed modules
into cohesive folders. Start with the `services/` canaries (increments 1–4 — layering-unconstrained,
safest), then bridge/model/engine layer-modules, then the feature slices. Codex implements; you
verify unit + E2E + `lint:arch`; land.
Sam's directives:
- **LEAN DEEP** — prefer over-nesting to under-nesting; a folder-per-small-module is fine, not a
  smell. (Answers §6 Q3.)
- **Put the frontend tests INSIDE the feature folders where possible** — co-locate specs into the
  feature slices as part of the decomposition. (Answers §6 Q4 = yes, co-locate now.)
- Still open (get Sam's answer or make a headless call): §6 Q1 (services `stub.js`/`real.js` filename
  convention vs folder) and §6 Q2 (split the obligation manifest `obligations.js` — higher-risk, OK
  to park behind the smaller wins).
- Guard the two hard floors the harden pass set: `controller.js` keeps its Hapi handlers (don't
  hollow controllers into barrels); no redundant internal `index.js` barrels (match barrel-free
  `engine/evaluate/`). Increment #11 (evaluator→folder) also widens the `model-behaviour-bridge-only`
  depcruise regex — ship that config edit in the same commit.

### C — Tests-repo rebuild  ·  per `tests-repo-fresh-approach.md`, AMENDED by Sam
Background: the promotion NUKED the tests repo (commit `c996502` deleted 44 spec files, added 5;
~270 cases → ~42). The page-objects/`flows/*` were genuinely re-ported to the new frontend — keep
them. **Sam's amendments to the proposal:**
- **Do NOT drop the ~35 "already-frontend-canned" e2e specs.** Instead **RESTORE** them (recover
  from `c996502~1` via `git show`, re-port against the kept page-objects/flows + new
  `/notifications/{journeyId}/…` routes) and **tag each `@duplicated-in-frontend`.** Keep the
  duplication for now = belt-and-braces; the tag is the seam to remove them later. (So the §2
  re-homing table's "already-frontend-canned → drop" becomes "restore + tag `@duplicated-in-frontend`".)
- Also rebuild the ~6 genuine integration seams the matrix assigns the tests repo (real persistence
  round-trips, outbox/DLQ events, admin-over-real-data).
- Harness: a **dedicated real-mode frontend `test-target` on port 3100** (a compose profile, pinned
  image, alongside dev-mode 3000). With B done, real is the default so the target is simpler.
- Fix-first: the sign-out-doesn't-clear-session defect (the real-mode config is subsumed by B).
- Open §6 questions for Sam: OIDC redirect allow-list for `localhost:3100`; image pin strategy;
  admin-specs ownership (tests-repo vs a new admin-repo canned suite); visual-regression drop/re-home;
  cross-browser set.

### D — JS best-practices refactors  ·  SECONDARY (`refactor-backlog` R1–R10)
Per `js-best-practices-audit.md`. Lower priority than A. Highest value = R1 (de-duplicate the
`bridge/` tree-walk cluster — silent-drift risk in the model spine).

## Also do
Correct `workareas/shared/promotion/GOLD-STANDARD-ACCEPTANCE.md`: it overstates the tests gate
("27/37 passed" on a suite shrunk ~85%) and claims `LIVE_ANIMALS_MODE=real` is set on the stack
(verified false). Annotate honestly.

## Suggested sequence
B (mode inversion, low-risk, unblocks C) → A (structural loop — the main thread — with test
co-location) → C (tests rebuild on the pinned harness) → D (opportunistic). A and D are the standing
loop; B and C are bounded.

## Sam's standing preferences (honour without restating)
- Prefer over-nesting to under-nesting.  ·  No time estimates.  ·  Keep tests duplication, tagged
  `@duplicated-in-frontend`, don't delete yet.  ·  `LIVE_ANIMALS_MODE` default = real, stub via the
  Playwright flag.  ·  Frontend tests live inside the feature folders where possible.
- Verify subagent/Codex claims yourself; test failures on the branch are yours to fix regardless of
  provenance; never skip the full E2E for "pure refactor"; Sonar is a milestone gate, not per-increment.

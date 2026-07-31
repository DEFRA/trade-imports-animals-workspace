# Handover — orchestrate the remaining promotion streams (EUDPA-288): D (JS best-practices) then C (tests rebuild)

You are the orchestrator for the tail of the live-animals promotion programme. The big pieces are DONE:
stream B (LIVE_ANIMALS_MODE inversion + boot-race fix) and stream A (all 21 structural-decomposition
increments) are landed, verified, committed and pushed. What remains is **stream D first (JS
best-practices refactors), then stream C (tests-repo rebuild)**, plus one small residual.

Run **headless**: make design calls yourself and flag them after landing; do NOT gate on confirmations.
Offload implementation to Codex, verify every increment yourself, commit → push → pull.

## Current state (confirm before starting)

- **Frontend** `repos/trade-imports-animals-frontend` on `spike/EUDPA-288-model-retrofit`, tip **`b7b01b6`**.
  Baselines: unit **1422 passed / 8 skipped**; E2E **37 journeys + 3 a11y**; `npm run lint:arch` clean
  (**457 modules**, 1 known-ignored baseline = the readiness edge). Every crammed module is now a folder.
- **Worktree** `workareas/promotion-loop/frontend` on branch `spike/EUDPA-288-promotion-loop`, synced to
  `b7b01b6`. This is where Codex works.
- **Workspace repo** (this dir) on `spike/EUDPA-288-model-retrofit`, tip **`8bcdcfb`**. Contains the stack
  boot-race fix (`e11a100`) and the committed programme docs.
- **Stack** is up (`docker ps`); the frontend runs healthy in **real** mode. If down: `scripts/stack/run-stack.sh -d`.
- Check both checkouts are clean and match; `git -C <worktree> log --oneline -1` == `b7b01b6`.

## Read these first (they hold the detail — don't re-derive)

All under `workareas/shared/promotion/` (now committed):
1. `refactor-backlog.json` — the tracker. 34 items, every stream-A/B increment `done` with verification
   notes + design calls. **Keep it current** — add items for D and C as you land them.
2. `refactor-proposals/js-best-practices-audit.md` — **stream D's spec (R1–R10).**
3. `tests-repo-fresh-approach.md` + `tests-repo-forensics.md` — stream C.
4. `REFACTOR-LOOP-HANDOVER.md` — **still authoritative for HOW to run the loop** (Codex offload command,
   brief rules, git worktree mechanics, verification discipline). Read it.
5. `GOLD-STANDARD-ACCEPTANCE.md` — programme acceptance state (already corrected).

## Loop mechanics (from REFACTOR-LOOP-HANDOVER.md — the short version)

- **Codex offload:** write a precise brief to your scratchpad, then:
  ```
  codex exec -C ~/git/defra/trade-imports-animals/workareas/promotion-loop/frontend \
    -s workspace-write --add-dir <scratchpad> -c model_reasoning_effort="high" \
    -o <scratchpad>/<item>-report.txt < <scratchpad>/<item>-brief.txt
  ```
  run it with `run_in_background`. Brief rules: Codex leaves changes UNCOMMITTED; forbid commit/push +
  edits under `workareas/` other than the worktree; it runs `npm test` + `lint:arch` + `npm run format`
  itself and iterates to green; it must NOT run `sonar` or use `cd` (use `-C`/`--prefix`/`-f`); it
  CANNOT run the browser E2E — that's yours.
- **Verify every increment YOURSELF** (a green unit suite is not enough): read Codex's report → read the
  production diff for scope creep / gutted tests → `git status` for unmentioned files → run the suites
  yourself: `npm --prefix <worktree> test` (baseline 1422/8), `npm --prefix <worktree> run lint:arch`
  (clean), then the browser E2E: `docker stop trade-imports-animals-trade-imports-animals-frontend-1`,
  from the worktree `npm run test:e2e` (37) + `npm run test:a11y` (3), then
  `docker start trade-imports-animals-trade-imports-animals-frontend-1`.
- **Land:** commit in the worktree → `git -C <worktree> push origin
  spike/EUDPA-288-promotion-loop:spike/EUDPA-288-model-retrofit` → `git -C repos/trade-imports-animals-frontend
  pull --ff-only`. Roll back a bad increment with `git stash push -u` — **never** `reset --hard`.
- One command per Bash call (no `&&`/`;`); `~` not `/Users/`; Sonar is a milestone gate, not per-increment.

## Stream D — JS best-practices refactors  ·  DO THIS FIRST  (per Sam)

Per `refactor-proposals/js-best-practices-audit.md`, items **R1–R10**. Highest value = **R1** (de-duplicate
the `bridge/` tree-walk cluster — silent-drift risk in the model spine). These are **NOT pure moves** like
stream A — they are genuine behaviour-preserving refactors (de-dup, simplify, extract-shared), so treat
them with more care: still byte-identical behaviour, gate stays green, no new baseline exception, but the
diffs carry real logic changes — read them closely.

**IMPORTANT path caveat:** the audit was written BEFORE stream A folder-ified everything. Its file
references (e.g. `bridge/status.js`, `bridge/fulfilments.js`, `model/obligations/evaluator.js`,
`model/obligations/helpers.js`) are now **folders** (`bridge/status/`, `bridge/fulfilments/`,
`model/obligations/evaluator/`, `model/obligations/helpers/…`). Map each R-item's targets onto the new
structure before briefing Codex — the audit's line numbers are stale, the *concerns* are still valid.
Work R1 → R10 in value order; skip/park any that stream A already incidentally resolved (note which in the
backlog).

## Stream C — tests-repo rebuild  ·  after D  (per `tests-repo-fresh-approach.md`, AMENDED by Sam)

Different repo: `repos/trade-imports-animals-tests` (cross-repo branch parity: same `spike/EUDPA-288-model-retrofit`).
The promotion NUKED it (commit `c996502` deleted 44 spec files; ~270 cases → ~42). **Sam's amendments:**
- **RESTORE the ~35 "already-frontend-canned" e2e specs** (recover from `c996502~1` via `git show`,
  re-port against the kept page-objects/`flows/*` + the new `/notifications/{journeyId}/…` routes) and
  **tag each `@duplicated-in-frontend`** (the seam to remove them later). Belt-and-braces.
- Rebuild the ~6 genuine integration seams the matrix assigns the tests repo (real persistence
  round-trips, outbox/DLQ events, admin-over-real-data).
- Harness: a dedicated real-mode frontend **`test-target` on port 3100** (a compose profile, pinned
  image). With stream B done, **real is the default**, so the target is simpler.
- Open §6 questions to flag for Sam: OIDC redirect allow-list for `localhost:3100`; image-pin strategy;
  admin-specs ownership; visual-regression drop/re-home; cross-browser set.

## Also — one small residual

The stack boot-race fix (`e11a100`: frontend `depends_on: trade-imports-reference-data (service_healthy)`)
was verified warm but not with a full cold down+up. Structurally certain; do a cold
`run-stack.sh` (down then up, `--wait` exit 0) when convenient and note it in the backlog. Low priority.

## Sam's standing preferences (honour without restating)

- Prefer over-nesting to under-nesting.  ·  No time estimates.  ·  `LIVE_ANIMALS_MODE` default = real,
  stub via the flag.  ·  Frontend tests live inside the feature folders.  ·  Keep tests duplication,
  tagged `@duplicated-in-frontend`, don't delete yet.
- Verify Codex claims yourself; test failures on the branch are yours to fix regardless of provenance;
  never skip the full E2E for a "pure refactor"; Sonar is a milestone gate; remove explanatory comments
  aggressively (rationale lives in docs).

## Suggested sequence

Confirm state → **D (R1 first, then R2–R10 in value order)** → **C (restore+tag, then integration seams
on the :3100 target)** → the cold-stack residual. D and C are the remaining loop; flag design calls in the
backlog as you land, don't gate.

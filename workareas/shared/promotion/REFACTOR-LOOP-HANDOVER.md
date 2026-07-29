# Handover — orchestrate the live-animals FRONTEND refactor loop (EUDPA-288)

You are the orchestrator for a refactoring pass on the promoted live-animals **frontend**.
Two jobs, in order:

1. **Be Sam's review partner.** Sam is reviewing the whole frontend now and wants to talk it
   through with you. Know the codebase well enough to discuss architecture, spot smells, and
   turn findings into concrete, right-sized refactor increments.
2. **Run the refactor loop.** As Sam feeds you refactors, capture them in a backlog, then process
   them one increment at a time: brief Codex → verify every increment yourself (unit + full E2E)
   → commit → push → pull. **Run headless** — make design calls yourself and flag them *after*
   landing; do NOT gate on confirmations or checkpoint-pauses.

## The frontend as it stands

- `repos/trade-imports-animals-frontend`, branch **`spike/EUDPA-288-model-retrofit`** (tip `804ac4e`).
  It is the PROMOTED service: dashboard at `/`, journeys at `/notifications/{journeyId}/…`, Defra ID
  auth, real-mode capable (`LIVE_ANIMALS_MODE=real`). The old `src/server` journey and the entire
  `prototypes/` scaffolding are GONE.
- Structure: `src/server/live-animals/` (the service: `features/`, `engine/`, `flow/`, `bridge/`,
  `model/obligations/`, `services/`), platform (`auth`, `health`, `signout`, `common`), `src/config/`,
  and `e2e/` (browser tests — the only E2E, promoted-journey + a11y).
- Cross-repo parity: backend (`520c1bf`), tests (`701b8f5`), and the workspace repo (docker/stack)
  are all on `spike/EUDPA-288-model-retrofit`.
- Architecture docs to read first (they make you a good review partner):
  `src/server/live-animals/docs/{add-a-field.md,add-a-page.md,testing.md,test-responsibility-matrix.md}`.
- Full programme history + open follow-ons: `workareas/shared/promotion/GOLD-STANDARD-ACCEPTANCE.md`.

## The refactor backlog

Maintain `workareas/shared/promotion/refactor-backlog.json` (create it on first use). One object per
item: `id`, `title`, `area` (files/dir), `rationale`, `acceptance` (exactly what to verify),
`status` (pending|in-progress|done), `decision` (design calls made, filled on landing). Break large
refactors into small, independently-verifiable increments. Keep behaviour-preserving refactors
byte-identical where you claim they are.

## Codex offload pattern (Sam is near Claude limits — Codex implements, you orchestrate + verify)

Write a precise brief to your scratchpad, run in the background:

```
codex exec -C ~/git/defra/trade-imports-animals/workareas/promotion-loop/frontend \
  -s workspace-write --add-dir <scratchpad-dir> -c model_reasoning_effort="high" \
  -o <scratchpad>/<item>-report.txt < <scratchpad>/<item>-brief.txt \
  > <scratchpad>/<item>-stream.log 2>&1
```

Brief rules: Codex leaves changes **UNCOMMITTED**; forbid commit/push + any edit under `workareas/`
other than the worktree; it runs `npm test` itself and iterates to green, `npm run format` last;
it must NOT run `sonar` or use `cd` (neither is allowlisted — use `-C`, `--prefix`, `-f`). It
CANNOT run the browser E2E (needs a server + free ports) — that's yours. Give precise anchors: the
files, the conventions to mirror, and the behaviour-preserving vs behaviour-changing bar.

## Git mechanics (worktree → model-retrofit → repos/)

- Codex works in the worktree `workareas/promotion-loop/frontend` (branch `spike/EUDPA-288-promotion-loop`).
- Land an increment: commit in the worktree → `git -C <worktree> push origin
  spike/EUDPA-288-promotion-loop:spike/EUDPA-288-model-retrofit` → `git -C
  repos/trade-imports-animals-frontend pull --ff-only`. The container mounts `repos/…/src` and
  nodemon hot-reloads.
- Roll back a bad increment with `git stash push -u` — **never** `reset --hard`.

## Verification discipline (non-negotiable — a green unit suite is NOT enough)

Every increment: read Codex's report → read the production diffs yourself (scope creep? are any
"corrected" tests honest, not gutted or masked with fabricated fixtures?) → `git status` for files
it didn't mention → run the suites YOURSELF:

- **Unit:** `npm --prefix ~/git/defra/trade-imports-animals/workareas/promotion-loop/frontend test`
  → baseline **1424 passed / 8 skipped**, coverage ~89.7%. Count moves only with justified test changes.
- **Browser E2E:** free port 3000 first — `docker stop trade-imports-animals-trade-imports-animals-frontend-1`
  — then from the worktree `npm run test:e2e` (promoted journeys, ~**37**) and `npm run test:a11y`
  (~**3**); then `docker start trade-imports-animals-trade-imports-animals-frontend-1`.
  NOTE: these are the current script names — `test:prototype` was removed in the cleanup.
- Commit only after both are green. Pre-commit hook runs format + lint + build + unit.

## Operating rules (learned this programme)

- Full E2E catches what unit misses (it caught a real flow-only regression during the model retrofit).
  Never skip it for "test-only"/"pure refactor" changes.
- Test behaviour not implementation; mock at the network boundary; no coverage-padding tests;
  remove explanatory comments aggressively (rationale lives in docs).
- Sonar is a **milestone gate**, not per-increment (deferred; run `sonar analyze` in a batch before a real merge).
- One command per Bash call (no `&&`/`;`); use `~` not `/Users/…`; Grep/Glob TOOLS aren't allowlisted for
  Codex sub-agents (use `grep` in Bash with `-workspace` paths).
- Real mode boots: the reference-data clients read `TRADE_IMPORTS_REFERENCE_DATA_URL`;
  `LIVE_ANIMALS_MODE=real` is set on the workspace stack (`docker/stack/frontend.compose.yml`).
- Open follow-ons (see GOLD-STANDARD-ACCEPTANCE.md): frontend `documentReference` validation +
  the "is alphanumeric-only the right cert-ref format?" spec question; Welsh human translation;
  the Sonar milestone gate. (Sign-out, real-mode, and submit→outbox were fixed and are done.)

## First moves

1. Read `workareas/shared/promotion/GOLD-STANDARD-ACCEPTANCE.md` + the `src/server/live-animals/docs/`.
2. Confirm the stack is up + frontend healthy (`docker ps`); if not, `scripts/stack/run-stack.sh -d`.
3. Review the frontend with Sam; capture each agreed refactor into `refactor-backlog.json`.
4. When Sam says go, start the loop: take the top increment, brief Codex, verify (unit + E2E), land, repeat.

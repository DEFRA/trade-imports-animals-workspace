# Orchestrator handoff — live-animals PROMOTION BUILD (pr-002 onward)

*Rewritten 2026-07-24 after pr-001 landed. Paste this to a fresh agent to make it
the promotion-build orchestrator. Supersedes the earlier "next unblocked work"
handoff (that phase — the blocked-on-sam rulings — is done).*

---

## Your role

You are the **orchestrator** of the live-animals promotion build. The prototype +
consolidated model is BECOMING the real frontend; the old `src/server/` journey is
deleted at the final cutover. **Codex is the implementor** (Sam is near Claude
usage limits — offload build work to Codex; you orchestrate, verify, commit,
push, pull). **You decide nothing contested — Sam rules.** Present decisions in
small batches with a recommendation; record his ruling; then Codex-build.

## Read first (durable state — don't re-derive)

- `workareas/shared/promotion/PROMOTION-PLAN.md` — **the approved plan** (Sam
  approved 2026-07-24, "go for gold"). Top section = Sam's rulings on the 8 open
  decisions. 14 ordered increments at the foot.
- `workareas/shared/promotion/promotion-backlog-items.json` — **the build queue**,
  `pr-001`–`pr-014`, ordered, with `dependsOn`. This is the promotion status
  tracker: each item's `status` (todo/in-progress/done) + a `decision` field you
  fill on landing. pr-001..pr-011 + **pr-013 (CUTOVER) = done**. The promoted service
  is LIVE AT ROOT (dashboard GET /, /notifications/{journeyId}/...); the old journey
  is deleted; the other prototype spikes survive behind FEATURES_PROTOTYPES_ENABLED.
  Verified: full unit 2586/8, E2E 108, a11y 3, webpack build clean. **ALL 14
  INCREMENTS DONE (pr-001..pr-014). Programme COMPLETE + gold-standard eligible**
  (GOLD-STANDARD-ACCEPTANCE.md). pr-012 tests-repo taken over (`c996502`, same-name
  branch, 27 integrated passed vs the live stack). Tips: frontend `745ce8d`, backend
  `7a4ceb5`, tests `c996502` — all 3 repos on `spike/EUDPA-288-model-retrofit`.
  **DEPLOY-READINESS follow-ups (found by pr-012, NOT local-cutover blockers):**
  (a) sign-out doesn't clear the session (PRE-EXISTING shared-auth
  `src/auth/get-sign-out-url.js` — missing post-logout callback; separate ticket);
  (b) deployed FE must set `LIVE_ANIMALS_MODE=real` (mode.js defaults stub; the plan
  wants production-always-real — deploy/stack config, flipping the FE default breaks
  the stub canned E2E); (c) submit->notification-outbox real downstream submission
  still unwired (Sam ruling #4 atomic cascade). Also: Welsh human translation + a
  sonar milestone gate remain. FLAG carried to cutover:
  the promoted fulfilment submit does NOT wire the notification outbox (real
  downstream submission) — a pre-existing gap, decide at pr-013/pr-014. Earlier
  next-pointer (superseded): pr-009 (copy-as-new +
  soft-delete, p-016+p-018). The NOTIFICATION already has copy + soft-delete
  (NotificationService.copyNotification / softDeleteNotification -> DELETED), but
  the CANONICAL FULFILMENT does NOT — pr-009 adds fulfilment copy (new owned DRAFT,
  idempotent) + soft-delete (-> DELETED, excluded from the list, already done in
  pr-007's list filter) mirroring the notification, then the frontend copy/delete
  dashboard actions + confirmation flows. Owner-enforced; idempotent copy (a safe
  retry must not create duplicates — the plan's key p-016 requirement).** Then
  pr-010 (dashboard paging/rich rows), pr-011/pr-012 (tests-repo takeover), pr-013
  (DESTRUCTIVE cutover — needs Sam's EXPLICIT approval per the plan), pr-014
  (gold-standard). KEY DISCOVERY: the backend already has the full status model +
  notification lifecycle (copy/submit/amend/cancel-amend/soft-delete/paged list) —
  re-scope pr-008..pr-010 against that (check the backend before assuming backend
  build is needed). Backend verification = `mvn verify` (Failsafe ITs), NOT
  `mvn test` (memory `reference-backend-mvn-verify-for-its`). Working rule: run
  headless, make the design calls yourself and flag them after building — do NOT
  gate/checkpoint (memory `feedback-headless-make-calls-dont-gate`).
- `workareas/shared/promotion/HANDOVER.md` — programme intent, system layout,
  standing rulings, agent guard rails (still current except the code now lives at
  `src/server/live-animals/`, not `prototypes/standalone/live-animals/`).
- `workareas/shared/promotion/BACKLOG.json` — the full ruled backlog (superset +
  merge-artifact + sam-review). All the Lane-E-routed items' rulings are in their
  `decision` fields; the promotion increments fold them in by id.
- Memory: `project-promotion-p101-option-e`, `project-model-retrofit-eudpa288-phase7`.

## Sam's binding rulings on the plan (2026-07-24)

1. Target `src/server/live-animals/` + `/notifications/{journeyId}/…` URL family — APPROVED.
2. No real-mode `ACTIVE_JOURNEY` fallback; id-less legacy URLs → dashboard — APPROVED.
3. **Owner identity = Defra ID `sub` + organisation** (composite). Flows through
   canonical fulfilment + both projections; backend enforces.
4. Backend-owned atomic lifecycle over canonical fulfilment + projections; idempotent — APPROVED.
5. **Status/action policy, DELETED visibility, dashboard rows/paging → MIRROR the
   existing skeleton / old `src/server` implementation.** Do not invent; match the
   deployed journey (superset thrust).
6. p-002 (16-value certifiedFor) + p-024 (14-value doc-type) backend enum
   extensions are CONFIRMED release blockers.
7. Two-layer test model — APPROVED (fast canned browser + a11y in the frontend
   repo; real-integration + cross-browser in the tests repo).
8. Cutover: **breaking changes are FINE (not in production)** — no maintenance
   window / legacy-link redirects beyond id-less→dashboard. Full cutover + delete.

## Current state (facts)

- **Branch (cross-repo parity, same name both repos):** frontend + backend are on
  `spike/EUDPA-288-model-retrofit`. The promotion build lands here (pushed after
  each verified increment). Sam's working checkout is
  `repos/trade-imports-animals-frontend` on that branch (auto-ff-pulled after each
  increment — his explicit ruling; keep doing it).
- **Frontend tip:** `b987dbd` (pr-008). **Backend tip:** `8211b7e` (pr-008) — both
  origin + checkouts in sync + backend live in the dev stack (bounced). Landed this
  session: pr-002 (`e2211b7`), pr-003 (`239e100`), pr-004 (`537cd2a`), pr-005 (backend
  `33437cb` + frontend `ff5467a`), pr-006 (`70d850d` + `6d00725`), pr-007 (`435b776` +
  `b195dea`), pr-008 (`8211b7e` + `b987dbd`). Each verified unit + full E2E (backend via
  `mvn verify`: pr-008 = 336 unit + 161 ITs) and ff-pulled into the checkouts. E2E
  baseline: 107 passed / 1 skipped (skeleton-vs-prototype parity retired at pr-005,
  formally replaced at pr-011). FE unit count at pr-008: 1318 passed / 8 skipped.
- **Backend Lane-D worktree (cross-repo builds):** `workareas/promotion-loop/backend`,
  child branch `spike/EUDPA-288-promotion-loop`, mirrors the frontend worktree pattern.
  Cross-repo landing = commit worktree -> push to model-retrofit -> pull the repos/
  checkout -> bounce the stack backend (`scripts/stack/bounce-backend.sh`; dev overlay
  mounts repos/backend/src so the restart recompiles) before running the real-mode E2E.
- **Lane-D worktree (where Codex builds):**
  `workareas/promotion-loop/frontend`, child branch
  `spike/EUDPA-288-promotion-loop`, already `npm ci`'d, at c6ea062. Sam uses
  `repos/` — NEVER write there except the ff-pull.
- **The system now lives at `src/server/live-animals/`** (moved from
  `prototypes/standalone/live-animals/` in pr-001). Routes/URLs still on the old
  `/prototype-standalone/live-animals` prefix behind `FEATURES_PROTOTYPES_ENABLED`
  until pr-002 (URLs) and pr-013 (cutover). The other prototype spikes
  (car-insurance etc.) remain under `prototypes/standalone/`.
- **Verification baselines (MOVE as increments land — re-read the last landed
  item's recorded counts before judging a run):** unit `npm run test:live-animals`
  = **1285 passed / 10 skipped**; E2E `npm run test:prototype` = **108 passed**.
- **Stack:** workspace stack in dev mode; backend built from source on :8085 with
  the option-e `/fulfilments` endpoints. Keep dev mode for real-mode E2E.

## This session's completed work (context)

Ruled + built + landed: p-216 (ratified), p-115 (deleted the stale address
domain gate → !isBlankValue), p-208 (underscore in internal ref), p-207 (contact
create-address link), p-209 (documents all-or-nothing — already enforced, pinned).
PO brief written (`PO-CONVERSATION-BRIEF.md`) + p-207/208/209/010/002/205 ruled.
p-217 raised (multi-tab session bug) → folded into pr-002. Lane E plan produced +
approved. **pr-001 (re-home) landed (c6ea062).**

## The remaining queue — pr-002 .. pr-014 (run in order)

Frontend-only runway first, then backend-dependent:
- **pr-002 (NEXT, XL, p-217):** journey id in every URL (`/notifications/{journeyId}/…`),
  delete the single `ACTIVE_JOURNEY`/`OPENING_RUN` session pointers, request-scoped
  resolver 404s on absent/inaccessible, create endpoint is the only journey
  creator, per-journey opening-run state, document actions load the URL's journey
  before `ownsUpload`. **This CHANGES the URL scheme → it will churn many E2E specs
  (their asserted URLs change) — that spec churn is legitimate; verify each spec's
  INTENT is preserved, don't rubber-stamp. Prove two-tab isolation** (see plan §3
  acceptance). Frontend-only.
- **pr-003:** promoted-chrome error handling + recoverable backend-failure banners
  (p-026+p-035). Frontend.
- **pr-004:** restore full Defra ID auth + signed-in chrome (p-025); remove the
  real-mode STUB_USER fallback. Frontend, but touches the OIDC dance — keep the
  workspace stack + base URL + WELL_KNOWN_HOST_OVERRIDE all on
  host.docker.internal (see memory `project-oidc-single-origin`).
- **pr-005:** backend ownership (sub+org) + owner-scoped paged list API (p-012,
  p-013 foundation). **CROSS-REPO: BACKEND** — coordinate; same branch name both
  repos. Depends on pr-002 + pr-004.
- **pr-006:** Mapper-A-compatible backend enum + projection contracts (p-105,
  p-002, p-024). **CROSS-REPO: BACKEND + PO.**
- **pr-007:** DRAFT/SUBMITTED/AMEND/DELETED status foundation (p-015), mirroring
  the skeleton. **BACKEND + FRONTEND.**
- **pr-008:** read-only submitted view + cancel-amend (p-017+p-018). **BACKEND + FE.**
- **pr-009:** copy-as-new + soft-delete (p-016+p-019). **BACKEND + FE.**
- **pr-010:** owner-scoped paged/sorted dashboard + rich rows (p-013+p-014),
  mirroring the skeleton. **BACKEND + FE.**
- **pr-011:** rename/define the frontend canned browser + a11y layer (p-202+p-203).
- **pr-012:** rewrite `trade-imports-animals-tests` for the promoted service
  (p-201). **CROSS-REPO: TESTS REPO**, same branch name.
- **pr-013:** production route/config/deletion cutover — register real routes,
  `/` = dashboard, remove prototype prefix/flag/banner, prune old webpack entries,
  DELETE the old `src/server/` journey + support (plan §1 lists exact files).
- **pr-014:** gold-standard acceptance + hand off the p-204 docs/skills lane.

When you reach a BACKEND increment, scope the backend side too (mirror the existing
`notification`/`fulfilment` packages; Java/Spring/Mongo, code-first), and batch any
cross-repo/contract decisions to Sam first.

## How to build — the Codex offload pattern

One background Codex run per increment. Write a precise brief to the scratchpad,
pipe via stdin:

```
codex exec -C ~/git/defra/trade-imports-animals/workareas/promotion-loop/frontend \
  -s workspace-write --add-dir <scratchpad-dir> -c model_reasoning_effort="high" \
  -o <scratchpad>/<item>-report.txt < <scratchpad>/<item>-brief.txt \
  > <scratchpad>/<item>-stream.log 2>&1
```

Run via Bash with `run_in_background: true`. Read the `-o` report when it completes.
- **Build briefs:** tell Codex to leave changes UNCOMMITTED; forbid commit/push and
  edits under `workareas/`; tell it to run `npm run test:live-animals` itself and
  iterate to green; `npm run format` last. It cannot run the full E2E (needs the
  stack + free ports) — YOU do that.
- **Read-only briefs** (planning/exploration): tell Codex READ-ONLY, write only to
  the scratchpad, verify the repo stayed clean after. For inputs outside the
  worktree (shared docs), COPY them into the scratchpad first (never `--add-dir` the
  real `workareas/shared/` — that would let Codex write the real backlog).
- Give precise anchors: the plan section, the exact files, the conventions to
  mirror, the behaviour-preserving vs behaviour-changing bar, and the p-115 lesson
  (any new test must exercise the REAL persisted shape, never a fabricated one).
- `-s workspace-write` is the right sandbox. Do NOT use
  `--dangerously-bypass-approvals-and-sandbox` (trips the Bash classifier).
- Occasional first-attempt classifier denials are transient — retry the same command.

## Verification discipline (non-negotiable — a green unit suite is NOT enough)

Per increment: **read the Codex report → read the production diffs yourself (check
for scope creep + that any "corrected" tests are honest, not gutted/masked — this
session caught a Codex attempt that masked a real bug with fabricated fixtures) →
`git status` for files it didn't mention → run the suites YOURSELF:**
- **Unit:** `npm --prefix …/promotion-loop/frontend run test:live-animals` to a
  scratchpad file, read once. Count moves only with justified test changes.
- **Full E2E when runtime is touched:** `docker stop
  trade-imports-animals-trade-imports-animals-frontend-1
  trade-imports-animals-trade-imports-animals-admin-1` (frees 3000/3001) →
  `npm --prefix …/promotion-loop/frontend run test:prototype` to a file → `docker
  start` both. E2E is quick (~50s). Under machine load the SPIKE specs can flake
  non-deterministically (not a regression) — a clean low-worker rerun is the pass.
- **Cross-repo:** cross-check the HTTP contract (FE request body vs backend DTO) by
  inspection in addition to each side's tests.

Then commit + land:
1. **One increment = one commit.** Write the message to a scratchpad file, commit
   with `-F`. End with the Claude co-author + `Claude-Session:` lines **from YOUR
   session's environment** (not the ones in this doc). The frontend pre-commit hook
   re-runs the full suite + lint + build — run in background, it's slow.
2. **ff-push:** `git -C …/promotion-loop/frontend push origin
   spike/EUDPA-288-promotion-loop:spike/EUDPA-288-model-retrofit`.
3. **ff-pull Sam's checkout:** check it's clean + on the branch, then
   `git -C repos/trade-imports-animals-frontend pull --ff-only`.
4. **Mark the pr-item `done`** in `promotion-backlog-items.json` with a one-line
   built+landed note (commit hash, what changed, the unit/E2E counts).
5. Report progress to Sam in one short paragraph; batch any decisions/blockers.

## Guard rails (put in every Codex/subagent brief)

One command per Bash call; no `cd`; no compound commands (no `&&`/`;`/`|`). Tilde
`~/git/defra/trade-imports-animals/…` paths in Bash; absolute paths only for
Read/Edit/Write. No Grep/Glob tools in subagents (use Bash `grep -rn`). No sonar in
loops (defer to a milestone gate). Tests redirected to a scratchpad file, read
once. `npm run format` before finishing. Copy lives in feature folders (boot-gated),
never the model; validation owned by feature folders; names = the notification
model vocabulary; no name-map layers. Paul's branch is upstream-read-only.

## Sonar / open items

- Sonar milestone gate: run `sonar analyze` in `repos/frontend` at a milestone
  (not per-increment). Fix BLOCKER/CRITICAL before those commits.
- Welsh copy is machine-draft + parity-pinned; human translation is a separate
  future item.
- PO conversation list (Sam owns): `PO-CONVERSATION-BRIEF.md` — the p-002 "shout"
  to backend, plus p-207/208/209/205 items.

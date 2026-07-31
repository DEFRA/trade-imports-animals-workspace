# Resume prompt — live-animals PROMOTION BUILD (pr-009 onward)

Paste the block below into a fresh agent to make it the promotion-build orchestrator and
continue the loop. It leans on the durable state files (all current as of pr-008).

---

You are the **orchestrator** of the live-animals PROMOTION build (EUDPA-288). The prototype +
consolidated model is becoming the real frontend; Codex is the implementor (Sam is near Claude
limits — offload build work to Codex; you orchestrate, verify, commit, push, pull). You run
**headless**.

## PRIME DIRECTIVE — KEEP THE LOOP RUNNING. DO NOT STOP.

Run increment after increment without pausing. Do **NOT** stop to report milestones, do **NOT**
ask "should I continue", do **NOT** gate design decisions. Make the call yourself and **flag it
after** the increment lands. The ONLY hard stop is **pr-013** (the destructive production cutover
+ old-journey deletion), which the plan requires Sam to explicitly approve — pause only there.
Everything before pr-013 (pr-009, pr-010, pr-011, pr-012) you build straight through. If a
decision is genuinely contested AND irreversible, still prefer deciding + flagging over stopping.
(Memory: `feedback-headless-make-calls-dont-gate`.)

## Read first (durable state — all current, don't re-derive)

- `workareas/shared/promotion/ORCHESTRATOR-HANDOFF.md` — the live orchestrator doc: current tips,
  next increment, the Codex offload pattern, cross-repo mechanics, verification discipline, guard
  rails, Sam's binding rulings.
- `workareas/shared/promotion/promotion-backlog-items.json` — the build queue pr-001..pr-014 with
  a filled `decision` field on each landed item (pr-001..pr-008 = done). This is your status
  tracker + the running record of every design call already made.
- `workareas/shared/promotion/PROMOTION-PLAN.md` — the approved plan + Sam's 8 rulings.
- Memory: `feedback-headless-make-calls-dont-gate`, `reference-backend-mvn-verify-for-its`,
  `project-promotion-p101-option-e`, `project-model-retrofit-eudpa288-phase7`.

## Current state (facts)

- **pr-001..pr-008 = DONE + landed + verified.** Next = **pr-009** (copy-as-new + soft-delete).
- **Frontend tip:** `b987dbd`. **Backend tip:** `8211b7e`. Both on `spike/EUDPA-288-model-retrofit`,
  origin + Sam's checkouts (`repos/trade-imports-animals-frontend`, `repos/trade-imports-animals-backend`)
  in sync, backend live in the dev stack (bounced).
- **Worktrees you build in (never write to `repos/` except the ff-pull):**
  - Frontend: `workareas/promotion-loop/frontend`, child branch `spike/EUDPA-288-promotion-loop`.
  - Backend: `workareas/promotion-loop/backend`, child branch `spike/EUDPA-288-promotion-loop`.
- **E2E baseline: 107 passed / 1 skipped** (the skeleton-vs-prototype parity spec is retired,
  formally replaced at pr-011). Frontend unit at pr-008: 1318 passed / 8 skipped. Backend:
  `mvn verify` = 336 unit + 161 Testcontainers ITs.
- **KEY DISCOVERY:** the backend already had the full status model + notification lifecycle
  (copy/submit/amend/cancel-amend/soft-delete/paged list). So pr-009/pr-010 are mostly: add the
  missing operation on the CANONICAL FULFILMENT (mirroring the notification) + wire the frontend.
  Always read the backend before assuming backend build is needed.

## The loop, per increment (this is exactly how pr-002..pr-008 were done)

1. **Scope** the increment yourself: read the relevant backend + frontend code. Decide the design
   points (mirror existing / plan-consistent). For cross-repo work the backend defines the
   contract first.
2. **Brief Codex** precisely (write the brief to YOUR scratchpad, pipe via stdin):
   ```
   codex exec -C ~/git/defra/trade-imports-animals/workareas/promotion-loop/<frontend|backend> \
     -s workspace-write --add-dir <your-scratchpad-dir> -c model_reasoning_effort="high" \
     -o <scratchpad>/<item>-report.txt < <scratchpad>/<item>-brief.txt \
     > <scratchpad>/<item>-stream.log 2>&1
   ```
   Run via Bash `run_in_background: true`. Brief tells Codex: leave changes UNCOMMITTED; no git; no
   `workareas/` edits; run its own tests to green (`npm run test:live-animals` for FE, **`mvn -f
   <pom> verify`** for BE — NOT `mvn test`, ITs are Failsafe); `npm run format` last for FE. Give
   precise anchors + the p-115 lesson (new tests must exercise the REAL persisted shape).
3. **Verify yourself** (a green Codex run is NOT enough — every pr caught real Codex slips):
   read the report → read the production diffs (scope creep? gutted/masked tests?) → `git status`
   → run the suites: FE `npm --prefix .../promotion-loop/frontend run test:live-animals`; BE
   `mvn -f .../promotion-loop/backend/pom.xml verify`; **full E2E** when runtime touched: `docker
   stop trade-imports-animals-trade-imports-animals-frontend-1
   trade-imports-animals-trade-imports-animals-admin-1` → `npm --prefix .../promotion-loop/frontend
   run test:prototype` → `docker start` both. Read test-results/*/error-context.md on E2E fails.
   Fix any Codex slip yourself (small remediations are fine) + flag it.
4. **Land** (cross-repo = backend FIRST): commit the worktree (`-F` msg file; end with the Claude
   co-author + `Claude-Session:` lines from YOUR session; FE pre-commit hook re-runs suite+lint+build,
   run in background — if it fails on prettier, `npm run format` + re-stage + recommit) → `git push
   origin spike/EUDPA-288-promotion-loop:spike/EUDPA-288-model-retrofit` → check the `repos/` checkout
   is clean + on-branch, `git -C repos/... pull --ff-only` → for BACKEND changes, bounce the stack:
   `~/git/defra/trade-imports-animals/scripts/stack/bounce-backend.sh` (dev overlay mounts
   repos/backend/src so the restart recompiles) BEFORE the real-mode E2E.
5. **Record**: set the pr-item `status: "done"` + a full `decision` note (commits, what changed,
   the counts, every design call flagged) in `promotion-backlog-items.json`; update the tips +
   "next" pointer in `ORCHESTRATOR-HANDOFF.md`. Then **immediately start the next increment** — do
   not stop.

## Guard rails (put in every Codex brief)

One command per Bash call; no `cd`; no `&&`/`;`/`|`. Tilde `~/git/defra/...` paths in Bash; absolute
paths only for Read/Write. No Grep/Glob tools in subagents. No sonar in the loop. Tests to a
scratchpad file, read once. FE `npm run format` before finishing. Copy lives in feature-folder
copy.*.js (never the model); journeyId in every URL (pr-002); owner via `session.owner` +
X-Owner-Id/X-Owner-Organisation headers (pr-005); status = DRAFT/SUBMITTED/AMEND/DELETED (pr-007);
Mapper A/B + LIVE_ANIMALS_MAPPER boundary preserved. `-s workspace-write` (never
`--dangerously-bypass...`). Occasional first-attempt classifier denials are transient — retry.

## Next: pr-009 (copy-as-new + soft-delete, p-016 + p-019)

The NOTIFICATION already has `copyNotification` + `softDeleteNotification` (-> DELETED). The
CANONICAL FULFILMENT does NOT. So:
- **Backend (worktree):** add fulfilment `copy(id, owner)` — creates exactly ONE new owned DRAFT
  copied from the source (owner-enforced source read); must be **idempotent** (a safe retry must
  not create duplicate copies — p-016's core requirement; decide the idempotency key, e.g. a
  client-supplied idempotency token or dedupe, and flag it). Add fulfilment `softDelete(id, owner)`
  -> DELETED (terminal; already excluded from the owner list by pr-007's `findAllBy...StatusIn`).
  New endpoints POST /fulfilments/{id}/copy + /fulfilments/{id}/soft-delete, owner headers, 200/400/404.
  Gate on `mvn verify`.
- **Frontend:** CSRF-protected copy + delete actions on the dashboard/read-only view (status-gated
  per the transition table: copy from DRAFT/SUBMITTED/AMEND; delete from DRAFT/SUBMITTED). Copy ->
  redirect to the new journey's URL even on a safe retry. Delete -> confirmation + soft-delete +
  remove from the dashboard. Success/failure banners in promoted chrome (reuse pr-003
  recoverableSave). records.copy/softDelete in facade+real+stub; engine wiring owner+known gate.
  Mirror the skeleton's action gating (Sam ruling #5).
Then pr-010 (owner-scoped paged/sorted dashboard + rich rows), pr-011/pr-012 (tests-repo takeover,
same-name branch), pr-013 (**STOP for Sam's explicit approval** — destructive cutover + delete the
old src/server journey), pr-014 (gold-standard acceptance).

Start pr-009 now. Keep going.

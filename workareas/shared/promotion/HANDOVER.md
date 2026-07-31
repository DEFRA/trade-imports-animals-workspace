# Promotion programme — handover pack

Written 2026-07-22 at the end of the retrofit/review/i18n/style sessions, for
fresh agents. Sam's intent, verbatim essence: **the prototype + consolidated
model becomes the real thing; the existing frontend gets nuked** — after
(a) verifying the new journey is a superset of the current one, (b) scrubbing
the codebase of anything that only exists because two branches were merged,
and (c) Sam's own thorough review, run through a voice-captured backlog with
an implementor loop consuming it.

## State of the world (facts a fresh agent needs)

- **The branch:** `spike/EUDPA-288-model-retrofit`, tip `190661c`, pushed.
  Checked out in `repos/trade-imports-animals-frontend` (Sam's working
  checkout — IntelliJ, stack dev-mode). Sam's address-book work is parked
  clean on `feat/EUDPA-58-address-book` @ d3d85b5.
- **The system under promotion:** `prototypes/standalone/live-animals/` in
  that repo. Layout: `model/` (the vendored-then-owned obligation model +
  evaluator + derivation engine + reachability prover), `bridge/` (adapter:
  answers↔fulfilments, scope/status projection — **merge-born, see Theme B**),
  `flow/` (dispatch/gates/task-rows/navigation), `engine/` (journey
  read/write/persistence), `features/<page>/` (page-owned controllers +
  hand-written njk + per-feature `copy.en.js`/`copy.cy.js`), `services/`
  (canned MDM reference data + real-mode clients), boot guards
  (`obligation-purity.js`: no-display-keys + model import boundary;
  `buildDispatch` ownership totality; write-time unrecognised-key guard).
- **Verification baseline:** unit `npm run test:live-animals` → 1229 passed /
  11 skipped. E2E `npm run test:prototype` → 105/105 incl. the Mongo parity
  spec. E2E needs the workspace stack up (dev mode: `tim docker dev`) and
  ports 3000/3001 free (`docker stop` the stack's frontend+admin containers,
  restart after). Full-suite + lint runs on every commit via the pre-commit
  hook.
- **The old frontend** (the thing to eventually nuke): `src/server/` in the
  same repo — the deployed notification journey the prototype deliberately
  mirrors (field vocabulary, canned data, Mongo notification shape via
  `services/persistence/records/notification-mapper.js`). The parity E2E
  compares the two journeys' persisted DRAFT notifications.
- **Spec sources:** Confluence "Live Animals Data Fields V4" (page
  6497338582); the journey-builder machinery (`.claude/skills/journey-builder`
  in the workspace) with its `journey-spec.json` + `conflicts.json`
  conventions under `workareas/journey-builder/EUDPA-249/`.
- **Standing rulings that bind all lanes** (full log:
  `workareas/shared/model-retrofit-review/REMEDIATION-BACKLOG.md`):
  copy lives in feature folders, never the model (boot-gated); validation is
  owned by feature folders; names = the notification model's vocabulary;
  no name-map/mapper layers — "the third way stands on its own"; Paul's
  branch is upstream-read-only; unit-count === numberOfAnimals invariant is
  intentional; pipelines are not the readability bar — named case-helpers
  are; comments near-bare, no process references.
- **Agent guard rails (non-negotiable, put in every subagent prompt):** one
  command per Bash call, no cd, no compound commands; tilde `-workspace`
  paths in Bash, absolute paths only for Read/Edit/Write; no Grep/Glob tools
  in subagents (Bash `grep -rn`); no sonar in loops; tests redirected to a
  scratchpad file and read once; `npm run format` before finishing; commit
  messages end with the Claude co-author line.

## The shared backlog (all themes feed one queue)

`workareas/shared/promotion/BACKLOG.json` — schema in the file. Rules:
- Analysis lanes and the voice companion APPEND items (never edit others').
- `type: conflict` and `type: question` start at `blocked-on-sam` — the
  implementor NEVER touches them until `decision` is filled.
- Exactly ONE implementor loop consumes `status: todo` items. Single-writer:
  no other agent edits the branch while the loop runs.

## Dependency map — what runs in parallel, what must be sequential

```
PARALLEL (read-only, start all three immediately):
  Lane A  Superset verification  ──┐
  Lane B  Merge-artifact review  ──┼──▶  BACKLOG.json  ──▶  SEQUENTIAL:
  Lane C  Sam's voice review     ──┘         │              Lane D implementor loop
                                             │              (single writer, serial
                                     Sam rules on           increments, verified
                                     blocked-on-sam         commits, ff+push)
                                             │
SEQUENTIAL, GATED LAST:                      ▼
  Lane E  Promotion plan + nuke  — only after A's conflicts are all ruled and
          B's structural decisions are made (they change what gets promoted).
```

Why: A, B, C never write code, so they can't collide. D is the only writer;
it works in its own worktree on a child branch (Sam is using `repos/` — never
write into his checkout) and fast-forwards + pushes `spike/EUDPA-288-model-
retrofit` after verified commits, exactly the loop proven this week. E
re-plans whatever A/B decisions changed, so starting it early wastes work.

---

## PROMPT — Lane A: superset verification against the existing frontend

> You are the SUPERSET-VERIFICATION lane of the promotion programme. The
> prototype at `prototypes/standalone/live-animals/` (branch
> `spike/EUDPA-288-model-retrofit`, checked out in
> `repos/trade-imports-animals-frontend`) is intended to REPLACE the existing
> frontend at `src/server/` in the same repo. Before the old one is nuked,
> verify the new journey is a SUPERSET of the current one. Read
> `workareas/shared/promotion/HANDOVER.md` first for context and guard rails.
>
> METHOD — journey-builder-style digest, applied to the CURRENT `src/server`
> journey as the source of truth for "what exists today": walk every route,
> controller, schema, template and client under `src/server/` (and its Mongo
> notification shape) and produce a behavioural inventory: pages, fields,
> validation rules, conditional logic, persistence semantics, statuses,
> integrations (address book, document upload/scan, defra-id auth, amend/
> copy/cancel/delete flows, dashboards). Follow the conventions of
> `.claude/skills/journey-builder` (spec + conflicts JSON shapes) and the
> existing digests under `workareas/journey-builder/EUDPA-249/` — reuse their
> format, do not invent a new one. Then compare against the prototype:
> for every current behaviour, classify SUPERSET-OK (new does it, possibly
> better), ADDITIVE-DELTA (new adds something — fine, list only), or
> **CONFLICT** (current does something the new journey does not, or does
> differently in a non-additive way — e.g. auth, amend flows, dashboard
> actions, upload scanning semantics, field-level validation differences).
> Fan out sub-agents per area if useful; verify every claim with file:line
> on BOTH sides.
>
> OUTPUT: write the inventory + comparison to
> `workareas/shared/promotion/superset-report.md`, and APPEND one item per
> CONFLICT to `workareas/shared/promotion/BACKLOG.json` (theme "superset",
> type "conflict", status "blocked-on-sam", evidence both-sided). Do NOT
> resolve conflicts, do NOT modify any code. Sam decides every conflict.
> Known-expected conflicts to check rather than assume: the prototype has
> auth disabled by design (mirror ruling), lists notifications unscoped
> (known security gap ticket), unit-count===numberOfAnimals is deliberately
> STRICTER than the current journey (ruled — additive-strict, not a
> conflict), and the old journey's accompanying-documents has no separate
> type field while the new derives type from filename (ruled).

## PROMPT — Lane B: merge-artifact review ("the only thing that ever existed")

> You are the MERGE-ARTIFACT review lane of the promotion programme. The
> live-animals prototype (branch `spike/EUDPA-288-model-retrofit`,
> `prototypes/standalone/live-animals/`) is the merger of two lineages: a
> page-owned frontend (A) and an obligations model+engine (B), unified over
> several increments. Sam's requirement: **the codebase should read as if it
> were the only thing that ever existed** — no structure, indirection or
> vocabulary that exists purely because two branches were merged. Read
> `workareas/shared/promotion/HANDOVER.md` first for context and guard rails.
>
> For each suspect, answer from first principles: "if this system had been
> designed from scratch — page-owned controllers over this obligation model —
> would this exist?" If no: propose the from-scratch shape, the migration
> cost, and the tension. SEED SUSPECTS (verify, don't assume; find more):
> - `bridge/` as a concept (created mid-merge as the A↔B adapter):
>   `bridge/fulfilments.js` `answersToFulfilments`/`fulfilmentsToAnswers` —
>   exists because A stores nested name-keyed answers while the evaluator
>   wants flat UUID-keyed fulfilments. From-scratch alternative: store
>   answers in the evaluator's shape (or make the evaluator accept the
>   stored shape) and delete the translation. Big blast radius (session/
>   Mongo persistence shapes, notification-mapper, E2E fixtures) — genuine
>   design decision for Sam, not a mechanical fix.
> - `bridge/fulfilments.js` VOCAB normalisation (camel↔kebab, name↔CN-code,
>   port-prefix strip): exists only because the two lineages named values
>   differently. From-scratch: one vocabulary end-to-end (ruling says the
>   notification model's). Check whether the manifest's gate constants could
>   simply BE the stored vocabulary, killing the regex bridging + the
>   vocab-coverage guard.
> - `flow/obligation-source.js` (registry→manifest walk adapter, ENFORCED_AT_
>   CONTINUE, SYSTEM_POPULATED, FLOW_ONLY_OBLIGATIONS): which parts are
>   inherent config vs adapter residue?
> - `engine/readiness-config.js` boot-injection (a cycle-breaker between
>   bridge/scope and flow/section-status created during the merge): would a
>   from-scratch layering need it?
> - `model/engine/is-blank-value.js` vs the deleted lib/answered semantics;
>   `model/` still shaped as "vendored tree" (PROVENANCE.md, DESIGN-DELTA.md,
>   the import-boundary guard's model/-is-special stance) — the upstream
>   branch is dead as a vendor source now; does the vendored-tree framing
>   (and those two .md files) still earn its keep?
> - `retrofit/` dir + `retrofit/path-prefix-depth.test.js` (a pinned test
>   "SKIPPED UNTIL inc-006" from a plan that no longer exists).
> - `services/persistence/records/notification-mapper.js` target-vs-direct
>   dual mapping paths; `services/commodities` duplicate allowlists (pinned
>   by allowlist-drift.test.js — should one side collapse?).
> - Naming residue: anything still named bridge/oracle/A/B/retrofit/vendored
>   in identifiers, file names, or test names; `engine/*-under-b.test.js`
>   file names; "third way" phrasing.
> - Paul's engine exports with no composite consumer (pageStatus/
>   containerStatus/journeyState/firstUnfulfilled* — kept "pre-existing
>   policy"; from-scratch they wouldn't exist here).
> OUTPUT: a report at `workareas/shared/promotion/merge-artifact-report.md`
> + APPEND items to `workareas/shared/promotion/BACKLOG.json` (theme
> "merge-artifact"): mechanical scrubs as type "refactor" status "todo";
> structural decisions (answers-shape, bridge existence, model/-framing) as
> type "question" status "blocked-on-sam" with options + recommendation.
> Do NOT modify code. Analysis only, file:line everything.

## PROMPT — Lane C: voice review companion (run while Sam reviews)

> You are Sam's REVIEW COMPANION for the live-animals promotion. He is
> reviewing the code in `repos/trade-imports-animals-frontend` (branch
> `spike/EUDPA-288-model-retrofit`) and talking to you, ideally via voicemode
> conversation (use the voicemode converse skill; his messages may be
> dictated — ask when something reads oddly). Read
> `workareas/shared/promotion/HANDOVER.md` for context. Your ONLY job:
> (1) answer his questions about the code — read files, give grounded
> answers with file:line, honestly including "that's merge residue" when it
> is; (2) capture every actionable thing he says into
> `workareas/shared/promotion/BACKLOG.json` — APPEND items (theme
> "sam-review"), his refactors/fixes as type "refactor" status "todo" with
> enough detail that an implementor with no conversation context can act;
> his open questions as type "question" status "blocked-on-sam"; his
> decisions on existing blocked-on-sam items go into that item's `decision`
> field and flip it to "todo" (or "rejected"). (3) NEVER implement anything
> yourself — no code edits, ever; the implementor loop owns the branch.
> Confirm each capture back to him in one short sentence.

## PROMPT — Lane D: implementor loop (single writer, start after items exist)

> You are the IMPLEMENTOR LOOP for the live-animals promotion backlog. Read
> `workareas/shared/promotion/HANDOVER.md` fully — state of the world, guard
> rails, verification baseline. The queue is
> `workareas/shared/promotion/BACKLOG.json`. Rules of the loop (proven this
> week; keep them): work in your OWN git worktree on a child branch cut from
> `spike/EUDPA-288-model-retrofit` (Sam uses `repos/` — never write there;
> `git -C repos/trade-imports-animals-frontend worktree add -b
> spike/EUDPA-288-promotion-loop <workarea path> spike/EUDPA-288-model-
> retrofit`, then npm ci). Loop: pick the LOWEST-id item with status "todo"
> (never "blocked-on-sam") → mark "in-progress" → spawn one implementor
> subagent for it (Sonnet for mechanical items, default model for structural
> ones; subagent does NOT commit) → verify yourself: unit suite green
> (baseline 1229/11 — moves only with justified test changes), plus the E2E
> suite when the item touches runtime behaviour (tim docker dev stack, ports
> dance) → commit (one item = one commit, style of the existing history) →
> mark "done" (or "rejected" with a reason if it shouldn't be done — tell
> Sam) → fast-forward `spike/EUDPA-288-model-retrofit` in a temporary
> operation and push, so Sam's checkout can pull → next item. If an item
> turns out to need a ruling, flip it to "blocked-on-sam" and move on. Never
> resolve conflicts/questions yourself. Report progress after each item in
> one short paragraph.

## PROMPT — Lane E: promotion plan (LAST — gated on A's rulings + B's decisions)

> You are the PROMOTION PLANNER. Precondition (verify before doing anything):
> `workareas/shared/promotion/BACKLOG.json` has NO remaining
> "blocked-on-sam" items from themes "superset" or "merge-artifact" — if it
> does, stop and say so. Read `workareas/shared/promotion/HANDOVER.md` and
> `superset-report.md`. Plan (do not execute) the promotion: the prototype
> at `prototypes/standalone/live-animals/` becomes the real frontend; the
> existing `src/server/` journey is DELETED. Cover: target layout (does
> live-animals move to src/, or does src/server content die in place and
> routes repoint); auth (the prototype runs AUTH_ENABLED=false by mirror
> ruling — promotion must restore real defra-id auth + per-user scoping,
> incl. the known unscoped-notifications security gap); persistence cutover
> (real-mode records/session are already backend-backed — what of the old
> journey's data/config remains); config/deploy (webpack entries, CDP
> pipeline, healthchecks, FEATURES_PROTOTYPES_ENABLED flag retired); the
> tests-repo takeover (its e2e/a11y/cross-browser suites target the old
> journey today — they must be repointed/rewritten, coordinate via the tests
> repo, same-name branches per workspace rules); what happens to the
> in-repo prototype E2E suite; and the increment-shaped backlog for all of
> it in the same BACKLOG.json (theme "promotion", status "todo", ordered).
> Output: `workareas/shared/promotion/PROMOTION-PLAN.md` + the backlog
> items. Sam reviews the plan before any increment runs.

---

## Orchestrator running notes (2026-07-22)

- Sam's ruling on visibility: after each verified Lane D commit
  (worktree → verify → commit → ff `spike/EUDPA-288-model-retrofit` →
  push), the orchestrator ALSO fast-forward-pulls Sam's checkout
  (`git -C repos/trade-imports-animals-frontend pull --ff-only`) so each
  item appears in IntelliJ as one clean commit. Only ff pulls — check the
  checkout is clean and on the branch first; never any other write there.
- Lane D worktree: `workareas/promotion-loop/frontend`, branch
  `spike/EUDPA-288-promotion-loop`.
- Verification baseline MOVES as items land — always re-read the last
  landed item's recorded count before judging a suite run. History:
  1230/11 (start) → 1187/11 at p-102 (ruled deletions) → 1140/11 at
  p-104 (dead flow API) → 1148/11 at p-004 → 1149/11 at p-007 →
  1151/11 at p-008. E2E baseline unchanged throughout: 105/105.
- Landed by the loop (branch `spike/EUDPA-288-model-retrofit`):
  p-001 typeOfCommodity emit (4264d40), p-003 transport enum (576a283),
  p-024 doc-type enum codes (dfd00bc), p-102 one-vocabulary (174c04f),
  p-103 lineage-doc removal (ddda979), p-104 dead-export removal
  (cb39ec8), p-004 CPH 9-digit rule (615dc00), p-006 10MB upload cap
  (fc71d70), p-007 country block filter (5cece5d). All ff-pushed +
  pulled into Sam's checkout.
- E2E runs need the backend on :8085. The stack's backend container has
  dropped out twice — `tim docker dev` brings it back; the suite's own
  preflight (`check:workspace-stack`) catches it before a 180s timeout.
- E2E FLAKINESS under machine load: the prototype suite runs 8 Playwright
  workers by default; when the machine is loaded (macOS daemons + the
  Docker VM can push load avg >15 on their own) the car-insurance
  obligations + nested-drivers SPIKE specs time out non-deterministically
  (toBeVisible 15s), different specs each run. This is NOT a code
  regression — confirmed twice by re-running the same specs in isolation
  green with and without the change under test. Mitigations: `-- --workers=2`
  for a deterministic signal under load; check `uptime` and
  `ps -eo pid,pcpu -r | head` if a run hangs (look for a stale `node .`
  prototype server squatting a port — kill it, it also makes parity reuse
  a stale build). A clean run at low worker count is the pass.
- Landed since the p-102 note: p-103 lineage docs (ddda979), p-104 dead
  exports (cb39ec8), p-004 CPH 9-digit (615dc00), p-006 10MB cap
  (fc71d70), p-007 country filter (5cece5d), p-008 transit mandatory,
  p-211 parity-harness paginate fix, p-020/p-021 client JS bundle, p-022
  remove-by-POST, p-023 file download. Unit baseline climbed to 1186/11
  (pre p-027). Superset conflict rulings: batches 1-5 all ruled — most
  routed to Lane E as promotion-theme (auth/lifecycle/dashboard), a few
  built (p-004/006/007/008/020/021/022/023/027), a few ratified-as-is
  (p-005 58-char, p-009 12-cap, p-011 unweaned gate). Follow-ups raised:
  p-212 (two more destructive-GET routes), p-213 (scan poll actions cell).

## MILESTONE 2026-07-23: ruled queue COMPLETE

Every ruled backlog item is built + landed + verified (unit + full E2E
where runtime, on `spike/EUDPA-288-model-retrofit`, pulled into Sam's
checkout). Backlog: 34 done, 22 rejected (Lane-E-routed / no-code-change
rulings), 0 todo, 0 in-progress. E2E baseline 107/107; unit 1197/11.
The branch is promotion-ready: superset-verified, merge-residue scrubbed,
resilience/parity/security fixes in, commodityType on real MDM data,
blank semantics unified (Paul), docs current.

10 items remain blocked-on-sam — NONE are code the loop can do; all need
Sam / Paul / PO / a data spike:
- **p-101** (bridge answers-shape) — Sam reads the refreshed
  `decision-docs/p-101-answers-shape.md` and rules. THE gate on Lane E.
- **p-115** (dual-key bug) — deferred to p-101 (p-106 now ruled, so it
  only waits on p-101).
- **p-216** — Cow type-select UX (default-show-all vs strict-hide).
- **p-201/202/203** — tests-repo + canned-data-test-placement (Lane E
  planning inputs).
- **p-204** — docs + custom-skills theme (gated on gold standard).
- **p-207/208/209** — rescued V4 conflicts for the PO conversation.

NEXT PHASE = Lane E (promotion plan), unblocked once p-101 is ruled. Its
prompt is below; it plans (not executes) auth restoration, the lifecycle
flows (amend/copy/cancel-amend/delete/read-only-view/status-model — the
p-014..p-019 + p-035 cluster all routed here), dashboard paging/rows,
error handling, config/deploy cutover, and the tests-repo takeover.
PO-conversation list to carry into Lane E / the PO: p-207/208/209,
p-010 (arrival datum), p-002 (certifiedFor enum), the c-037 pack
(`decision-docs/p-205-commodity-type-data.md`). Optional data spike:
backfill real cat/dog/fish (01061900/0301) commodity types by running
the ipaffs commoditycode microservice join (validated method + the two
known fixtures already reproduced in `commodity-type-data/method.md`).

## Codex offload (2026-07-23, Sam approaching Claude limits)

Implementor tasks now run on Codex, not Claude subagents, to save Claude
tokens. Orchestration (verify/commit/push/pull, backlog, rulings) stays
on Claude — it is light. Proven working command (first task p-106):

```
codex exec \
  -C ~/git/defra/trade-imports-animals-workspace/workareas/promotion-loop/frontend \
  -s workspace-write \
  --add-dir <scratchpad-dir> \
  -o <scratchpad>/<item>-codex-report.txt \
  < <scratchpad>/<item>-brief.txt \
  > <scratchpad>/<item>-codex-stream.log 2>&1
```
Run it via Bash with `run_in_background: true` (it is synchronous + long).
Read the `-o` report file when it completes; verify EXACTLY as for a
Claude subagent (git status = only intended files; read the diff; run
unit + full E2E yourself; commit only on green). Notes:
- `-s workspace-write` is the right sandbox (hard-limits Codex to the
  worktree). Do NOT use `--dangerously-bypass-approvals-and-sandbox` — it
  trips the Claude Bash safety classifier.
- Write the implementor brief to a scratchpad `.txt` and pipe via stdin
  (`< brief`) — cleaner than a giant shell arg. Same brief content /
  guard rails as a Claude subagent prompt.
- Single-writer still holds: one Codex task at a time on the worktree;
  the next waits until the current is committed.
- Occasional first-attempt classifier denials are transient — retry the
  same command.

## Open items inherited from previous sessions (don't lose)

- Sonar milestone gate — Sam runs `sonar analyze` in `repos/frontend`.
- Welsh: human translation + locale switch + date formatting, when
  commissioned. Machine-draft `copy.cy.js` is parity-pinned.
- Paul/PO: Confluence page amendments (documents 0..10); FYI that c-017/
  c-038 were reversed his way.
- Possible a11y leg for the prototype E2E (offered, undecided) — fold into
  Lane E's tests-repo takeover thinking rather than doing it twice.

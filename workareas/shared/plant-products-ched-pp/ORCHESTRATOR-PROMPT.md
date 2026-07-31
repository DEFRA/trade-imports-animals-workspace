# Orchestrator prompt — plant-products/CHED-PP journey-builder plan (overnight, autonomous)

> Paste everything below the line into a fresh agent. It is self-contained. It runs headless
> (Sam is asleep — **never ask a question**; make the call, log it, keep going).

---

You are the **orchestrator** for an overnight planning run. You do not implement — you spawn
workflows and subagents, read their results, decide the next step, and synthesise. Your single
deliverable is **a very detailed, journey-builder-ready plan to build `plant-products/ched-pp` as a
sibling of the `live-animals` set** — frontend (obligation-model sibling set) + backend (new
`/plant-products/` schema and endpoints) — grounded in the already-mined CHED-PP requirements.

This is a **proof-of-concept planning** run. Produce the PLAN (and the concrete backend schema as a
compilable artefact). Do **not** attempt to build the full frontend journey tonight.

## Operating mode (non-negotiable)

- **No questions. Ever.** Sam is asleep. When you hit a design fork, decide it yourself using the
  ground-truth docs, implement/record the decision, and append a 3–4 sentence entry to
  `WHEN-YOURE-BACK.md` (path below). Bias to the simplest option that honours the CHED-PP rulings and
  the live-animals architecture. (Memory: *headless — make calls, flag after; don't gate.*)
- **Parent orchestrates, never implements.** Keep your own context clean. Push real work into
  workflows/subagents. On a subagent failure, re-spawn with corrective notes — never pull the work
  into your own turn. (Memory: *parent orchestrates, never implements.*)
- **Commit + push progress at every phase boundary** so nothing is lost if you die. Conventional
  messages, `spike/trace-to-requirements` branch, co-author trailer
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Maintain `WHEN-YOURE-BACK.md`** continuously — newest on top, every decision + every thing Sam
  must look at, 3–4 sentences each. This is the first thing Sam reads.
- Keep going until the Definition of Done is met, then write the final summary to `HANDOVER.md` and
  stop. Chain workflows: kick one, await its completion notification, read results, kick the next.

## State already set up for you (do not redo)

- Workspace repo `~/git/defra/trade-imports-animals` is on **`spike/trace-to-requirements`**, which
  now contains the merged EUDPA-288 model-retrofit platform + the `frontend-change` skill
  (`.claude/skills/frontend-change/SKILL.md`) + the whole `workareas/shared/promotion/` obligation-
  model corpus. Pushed (tip after merge = `9bf907b`).
- Frontend repo `repos/trade-imports-animals-frontend` and backend repo
  `repos/trade-imports-animals-backend` are both on **`spike/trace-to-requirements`**, cut off
  `spike/EUDPA-288-model-retrofit`, pushed with upstreams set.
- Your output workarea already exists: `workareas/shared/plant-products-ched-pp/` (contains
  `WHEN-YOURE-BACK.md` seeded, and this prompt). It's under `shared/` so it's tracked and pushes.

## Ground truth — read before planning (assign to Phase-A recon agents, don't read all yourself)

**CHED-PP requirements (the WHAT):** `workareas/shared/trace-requirements/ched-pp/` —
`RULINGS.md` (the 8 conflict rulings + first-pass scope: DoA out, CUC in, cloning out),
`backlog.json` (42 increments; 5 unblocked / 5 deferred; `scopeDecisions` + per-increment `ruling`),
`journey-spec.json` (39 pages, 354 fields), `target-model.md` (proposed JSON doc shape),
`conflicts.json`, `integrations.md`, `authorization-rules.md`, `pages/*.json`.

**Frontend platform (the HOW, frontend):** in `repos/trade-imports-animals-frontend/src/server/app/` —
`docs/architecture.md` (L1–L4), the `frontend-change` skill (`.claude/skills/frontend-change/SKILL.md`),
and the live-animals recipe suite `sets/live-animals/docs/` (`add-a-field.md`, `add-a-page.md`,
`add-a-section.md`, `add-a-collection.md`, `obligation-model.md`, `journey-flow-and-gates.md`,
`features.md`, `services.md`, `testing.md`, `limits.md`, `README.md`). The set lives at
`sets/live-animals/{obligations,journeys,services,docs}`; `plant-products` will be a **sibling set**
under `sets/`. L2 (`app/{engine,model,bridge,flow,...}`) is set-agnostic and wired via `configure*`
seams in `app/routes.js`. Dependency-cruiser (`npm run lint:arch`) enforces the layering.

**Obligation-model + gold standard (the design intent):** `workareas/shared/promotion/` —
`GOLD-STANDARD-ACCEPTANCE.md`, `PROMOTION-PLAN.md`, `RESTRUCTURE-ANALYSIS.md`,
`decision-docs/p-101-option-e-plan.md` (fulfilment as canonical source), and
`workareas/shared/EUDPA-288/notification-shape-persistence-analysis.md` (persistence shape).

**Backend animals model (the HOW, backend — inspiration for the new schema):** in
`repos/trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/` —
`notification/` (`Notification extends NotificationBase`, `@Document(collection="notification")`,
`NotificationController` at `@RequestMapping("/notifications")`, plus `Commodity`,
`CommodityComplement`, `Species`, `Operator`, `Origin`, `Transport`, `AdditionalDetails`,
`ReferenceNumberGenerator`, `NotificationStatus`, repositories, mappers, DTOs), and `fulfilment/`
(`@RequestMapping("/fulfilments")`). Public records carry compact-constructor null guards
(house rule). REST is noun-based (Zalando) — no action paths.

## The plan-production workflow architecture

Run these as **separate `Workflow` calls** (you stay in the loop between them; read each result,
update `WHEN-YOURE-BACK.md`, commit, then launch the next). Fan out inside each. Default to
`pipeline()`; use a barrier only when a stage genuinely needs all prior results.

**Phase A — Recon & foundations (parallel readers → structured maps).** Fan out ~4 agents:
(1) frontend platform + how to stand up a sibling set (the `configure*` seams, obligations manifest
shape, journeys/linear flow+features, what a new set MUST provide); (2) the 4 frontend recipes +
obligation-model/flow-gate docs distilled into a reusable "recipe cheat-sheet"; (3) backend animals
notification model + persistence + REST, as a field-and-type inventory; (4) CHED-PP requirements
re-load — the unblocked m0–m4 increments, the target-model, the rulings. Each returns a structured
JSON/markdown map saved under `plant-products-ched-pp/recon/`.

**Phase B — Backend schema design (concrete artefact).** One design workflow: derive a **new
plant-products notification schema** from the CHED-PP pages/target-model, using the animals
`Notification` model as inspiration (mirror the shape; rename/extend for plants — commodity →
species → variety/class nesting, phytosanitary docs, BCP/inspection-premises transport, CUC billing).
Decide the sub-path (`/plant-products/notifications` mirroring `/notifications`) and the Mongo
collection name. Then WRITE it as compilable Java records in a **new package**
`uk.gov.defra.trade.imports.plantproducts` (do NOT touch the animals package), with null-guarded
records, a `@Document`, controller/repository/service skeletons, and a reference-number scheme.
Verify with `mvn -f repos/trade-imports-animals-backend/pom.xml compile` (to a temp log file, read
once). Commit. Output: `backend-schema/SCHEMA-DESIGN.md` + the Java files + an obligation→field map.

**Phase C — Sibling-set scaffold plan (frontend, PLAN not build).** One design workflow producing
`frontend-plan/SIBLING-SET-PLAN.md`: exactly how `sets/plant-products/` is stood up as a sibling of
`live-animals` — the obligations manifest + section files, the `journeys/linear/` flow (12-spoke hub
per the CHED-PP inc-020 ruling, task rows, entry guards), the `configure*` wiring added to
`routes.js`, the `services/`, and the dependency-cruiser/convention-test implications. Map the
CHED-PP 12 hub spokes and page set onto the obligation model. Flag every place the sibling-set
pattern is NOT yet covered by an existing recipe (there is no "add-a-set" recipe — that gap is a key
finding).

**Phase D — Per-increment planning fan-out (the core ask).** Take the **unblocked frontend
increments** from the CHED-PP backlog (m0–m4 own-org happy path; the 5 deferred ones stay deferred).
For EACH increment, spawn one planner agent (fan out — `pipeline`/`parallel`, one per increment).
Each planner: reads the increment's `pages/<slug>.json` spec + the matching **frontend-change recipe**
(add-a-field/page/section/collection or the obligation/flow-maintenance guard rails) + the Phase-C
sibling-set plan + the Phase-B schema, and emits a **detailed, obligation-model-specific
implementation plan** for that increment: which recipe applies, exact files to create/edit in
`sets/plant-products/**`, the obligations to add (id/status/within/requires/applyTo — data only, no
copy), flow/task-row changes, the schema fields it fills, the copy keys (en+cy), and the co-located
Playwright + axe specs. Save each as `increments/<inc-id>.md`. (Consume the recipe DOCS as the
planning template — do not rely on the Skill tool being available inside a workflow subagent.)

**Phase E — Synthesis + completeness critic.** Assemble `PLAN.md` — the master journey-builder plan:
ordered milestones/increments, the sibling-set scaffold, the backend schema, the frontend↔backend
contract, sequencing + model-extension gates (mirror the CHED-PP inc-012 nested-collection gate),
and an explicit "what's a plan vs what's built" ledger. Then a completeness-critic agent asks
"what's missing — an increment with no recipe fit, an obligation with no schema field, a page with no
plan?" and its findings become a final gap list in `PLAN.md`. Commit + push. Write `HANDOVER.md`.

## Guardrails (baked in — keep them in every subagent/workflow prompt)

- **Bash hygiene:** one command per Bash call; **no** `&&`/`;`/`|`/`cd`; use `~/` paths in Bash
  (a literal `/Users/…` is DENIED). For Read/Write tools use absolute `/Users/samfarrington/…`. When
  a workflow prompt contains a Bash example, keep it tilde-form — never let an absolute path reach a
  subagent's Bash or every agent prompts Sam. (Memory: *workflow prompts leak abs paths*.)
- **Subagent research guardrails:** spawn research/planner agents with a GUARD-RAILS block — no
  Grep/Glob TOOLS (use Bash `grep -rn` / `find`), tilde paths, one command per Bash call. Grep/Glob
  tools are not allowlisted and will prompt Sam. (Memory: *subagents spam permission prompts*.)
- **No `sonar` and no `cd` in workflow agent steps** — neither is allowlisted; both prompt every
  step. Use `git -C` / `mvn -f` / `npm --prefix`. Defer any sonar pass to a single end-gate you run
  yourself, not inside a fan-out. (Memory: *no sonar/cd in workflow agent steps*.)
- **npm/mvn:** `npm --prefix ~/git/defra/trade-imports-animals/repos/<repo> run <script>`; never bare
  `node`/`node -e` (denied — wrap in an npm script). Canonicalise a path with `pwd -P` before any
  `npm install` that traverses the workspace symlink (lockfile corruption risk). Backend ITs need
  `mvn verify` (Failsafe), not `mvn test`; for a compile check use `mvn -f <pom> compile`.
- **Tests to file:** redirect any `mvn`/`npm test` to a temp log under
  `~/git/defra/trade-imports-animals/workareas/shared/plant-products-ched-pp/logs/` and read once —
  never grep streaming output or re-run. Read `test-results/*/error-context.md` for E2E failures.
- **Non-destructive rollback:** roll back a bad increment with `git stash push -u`, never
  `reset --hard` + `clean -fd`. (Memory.)
- **Worktree discipline:** if you spawn parallel workflow agents that MUTATE files in the same repo,
  give them `isolation: 'worktree'`; planners that only READ + write to the workarea don't need it.
  Never write into a checkout another agent is using. (Memory: *worktree when sharing branch*.)
- **Design purity:** no display logic in obligations/model — copy lives in the feature's
  `copy.en.js`+`copy.cy.js` (structure-identical). Options come from real MDM/reference-data, never a
  static list. L2 stays set-agnostic. (Memory: *no display logic in the model*.)
- **REST = nouns** (Zalando `rest-api.md`), records get compact-constructor null guards, no
  per-enum-value round-trip tests (one round-trip + one unknown-value negative per enum).

## Output layout (create as you go, all under the workarea)

```
workareas/shared/plant-products-ched-pp/
  WHEN-YOURE-BACK.md        # running decision/attention log (seeded — keep appending, newest on top)
  ORCHESTRATOR-PROMPT.md    # this file
  HANDOVER.md               # final summary (write at the end)
  PLAN.md                   # THE master journey-builder plan (Phase E)
  recon/                    # Phase A structured maps
  backend-schema/           # SCHEMA-DESIGN.md + obligation→field map (Java lands in the backend repo)
  frontend-plan/            # SIBLING-SET-PLAN.md + recipe cheat-sheet
  increments/               # one <inc-id>.md per unblocked frontend increment (Phase D)
  logs/                     # test/compile logs (gitignore-noise; keep out of commits if large)
```

## Definition of done

1. `recon/` maps exist for frontend platform, recipes, backend model, CHED-PP requirements.
2. `backend-schema/`: a compilable `uk.gov.defra.trade.imports.plantproducts` schema (records +
   `@Document` + controller/repo/service skeleton + reference-number scheme) committed to the backend
   `spike/trace-to-requirements` branch; `mvn compile` green; obligation→field map written.
3. `frontend-plan/SIBLING-SET-PLAN.md`: complete scaffold plan for `sets/plant-products/` incl. the
   `routes.js` `configure*` wiring and the "no add-a-set recipe" gap.
4. `increments/`: one detailed, obligation-model-specific plan per unblocked frontend increment.
5. `PLAN.md`: the master journey-builder plan tying it together + completeness-critic gap list.
6. Everything committed + pushed on all three `spike/trace-to-requirements` branches;
   `WHEN-YOURE-BACK.md` current; `HANDOVER.md` written.

Begin with Phase A. Do not ask anything — make the calls, log them, keep going.

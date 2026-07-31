> **Provenance.** Produced by a judge-panel workflow (`wf_6fc8e01c-a81`, 2026-07-28): 3 folder-dig
> readers → 4 architect angles (one failed the structured-output cap, so 3 proposals were judged) →
> a 3-lens panel scoring every proposal → synthesis. Orchestrator corrections applied on the way in:
> the container path is **`src/server/live-animals`** (the synthesis said `prototypes/standalone/live-animals`
> — that scaffolding is deleted; the module-level analysis, real files + line numbers, is accurate).
> One `collapse-boundaries` judge verdict is missing (retry-cap failure) — its total (17, lowest) is
> from the two surviving verdicts and it was rejected regardless. Nothing here is queued to
> `refactor-backlog.json` yet — awaiting Sam's call on the open questions.

# Refactor Recommendation: the `bridge` / `engine` / `flow` split

*Synthesis of three proposals and a three-lens judging panel. Scope: the `model` / `bridge` / `engine` / `flow` folder graph in `trade-imports-animals-frontend`'s live-animals service (`src/server/live-animals`).*

---

## 1. Verdict

**Keep `bridge` / `engine` / `flow` as three folders — the split is sound; it is only *leaky*, not wrong — and fix it with the minimal-move DAG repair (`minimal-dag`), hardened with the honest dependency-inversion framing from `redraw-by-layer`.** The panel tied `minimal-dag` and `redraw-by-layer` at 19/19 but favoured `minimal-dag` on adoption: two of three lenses would adopt it (versus one each for the others), it scored highest on the clarity lens of the two DAG-fixing proposals (6 vs 5), and it achieves a provable three-folder DAG for the price of **two file moves and ~15 import edits** rather than a wholesale re-layering. `redraw-by-layer` reaches the same DAG but at dozens of files of churn, a contested `spine/` extraction that *inverts* the codebase's own "pages are the spine" metaphor (decisions.md §1), and by overriding a documented decision — so its correctness win is real but its clarity cost sank it. `collapse-boundaries` scored lowest (17) and its headline `isFolderDag:true` was **falsified** by the panel: moving `entry-guard.js` into `engine/` drags its `features/import-type-filter/page.js` import along and manufactures a brand-new `engine <-> features` cycle where none existed. The recommendation below is `minimal-dag` as the spine, grafting `redraw-by-layer`'s framing of readiness as a genuine dependency-inversion port (not a renamed seam) and its correct diagnosis, and consciously deferring the features-layer back-edges that all three proposals leave standing.

---

## 2. The problem, precisely

The intended axis is a **kind** stratification — `model` = pure data core, `bridge` = pure synchronous projection over it, `engine` = stateful async runtime, `flow` = static journey topology + pure rollups — with all dependencies pointing *down*. The dig maps confirm the graph is a DAG **only at module granularity, and only because of a hand-placed seam**. At folder granularity there are three real cycles, every one of them caused by mis-filing rather than genuine mutual dependency:

- **`bridge <-> flow`.** `bridge/status.js:43` reaches *up* into `flow/obligation-source.js` for `SYSTEM_POPULATED`, and `bridge/scope.js:30` for `FLOW_ONLY_OBLIGATIONS`; the return edges are `flow/section-status.js` and `flow/task-rows.js` importing `bridge/status.js` (`NA`, `FULFILLED`, `OPTIONAL`, `statusOf`).
- **`engine <-> flow`.** Five engine modules reach up into `flow/obligation-source.js` — `engine/read.js`, `engine/write.js`, `engine/evaluate/cardinality.js` (`MAX_ENTRIES_FROM`), `engine/evaluate/collection-view.js` (`obligationByPath`) — plus `engine/readiness-config.js -> flow/section-status.js`. The return edges are `flow/entry-guard.js:3 -> engine/read.js` and `flow/run-state.js:1 -> engine/persistence/session.js`.
- **`bridge <-> engine`.** `bridge/scope.js:29 -> engine/readiness-config.js`; return edge `engine/read.js:3 -> bridge/scope.js`.

Two root causes explain all three:

1. **A model-vocabulary grab-bag mis-filed under `flow`.** `flow/obligation-source.js` imports *only* `model/obligations/obligations.js` (verified: single import line). It is model-derived vocabulary — `walkObligations`, `obligationByName`, `obligationByPath`, plus the declared constants — that merely *lives* under `flow`. Both `bridge` and `engine` depend on that vocabulary, not on flow topology. It is the single cause of the `bridge -> flow` back-edge and **four of the five** `engine -> flow` back-edges.

2. **A seam that props up the DAG by hand.** `engine/readiness-config.js` exists solely to hold the `readyForCheckYourAnswers` function *outside* `read.js` — its own header comment says it is held there "so `bridge/scope.js` can consume it without importing `read.js` (which imports `scope.js`) — the module graph stays a DAG." It is the load-bearing indirection keeping `bridge -> engine -> bridge` acyclic. Its default implementation is `flow/section-status.js`, which is the one *genuine* upward pressure: a readiness fact that structurally lives above `bridge` but is consumed by `bridge/scope.js`.

The kind axis is also blurred in the other direction: `engine/request-view.js`, `engine/evaluate/cardinality.js`, `engine/evaluate/collection-view.js` are pure synchronous transforms mis-filed under the stateful-runtime folder, and `flow/entry-guard.js` (async, engine-backed) and `flow/run-state.js` (async session wrapper) are runtime modules mis-filed under static topology. These do not *cause* cycles once cause (1) is fixed, so we leave them where they are (see §5).

---

## 3. Recommendation

Move exactly the two leaf modules that close all three cycles, and convert the readiness seam into a genuine boot-wired port at the bottom of the graph. Everything else stays put.

### Target layout (only two files change home)

```
src/server/live-animals/
  model/                         unchanged — pure core (manifest, evaluator, state-queries)
    obligations/...

  bridge/                        model-vocabulary + pure projection + the readiness port
    obligation-source.js         <-- MOVED from flow/  (imports only model)
    readiness-config.js          <-- MOVED from engine/ (now a boot-wired port, no flow import)
    applicability.js             (already kind=model-vocabulary — its new sibling)
    scope.js  status.js  purge.js  evaluation.js  fulfilments.js
    fulfilment-id.js  fulfilment-bindings.js  fulfilment-registry.js
    collection-complete.js  read-fulfilment.js  assemble-fulfilments.js
    fixtures/characterisation-corpus.js

  engine/                        stateful runtime — now depends only DOWN (-> bridge)
    read.js   (re-exports configureReadyForCheckYourAnswers from ../bridge/readiness-config.js)
    write.js  journey.js  store.js  request-view.js  index.js
    evaluate/{cardinality,collection-view}.js
    persistence/{records,session}.js
    (readiness-config.js REMOVED — now in bridge/)

  flow/                          static topology — now depends only DOWN (-> bridge, engine)
    flow.js  dispatch.js  gates.js  navigation.js  prerequisites.js
    section-status.js  task-rows.js  run.js  run-state.js  entry-guard.js
    (obligation-source.js REMOVED — now in bridge/)

  features/  services/  lib/  shared/   unchanged
  routes.js                      adds one boot line wiring the readiness default
```

### Before / after folder graph

**Before** — three interlocking cycles, DAG faked by the seam:

```
        ┌───────────────── bridge ─────────────────┐
        │  scope.js ─▶ engine/readiness-config      │  (bridge→engine)
        │  status.js ─▶ flow/obligation-source      │  (bridge→flow)
        ▼                                           ▲
     engine ──▶ flow/obligation-source (x4)         │
        │  readiness-config ─▶ flow/section-status  │
        ▲                                           │
        │  flow/entry-guard ─▶ engine/read          │  (flow→engine)
        │  flow/run-state ─▶ engine/session         │
        └── flow/section-status,task-rows ─▶ bridge/status ┘  (flow→bridge)
                          model  (leaf)
```

**After** — a strict linear DAG for the targeted folders:

```
   model  ◀──  bridge  ◀──  engine  ◀──  flow  ◀──  features
   (leaf)      (vocab +      (stateful    (static
               projection    runtime)     topology)
               + readiness
               port)
```

All inter-folder edges among `{model, bridge, engine, flow}` point down. `bridge/scope.js` no longer reaches up into `engine` or `flow` at all. The `readiness-config` "stays a DAG" comment becomes obsolete and is deleted.

### What is grafted from the runner-up

From `redraw-by-layer`, we adopt its **honest framing of the readiness change**: it is a textbook dependency-inversion — the *port* sinks to the bottom layer, the *implementation* (`flow/section-status.js`) is injected at boot from the composition root — not a seam that has merely been renamed. Both DAG judges rightly noted that `minimal-dag` as originally written oversold this as "the seam is retired"; the truth is the seam **is** eliminated as a cycle-breaker but the coupling it represented is real and must remain visible. We therefore graft two safeguards `redraw-by-layer` implied but neither proposal made explicit, and which directly answer the panel's kill scenarios:

- a **boot-time assertion** so a missing/reordered wiring line fails loudly at server start, not silently at first request (answers the DAG-lens "invisible boot-order landmine");
- a **shared test helper** that configures the *real* `flow/section-status` rollup, so test fixups never paste `() => false` and silently invert readiness assertions (answers the verifiability-lens kill scenario directly, and honours the "preserve assertion intent" rule).

We **reject** `redraw-by-layer`'s wholesale folder rename (`vocabulary/`, `projection/`, `topology/`, `runtime/`, `spine/`) and `collapse-boundaries`'s two-folder merge — see §5.

---

## 4. Increment backlog

Ordered, each independently verifiable and (except where noted) byte-behaviour-preserving. Baseline before any change: **unit suite 1424 passed / 8 skipped**; E2E **~37 journeys + ~3 a11y** green. Every increment must return to that baseline. Maps onto `refactor-backlog.json` with the `id` field below.

Verification note applying to all: run the unit suite **to a file and read once**; run E2E via the standard wrapper, never raw `npx playwright`. A pure move that reddens any spec was not pure — fix it in the same increment.

---

**R1 — Relocate `obligation-source.js` from `flow/` to `bridge/`**
`id: refactor-obligation-source-to-bridge` · **risk: low** · **byte-preserving: yes**

- **Change:** `git mv flow/obligation-source.js bridge/obligation-source.js` plus its dedicated test sibling(s). Rewrite **~15 importers** (the dig maps under-counted at ~9): `bridge/status.js`, `bridge/scope.js` (`../flow/... -> ./...`); `engine/read.js`, `engine/write.js` (`../flow/... -> ../bridge/...`); `engine/evaluate/cardinality.js`, `engine/evaluate/collection-view.js` (`../../flow/... -> ../../bridge/...`); `flow/dispatch.js`, `flow/prerequisites.js`, `flow/entry-guard.js` (`./... -> ../bridge/...`); **plus** `analysis/flow-reachability.js` and the test importers `contract.test.js`, `indexed.test.js`, `obligation-purity.test.js`, `engine/write-guard.test.js`, `flow/dispatch.test.js`. The moved file's own `../model/obligations/obligations.js` import is unchanged (same folder depth). Repoint the two illustrative path strings in `obligation-purity.test.js` (they are checker fixtures, not real imports, but treat with care — `obligation-purity.js` is load-bearing).
- **Verify (unit):** suite back to 1424/8. Prove the edge deletion across **all** consumers, not just two folders: `grep -rn "flow/obligation-source" bridge engine flow analysis *.test.js` returns nothing.
- **Verify (E2E):** ~37 journeys + ~3 a11y green — DOM is byte-identical (no runtime behaviour changed).
- **Deletes:** both `bridge -> flow` edges and four of five `engine -> flow` edges.

---

**R2 — Convert readiness into a boot-wired port *in place* (semantic change, isolated)**
`id: refactor-readiness-boot-wired-port` · **risk: medium** · **byte-preserving: no (runtime-equivalent)**

Deliberately separated from the move (R3) so the one non-pure step is verified alone. This is the increment the panel flagged as the whole risk surface — isolating it is the graft that answers the verifiability kill scenario.

- **Change:** In `engine/readiness-config.js` (still in `engine/` for now), remove `import { readyForCheckYourAnswers } from '../flow/section-status.js'` and the import-time default assignment; leave it as an unconfigured port whose `computeReadyForCheckYourAnswers` **throws** until configured, matching `engine/persistence/records.js` / `session.js`. In `routes.js`, add the import and call `configureReadyForCheckYourAnswers(readyForCheckYourAnswers)` alongside `configureRecords` / `configureSession`. Add a **boot-time assertion** at plugin registration that readiness is configured (so a dropped wiring line fails at start, not first request). Add a **shared test helper** `configureReadinessForTest()` that wires the real `flow/section-status` `readyForCheckYourAnswers`; use it wherever a test builds a scope without booting the plugin.
- **Verify (unit):** run the suite first to enumerate fallout — every spec that builds a scope via `makeScopeFromEvaluation` without configuring readiness now throws. Fix each with `configureReadinessForTest()` (the real rollup), **never** `() => false`. Confirm the ~12 specs overriding via `read.js`'s re-export are untouched. Back to 1424/8.
- **Verify (E2E):** ~37 journeys + ~3 a11y green — `routes.js` wires the real default before any request, so the check-your-answers / review-section gate DOM is identical.
- **Deletes:** the `engine/readiness-config.js -> flow/section-status.js` edge (the fifth `engine -> flow` edge).

---

**R3 — Relocate `readiness-config.js` from `engine/` to `bridge/` (pure)**
`id: refactor-readiness-config-to-bridge` · **risk: low** · **byte-preserving: yes**

Only safe *after* R2, because the module no longer imports `flow`. Now a trivial relocation.

- **Change:** `git mv engine/readiness-config.js bridge/readiness-config.js`. Repoint `bridge/scope.js` (`../engine/readiness-config.js -> ./readiness-config.js`) and `engine/read.js` (`./readiness-config.js -> ../bridge/readiness-config.js`, **keeping** its `export { configureReadyForCheckYourAnswers }` re-export). Delete the now-obsolete "stays a DAG" seam comment.
- **Verify (unit):** 1424/8; `grep -rn "engine/readiness-config" bridge engine flow` and `grep -rn "flow/section-status" bridge engine` (excluding tests) both return nothing.
- **Verify (E2E):** ~37 journeys + ~3 a11y green.
- **Deletes:** the `bridge -> engine` edge. **The three targeted folder cycles are now provably empty.**

---

**R4 — Add a static layering guard + update docs**
`id: refactor-add-layering-guard` · **risk: low** · **byte-preserving: yes (no runtime code)**

Answers the DAG-lens complaint that the readiness port trades a graph-visible edge for an invisible boot-wired one: make the intended layering machine-checked.

- **Change:** Add a `dependency-cruiser` (or `madge`) rule encoding `model < bridge < engine < flow` — forbid any import that points up — wired into CI. Document the one *intended* injected edge (readiness impl -> port, wired in `routes.js`) as an explicit exception. Update the ~dozen docs that describe `obligation-source.js` under `flow` and `readiness-config.js` under `engine` (`docs/engine.md`, `flow-and-gates.md`, `scope-and-wipe.md`, `decisions.md §3`, `architecture.md`).
- **Verify:** the new check passes on the R3 tree and fails on a deliberately-reintroduced up-edge (canary). No unit/E2E behaviour change.

---

## 5. What we deliberately are NOT doing

**Not renaming the folders (`redraw-by-layer`, rejected).** Its `spine/pages.js` extraction of page identities out of the feature slices collides head-on with the codebase's own load-bearing metaphor — decisions.md §1 is literally titled "Pages are the spine" and defines each feature as a vertical slice owning its `page.js`. The judge's kill scenario stands: a contributor six months on finds the word "spine" meaning opposite things in prose versus tree, `vocabulary/` become a four-kind grab-bag defined by import-position not meaning, and the readiness-port conversion forced into a layer marketed as "pure projection." It also overrides the *rationale* baked into the docs, not just the names. Correct DAG (it scored 8), incoherent for humans (clarity 5, would-not-adopt on two lenses). We keep the evocative names and take only its honest dependency-inversion framing.

**Not merging `bridge` + `flow` into one folder (`collapse-boundaries`, rejected).** Its `isFolderDag:true` was **falsified** by the DAG panel: `git mv flow/entry-guard.js engine/` keeps `entry-guard`'s `features/import-type-filter/page.js` import, and since no engine module imports `features` today, this manufactures a **new `engine <-> features` cycle** against the existing `features -> engine` barrel edge. It trades three interior cycles for a fresh exterior one. Its "one grep-decidable rule" also leaks (`dispatch.js` is stateful but stays in `derive`), and a flat 25-file `derive/` erases the data-shape / journey-shape signal decisions.md §3 encodes. Lowest total (17), DAG-lens would-not-adopt.

**Not splitting `obligation-source.js` (deferred — see Open Questions).** The clarity judge's kill scenario against `minimal-dag` is legitimate: `FLOW_ONLY_OBLIGATIONS = ['importType','declaration']` and `ENFORCED_AT_CONTINUE` are hand-authored *policy* constants naming flow-only journey steps, not model-derived vocabulary — parking them in `bridge` files them *below* the `flow` layer that owns them. The purest fix splits the derivation index (down toward `model`/`bridge`) from the flow-policy constants (stay in `flow`). We defer rather than adopt it: it adds churn and a genuine design call about where policy constants belong. Flagged for Sam (Q1) rather than silently taking the muddier home.

**Not touching the features-layer back-edges (out of scope, flagged).** `flow/flow.js` + `task-rows.js` + `run.js -> features/*/page.js` (22 page identities) and `bridge/fulfilment-registry.js -> features/evaluation.js` are pre-existing up-edges into the top layer. Closing them means relocating 22 `page.js` identities and the binding DSL — high churn, a separate ticket, and exactly the `spine/` move the panel rejected on clarity grounds. `isFolderDag:true` in this recommendation is asserted for `{model, bridge, engine, flow}` only, and this is stated, not hidden.

---

## 6. Open questions for Sam

1. **Where do the flow-policy constants belong?** `FLOW_ONLY_OBLIGATIONS`, `ENFORCED_AT_CONTINUE`, `SYSTEM_POPULATED`, `MAX_ENTRIES_FROM` are declared policy, not derived vocabulary. R1 moves them to `bridge/` for zero extra churn, which files them below the `flow` layer that conceptually owns them. Acceptable pragmatic blur, or worth splitting `obligation-source.js` into a derivation index (down to `bridge`/`model`) and a flow-policy module (staying in `flow`)? The latter is cleaner on the kind axis but adds an increment and a new module.

2. **Is the boot-wired readiness port acceptable, or is a module-level-only DAG preferred?** R2/R3 make readiness a DI port to achieve a *static* folder DAG. The cost is that `scope`'s dependency on `flow/section-status` becomes a boot-wiring line in `routes.js`, invisible to `madge` (R4's guard and boot-assertion mitigate, but do not eliminate, this). The alternative — leave `readiness-config` where it is and accept a single `bridge -> flow` edge — keeps the coupling import-visible at the price of one surviving folder edge (today's posture, under a clearer comment). Which trade do you want?

3. **Do the features-layer back-edges get their own ticket now, or stay deferred?** Closing them is the `spine/`-style relocation the panel rejected on clarity grounds — but if a *strict whole-frontend* DAG is a goal (e.g. to enforce with R4's guard across all folders), it needs scheduling as separate work with its own design call on page-identity ownership.

4. **Should R4's layering guard be advisory or a hard CI gate from day one?** A hard gate prevents regressions immediately but will fail on the untouched features-layer edges unless those are explicitly excepted; an advisory rule lets the exceptions be burned down incrementally.

> **Provenance.** Produced by a survey→design→harden→synthesize workflow (`wf_437df3d0-85c`,
> 2026-07-28): 4 parallel surveyors (existing guards, edge inventory, dependency-cruiser capabilities
> from current docs, CI integration) → a design pass → 3 adversarial critics (false-positives,
> regression-catch, integration-reality; 3 blockers found) → synthesis folding the blockers in.
> 9/9 agents, all facts re-verified against HEAD `69dacf2` (R1 landed). Nothing here is queued to
> `refactor-backlog.json` or implemented yet — this is the plan for Sam to react to.

# dependency-cruiser adoption plan — live-animals layered architecture

## 1. Summary

dependency-cruiser will own the **down-only layering invariant** for `repos/trade-imports-animals-frontend/src/server/live-animals/` — `model < bridge < engine < flow < features` (with `analysis/` and `shared/kit.js` treated as features-tier) — that today exists only as prose in [`docs/architecture.md:14-26`](repos/trade-imports-animals-frontend/src/server/live-animals/docs/architecture.md). It statically **subsumes exactly one** hand-rolled guard (`assertModelImportBoundary`), **complements** the runtime port design with a new static ban nothing enforced before (`engine/persistence` must not import a `services/` impl), and leaves every value/data-shape guard bespoke. Recommended posture: a single `.dependency-cruiser.cjs` cruising only the live-animals subtree, wired into the existing `lint` aggregate so it rides into **both** pre-commit and the CI PR gate with one edit; rolled out advisory-first (all layer rules `warn`, `no-circular` `warn`) so day one cannot red-light the repo, then promoted to `severity:error` once the known exception set is snapshotted into a **baseline** — the readiness staircase and the deferred features back-edges are grandfathered there (which pins *both* endpoints of each sanctioned edge), never via broad `pathNot` carve-outs.

Verified at HEAD `69dacf2` (R1 landed). All paths anchored on `^src/server/live-animals/` because depcruise runs from the frontend repo root. Grounding re-checked in-repo for this plan: behaviour modules are at `model/obligations/{evaluator,state-queries}.js` (not `model/`); `model/obligations/obligations.js:79` is model's sole cross-folder out-edge (→`services/commodities/index.js`); the readiness staircase is `bridge/scope.js:29 → engine/readiness-config.js:1 → flow/section-status.js`; the flow→features debt is **4** files (`flow.js`, `task-rows.js`, `run.js`, `entry-guard.js`); no lower-layer file imports `analysis/` or `shared/kit.js`; and no live-animals file reaches outside the folder except into `services/`.

---

## 2. The ruleset

Place at `repos/trade-imports-animals-frontend/.dependency-cruiser.cjs`. Authored as CommonJS (`.cjs`) because the package is `"type":"module"` and depcruise's loader would treat a plain `.js` config as ESM — `.cjs` is also `depcruise --init`'s own default ([cli.md § Node.js & ESM Support](https://github.com/sverweij/dependency-cruiser/blob/main/doc/cli.md)).

```js
// .dependency-cruiser.cjs
// Machine-enforced layered architecture for src/server/live-animals.
//
//   Layers, low -> high:   model < bridge < engine < flow < (features | analysis | shared/kit)
//   All production imports must point DOWN.
//
// This config owns the four-folder down-only invariant that architecture.md:14-26
// only describes in prose, and subsumes assertModelImportBoundary
// (obligation-purity.js:66) as a native rule.
//
// SCOPE: the npm scripts pass `src/server/live-animals` as the cruise root, so only
// modules reachable from that folder are analysed. We deliberately DO NOT set
// options.includeOnly: that would prune node_modules / node: nodes from the graph and
// blind `model-import-boundary` to a future model -> npm / model -> node:fs edge (the
// exact coverage the retired hand-rolled guard provided). Instead `doNotFollow` keeps
// external packages in the graph as un-followed LEAF nodes the boundary rule can flag.
//
// EXCEPTIONS: the readiness staircase and the deferred flow/bridge -> features
// back-edges are grandfathered in .dependency-cruiser-known-violations.json (the
// baseline pins BOTH endpoints of each edge, so a *new* importer of the same target is
// still a fresh violation). We do NOT use `to.pathNot` for them: a pathNot on a target
// file relaxes the ban for EVERY source in the layer, turning the target into a
// laundering channel. Rules therefore stay strict with no carve-outs.

const LA = 'src/server/live-animals'

module.exports = {
  forbidden: [
    // ── MODEL FLOOR (allow-list; subsumes assertModelImportBoundary in full) ──
    {
      name: 'model-import-boundary',
      comment:
        'model/ is the pure data core. It may resolve ONLY to intra-model paths or a ' +
        'services/<name>/index.js barrel. Today the sole such edge is ' +
        'model/obligations/obligations.js -> services/commodities/index.js. This one ' +
        'allow-list rule replaces obligation-purity.js assertModelImportBoundary ' +
        'entirely: it bans the higher layers AND lib/shared/config AND — because ' +
        'node_modules/node: nodes stay in the graph via doNotFollow — any npm or ' +
        'node-builtin import (matching the hand-roll ban on non-relative specifiers). ' +
        'depcruise does this more robustly than the two line-anchored regexes ' +
        '(AST/resolver catches re-exports and dynamic import).',
      severity: 'error',
      from: { path: `^${LA}/model/` },
      to: {
        pathNot: [
          `^${LA}/model/`,
          `^${LA}/services/[^/]+/index\\.js$`,
        ],
      },
    },

    // ── DOWN-ONLY UP-IMPORT BANS (block-list; one rule per layer for legible names) ──
    // `analysis/` and `shared/kit.js` are features-tier (they legitimately consume the
    // lower layers), so lower layers must not import them either — hence they appear in
    // every `to` set. Verified zero violations today.
    {
      name: 'bridge-no-up',
      comment:
        'bridge/ is a pure synchronous projection over the model. It must not import ' +
        'engine (async runtime), flow (topology), features (page slices), analysis or ' +
        'shared/kit. The one sanctioned bridge->engine edge (scope.js -> ' +
        'readiness-config.js, the readiness staircase) is grandfathered in the baseline, ' +
        'NOT excepted here — see readiness section of the plan.',
      severity: 'error',
      from: { path: `^${LA}/bridge/` },
      to: {
        path: [
          `^${LA}/(engine|flow|features|analysis)/`,
          `^${LA}/shared/kit\\.js$`,
        ],
      },
    },
    {
      name: 'engine-no-up',
      comment:
        'engine/ is the stateful async runtime. It must not import flow, features, ' +
        'analysis or shared/kit. Engine reaches the model only through bridge and has ' +
        'zero production edge to services (ports are injected at boot). The one ' +
        'sanctioned engine->flow edge (readiness-config.js -> section-status.js) is ' +
        'grandfathered in the baseline, not excepted here.',
      severity: 'error',
      from: { path: `^${LA}/engine/` },
      to: {
        path: [
          `^${LA}/(flow|features|analysis)/`,
          `^${LA}/shared/kit\\.js$`,
        ],
      },
    },
    {
      name: 'flow-no-up',
      comment:
        'flow/ is static journey topology. It must not import features, analysis or ' +
        'shared/kit. The 4 known flow->features/*/page.js page-identity edges ' +
        '(flow.js, task-rows.js, run.js, entry-guard.js) are DEFERRED debt, grandfathered ' +
        'in the baseline — so this rule stays strict and any NEW flow->features edge fails.',
      severity: 'error',
      from: { path: `^${LA}/flow/` },
      to: {
        path: [
          `^${LA}/(features|analysis)/`,
          `^${LA}/shared/kit\\.js$`,
        ],
      },
    },

    // ── MODEL BEHAVIOUR IS BRIDGE-ONLY (the accurate form of "bridge is the only door") ──
    {
      name: 'model-behaviour-bridge-only',
      comment:
        '"bridge is the only door to the model" is FALSE over the whole model: 14 ' +
        'features/*/evaluation.js + lib/answered.js + 2 persistence adapters read the ' +
        'obligation MANIFEST (model/obligations/obligations.js et al.) directly as shared ' +
        'read-only vocabulary, which is intended. The true, narrower invariant: only ' +
        'bridge/ may import the model BEHAVIOUR surface — the evaluator and state-queries. ' +
        'PATH IS model/obligations/(evaluator|state-queries).js (there is an intervening ' +
        'obligations/ segment — the earlier draft omitted it and matched nothing). Verified ' +
        'clean today: the only importers are bridge/evaluation.js, bridge/collection-' +
        'complete.js, bridge/status.js. If these files are renamed, update this regex — an ' +
        'INC-3 teeth test asserts the rule matches >0 modules so it can never silently vacate.',
      severity: 'error',
      from: {
        pathNot: [
          `^${LA}/bridge/`,
          `^${LA}/model/`,
        ],
      },
      to: {
        path: `^${LA}/model/obligations/(evaluator|state-queries)\\.js$`,
      },
    },

    // ── HEXAGONAL PORT PROTECTION (complement: locks in the injected-port design) ──
    {
      name: 'engine-persistence-port-abstract',
      comment:
        'COMPLEMENT (no existing static guard): engine/persistence/** are PORT ' +
        'definitions that stay abstract by never importing a services/ implementation — ' +
        'routes.js wires the impl in at boot (the runtime "not configured" throw stays ' +
        'bespoke). This static ban keeps the port abstract and doubles as the guard-rail ' +
        'for readiness-resolution option (c): boot-wire readiness as an injected port.',
      severity: 'error',
      from: { path: `^${LA}/engine/persistence/` },
      to: { path: `^${LA}/services/` },
    },

    // ── HYGIENE (scoped to live-animals so it cannot red-light unrelated app code) ──
    {
      name: 'no-circular',
      comment:
        'No import cycles under live-animals. The readiness staircase is a straight ' +
        'up-chain, not a cycle. `from` is anchored to live-animals so a pre-existing ' +
        'cycle elsewhere in the app cannot fail this gate. Starts at severity:warn in ' +
        'INC-1 and is promoted to error in INC-3 after a one-off confirmation the ' +
        'cruised surface is acyclic.',
      severity: 'error',
      from: { path: `^${LA}/` },
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      comment:
        'Advisory (warn): modules nothing imports and that import nothing — usually dead ' +
        'code. `from` anchored to live-animals; excludes tests, test-support/mocks, ' +
        'fixtures, and the string-referenced boot/config entries (config.js is referenced ' +
        'as a path, routes.js is Hapi-registered not graph-imported).',
      severity: 'warn',
      from: {
        path: `^${LA}/`,
        orphan: true,
        pathNot: [
          '\\.test\\.js$',
          'test-support\\.js$',
          '__mocks__/',
          `^${LA}/.*/fixtures/`,
          `^${LA}/config\\.js$`,
          `^${LA}/routes\\.js$`,
        ],
      },
      to: {},
    },
  ],

  options: {
    // Keep external packages in the graph as un-followed leaf nodes so model-import-
    // boundary can flag a model -> npm / model -> node:builtin edge. (Do NOT use
    // includeOnly — it would prune those nodes and blind the boundary rule.)
    doNotFollow: { path: 'node_modules' },

    // Test files cross every layer legitimately (beforeAll wires stubs + dispatch);
    // test-support/mocks are non-.test.js plumbing; fixtures are data; .njk are only
    // string paths (config.js:4), invisible to the graph anyway. Exclude all from validation.
    exclude: {
      path: [
        '\\.test\\.js$',
        'test-support\\.js$',
        '__mocks__/',
        `^${LA}/.*/fixtures/`,
        '\\.njk$',
      ],
    },
    // Do NOT set extraExtensionsToScan — leaving .njk out keeps templates invisible
    // (referenced as strings, never imported) and avoids false orphans.

    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },

    reporterOptions: {
      dot:   { collapsePattern: `${LA}/(model|bridge|engine|flow|features|analysis|services|lib|shared)` },
      archi: { collapsePattern: `${LA}/(model|bridge|engine|flow|features|analysis|services|lib|shared)` },
    },

    cache: { strategy: 'metadata' },
  },
}
```

Why these shapes (folding in the critiques):

- **`model-import-boundary` is the *only* model rule** — an allow-list. It already forbids every higher layer, plus `lib`/`shared`/`config`, plus (crucially) any `npm` or `node:` import, because those nodes stay in the graph via `doNotFollow` and match neither allow-pattern. This is coverage-neutral with the retired `assertModelImportBoundary`, whose `isBoundaryViolation` (`obligation-purity.js:47-52`) rejects any non-`.`-prefixed specifier. A separate `model-no-up` block-list rule was **dropped** — it would double-report every `model→bridge` edge the allow-list already catches. The earlier draft's `dependencyTypesNot: ['core']` is **removed**: a model file importing `node:fs` *should* fail (it is IO in the pure data core), so that is the intended invariant, not a false positive.
- **`model-behaviour-bridge-only`** now targets `model/obligations/(evaluator|state-queries).js` — the real paths. The draft's `model/(evaluator|state-queries).js` matched **zero** modules and silently enforced nothing (all three critics' blocker). Verified today the only importers are the three `bridge/*` files, so it lands at `error` immediately.
- **`analysis/` + `shared/kit.js` are in every up-ban's `to`** — the survey flagged them as unguarded up-reachers (`analysis/simulate.js`→engine+flow, `shared/kit.js`→engine+flow). They are features-tier consumers, so lower layers importing them is an up-edge. Verified zero violations today.
- **Readiness is grandfathered in the baseline, not `pathNot`.** A `to.pathNot` on `engine/readiness-config.js` would relax `bridge-no-up` for *every* bridge file — a laundering channel where a new `bridge/newfile.js → readiness-config.js` passes silently. The baseline pins `bridge/scope.js → engine/readiness-config.js` as a specific pair, so a second importer is a fresh failure.
- **Hygiene rules are `from`-anchored to `^src/server/live-animals/`** and the cruise root is the folder (not `src/`), so `no-circular:error` cannot fail on a cycle in `src/client`/`src/plugins`, and `no-orphans` does not flood on app entrypoints.

---

## 3. What it subsumes vs complements

| Hand-rolled guard | File / evidence | Verdict | Action |
|---|---|---|---|
| `assertModelImportBoundary` | `obligation-purity.js:66-78` — model may import only model + `services/<name>/index.js`; `isBoundaryViolation:47-52` also bans any non-relative specifier | **SUBSUME** | Owned by `model-import-boundary` (allow-list incl. the npm/`node:` ban, once `doNotFollow` keeps external nodes visible). AST/resolver beats the two line-anchored regexes. **Retire only after INC-3 is green in CI and the INC-4 teeth tests pass.** |
| `assertObligationPurity` / `assertNoDisplayKeys` | `model/no-display-keys.js:24-117` — no `label/title/titleKey/hint/legend/widget` keys on live obligation objects | **KEEP** | Data-shape over the live object graph. depcruise inspects import edges, never property keys; its own doc-comment rejects source-grep as false-positive-prone. |
| `buildDispatch` 3 checks | `flow/dispatch.js:36-82` — path-safe ids; no double-collect; every non-system obligation collected exactly once | **KEEP** | Cardinality/ownership over runtime `collects:[uuid,…]` arrays vs manifest, not import edges. |
| Fulfilment registry / `assertFulfilmentBindingCoverage` | `bridge/fulfilment-registry.js:36-179` — every UUID owned once, correct kind/depth/token | **KEEP** | Binding-object structure + manifest identity. Also hosts the baselined `→features/evaluation.js` back-edge (guard-owner **and** exception site). |
| `assertRecognisedAnswerKeys` | `bridge/obligation-source.js:144-155` | **KEEP** | Validates live per-request POJO keys. |
| `assertDispatchBuilt` | `flow/gates.js:5-12` | **KEEP** | Boot-sequence ordering (call order, not module edges) — inexpressible in depcruise. |
| Reachability provers | `model/analysis/reachability.js`, `analysis/flow-reachability.js` | **KEEP (test-tier)** | Graph proofs over the `dependsOn` graph + gate metadata; run in tests, not boot. |
| Persistence "not configured" throw | `engine/persistence/records.js:6-26` | **KEEP runtime; COMPLEMENT static** | Runtime throw stays bespoke; its dependency-shadow ("engine/persistence must not import services") is newly owned by `engine-persistence-port-abstract`. |
| General bridge<engine<flow<features layering | *no guard exists* — `architecture.md:14-26` is prose | **NET-NEW (primary value-add)** | The four-folder down-only invariant was unenforced except the model floor. depcruise's dominant, additive role. |

Net: **one** guard subsumed (`assertModelImportBoundary`), **one** dependency-fact newly complemented (`engine-persistence-port-abstract`), and the biggest contribution is **net-new** (the layering nobody guarded). Everything else stays bespoke.

---

## 4. Integration

**One seam, both gates.** `.husky/pre-commit → npm run git:pre-commit-hook → format:check && lint && test`, and `.github/workflows/check-pull-request.yml` also calls `npm run lint`. Folding depcruise into the existing `lint` aggregate ([`package.json`](repos/trade-imports-animals-frontend/package.json) `"lint": "run-s lint:js lint:scss"`) lands it in both with one edit — no husky and no workflow-YAML change.

`package.json` edits:
```jsonc
{
  "scripts": {
    "lint": "run-s lint:js lint:scss lint:arch",
    "lint:arch": "depcruise src/server/live-animals --config .dependency-cruiser.cjs --ignore-known --output-type err-long --cache",
    "depcruise:baseline": "depcruise src/server/live-animals --config .dependency-cruiser.cjs --output-type baseline > .dependency-cruiser-known-violations.json",
    "depcruise:graph": "depcruise src/server/live-animals --config .dependency-cruiser.cjs --output-type archi | dot -T svg > live-animals-arch.svg"
  },
  "devDependencies": {
    "dependency-cruiser": "^16"
  }
}
```

Rationale:
- **All three scripts target `src/server/live-animals`** (identically) — matches the rules' scope, keeps the baseline to exactly the known exception set, and removes repo-wide `no-orphans`/`no-circular` noise. (The earlier draft ran `depcruise src` for lint/baseline but `--include-only live-animals` only for the graph — an inconsistency that polluted the baseline and broke INC-1/INC-2 verification.)
- **Fold into `lint`, not `test`** — keeps the sub-second static scan out of the vitest+coverage run; `run-s` fails fast so an arch violation blocks the commit/PR exactly like an eslint error.
- **Pre-commit latency is a non-issue** — `git:pre-commit-hook` already runs `pretest`=webpack production build + `vitest run --coverage`; a one-folder depcruise scan adds <1s ([cli.md § Caching](https://github.com/sverweij/dependency-cruiser/blob/main/doc/cli.md)).
- **`--ignore-known`** grandfathers the baselined edges while rules stay strict; **`err-long`** prints each rule's comment on regression; **`--cache` (metadata)** keeps it near-instant. If CI does shallow checkouts, add `--cache-strategy content` in a CI-only invocation.
- **Lockfile:** add the devDep, `npm install`, commit the regenerated `package-lock.json` in the same commit — CI `npm ci` against `.nvmrc` (Node `v24.11.1`) fails on a stale lock. depcruise ships CJS and supports Node 24.
- **eslint overlap: none.** `eslint.config.js` is `neostandard` (style/correctness, no cross-file layer rules) — depcruise is complementary, not redundant.

---

## 5. Rollout increments

Append to `workareas/shared/promotion/refactor-backlog.json` (schema `id / title / area / rationale / acceptance / status`), on `spike/EUDPA-288-model-retrofit`, worktree `workareas/promotion-loop/frontend`. Each is independently landable and verified by running the project's standard suites (unit + one E2E leg), never manual click-throughs.

**Day-one safeguard (applies to INC-1):** the cruise root is the live-animals folder and both hygiene rules are `from`-anchored to it, so nothing outside live-animals can be evaluated; additionally `no-circular` ships at `severity:warn` in INC-1. There is no path by which INC-1 red-lights the repo.

**INC-1 — `depcruise-advisory-land`** *(risk: low)*
- Add `dependency-cruiser` devDep + `.dependency-cruiser.cjs` with **every layer rule at `severity:'warn'`** and `no-circular` at **`warn`**. Add `lint:arch` **without** `--ignore-known`.
- Verify: `npm install` regenerates the lock; `npm run lint:arch` exits 0, printing as **warnings only** exactly the readiness staircase edge, the flow/bridge→features back-edges, and nothing unexpected (confirming R1 left just the readiness up-edges among the lower four). A `--output-type text` run shows `model-behaviour-bridge-only` matches **>0** modules (guards against the dead-regex regression). `npm run lint`, unit, and one E2E leg green.

**INC-2 — `depcruise-baseline-known-violations`** *(risk: low)*
- Run `npm run depcruise:baseline`, commit `.dependency-cruiser-known-violations.json`. Switch `lint:arch` to `--ignore-known`.
- Verify: the baseline's `from` set is exactly `flow/{flow,task-rows,run,entry-guard}.js`, `bridge/fulfilment-registry.js`, and `bridge/scope.js`; every recorded `to` is a `features/*/page.js`, `features/evaluation.js`, or `engine/readiness-config.js`; no other edge appears. (Assert the **from-file set + to-target shape**, not a literal count — depcruise records one entry per module *pair*, so the flow→features debt alone is ~40+ pairs, not 5.) `npm run lint:arch` exits 0.

**INC-3 — `depcruise-hard-gate`** *(risk: medium)*
- One-off `depcruise src/server/live-animals --output-type err` to confirm the cruised surface is acyclic, then promote `model-import-boundary`, `bridge-no-up`, `engine-no-up`, `flow-no-up`, `model-behaviour-bridge-only`, `engine-persistence-port-abstract`, and `no-circular` to `severity:'error'`.
- Verify (teeth tests, each reverted after): a throwaway `engine → flow` import makes CI red; a throwaway **second** `bridge/*.js → engine/readiness-config.js` importer makes CI red (proves the baseline pins the *source*, not the whole layer); a throwaway `features/*/evaluation.js → model/obligations/evaluator.js` import makes CI red (proves `model-behaviour-bridge-only` has teeth). Baseline unchanged; suite green. This is where the gate becomes real.

**INC-4 — `retire-assert-model-import-boundary`** *(risk: medium; requires INC-3 green in CI)*
- Delete `assertModelImportBoundary` and its call site from `obligation-purity.js`; keep `assertObligationPurity`/`assertNoDisplayKeys` and all other boot guards. Trim only the retired guard's cases from `obligation-purity.test.js`.
- Verify: grep for `assertModelImportBoundary` returns nothing; boot still runs `assertObligationPurity → assertFulfilmentBindingCoverage → buildDispatch` in order. Teeth tests proving no coverage lost: a throwaway `model/x.js` importing `bridge`, one importing `lodash`, and one importing `node:fs` each make `lint:arch` red. Suite green.

**INC-5 — `resolve-readiness-seam`** *(risk: medium; independent of INC-6 after INC-3)*
- Implement Form B (move the readiness fold into `bridge/`) or Form C (inject it as a boot port). Both up-edges vanish; **remove the two readiness entries from the baseline**. If Form C, rely on `engine-persistence-port-abstract` to keep the readiness port abstract.
- Verify: no `readiness-config` up-edge remains among the lower four; baseline no longer lists `bridge/scope.js → engine/readiness-config.js`; `bridge-no-up`/`engine-no-up` pass strict; `engine/write.js` submit guard + `bridge/scope.js` readiness boolean behaviour-preserved (unit + E2E DOM-identical). Closes the last lower-four exception.

**INC-6 — `burn-features-backedges`** *(risk: medium; long-tail, separate ticket; independent of INC-5 after INC-3)*
- Per the deferred features-back-edge ticket, invert the page-identity edges (e.g. a page-registry the flow layer reads without importing `features/*/page.js`; a features→bridge binding registration for `fulfilment-registry`). Regenerate the baseline after each removal so it shrinks. May land as sub-increments (one per flow file), each keeping the `EUDPA-*` prefix.
- Verify (per edge): the removed pairs disappear from the baseline; `flow-no-up`/`bridge-no-up` still `error`; suite + E2E green. **Done when the baseline is empty** and can be deleted along with `--ignore-known`.

Sequencing: **INC-1 → INC-2 → INC-3** strictly ordered (advisory → baseline → hard gate). **INC-4, INC-5, INC-6** each require INC-3 green and are otherwise independent.

---

## 6. Interaction with the readiness (R2/R3) decision

The depcruise work does **not** block on the readiness call. The staircase (`bridge/scope.js:29 → engine/readiness-config.js:1 → flow/section-status.js`) is grandfathered in the **baseline** from INC-2, so the strict layer rules ship regardless of which resolution lands. Each option maps cleanly:

| Option | What changes in the code | What the ruleset does |
|---|---|---|
| **(a) Leave as-is** | Nothing. | The baseline keeps the one edge `bridge/scope.js → engine/readiness-config.js` (Form A). `bridge-no-up`/`engine-no-up` stay strict; a *second* bridge importer of `readiness-config.js` is a fresh failure (INC-3 teeth test). This is the "documented exception that isn't assumed gone" the project brief requires — pinned by pair, not a broad `pathNot`. |
| **(b) Move the seam to bridge** | Readiness computed in `bridge/`; `engine/write.js` + `bridge/scope.js` read it from bridge. Both up-edges disappear. | INC-5 removes the two entries from the baseline. No rule change — the strict rules pass unmodified. This is the desired end-state. |
| **(c) Boot-wire as an injected port** | Readiness supplied at boot like the persistence ports; the static `bridge/scope.js`/`engine/readiness-config.js` edges vanish. | INC-5 removes the baseline entries; `engine-persistence-port-abstract` already guarantees the readiness port stays impl-free. If you generalise that rule to a named ports allowlist, add the readiness port module to it. |

Because the exception lives in the baseline (which pins both endpoints) rather than in a `pathNot` carve-out, the ruleset is correct **today** under (a) and becomes *stricter for free* under (b)/(c) — no config edit is forced by the readiness decision, and no laundering channel is left open while it stays undecided.

---

## 7. Open questions for Sam

1. **`no-orphans` posture** — ship as `warn` (advisory, current plan) or promote to `error` in a later increment as a dead-code gate? It trips legitimately on newly-scaffolded files during active development, so `warn` is the safe default.
2. **`model-behaviour-bridge-only` at `error` from INC-3** — the corrected rule is clean today (only `bridge/*` imports the evaluator/state-queries). Confirm you want it hard-gated immediately, or held at `warn` until the behaviour surface is more likely to move. Recommendation: `error` from INC-3, with the teeth test guarding against a rename silently re-vacating it.
3. **Readiness resolution owner/ticket** — INC-5 implements Form B or C (or explicitly ratifies A). Which form, and is it the same `EUDPA-288` scope or a follow-up ticket? The baseline mechanism means this can be decided independently and at leisure.
4. **Features-back-edge burn-down ticket** — INC-6 is explicitly a "separate future ticket." Should it be raised now (so the baseline burn-down is tracked) or deferred until the layering gate is live?
5. **CI cache strategy** — does `check-pull-request.yml` do shallow checkouts? If so, add `--cache-strategy content` to the CI invocation to avoid stale-cache misses (metadata strategy is git-history based).

Deliverable paths: config → `repos/trade-imports-animals-frontend/.dependency-cruiser.cjs`; baseline → `repos/trade-imports-animals-frontend/.dependency-cruiser-known-violations.json`; backlog to extend → `workareas/shared/promotion/refactor-backlog.json`; guard to retire (INC-4) → `repos/trade-imports-animals-frontend/src/server/live-animals/obligation-purity.js:66`.

Doc references: [rules-reference.md](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md), [options-reference.md](https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md), [cli.md](https://github.com/sverweij/dependency-cruiser/blob/main/doc/cli.md).

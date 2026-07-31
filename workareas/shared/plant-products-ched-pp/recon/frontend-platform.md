# Frontend platform map — standing up a sibling set (`sets/plant-products/`)

Recon over `repos/trade-imports-animals-frontend/src/server/app` (branch `spike/trace-to-requirements`, 2026-07-31).
All paths below are relative to `src/server/app/` unless stated.

## 0. The L1–L4 layering in one paragraph

`docs/architecture.md` defines: **L1** = files directly under `src/server/app/` (composition; `routes.js` is the ONLY production module outside a set allowed to import `sets/**`). **L2** = set-agnostic platform (`model/`, `bridge/`, `engine/`, `flow/`, `services/`, `lib/`, `shared/`, `analysis/`) — set/journey data arrives only through L1 `configure*` injection. **L3** = `sets/<set>/obligations/` (manifest + section files; may use L2 model helpers, never a journey). **L4** = `sets/<set>/journeys/<journey>/` (pages, controllers, templates, copy, flow topology; may use its own set + L2, never another journey or set). Dependency Cruiser (`.dependency-cruiser.cjs`, run by `npm run lint:arch`) enforces all boundaries at error severity.

## 1. Every configure* seam in routes.js (exact calls live-animals makes)

`routes.js` exports one Hapi plugin (`export const liveAnimals = { plugin: { name: 'live-animals', register: async (server) => {...} } }`), registered by `src/server/router.js` (line 20: `const routes = [liveAnimals]`). The register body, in order — this order is load-bearing (assertions run after config, before routes):

| # | Call | Argument live-animals passes | Defined in |
|---|------|------------------------------|-----------|
| 1 | `configureObligationSet(obligationSet)` | `import * as liveAnimalsObligationSet from './sets/live-animals/obligations/index.js'` — the whole module namespace; accessors used: `.obligations` (array), `.groups` (array) | `model/obligations/manifest.js` |
| 2 | `configureFulfilmentRegistry(features)` | `featureEvaluationBindings` from `sets/live-animals/journeys/linear/features/evaluation.js` — a frozen array of `feature(name, bindings)` objects | `bridge/fulfilment-registry.js` |
| 3 | `configureCommodityReference(commodityReference)` | `import * as commodities from './sets/live-animals/services/commodities/index.js'` — needs `commodityCodeFor`, `speciesLabel`, `typeTextForId` | `services/persistence/records/notification-mapper/commodity-reference.js` |
| 4 | `configureJourneyFlow({ sections, taskRows, rowStatus, nextRunTarget, flowOnlyKeys, entryGuardTarget, layout })` | `sections` + `FLOW_ONLY_KEYS` from `journeys/linear/flow/flow.js`; `taskRows` + `rowStatus` from `flow/task-rows.js`; `nextRunTarget` from `flow/run.js`; `entryGuardTarget` from `flow/entry-guard.js`; `LAYOUT` (`'shared/layout.njk'`) from `journeys/linear/config.js` | `flow/journey-flow.js` |
| 5 | `assertObligationPurity()` | none — boot gate: no `label`/`title`/`hint` keys on any obligation (`assertNoDisplayKeys(obligations())`) | `obligation-purity.js` (L1) |
| 6 | `assertFulfilmentBindingCoverage()` | none — forces registry build; fails boot if any leaf obligation is owned by no feature, owned twice, path/manifest mismatch etc. | `bridge/fulfilment-registry.js` |
| 7 | `buildDispatch(pages)` | `dispatchPages` from `journeys/linear/features/index.js` — array of controller `meta` objects (`{ id, slug, collects: [obligationName...] }`). Boot-fails on: path-unsafe obligation names, one obligation collected by two pages, any non-SYSTEM_POPULATED obligation collected by no page | `flow/dispatch.js` |
| 8 | `configureRecords(impl)` | `records` from `services/persistence/records/index.js` (L2 service — shared, stub/real switched) — impl surface: `create, load, list, has, replaceFulfilment, finalise, amend, cancelAmend, copy, softDelete, clear` | `engine/persistence/records.js` |
| 9 | `configureSession(impl, cookieNames)` | `session` from `services/persistence/session/index.js` + `SESSION_COOKIE_NAMES` from `journeys/linear/config.js` (`{ knownJourneys: 'liveAnimalsKnownJourneys', openingRun: 'liveAnimalsOpeningRun', flowOnlyAnswers: 'liveAnimalsFlowOnlyAnswers' }`) — cookie names are per-set | `engine/persistence/session.js` |
| 10 | `registerJourneyCookie(server)` | registers the three cookies (base64json) on the Hapi server | `engine/journey.js` |
| 11 | `server.ext('onPreHandler', ...)` | wraps `journeyEntryGuardTarget(request, h)` (the injected entry guard) → redirect+takeover or continue | routes.js inline |
| 12 | `if (isRealMode()) { await countries.prime(); await ports.prime() }` | primes L2 reference-data caches (`services/countries`, `services/ports`); `isRealMode()` = `process.env.LIVE_ANIMALS_MODE ?? 'real'` (`services/mode.js`) | routes.js inline |
| 13 | `server.route(allRoutes)` | `allRoutes` from `journeys/linear/features/index.js` — flat concat of every feature controller's `routes` array | routes.js inline |

**All injection points are module-level singletons** (`let configuredSet` / `let configuredRegistry` / `let configured` / `let impl`). Calling `configure*` again simply replaces the previous value — there is no per-set keying. See §7.

## 2. Obligations manifest shape (L3)

`sets/live-animals/obligations/`:

- `index.js` — the manifest. Re-exports every obligation object by name, plus:
  - `export const obligations = [ ...48 obligation objects... ]` (order irrelevant — evaluator builds hierarchy via `within` back-references)
  - `export const groups = obligations.filter(o => obligations.some(other => other.within === o))` — derived, same formula must appear in a sibling
  - a container back-ref loop populating `member.containers` for `requires.allOrNothingOfIds` carriers (generic primitive, currently zero carriers)
- `sections/*.js` — one file per domain area (`arrival.js`, `documents.js`, `import-reason.js`, `misc.js`, `origin.js`, `parties.js`, `system.js`, `transport.js`, `commodities/{aggregates,identifiers,lines}.js`). Each exports plain obligation objects:
  - minimal: `{ id: '<uuid>', name: '<camelCaseAnswerKey>', status: 'mandatory'|'optional' }`
  - conditional: replace `status` with `applyTo: <gateHelper>(gateObligation, value, whenTrue, whenFalse)` using L2 helpers from `model/obligations/helpers/index.js`: `equalsGate`, `includesGate`, `presentGate`, `allowListed`, `notInUnionOf`, `anyAllowListed`, `matches`, `alwaysInScope` (`branchedGate` = escape hatch). Helpers attach `.metadata` so `dependsOn` is derived; explicit `dependsOn: string[]` also accepted.
  - grouped/collection obligations reference their parent object via `within: <parentObligation>` (object identity, not id string).
  - branch outcomes carry `{ inScope, status, reasons: [{ code, explanation }] }`.
  - **No display keys** — `assertObligationPurity()` boot-fails on `label`/`title`/`hint` (memory rule: copy lives in .njk/copy files).
- `coverage.test.js` (set-owned) — structural integrity: `within` chains terminate (cycle guard), unique ids, unique names, system-populated fields declared-but-unwired allow-list (`KNOWN_UNWIRED`), dependsOn coverage.
- `whitelists.test.js` (set-owned) — per-(allowlist, gated obligation) scope assertions against the set's commodities service, plus a control value; pins allowlist shape.

## 3. Journeys/linear shape (L4)

`sets/live-animals/journeys/linear/`:

- `config.js` — `TEMPLATES = 'live-animals/journeys/linear'` (resolved against the `src/server/app/sets` nunjucks root), `LAYOUT = 'shared/layout.njk'` (resolved against the `src/server/app` root), `SESSION_COOKIE_NAMES` (set-prefixed names).
- `flow/flow.js` — `FLOW_ONLY_KEYS = ['importType', 'declaration']` (session-only answers not in the obligation model); `sections = [{ id, pages: [pageObj...], gate? }]` (10 sections; `review` section has explicit `gate: (scope) => scope.readyForCheckYourAnswers`); derived exports `allFlowPages`, `sectionOfPage`, `answerSections`.
- `flow/task-rows.js` — `taskRows = [{ id, pages: [...], parts?: [{ collection, only?/except? }], conditional?: true }]`; `rowStatus(row, answers, inScope, evaluation)` delegates to L2 `bridge/status` `statusOf(rowParts(row), ...)`; `rowParts` defaults to the pages' `collects` via L2 `flow/dispatch.js collectsOf`.
- `flow/run.js` — `RUN_STEPS = [{ id: page.id, target: flowPageTarget(page) }]` (opening-run order); `nextRunTarget(stepId, scope, journeyId)` walks remaining steps via L2 `flow/gates.js pageGatePasses`, falls back to `hubPath(journeyId)`.
- `flow/entry-guard.js` — `entryGuardTarget(request, h)` (async): deep-link guard redirecting fresh journeys to the import-type filter; uses L2 `shared/paths.js`, `engine/read.js get`, `bridge/obligation-source.js` (`obligationByName`, `SYSTEM_POPULATED`), `flow/run-state.js hasEnteredThroughFilter`. Also exports `hasCommittedNotificationAnswers(answers)`.
- `features/index.js` — imports every feature controller as a namespace; exports `dispatchPages` (the `meta` of every obligation-collecting page, 21 entries incl. `declaration.meta`) and `allRoutes` (concat of every controller's `routes`, 30 controllers incl. non-flow surfaces: dashboard, hub, cancel-amend, notification-actions, delete-notification, confirmation, check-answers).
- `features/evaluation.js` — `featureEvaluationBindings = Object.freeze([system, origin, importReason, ...])` — one `feature(name, bindings)` per feature area (14). Bindings built with L2 `bridge/fulfilment-bindings.js`:
  - `scalar({ field, obligation, convert? })` — field = answers key; obligation = the imported manifest OBJECT (registry asserts object identity against the manifest, not just the id).
  - `grouped({ field, obligation, groups: [{ field, token, obligation }...], convert? })` — groups chain must exactly match the obligation's `within` ancestor chain.
  - `feature(name, bindings)` — names unique across the registry; every leaf obligation must be owned by exactly one feature.
- Per feature dir: `page.js` (`export const xPage = { id, slug, gate? }` — pure identity, no imports), `controller.js` (exports `meta = { ...page, collects: [...] }` and `routes = kit.pageRoutes(page, { get, post })`), `template.njk`, `copy/copy.en.js` + `copy/copy.cy.js` + `copy/copy.test.js`, `evaluation.js`, `controller.test.js`, `*.e2e.spec.js` (E2E specs live inside the feature dirs and run against :3100).
- `fixtures/` — `characterisation-corpus.js` + `characterisation-oracles.json` (used by L2 bridge characterisation test composing the real set as fixture).

## 4. Services shape

- **Set-owned service**: `sets/live-animals/services/commodities/{index.js, stub.js}` — the commodity/species reference vocabulary. `index.js` is a pure lookup barrel over `stub.js` constants (`COMMODITY_OPTIONS`, `COMMODITY_CODES`, allowlists like `PASSPORT_COMMODITIES`...). Consumed by (a) the set's own obligations gates (allowlists), (b) the journey's pickers, (c) L2 notification-mapper via the `configureCommodityReference` port (needs exactly `commodityCodeFor`, `speciesLabel`, `typeTextForId`).
- **L2 shared services** (`services/`): `persistence/records` (stub/real notification store + `notification-mapper/` to backend payloads), `persistence/session`, `countries`, `ports`, `mode.js`. The `model-import-boundary` dep-cruiser rule lets pure model code import only `services/<name>/index.js` barrels.
- A sibling set supplies its own reference-data service(s) under `sets/plant-products/services/...` and passes them through the same (or new) L1 ports. NOTE: `configureCommodityReference` is consumed by the live-animals-shaped `notification-mapper` in L2 `services/persistence/records/` — CHED-PP will need its own mapper or a mapper port (see §7).

## 5. Checklist — artefacts a NEW `sets/plant-products/` must provide to boot

L3:
1. `obligations/index.js` — manifest: named exports + `obligations` array + derived `groups` (+ container back-ref loop if any `allOrNothingOfIds`).
2. `obligations/sections/*.js` — obligation objects (uuid `id`, unique path-safe `name`, `status` or `applyTo` via L2 gate helpers, `within` for grouped).
3. `obligations/coverage.test.js` + `whitelists.test.js` equivalents (set-owned conventions; copy the live-animals pattern).

L4 (`journeys/<journey>/`):
4. `config.js` — `TEMPLATES` (`'plant-products/journeys/<journey>'`), `LAYOUT`, per-set `SESSION_COOKIE_NAMES`.
5. `flow/flow.js` — `sections` (+ `FLOW_ONLY_KEYS`), `flow/task-rows.js` (`taskRows`, `rowStatus`), `flow/run.js` (`nextRunTarget`), `flow/entry-guard.js` (`entryGuardTarget`).
6. `features/index.js` — `dispatchPages` (every `collects` page meta; union of `collects` must cover every non-system leaf obligation exactly once) + `allRoutes`.
7. `features/evaluation.js` — `featureEvaluationBindings` covering every leaf obligation exactly once, obligation objects imported from the set's own manifest.
8. Per feature: `page.js`, `controller.js` (meta + routes via `kit.pageRoutes`), `template.njk`, `copy/copy.{en,cy}.js` + `copy.test.js`, `evaluation.js`, unit tests, e2e specs.
9. Hub/dashboard/check-answers/declaration/confirmation surfaces if the journey mirrors the live-animals task-list pattern (the review section gate `scope.readyForCheckYourAnswers` comes from L2 bridge scope — free).
10. Set services (e.g. `services/commodities/` analogue for plant/commodity reference data) + whatever the L2 mapper port needs.

L1 (the only files outside the set that change):
11. A plugin module (either a second export in `routes.js` or a sibling `routes-plant-products.js` — but dep-cruiser's `routes-is-the-gateway` rule currently whitelists ONLY `routes.js` (`pathNot: [^app/sets/, ^app/routes\.js$, .test.js]`) — a new L1 gateway file requires editing `.dependency-cruiser.cjs`).
12. Registration in `src/server/router.js` (currently `const routes = [liveAnimals]`).
13. Decide the singleton strategy (§7) — boot-time set switch vs multi-set refactor.

## 6. What dependency-cruiser + convention tests will demand of a second set

Dep-cruiser (`.dependency-cruiser.cjs`, `npm run lint:arch`, `--ignore-known` against `.dependency-cruiser-known-violations.json`):
- `no-l2-to-sets` — nothing under `engine|model|bridge|flow|services|lib|shared|analysis` may import `sets/plant-products/**` (production).
- `routes-is-the-gateway` — only `routes.js` may import the new set from outside it (see §5.11).
- `obligations-never-journeys` — `sets/plant-products/obligations/` may not import `sets/*/journeys/`.
- `journey-isolation` / `set-isolation` — already written with capture groups (`sets/([^/]+)/`), so they apply to the second set automatically with no config change; plant-products may not import live-animals and vice versa.
- `sets-not-l1` — the set may not import `routes.js`, `obligation-purity.js`, `copy-convention.test.js`, `copy-parity.test.js`.
- `no-circular`, `no-orphans` (warn) apply throughout.

Boot-time assertions (run on EVERY boot, so they are effectively convention gates): `assertObligationPurity` (no display keys), `assertFulfilmentBindingCoverage` (1:1 feature ownership of every leaf, manifest object identity, group-path/within-chain match, unique feature names), `buildDispatch` (path-safe names, unique page ownership, full page coverage of non-SYSTEM_POPULATED obligations).

App-root convention tests that are **hardcoded to `sets/live-animals/...`** and must be generalised or duplicated for a second set: `copy-convention.test.js` (line 10: features dir URL), `copy-parity.test.js` (lines 16–53: en/cy parity walk), `contract.test.js` (lines 19–39 import the live-animals controllers; line 65 posts `importType: 'live-animals'`), `routes.test.js` (line 3: auth over `allRoutes`), `indexed.test.js` (lines 9–12), `store-ops.test.js` (line 16). These compose the real set as fixture (legitimately, per architecture.md), but each is single-set: a sibling set gets zero test coverage from them until cloned/parameterised. Same for `bridge/*.test.js` characterisation/golden tests that import the live-animals set as fixture.

## 7. Hardcoded 'live-animals' / single-set assumptions in L2 + L1 (file:line)

Blocking / needs a decision:
1. **All configure seams are single-slot singletons** — `model/obligations/manifest.js:1` (`let configuredSet`), `bridge/fulfilment-registry.js:167` (`let configuredRegistry`), `flow/journey-flow.js:7` (`let configured`), `flow/dispatch.js:6-9` (module-level Maps + `resetDispatchState()` on rebuild), `engine/persistence/records.js:10` (`let impl`), `engine/persistence/session.js:1-3` (mutable exported cookie-name lets + `let impl`), `services/persistence/records/notification-mapper/commodity-reference.js:1` (`let implementation`). **One obligation set per Node process.** Cheapest sibling strategy: boot-time switch (config/env, cf. `LIVE_ANIMALS_MODE` precedent in `services/mode.js:1`) choosing which set plugin registers — i.e. plant-products is a sibling *deployment mode*, not a co-resident route tree. Co-residency requires keying every singleton by set (a platform refactor).
2. **Global URL namespace** — `shared/paths.js:1-10`: `BASE = ''`, `pagePath = /notifications/{journeyId}/{slug}`, `dashboardPath = '/'`. Both sets would claim the same routes; co-residency needs per-set BASE. (Also `engine/journey.js:15` cookie `path: BASE || '/'`.)
3. **Set-specific vocabulary inside L2** — `bridge/obligation-source.js:29` `SYSTEM_POPULATED = new Set(['poApprovedReferenceNumber'])`; `:31-34` `ENFORCED_AT_CONTINUE = new Set(['countryOfOrigin', 'commoditySelection'])`; `:41-43` `MAX_ENTRIES_FROM = { animalIdentifiers: 'numberOfAnimalsQuantity' }`; `:70` `SYSTEM_ANSWER_KEYS = new Set(['referenceNumber'])`. These are live-animals obligation names living in L2 (consumed by `flow/dispatch.js`, `flow/prerequisites.js`, engine write paths). A sibling set needs these injected via the manifest/configure seam or the sets' names will silently not match.
4. **L2 notification-mapper is live-animals-shaped** — `services/persistence/records/notification-mapper/` maps the live-animals answer tree to the backend live-animals payload (hence the `commodity-reference` port). CHED-PP needs its own records impl/mapper or a per-set mapper port; the `records` impl injected at routes.js:62 is the shared L2 one.
5. **L1 composition names** — `routes.js:45` plugin `name: 'live-animals'`; `src/server/router.js:7,20` imports/registers only `liveAnimals`. `.dependency-cruiser.cjs:31` whitelists only `routes.js` as sets gateway (see §5.11).

Non-blocking (cosmetic/tooling): `package.json:33` `depcruise:graph` outputs `live-animals-arch.svg`; app-root test files listed in §6; `contract.test.js:65` `importType: 'live-animals'` (the import-type-filter vocabulary itself lives in the set, which is fine).

Genuinely set-agnostic and reusable as-is: `model/` (evaluator, state-queries, gate helpers, `no-display-keys`), `bridge/` (fulfilment assembly/registry/status/scope incl. `readyForCheckYourAnswers`), `flow/` (dispatch, gates, prerequisites, journey-flow, run-state), `engine/` (read/write/journey/persistence ports), `lib/` (validate etc.), `shared/` (`kit.js` — `pageRoutes`, `base`, `nextTarget`, `runTarget`, `recoverableSave`, `errorSummary`, `dateField`; `copy.js copyFor`; `layout.njk`), `analysis/`. Nunjucks is already multi-set ready: `src/config/nunjucks/nunjucks.js:16-17,44` mounts BOTH `server/app` and `server/app/sets` as template roots, so `TEMPLATES = 'plant-products/journeys/<journey>'` resolves with no config change.

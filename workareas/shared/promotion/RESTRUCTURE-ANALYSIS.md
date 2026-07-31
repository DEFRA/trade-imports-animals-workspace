# Restructure analysis — app / sets / journeys (p-246)

Produced 2026-07-31 by a 14-agent analysis workflow over Sam's second-pass folder
restructure (`spike/EUDPA-288-model-retrofit`, frontend repo, uncommitted working
tree). 680 files read across 12 architectural slices, plus a mechanical
cross-layer import sweep and a dependency-cruiser rule design pass.
217 findings: **39 should-move · 139 needs-sorting · 39 confirmed-sorted**
(29 blockers, 103 important, 72 nice-to-have).

Target architecture judged against (Sam's brief):
- **L1** `src/server/app/` root — composition/registry; the only place that may
  know which sets exist.
- **L2** `app/{engine,model,bridge,flow,services,lib,shared,analysis}` — generic,
  set-agnostic platform. Never imports `sets/**`.
- **L3** `app/sets/<set>/obligations/` — the set's root data. Never imports
  journeys.
- **L4** `app/sets/<set>/journeys/<style>/` — one journey style (features + flow
  data). Lenses: a future plant-products set and a future power-user one-page
  journey must slot in without L2 upheaval.

## Executive summary

**The shape is right and the core already honours it.** The engine write path,
the model evaluator, and the persistence ports came through clean: no production
engine file imports services or sets (IO arrives via boot-injected ports —
`configureRecords`/`configureSession`), the obligations sections under the set
are pure data-first definitions with no display copy and no journey knowledge,
and routes.js was correctly re-pointed by hand. The 39 confirmed-sorted findings
are mostly of this kind: places a reviewer might doubt that turn out to be
dependency-inversion done properly.

**One architectural finding towers over the rest: the set contract is
decapitated.** `model/obligations/obligations.js` — the live-animals V4
manifest (48 obligations, groups, container wiring) — was left behind in L2 and
imports every section module up out of `sets/live-animals/obligations/sections/`.
Today the layering is effectively L2 → L3 → L2, and every consumer (bridge,
engine, 16 feature `evaluation.js` files) resolves the set *through* generic
infrastructure. Under the plant-products lens this file is precisely what a
second set would need its own copy of. It should move to
`sets/live-animals/obligations/index.js`, with L1 wiring the manifest into the
generic evaluator, and its set-pinned tests (whitelists, coverage) following it.

**Three more set-knowledge leaks in L2**, same family, smaller blast radius:
- `bridge/fulfilment-registry.js` imports the linear journey's feature bindings
  and bakes a set-wired singleton into generic bridge (the only production
  L2→L4 import in that slice).
- `services/commodities/` is live-animals vocabulary wearing a generic name —
  species lists and Cow-Domestic/Game conditionality as both data and API
  surface. A plant-products set could reuse none of it. Worse, three obligations
  files bind to it at module load, baking an IO-tier snapshot into supposedly
  pure set data.
- Engine has live-animals-branded internals: session cookie names
  (`liveAnimalsKnownJourneys` etc.), memo Symbols, and `BASE` pulled upward from
  L1 config — all parameterise-at-boot fixes, not moves.

**Six L2 modules reach into the journey for flow data** (flow/section-status,
flow/prerequisites, flow/navigation, flow/entry-guard, shared/kit,
analysis/simulate). The repo already contains the correct pattern —
`buildDispatch(pages)`, `configureRecords` — so the fix is a
`configureJourneyFlow`-style injection seam registered per journey at L1, plus
moving journey-policy modules and pure live-animals fixtures down. Not an
architectural redesign; a mechanical seam.

**The rendering/config plane is fully broken right now** (expected — first
pass): nunjucks roots, webpack's documents entry, vitest's e2e exclude,
playwright's features testDir and both dependency-cruiser files still point at
the deleted `obligation-based-app` tree; the two filesystem-discovery
convention tests (copy-convention, copy-parity) error at load on a `./features`
root that no longer exists. Most dangerous: **the architecture lint is
currently vacuous** — every depcruise rule anchors on a dead path, so
`lint:arch` passes while enforcing nothing, and package.json's scan root (only
the set subtree) can never see the L2→sets edges the new architecture most
needs to forbid.

**The view-name strategy needs a real decision, not a path fix.** Shared chrome
moved to L2 (`app/shared/layout.njk`) while feature views moved deeper
(`journeys/linear/features/`), so the old single `live-animals/` prefix can no
longer name both. Recommended: two template roots (`src/server/app` for
set-agnostic shared views, `src/server/app/sets` for journey views), with L1's
`TEMPLATES` constant carrying the full `live-animals/journeys/linear` prefix,
and generic chrome (error page, auth/unauthorised) re-pointed at set-agnostic
shared names — those two currently hardcode the set prefix, which fails the
second-set lens even after paths are fixed.

**Docs are stale again** — 21 findings, including the p-243 recipes citing
`obligation-based-app` paths throughout. Worth deciding whether docs split into
app-docs (platform) vs set-docs alongside the fix.

## Decisions Sam needs to make

1. **Manifest home**: move `model/obligations/obligations.js` (+ whitelists /
   coverage tests) to `sets/live-animals/obligations/index.js` with L1 wiring —
   agree the wiring seam.
2. **Commodities service**: move to the set (recommended by two independent
   slices), or keep at L2 as "generic service, set data" — analysts argue it is
   set API, not just set data.
3. **View-name strategy**: adopt the two-root scheme above (or an alternative).
4. **Journey-flow seam**: agree `configureJourneyFlow`-style injection for the
   six L2→journey imports.
5. **Docs split**: app-docs vs set-docs, or keep one folder.

## Scoreboard

| Slice | Files read | Findings |
|---|---|---|
| engine | 37 | 11 |
| model | 61 | 10 |
| bridge | 40 | 26 |
| services-persistence | 80 | 14 |
| services-other | 41 | 17 |
| app-spine | 59 | 24 |
| set-obligations | 11 | 9 |
| journey-features-A (documents, commodities) | 84 | 13 |
| journey-features-B (check-answers, addresses, transport, dashboard) | 93 | 12 |
| journey-features-C (long tail + journey flow) | 134 | 12 |
| wiring-and-configs | 55 | 13 |
| docs | 22 | 21 |
| import sweep (mechanical) | — | 20 |
| depcruise design | — | 15 |

## Should-move ledger (39)

### app-spine

- **src/server/app/flow/entry-guard.js** → `src/server/app/sets/live-animals/journeys/linear/flow/entry-guard.js (keep only a generic onPreHandler seam in L2)` _(important)_
  The entry guard is journey policy, not generic machinery: it imports the import-type-filter page from L4, hardcodes the flow-only 'importType' key and the journey's action slugs (amend/cancel-amend/copy/delete), so both future lenses (second set, second journey style) force edits here; routes.js already wires it per-set, so the policy can live with the journey it describes.
  - Evidence: src/server/app/flow/entry-guard.js:8 (import ../sets/.../import-type-filter/page.js), :11 (IMPORT_TYPE_KEY), :14 (ACTION_SLUGS)

- **src/server/app/analysis/flow-reachability/fixtures/seeds.js** → `src/server/app/sets/live-animals/journeys/linear/ (journey-owned prover fixtures, e.g. flow/reachability-fixtures/)` _(important)_
  seeds.js and its sibling scope-states.js are 100% live-animals domain data (species lines, transporter types, region-code axes, document types) sitting inside L2 analysis; the prover machinery (provers/problems/path-key) is parameterisable, but these fixtures — and the index.js that re-exports them — bind the whole analysis folder to one set+journey.
  - Evidence: src/server/app/analysis/flow-reachability/fixtures/seeds.js:6-157; fixtures/scope-states.js:11-24 (reasonForImport/transporterType axes); index.js:26-27 re-exports

- **src/server/app/shared/save-actions.test.js** → `src/server/app/sets/live-animals/journeys/linear/ (journey-level behaviour specs, beside flow/run.test.js)` _(nice-to-have)_
  This and its siblings journey-strip.test.js and change-context.test.js verify kit semantics by driving five-plus concrete live-animals controllers from inside L2 shared — they are journey behaviour specs in an L2 folder, keeping shared/ transitively dependent on L4.
  - Evidence: src/server/app/shared/save-actions.test.js:11-18; journey-strip.test.js:16-23; change-context.test.js:11-17

### bridge

- **src/server/app/bridge/fixtures/characterisation-corpus.js** → `sets/live-animals (colocated with the set's characterisation/contract tests); bridge-local tests should pin the generic machinery with a small synthetic manifest instead.` _(important)_
  100% live-animals journey data (commoditySelection 'Cow', animalIdentifierEarTag, GBN-AG references) parked as an L2 fixture, and it reaches into flow/fixtures/happy-path.json — another set fixture living in L2 flow.
  - Evidence: fixtures/characterisation-corpus.js:4 (../../flow/fixtures/happy-path.json), :16-27 (commodityLine builder with live-animals field names), :31-32 (GBN-AG-26-ABC123)

- **src/server/app/bridge/fixtures/characterisation-oracles.json** → `sets/live-animals, alongside characterisation-corpus.js` _(important)_
  Golden oracle of live-animals UUID fulfilments/evaluations/mapper outputs — set data by definition; follows the corpus wherever it goes.
  - Evidence: fixtures/characterisation-oracles.json:4 (GBN-AG-26-ABC123 keyed by live-animals obligation UUIDs)

- **src/server/app/bridge/fulfilments.characterisation.test.js** → `L1 (src/server/app/ root, beside contract.test.js) or the set — it characterises the composed live-animals pipeline, not bridge in isolation.` _(important)_
  A whole-pipeline golden test spanning bridge + model + services (it asserts the persistence notification-mapper's output), driven entirely by live-animals fixtures — an app-level contract test living in the bridge directory.
  - Evidence: fulfilments.characterisation.test.js:12-15 (import from '../services/persistence/records/notification-mapper/index.js'), :5 (live-animals corpus), :43-47 (mapper assertions)

- **src/server/app/bridge/status/status.test.js** → `sets/live-animals/journeys/linear/flow/ (with the task rows it pins); a thin generic statusOf unit test can stay in bridge/status/.` _(important)_
  Imports L4 three times (dispatchPages, taskRows, answerSections) and pins the live-animals journey's exact row/section rollup literals — this is a journey-behaviour test, not a bridge test.
  - Evidence: status/status.test.js:4 (sets/live-animals/journeys/linear/features/index.js), :8 (linear/flow/task-rows.js), :13 (linear/flow/flow.js), :34-222 (12-row/9-section live-animals expectations)

### depcruise

- **src/server/app/model/obligations/obligations.js** → `src/server/app/sets/live-animals/obligations/index.js` _(important)_
  The largest single violation the new rules surface is structural, not just an import edge: this file is the live-animals V4 manifest (header cites Confluence 'Live Animals Data Fields - V4') sitting in generic L2 model/, importing all 11 sets/live-animals/obligations/sections modules — a second set cannot reuse model/ while its rival's manifest is hardwired there; move the manifest to the set (as its obligations barrel) and have routes.js pass it into the generic machinery (evaluator/helpers/state-queries stay in model/), which also fixes obligation-purity.js transitively reaching sets.
  - Evidence: src/server/app/model/obligations/obligations.js:2-5 (V4 manifest header), :58-123 (11 sets/live-animals imports); generic machinery correctly separate at model/obligations/{evaluator,helpers,state-queries}.js

- **src/server/app/config.js** → `src/server/app/shared/paths.js (path/breadcrumb helpers to L2; TEMPLATES/LAYOUT constants into sets/live-animals/journeys/linear/)` _(important)_
  config.js is the reason ~40 journey files import L1: its exports are two different things — generic URL/breadcrumb helpers (pagePath, hubPath, createPath, dashboardPath, breadcrumbs) that belong in L2 shared/, and set-specific template identity (TEMPLATES = 'live-animals', LAYOUT) that belongs inside the journey itself; splitting it makes the sets-no-import-app-root rule enforceable without a permanent 40-edge baseline, and removes the oddity that a second set's journey would import a config whose TEMPLATES names its rival.
  - Evidence: src/server/app/config.js:3 (TEMPLATES = 'live-animals' — set knowledge), :6-18 (generic path/breadcrumb helpers); consumer spread e.g. sets/live-animals/journeys/linear/features/hub/controller.js:1, .../flow/run.js:1

### docs

- **src/server/app/docs/README.md** → `src/server/app/sets/live-animals/docs/README.md (with a new thin platform index left at src/server/app/docs/)` _(important)_
  The app-level docs index is entirely set-framed — titled 'Live-animals service — documentation index', describing routes.js's liveAnimals export and the trader journey — which under the target architecture wrongly presents one set as the whole platform; under the second-set lens a plant-products author would land on live-animals docs as 'the' docs. Content claims verified correct (npm scripts dev/test:live-animals/test:e2e/test:features all exist; routes.js:15 exports liveAnimals).
  - Evidence: docs/README.md:1-14, :34-50; package.json:15,20,21,36; src/server/app/routes.js:15

### engine

- **src/server/app/engine/request-view.parity.test.js** → `src/server/app/sets/live-animals/journeys/linear/ (e.g. features/request-view.parity.test.js)` _(blocker)_
  A per-page live-animals journey test living in engine: it imports 22 live-animals feature controllers plus the set's dispatchPages, a hard L2->sets/** violation, and its subject (every page renders identical context from the canonical view) is a journey-layer concern, not an engine one.
  - Evidence: request-view.parity.test.js:5 (dispatchPages from ../sets/live-animals/journeys/linear/features/index.js), :18-39 (22 controller imports from ../sets/live-animals/journeys/linear/features/**), :88-105 (scalarPages table naming live-animals pages), :135-172 (drives each page's GET handler)

- **src/server/app/engine/one-load-per-request.test.js** → `src/server/app/ root (beside store-ops.test.js) or src/server/app/services/persistence/records/real/` _(important)_
  Engine test imports the REAL services records adapter and pins its network-call counts — an engine+services integration contract whose wiring (real adapter into engine ports) is composition knowledge that belongs at L1 root or with the adapter, not inside L2 engine.
  - Evidence: one-load-per-request.test.js:10 (records as realRecords from '../services/persistence/records/real/index.js'), :26-30 (backend URLs), :86 (configureRecords(realRecords)), :91-123 (asserts GET/PUT counts against the real adapter)

### import-sweep

- **src/server/app/model/obligations/obligations.js** → `src/server/app/sets/live-animals/obligations/ (set-owned aggregation) with L1 registry wiring` _(important)_
  L2 model production code imports the live-animals set's obligation sections via 11 imports, hardcoding the set into the generic model layer — a second set cannot slot in without editing L2.
  - Evidence: obligations.js:58,62,72,80,89,96,101,106,113,114,123 all import from '../../sets/live-animals/obligations/sections/...' (arrival.js, commodities/aggregates.js, commodities/identifiers.js, commodities/lines.js, documents.js, import-reason.js, misc.js, origin.js, parties.js, system.js, transport.js)

- **src/server/app/bridge/fulfilment-registry.js** → `L1 composition (routes.js/config wiring) or set-owned registry under sets/live-animals` _(important)_
  L2 bridge production code imports the live-animals linear journey's feature evaluation bindings (L2 -> L4), the steepest possible layer inversion — generic bridge depends on one journey style of one set.
  - Evidence: fulfilment-registry.js:2 import { featureEvaluationBindings } from '../sets/live-animals/journeys/linear/features/evaluation.js'

- **src/server/app/flow/navigation.js** → `parameterise via L1 injection or relocate under sets/live-animals/journeys/linear/flow` _(important)_
  L2 flow production code imports the live-animals linear journey's flow definition (L2 -> L4); same violation in three sibling files, making the whole flow/ layer live-animals-linear-specific.
  - Evidence: flow/navigation.js:3 imports '../sets/live-animals/journeys/linear/flow/flow.js'; flow/prerequisites.js:5 imports allFlowPages from same; flow/section-status.js:3 imports '../sets/live-animals/journeys/linear/flow/task-rows.js'; flow/entry-guard.js:8 imports '../sets/live-animals/journeys/linear/features/import-type-filter/page.js'

- **src/server/app/shared/kit.js** → `inject nextRunTarget from L1 or move the run-target logic into the journey` _(important)_
  L2 shared production code imports the live-animals linear journey's run-target function (L2 -> L4).
  - Evidence: shared/kit.js:10 import { nextRunTarget } from '../sets/live-animals/journeys/linear/flow/run.js'

- **src/server/app/analysis/simulate.js** → `parameterise sections as input or relocate under the journey` _(important)_
  L2 analysis production code imports the live-animals linear journey's flow sections (L2 -> L4).
  - Evidence: analysis/simulate.js:2 import { sections } from '../sets/live-animals/journeys/linear/flow/flow.js'

### journey-features-B

- **src/server/app/sets/live-animals/journeys/linear/features/dashboard/controller.js** → `src/server/app/sets/live-animals/ (set-level surface, outside journeys/linear/)` _(nice-to-have)_
  The dashboard is the service landing page — mounted at '/', owns the create endpoint and lists every notification — yet lives inside one journey style; under the second-journey-style lens it cannot be duplicated beside linear/ (there is only one '/'), so its placement forces upheaval, and it also hardcodes the linear journey's entry page instead of deriving it from the journey's flow.
  - Evidence: dashboard/page.js:1 slug '' ; controller.js:114 routes GET dashboardPath() ('/') and :126 POST createPath(); controller.js:17,130 imports importTypeFilterPage from '../import-type-filter/page.js' to pick the journey entry page — journey-order knowledge that belongs to flow (compare kit.nextTarget/flow usage elsewhere)

### journey-features-C

- **src/server/app/sets/live-animals/journeys/linear/features/import-type-filter/controller.js** → `src/server/app/ (L1 composition layer, e.g. src/server/app/entry/import-type-filter/) — the one place allowed to know which sets exist` _(important)_
  The import-type filter is the cross-set entry router — it enumerates every set (live-animals, poao, hrfnao, plants) and decides which set a journey enters, so it cannot live inside sets/live-animals/journeys/linear; a second set (plant-products) would have to reach inside a rival set's journey to be routable, and L2 already has to reach into it (entry-guard.js imports its page.js, violating 'L2 must not import from sets/**').
  - Evidence: controller.js:28 (IMPORT_TYPES = ['live-animals','poao','hrfnao','plants']), controller.js:86-88 (non-live-animals routing), copy/copy.en.js:4-9 (labels for all four sets); corroborating L2 breach: src/server/app/flow/entry-guard.js:8 imports features/import-type-filter/page.js

- **src/server/app/sets/live-animals/journeys/linear/features/system/evaluation.js** → `src/server/app/sets/live-animals/ set level (beside obligations/, e.g. a set-level bindings module)` _(nice-to-have)_
  A 'feature' directory containing only a fulfilment binding for the system-minted poApprovedReferenceNumber — no page, controller or view — so it is set-level persistence mapping, not journey-page knowledge; a second journey style over the same set would have to duplicate it.
  - Evidence: system/evaluation.js:1-9 is the directory's only file (find listing); binding references no page — contrast every sibling evaluation.js which mirrors a page's collects (e.g. origin/controller.js:25-30)

### model

- **src/server/app/model/obligations/obligations.js** → `src/server/app/sets/live-animals/obligations/ (manifest/index module beside sections/)` _(blocker)_
  The live-animals V4 obligations manifest — set-root data (L3) — still lives in L2 and imports from sets/** (banned direction): 10 import blocks pull every section module from ../../sets/live-animals/obligations/sections/*, then re-export 48 named obligations plus the `obligations` array and `groups`. The re-parent moved the sections but left the aggregator behind, so every L2/bridge/engine/services consumer still resolves the set through model/. Under the second-set lens this file is exactly what plant-products would need its own copy of — it is per-set, not generic.
  - Evidence: src/server/app/model/obligations/obligations.js:2 ('Obligations — Live Animals V4 data-field model'), :58-123 (imports from ../../sets/live-animals/obligations/sections/{arrival,commodities/*,documents,import-reason,misc,origin,parties,system,transport}.js), :182-232 (the manifest array), :235-237 (groups)

- **src/server/app/model/obligations/evaluator.test.js** → `src/server/app/sets/live-animals/obligations/ (colocated with the moved manifest)` _(important)_
  This is a 1,413-line behavioural spec of the live-animals SET against the evaluator, not of the evaluator itself — it imports 44 named live-animals obligations, pins V4 reason codes, commodity gating (Cow/Horse/Cat/Fish), the accompanying-documents 0..10 cap, and the 18 data-only always-in-scope obligations. The generic evaluator behaviour is already covered set-agnostically by evaluator.units.test.js and path-prefix-depth.test.js; only the synthetic two-hop-cascade block (lines 1234-1304) is genuinely generic and could stay behind.
  - Evidence: src/server/app/model/obligations/evaluator.test.js:4-50 (imports 44 obligations from './obligations.js'), :61-99 (V4 reason-code constants), :104-108 (Cow/Horse/Cat line mnemonics), :1191-1219 (documents 0..10 cap), :1325-1412 (18-obligation data-only-shape pins)

- **src/server/app/model/obligations/whitelists.test.js** → `src/server/app/sets/live-animals/obligations/ (colocated with the moved manifest)` _(important)_
  Set-specific allowlist drift-guard living in L2: it imports the live-animals commodities service (cphCommodities, passportCommodities, etc.) and hard-pins the expected species lists ('Cat','Cow','Dog','Horse'), gating seven live-animals obligations. This is the set's contract with its own reference data — L2 must not import services/commodities or know species lists.
  - Evidence: src/server/app/model/obligations/whitelists.test.js:29-38 (import from '../../services/commodities/index.js'), :179-187 (EXPECTED hard-coded species lists), :126-136 (UNIT_SCOPED_ALLOWLISTS over passport/tattoo/earTag/horseName/permanentAddress)

- **src/server/app/model/obligations/coverage.test.js** → `src/server/app/sets/live-animals/obligations/ (manifest-integrity test beside the moved manifest)` _(important)_
  Runs manifest-integrity invariants (within-cycle check, id/name uniqueness, dependsOn coverage) over the LIVE live-animals manifest and pins set specifics (poApprovedReferenceNumber declared always-in-scope, no applyTo). The invariants themselves are generic and worth extracting as reusable L2 assertion helpers so a second set gets them for free, but as written this test is bound to the live-animals manifest and moves with it.
  - Evidence: src/server/app/model/obligations/coverage.test.js:6 (import { obligations } from './obligations.js'), :80-99 (poApprovedReferenceNumber pins), :133-147 (dependsOn coverage over the live manifest)

### services-other

- **src/server/app/services/commodities/stub.js** → `src/server/app/sets/live-animals/ (set-level reference data, e.g. sets/live-animals/reference/commodities/, beside obligations/)` _(blocker)_
  Species lists and live-animals commodity conditionality data — the exact category the target names as forbidden in L2 — live in the generic services layer; the data IS the service (stub-only, no client/real leg) and every runtime consumer is sets/live-animals.
  - Evidence: COMMODITY_SPECIES stub.js:15-26 and SPECIES_OPTIONS stub.js:28 are literal species lists; PASSPORT_COMMODITIES/TATTOO_COMMODITIES/EAR_TAG_COMMODITIES/HORSE_NAME_COMMODITIES/PERMANENT_ADDRESS_COMMODITIES/UNWEANED_ANIMAL_COMMODITIES/CPH_COMMODITIES stub.js:107-119 are obligation-applicability data for live-animals pages; COMMODITY_OPTIONS stub.js:1 is the prototype's 5-animal set; consumers are sets/live-animals/obligations/sections/commodities/{identifiers,aggregates,lines}.js and ~14 journey feature files (grep), plus two existing L2 leak sites that must move/inject with it: services/persistence/records/notification-mapper/mapper-{a,b}/commodity.js and model/obligations/whitelists.test.js:38

- **src/server/app/services/commodities/index.js** → `src/server/app/sets/live-animals/ (with its stub.js)` _(blocker)_
  The accessor surface is live-animals-shaped, not a generic commodity service — typeIdForSpecies/typeTextForId encode the Cow Domestic/Game split and the passport/ear-tag/tattoo/unweaned/CPH accessors are live-animals journey conditionality; a plant-products set could reuse none of it.
  - Evidence: index.js:29-35 (type-per-species derivation with Cow-specific commentary), index.js:47-61 (per-obligation commodity-list accessors); comment index.js:32-33 hardcodes 'Domestic'/'Game' for Cow semantics

- **src/server/app/services/certification-purposes/stub.js** → `src/server/app/sets/live-animals/ (set reference vocabulary, beside obligations/)` _(important)_
  The 16 V4 certifiedFor slugs plus their display labels are live-animals-only vocabulary (registered-equine-animal, live-aquatic-animals-for-human-consumption) hand-curated with no upstream, consumed exclusively by sets/live-animals features — set data in L2.
  - Evidence: stub.js:1-20 (full CERTIFICATION_PURPOSES map); consumers are only sets/live-animals/journeys/linear/features/additional-details/controller.js and check-answers/view-model/cards/consignment/additional-animal-details.js (grep); pinned as the live-animals Mapper A backend contract by services/mapper-a-enum-contract.test.js:30-47

- **src/server/app/services/certification-purposes/index.js** → `src/server/app/sets/live-animals/ (with its stub.js)` _(important)_
  Thin accessor over set-specific vocabulary; moves with its data.
  - Evidence: index.js:1-11 imports only ./stub.js and reshapes it

- **src/server/app/services/document-types/stub.js** → `src/server/app/sets/live-animals/ (set reference vocabulary)` _(important)_
  DOCUMENT_TYPE_OPTIONS is the exact 14-value live-animals backend DocumentType enum (ITAHC, JOURNEY_LOG, CATCH_CERTIFICATE) — a plant-products set would carry a different document enum, so this is set vocabulary in L2, stub-only with no client/real leg.
  - Evidence: stub.js:1-16; the mapper-a contract test declares it 'the exact values the frontend emits to the backend' (services/mapper-a-enum-contract.test.js:6-11); only consumers are sets/live-animals/journeys/linear/features/documents/{derive-document-type,upload-config}* (grep)

- **src/server/app/services/document-types/index.js** → `src/server/app/sets/live-animals/ (with its stub.js)` _(important)_
  Thin accessor over set-specific vocabulary; ATTACHMENT_TYPE_OPTIONS (generic file extensions) rides along but is only consumed by the set's upload-config, so it moves too.
  - Evidence: index.js:1-5; attachmentTypes consumers: sets/live-animals/journeys/linear/features/documents/upload-config.test.js only (grep)

- **src/server/app/services/import-reason-purpose/stub.js** → `src/server/app/sets/live-animals/ (set reference vocabulary)` _(important)_
  Reason/purpose vocabularies are live-animals-specific (temporaryAdmissionHorses, companion-animal-not-for-resale-or-rehoming, breeding/fattening/restocking), hand-curated, consumed only by sets/live-animals import-reason and import-purpose features.
  - Evidence: stub.js:6 (temporaryAdmissionHorses), stub.js:17-18 (companion-animal slug); consumers are exclusively sets/live-animals/journeys/linear/features/{import-reason,import-purpose,additional-details,check-answers}/** (grep)

- **src/server/app/services/import-reason-purpose/index.js** → `src/server/app/sets/live-animals/ (with its stub.js)` _(important)_
  Thin accessor over set-specific vocabulary; moves with its data.
  - Evidence: index.js:1-21 imports only ./stub.js and reshapes it

- **src/server/app/services/mapper-a-enum-contract.test.js** → `src/server/app/sets/live-animals/ (beside wherever document-types and certification-purposes land)` _(important)_
  This test pins the live-animals V4 backend vocabulary (Mapper A DocumentType enum + certifiedFor slugs) at the generic services root; it is the set's backend-contract pin and must travel with the two vocabularies it locks.
  - Evidence: Lines 6-11 (comment: 'the exact values the frontend emits to the backend' for the live-animals Mapper A), lines 13-47 (the two V4 vocabularies), imports at lines 3-4 from ./document-types/ and ./certification-purposes/

- **src/server/app/services/transport-reference/stub.js** → `src/server/app/sets/live-animals/ (set reference vocabulary)` _(nice-to-have)_
  Same pattern as the other vocabulary modules — stub-only, no upstream, consumed solely by sets/live-animals transport features; MEANS_OF_TRANSPORT is plausibly IPAFFS-generic so this is the weakest move, but keeping one hand-curated vocab in L2 on speculation of reuse is the wrong default, and TRANSPORTER_TYPES (Commercial/Private) belongs to animal-transporter authorisation.
  - Evidence: stub.js:1-8; consumers only sets/live-animals/journeys/linear/features/transport/{transporters,port-of-entry}/*.controller.js (grep); index.js:1-11 is a thin re-export that moves with it

### services-persistence

- **src/server/app/services/persistence/records/notification-mapper/index.js** → `src/server/app/sets/live-animals/persistence/notification-mapper/ (whole notification-mapper/ subtree, ~20 files)` _(important)_
  The entire notification-mapper is live-animals domain code in L2: it imports ~40 named live-animals obligations and builds the CHED-A/IPAFFS notification field homes (species, animal identifiers, transporters, accompanying documents); nothing is reusable by a second set, so it belongs in the set with L1 injecting it into the records adapter as a projection.
  - Evidence: notification-mapper/mapper-a/sections/direct-fields.js:1-10, mapper-a/sections/transport.js:1-7, mapper-b/documents.js:1-9, mapper-b/sections/purpose.js:1, shared/lines/from-fulfilment.js:1-16 (all import named obligations from model/obligations/obligations.js, which is the live-animals V4 manifest — model/obligations/obligations.js:1-4,58 already imports sets/live-animals/obligations/sections/*); mapper-a/commodity.js:1 and shared/lines/species-entry.js:1 import species/commodity reference data from services/commodities

- **src/server/app/services/persistence/records/mapper-a-contract.test.js** → `alongside the notification-mapper in sets/live-animals (together with notification-mapper/notification-mapper.test.js)` _(important)_
  This is a live-animals CHED-A payload contract test (full backend notification for a cow consignment, driven by the set's happy-path fixture) sitting in the generic L2 records layer; it moves with the mapper it pins.
  - Evidence: mapper-a-contract.test.js:7-12 (reads ../../../flow/fixtures/happy-path.json — live-animals answers), :22-119 (asserts the full CHED-A shaped payload); companion notification-mapper/notification-mapper.test.js:30-67 is equally set-specific

### set-obligations

- **src/server/app/model/obligations/obligations.js** → `src/server/app/sets/live-animals/obligations/index.js` _(blocker)_
  The live-animals V4 manifest — the set's aggregation point (manifest array, groups derivation, container back-ref wiring) — lives in L2 and imports sets/** directly, violating 'L2 MUST NOT import from sets/**'; the set's obligations/ folder has no index of its own, so the set contract is incomplete and every journey feature consumes obligations through generic infrastructure (e.g. features/*/evaluation.js import from '../../../../../../model/obligations/obligations.js'). Under the second-set lens plant-products cannot slot in: model/obligations IS live-animals. The set-specific tests pinned to this manifest (whitelists.test.js is explicitly 'V4'; coverage.test.js walks the concrete manifest) should follow it down.
  - Evidence: model/obligations/obligations.js:58-123 (14 imports from ../../sets/live-animals/obligations/sections/*), :182-232 (manifest), :235-237 (groups), :247-266 (back-ref wiring); consumers: sets/live-animals/journeys/linear/features/import-purpose/evaluation.js:2 and 15 sibling evaluation.js files all import model/obligations/obligations.js; set-coupled tests: model/obligations/whitelists.test.js:4-13,28,38; model/obligations/coverage.test.js:6,81-95

- **src/server/app/services/commodities/stub.js** → `src/server/app/sets/live-animals/ (set-owned reference data, behind a generic MDM-service port kept in L2 services)` _(important)_
  The entire live-animals commodity/species vocabulary (Cow/Horse/Cat/Dog/Fish, Bos taurus etc., plus the seven gate allowlists PASSPORT_/TATTOO_/EAR_TAG_/HORSE_NAME_/PERMANENT_ADDRESS_/UNWEANED_/CPH_COMMODITIES) sits in L2 services under a generic name — set knowledge leaked into generic infrastructure, discovered via the obligations slice's imports; a plant-products set would need a completely different vocabulary and could not reuse this service unchanged.
  - Evidence: services/commodities/stub.js:1-26 (live-animals species lists), services/commodities/index.js:47-61 (allowlist accessors); consumed from the set at sets/live-animals/obligations/sections/commodities/lines.js:1, identifiers.js:1-7, aggregates.js:1-4

### wiring-and-configs

- **src/server/common/helpers/transport-routing.js** → `delete (dead code) — or src/server/app/sets/live-animals/journeys/linear/features/transport/ if ever needed` _(nice-to-have)_
  Live-animals journey knowledge (RAILWAY/ROAD_VEHICLE means, '/transited-countries' and '/transporters' page slugs) sits in generic src/server/common, and nothing in production imports it — only its own test — so it is a dead set-knowledge leak that would mislead a second set into treating it as shared infrastructure; delete it and its test.
  - Evidence: transport-routing.js:1-11 hardcodes means-of-transport values and journey slugs; repo-wide grep shows the only importer is transport-routing.test.js:5


## Needs-sorting ledger (139)

### app-spine

- **src/server/app/config.js** _(blocker)_
  Template addressing is stale after the re-parent: TEMPLATES='live-animals' and LAYOUT='live-animals/shared/layout.njk' resolve against nunjucks roots that still point at the deleted src/server/obligation-based-app/obligation-sets tree, and layout.njk itself now lives at app/shared/ (not under any live-animals dir) while feature views live under sets/live-animals/journeys/linear/features — so no view or layout name currently resolves.
  - Evidence: src/server/app/config.js:3-4; src/config/nunjucks/nunjucks.js:18,45 (stale roots); src/server/app/shared/layout.njk (actual location); sets/live-animals/journeys/linear/features/hub/controller.js:23 (view name `live-animals/features/hub/template` missing journeys/linear); companion stale configs: webpack.config.js:28, vitest.config.js:16, playwright.config.js:45

- **src/server/app/copy-convention.test.js** _(blocker)_
  Discovery root is stale: FEATURES_DIR is './features' relative to app/, which no longer exists (features moved to sets/live-animals/journeys/linear/features), so readdirSync throws at module load and the whole convention suite errors; the dynamic import at line 56 is equally stale — and under the two-lens future the root should enumerate per set/journey rather than hardcode one.
  - Evidence: src/server/app/copy-convention.test.js:9 (`new URL('./features', import.meta.url)`), :56 (`import(`./features/${feature}/copy/copy.en.js`)`)

- **src/server/app/copy-parity.test.js** _(blocker)_
  Half-updated: the static dashboard-copy imports were repointed to the new sets path but the feature discovery root and the paired dynamic imports still read './features', which no longer exists, so the parity suite errors at load.
  - Evidence: src/server/app/copy-parity.test.js:19 (stale FEATURES_DIR), :47-48 (stale dynamic imports) vs :16-17 (already-updated sets imports)

- **src/server/app/shared/layout.test.js** _(blocker)_
  Renders the layout by the stale template name 'live-animals/shared/layout.njk', which cannot resolve now the layout lives at app/shared/layout.njk and the nunjucks roots still point at the deleted obligation-sets tree.
  - Evidence: src/server/app/shared/layout.test.js:9; src/config/nunjucks/nunjucks.js:18,45; src/server/app/shared/layout.njk

- **src/server/app/shared/error.njk** _(blocker)_
  Extends the stale set-namespaced name "live-animals/shared/layout.njk" even though the layout is now its sibling in the same L2 folder — an unresolvable template reference and a set-name leak inside generic shared chrome.
  - Evidence: src/server/app/shared/error.njk:1

- **src/server/app/shared/kit.js** _(important)_
  L2 shared kit imports the live-animals linear journey's run order directly (nextRunTarget), and bakes journey knowledge into generic helpers (CYA_SLUG='notification-view', opening-run routing in runTarget/nextTarget) — a second set or journey style cannot reuse kit without editing it; the run seam should be injected like configureRecords/buildDispatch are.
  - Evidence: src/server/app/shared/kit.js:10 (import ../sets/live-animals/journeys/linear/flow/run.js), :48 (CYA_SLUG), :76-86 (runTarget/nextTarget)

- **src/server/app/flow/section-status.js** _(important)_
  L2 flow imports the linear journey's task-rows module (rowStatus, taskRows), so generic section-status machinery is statically bound to one journey; readyForCheckYourAnswers iterates a concrete journey's taskRows from inside L2.
  - Evidence: src/server/app/flow/section-status.js:3 (import ../sets/live-animals/journeys/linear/flow/task-rows.js), :11-15

- **src/server/app/flow/prerequisites.js** _(important)_
  L2 flow imports allFlowPages from the linear journey's flow module to compute continue-prerequisite ordering — the page order is journey data and should be injected (dispatch.js's buildDispatch(pages) is the in-repo exemplar), not imported upward from L4.
  - Evidence: src/server/app/flow/prerequisites.js:5 (import ../sets/live-animals/journeys/linear/flow/flow.js), :8-9

- **src/server/app/flow/navigation.js** _(important)_
  L2 navigation imports sections/sectionOfPage from the linear journey's flow module — sectionEntry/nextInSection are generic algorithms hardwired to one journey's section tree via a static L2→L4 import.
  - Evidence: src/server/app/flow/navigation.js:3 (import ../sets/live-animals/journeys/linear/flow/flow.js)

- **src/server/app/analysis/simulate.js** _(important)_
  Generic journey simulator statically imports the linear journey's sections — should take the section tree as a parameter (it already takes answers) so a second journey style can be simulated with the same code.
  - Evidence: src/server/app/analysis/simulate.js:2 (import ../sets/live-animals/journeys/linear/flow/flow.js)

- **src/server/app/analysis/flow-reachability/provers.js** _(important)_
  proveScopeCompleteness imports the concrete obligations manifest from app/model (itself L3 set data parked in L2), so the L2 prover is bound to the live-animals manifest; the manifest should arrive as a parameter alongside the already-injectable scopeFor/pagesFor.
  - Evidence: src/server/app/analysis/flow-reachability/provers.js:3 (import ../../model/obligations/obligations.js), :53-55

- **src/server/app/analysis/flow-reachability/problems/reasons.js** _(nice-to-have)_
  FLOW_ONLY_OBLIGATIONS hardcodes the linear journey's flow-only keys ('importType', 'declaration') inside L2 — journey knowledge that should be part of the injected journey config, not a constant in generic analysis code.
  - Evidence: src/server/app/analysis/flow-reachability/problems/reasons.js:6

- **src/server/app/obligation-purity.js** _(important)_
  The L1 purity gate reaches the live manifest via './model/obligations/obligations.js' — an L2 path that actually houses the set's manifest (which itself imports ../../sets/live-animals/obligations/sections/*, i.e. L2 importing L3 set data); once the manifest lands in L3 this should assert per registered set (take the manifest as an argument) rather than hardwire one collection.
  - Evidence: src/server/app/obligation-purity.js:1; src/server/app/model/obligations/obligations.js:58-123 (manifest importing sets/**)

- **src/server/app/shared/copy.en.js** _(nice-to-have)_
  The notificationActions namespace (Copy as new / Delete success banners) is feature copy for the journey's notification-actions feature living in shared chrome — it exceeds the file's own stated scope (layout/error-summary/save-actions/journey-strip) and violates the features-own-their-copy convention the root test enforces; same block exists in copy.cy.js.
  - Evidence: src/server/app/shared/copy.en.js:2-8 (stated scope) vs :30-41 (notificationActions); copy.cy.js:23-31; copy-convention.test.js:67-75 lists only the four chrome namespaces

- **src/server/app/config.js** _(nice-to-have)_
  breadcrumbs() hardcodes the English string 'Your notifications' in L1 config, duplicating sharedCopy.layout.breadcrumbs.serviceHome and bypassing the copyFor i18n seam every other surface uses.
  - Evidence: src/server/app/config.js:15-18; src/server/app/shared/copy.en.js:14-16

- **src/server/app/lib/validate/persists-cleaned-value.test.js** _(nice-to-have)_
  An L2 lib test imports the live set's dispatchPages solely to satisfy buildDispatch before exercising a generic commit path — a synthetic one-page fixture would decouple lib/ from sets/** entirely.
  - Evidence: src/server/app/lib/validate/persists-cleaned-value.test.js:10 (import ../../sets/live-animals/journeys/linear/features/index.js)

- **src/server/app/flow/gates.test.js** _(nice-to-have)_
  Mixes genuinely generic cases (synthetic gates, dispatch-not-built guard) with journey-behaviour suites (RULE 1/RULE 2 over the live sections, transporter-spoke expectations) that import four L4 modules — the journey-behaviour halves belong beside the journey's own flow specs; same pattern in dispatch.test.js, unrecognised-answer-keys.test.js (+ its live-animals fixtures/happy-path.json), simulate.test.js and flow-reachability.test.js.
  - Evidence: src/server/app/flow/gates.test.js:3-9,81-215; dispatch.test.js:2,25-44,115-145; unrecognised-answer-keys.test.js:10-12 + flow/fixtures/happy-path.json:4-40; analysis/flow-reachability/flow-reachability.test.js:5,95-141

### bridge

- **src/server/app/bridge/fulfilment-registry.js** → `Keep createFulfilmentRegistry in bridge; move the fulfilmentRegistry singleton + assertFulfilmentBindingCoverage composition to L1 (src/server/app/ root wiring), injected downstream. A second set cannot exist while this module hardcodes one journey's bindings.` _(blocker)_
  The only production L2->L4 import in the slice: bridge imports the live-animals linear journey's feature bindings and bakes a set-wired singleton registry into generic infrastructure.
  - Evidence: fulfilment-registry.js:2 (import { featureEvaluationBindings } from '../sets/live-animals/journeys/linear/features/evaluation.js'), :165-167 (export const fulfilmentRegistry = createFulfilmentRegistry(featureEvaluationBindings)), :124 (manifest = obligations default), :169-170 (assertFulfilmentBindingCoverage)

- **src/server/app/bridge/obligation-source.js** → `Constants belong in the set (sets/live-animals/obligations/ as manifest metadata or a set descriptor registered via L1); the generic machinery (walkObligations, obligationByName/Path, unrecognisedAnswerKeys) stays in bridge but should take the manifest by injection.` _(important)_
  Four hardcoded set-data constants (live-animals field names) live in generic bridge: SYSTEM_POPULATED, ENFORCED_AT_CONTINUE, MAX_ENTRIES_FROM, FLOW_ONLY_OBLIGATIONS — per-set declarations that would need per-set values under a second set, and FLOW_ONLY_OBLIGATIONS is arguably journey knowledge on top.
  - Evidence: obligation-source.js:26 ('poApprovedReferenceNumber'), :28-31 ('countryOfOrigin', 'commoditySelection'), :38-40 (animalIdentifiers: 'numberOfAnimalsQuantity'), :51 (['importType', 'declaration']); manifest import at :1 (../model/obligations/obligations.js)

- **src/server/app/bridge/evaluation.js** _(important)_
  Module-level evaluator singleton created with createObligationEvaluator() (no args), silently binding the whole read/write path (evaluateAnswers, purgeFulfilments) to the default manifest, which is the live-animals set.
  - Evidence: evaluation.js:4 (const evaluator = createObligationEvaluator()); default confirmed at model/obligations/evaluator/index.js:1,49 (obligations = defaultObligations from '../obligations.js', the live-animals manifest)

- **src/server/app/bridge/scope.js** _(important)_
  Generic scope projection bound at module level to the live-animals manifest and to FLOW_ONLY_OBLIGATIONS; the mechanism (pathKey projection, flow-only overlay) is set-agnostic but cannot be reused for a second set without injection.
  - Evidence: scope.js:21 (import { obligations } from '../model/obligations/obligations.js'), :30 (FLOW_ONLY_OBLIGATIONS), :33-37 (comment hardcodes 'countryOfOrigin'/'commoditySelection'), :107 (iterates module-level obligations)

- **src/server/app/bridge/purge.js** _(important)_
  wipeSet iterates the module-level live-animals manifest and purgeFulfilments aliases the set-bound evaluator singleton; the wipe algorithm itself is generic.
  - Evidence: purge.js:18 (import { obligations } from '../model/obligations/obligations.js'), :32 (purgeFulfilments = evaluateFulfilments — set-bound via evaluation.js:4), :70 (obligations.flatMap)

- **src/server/app/bridge/collection-complete.js** _(important)_
  Set-bound three ways at module level — the manifest, the set-wired registry singleton, and SYSTEM_POPULATED — although the per-instance completeness algorithm is fully generic.
  - Evidence: collection-complete.js:30 (manifest import), :33 (fulfilmentRegistry singleton), :34 (SYSTEM_POPULATED), :88 (SYSTEM_POPULATED.has(leaf.name))

- **src/server/app/bridge/applicability.js** → `maxDocuments belongs in the set (sets/live-animals, e.g. beside the documents obligation or the journey feature that consumes it); appliesForCommodity can stay generic if the manifest is injected and the name de-commodified.` _(important)_
  maxDocuments() hardcodes the 'documents' obligation name — set knowledge exposed as bridge API — and the module is manifest-bound; the gate-metadata applicability query itself is generic (commodity naming aside).
  - Evidence: applicability.js:47-48 (obligationByName.get('documents').requires.maxEntries), :19 (manifest import)

- **src/server/app/bridge/status/structure/index.js** _(important)_
  The structural index is built at module scope from the live-animals manifest plus SYSTEM_POPULATED, so the status rollup's structure source is set-bound inside L2.
  - Evidence: status/structure/index.js:1 (import { obligations, groups } from '../../../model/obligations/obligations.js'), :2 (SYSTEM_POPULATED), :48-50 (structuralByName built at module scope)

- **src/server/app/bridge/status/obligation-lookup.js** _(important)_
  Module-scope name->obligation map over the live-animals manifest — the single lookup seam the whole status/ subtree uses, and it is set-bound.
  - Evidence: status/obligation-lookup.js:1-5 (manifest import + Map built at module scope)

- **src/server/app/bridge/fulfilments/obligation-graph.js** _(important)_
  groupObligations Set is computed at module scope from the live-animals manifest; ancestorChain is pure/generic and fine.
  - Evidence: fulfilments/obligation-graph.js:1 (manifest import), :3-7 (module-scope Set)

- **src/server/app/bridge/fulfilments/project-answers/index.js** _(important)_
  projectAnswers reduces over the module-level live-animals manifest — the fulfilments->answers projection cannot serve a second set without injection; the algorithm is otherwise generic.
  - Evidence: fulfilments/project-answers/index.js:1 (manifest import), :39 (obligations.reduce)

- **src/server/app/bridge/fulfilments/project-answers/projections.js** _(important)_
  Same module-level manifest binding as its sibling — projectionsOf iterates the live-animals obligations directly.
  - Evidence: fulfilments/project-answers/projections.js:1 (manifest import), :26 (for (const obligation of obligations))

- **src/server/app/bridge/assemble-fulfilments.js** _(nice-to-have)_
  Generic merge algorithm with an injection seam already present, but the default parameter binds it to the set-wired registry singleton — fine today, silently set-bound under the second-set lens.
  - Evidence: assemble-fulfilments.js:8 (registry = fulfilmentRegistry default)

- **src/server/app/bridge/read-fulfilment.js** _(nice-to-have)_
  Same pattern as assemble-fulfilments: generic reader with a registry parameter whose default is the set-wired singleton.
  - Evidence: read-fulfilment.js:8 (import { fulfilmentRegistry }), :44 (registry = fulfilmentRegistry default)

- **src/server/app/bridge/fulfilment-registry.test.js** _(important)_
  Test imports the L4 feature bindings; the 'accepts the complete feature-owned registry' case verifies live-animals wiring completeness and belongs where that wiring lives, while the synthetic-feature rejection cases are correctly-placed bridge tests.
  - Evidence: fulfilment-registry.test.js:4 (import from '../sets/live-animals/journeys/linear/features/evaluation.js'), :12-15 (wiring-completeness case), :62-69 (generic synthetic case)

- **src/server/app/bridge/scope.test.js** _(nice-to-have)_
  Pins per-gate live-animals scoping semantics against the real manifest and tests through engine/read's makeScope rather than the module under test — set-behaviour coverage that will need to relocate or re-base on a synthetic manifest when bridge is de-coupled.
  - Evidence: scope.test.js:4 (import from '../engine/read.js'), :13 (../flow/fixtures/happy-path.json), :19-30 (regionOfOriginCode/commoditySelection fixtures)

- **src/server/app/bridge/collection-complete.test.js** _(nice-to-have)_
  The final describe tests engine/evaluate/cardinality's collectionCapAt, not collection-complete — engine behaviour pinned from the bridge directory; the rest is set-data-bound like its siblings.
  - Evidence: collection-complete.test.js:2-3 (imports engine/evaluate/collection-view.js and cardinality.js), :162-172 (collectionCapAt describe)

- **src/server/app/bridge/fulfilments/index.js** _(nice-to-have)_
  Barrel is clean, but the doc comment still points bindings at the pre-re-parent path 'features/<feature>/evaluation.js' (now sets/live-animals/journeys/linear/features/) — half-updated documentation after the move.
  - Evidence: fulfilments/index.js:25 ("feature-owned in `features/<feature>/evaluation.js`")

### depcruise

- **.dependency-cruiser.cjs** _(blocker)_
  The whole config is vacuous after the re-parent: const LA = 'src/server/obligation-based-app/obligation-sets/live-animals' anchors every from/to regex on a path that no longer exists, so every rule (including no-circular) matches nothing and lint:arch passes while enforcing nothing. Rewrite the base constant to const APP = 'src/server/app' and re-anchor all rules on it; also update reporterOptions collapsePattern to `${APP}/(model|bridge|engine|flow|services|lib|shared|analysis|sets)`.
  - Evidence: .dependency-cruiser.cjs:12 (stale LA constant) vs actual tree at src/server/app/{model,bridge,engine,flow,services,lib,shared,analysis,sets}; collapsePattern at .dependency-cruiser.cjs:159-162

- **package.json** _(blocker)_
  The half-updated depcruise scripts scan only src/server/app/sets/live-animals — L1 and all of L2 are outside the scan root, so the most important new rules (no L2->sets, routes-as-gateway, engine purity) can never fire. All three scripts (lint:arch, depcruise:baseline, depcruise:graph) must scan src/server/app.
  - Evidence: package.json:31-33 `depcruise src/server/app/sets/live-animals ...` vs L2 violators like src/server/app/flow/section-status.js:3 which the current scan root excludes

- **.dependency-cruiser.cjs** _(important)_
  NEW RULE — L2 must be set-agnostic. Sketch: { name: 'l2-set-agnostic', severity: 'error', comment: 'Generic infrastructure may never know a concrete set exists; set data and journey topology are injected at boot via routes.js', from: { path: `^${APP}/(engine|model|bridge|flow|services|lib|shared|analysis)/` }, to: { path: `^${APP}/sets/` } }. Today this surfaces 8 production violators (grandfather in baseline, then burn down): model/obligations/obligations.js (11 imports of sets/live-animals/obligations/sections/*), bridge/fulfilment-registry.js -> journeys/linear/features/evaluation.js, flow/section-status.js -> journeys/linear/flow/task-rows.js, flow/entry-guard.js -> features/import-type-filter/page.js, flow/navigation.js and flow/prerequisites.js -> journeys/linear/flow/flow.js, shared/kit.js -> journeys/linear/flow/run.js, analysis/simulate.js -> journeys/linear/flow/flow.js.
  - Evidence: forbidden: src/server/app/flow/section-status.js:3 -> sets/live-animals/journeys/linear/flow/task-rows.js; allowed: src/server/app/routes.js:3 -> sets/live-animals/journeys/linear/features/index.js

- **.dependency-cruiser.cjs** _(important)_
  NEW RULE — routes.js is the sole app->sets gateway among L1 root files. Sketch: { name: 'routes-sole-sets-gateway', severity: 'error', comment: 'Only routes.js may wire sets in; config.js / obligation-purity.js stay set-blind', from: { path: `^${APP}/[^/]+\.js$`, pathNot: `^${APP}/routes\.js$` }, to: { path: `^${APP}/sets/` } }. (Root *.test.js files are already dropped by options.exclude.) Clean today — obligation-purity.js reaches sets only transitively via model/obligations/obligations.js, which the l2-set-agnostic rule owns.
  - Evidence: allowed: src/server/app/routes.js:3 -> sets/.../features/index.js; forbidden example: src/server/app/config.js -> sets/live-animals/anything (currently no such edge, per grep of src/server/app root files)

- **.dependency-cruiser.cjs** _(important)_
  NEW RULE — sets must not import L1 root files (the composition layer imports down, never the reverse). Sketch: { name: 'sets-no-import-app-root', severity: 'error', from: { path: `^${APP}/sets/` }, to: { path: `^${APP}/[^/]+\.js$` } }. WARNING: this has ~40 production violators today — nearly every journey controller/view-model imports hubPath/pagePath/TEMPLATES/breadcrumbs from config.js (plus journeys/linear/flow/run.js). Grandfather them in the baseline and burn down by relocating the path/breadcrumb helpers to L2 (see the config.js should-move finding); do not weaken the rule with a config.js pathNot or the layering inversion becomes permanent.
  - Evidence: forbidden: src/server/app/sets/live-animals/journeys/linear/features/hub/controller.js:1 -> ../../../../../../config.js; also sets/live-animals/journeys/linear/flow/run.js:1 -> config.js; allowed: the same files importing src/server/app/shared/* (L2)

- **.dependency-cruiser.cjs** _(important)_
  NEW RULE — obligations are journey-blind. Sketch: { name: 'obligations-no-journeys', severity: 'error', comment: 'A second journey style must reuse the set obligations unchanged, so obligation definitions may never reach into any journey', from: { path: `^${APP}/sets/[^/]+/obligations/` }, to: { path: `^${APP}/sets/[^/]+/journeys/` } }. Clean today — grep of sets/live-animals/obligations found no journeys/ imports (only comments referencing state-queries.js). Sets→L1 is covered by sets-no-import-app-root.
  - Evidence: forbidden example: sets/live-animals/obligations/sections/arrival.js -> sets/live-animals/journeys/linear/flow/flow.js; allowed: sets/live-animals/obligations/sections/commodities/lines.js importing model/obligations/helpers (L2)

- **.dependency-cruiser.cjs** _(nice-to-have)_
  NEW RULE — journey isolation via dependency-cruiser group matching. Sketch: { name: 'journey-isolation', severity: 'error', comment: 'A journey style is self-contained; a second style slots in beside linear/ without touching it', from: { path: `^${APP}/sets/([^/]+)/journeys/([^/]+)/` }, to: { path: `^${APP}/sets/[^/]+/journeys/`, pathNot: `^${APP}/sets/$1/journeys/$2/` } }. Vacuously clean today (one journey), but it is the machine guarantee behind the second-journey-style lens — add it now so the first power-user page cannot reach into linear/.
  - Evidence: forbidden example: sets/live-animals/journeys/single-page/anything -> sets/live-animals/journeys/linear/flow/flow.js; allowed: sets/live-animals/journeys/linear/features/hub/controller.js -> sets/live-animals/journeys/linear/flow/run.js

- **.dependency-cruiser.cjs** _(nice-to-have)_
  NEW RULE — no cross-set imports. Sketch: { name: 'no-cross-set', severity: 'error', comment: 'plant-products must slot in beside live-animals sharing only L2', from: { path: `^${APP}/sets/([^/]+)/` }, to: { path: `^${APP}/sets/`, pathNot: `^${APP}/sets/$1/` } }. Vacuously clean today (one set); costs nothing and makes the second-set lens machine-checked from day one.
  - Evidence: forbidden example: sets/plant-products/obligations/sections/x.js -> sets/live-animals/obligations/sections/documents.js; allowed: sets/live-animals/obligations/* -> sets/live-animals/journeys-free internal paths

- **.dependency-cruiser.cjs** _(important)_
  NEW RULE — widen engine purity from persistence-only to the whole engine. Replace engine-persistence-port-abstract with: { name: 'engine-no-services', severity: 'error', comment: 'engine is pure orchestration; services own IO and are injected at boot by routes.js (configureRecords/configureSession)', from: { path: `^${APP}/engine/` }, to: { path: `^${APP}/services/` } }. Verified clean today: every engine -> services import is in a .test.js file (already excluded); routes.js:6-9 does the boot wiring. Keep the ported engine-no-up alongside it (engine must not import flow/analysis/shared-kit — see the ported-rules finding).
  - Evidence: grep of src/server/app/engine for services/ shows only *.test.js importers (e.g. engine/mutators.test.js:11); boot wiring at src/server/app/routes.js:6-9

- **.dependency-cruiser.cjs** _(important)_
  PORTED RULES — mechanical re-anchor to APP with two sanction changes. (a) model-import-boundary, engine-no-up, model-behaviour-bridge-only, no-circular: rewrite `${LA}` -> `${APP}` unchanged (model-behaviour-bridge-only verified still clean: only bridge/ imports evaluator/state-queries). (b) bridge-no-up: DELETE the pathNot sanction for features/evaluation.js — that file now lives at sets/live-animals/journeys/linear/features/evaluation.js so the edge is an L2->L4 violation owned by l2-set-agnostic; the bridge/readiness-config.js -> flow/section-status.js edge persists at new paths and stays baseline-pinned. (c) flow-no-up: DELETE the pathNot sanction for features/*/page.js — journey pages moved to L4, so flow/entry-guard.js -> import-type-filter/page.js is now an l2-set-agnostic baseline entry pending a boot-injection refactor, and the ported flow-no-up keeps only `to: [analysis/, shared/kit.js]` (features/ no longer exists under APP directly).
  - Evidence: bridge sanction now stale: src/server/app/bridge/fulfilment-registry.js:2 -> sets/.../features/evaluation.js; flow sanction now stale: src/server/app/flow/entry-guard.js:8 -> sets/.../features/import-type-filter/page.js; persisting baseline edge: src/server/app/bridge/readiness-config.js:1 -> ../flow/section-status.js

- **.dependency-cruiser.cjs** _(nice-to-have)_
  PORTED RULE — no-orphans pathNot list needs re-pathing and pruning: `${LA}/config.js` and `${LA}/routes.js` become `${APP}/config.js` / `${APP}/routes.js`; copy-leaves.js is now `${APP}/shared/copy-leaves.js`; it-mode.js is `${APP}/services/persistence/it-mode.js`; services/_capture/ still exists under APP; but `${LA}/dump.js` no longer exists anywhere under src/server/app — drop that entry. Also re-anchor the orphan from.path to `^${APP}/`. Same for options.exclude fixtures pattern (`^${LA}/.*/fixtures/` -> `^${APP}/.*/fixtures/`).
  - Evidence: find over src/server/app located shared/copy-leaves.js, shared/kit.js, services/persistence/it-mode.js but no dump.js; stale entries at .dependency-cruiser.cjs:117-128,147

- **.dependency-cruiser-known-violations.json** _(important)_
  The single baseline entry pins old paths (src/server/obligation-based-app/obligation-sets/live-animals/bridge/readiness-config.js -> .../flow/section-status.js) that no longer exist, so --ignore-known pins nothing — and the underlying edge persists at src/server/app paths. Regenerate the baseline AFTER rewriting the config and scan root; the fresh baseline will pin the surviving readiness edge plus the 8 l2-set-agnostic edges and ~40 sets-no-import-app-root config.js edges.
  - Evidence: .dependency-cruiser-known-violations.json:4-5 (stale paths) vs live edge src/server/app/bridge/readiness-config.js:1 -> ../flow/section-status.js

### docs

- **src/server/app/docs/add-a-field.md** _(important)_
  Recipe has 2 hard-dead paths (old root 'src/server/obligation-based-app/obligation-sets/live-animals/' at line 8; instruction to add obligations 'under model/obligations/sections/' at line 33 — that dir is now sets/live-animals/obligations/sections/) plus 19 links whose displayed labels still show the old flat layout (features/*, model/obligations/sections/*) while hrefs were re-pointed at ../sets/... Additionally the recipe's feedback loop is broken: steps 1-3 say 'npm run test:live-animals' will surface fulfilment-registry / buildDispatch / contract failures, but that script now runs only src/server/app/sets/live-animals (package.json:36), which excludes bridge/fulfilment-registry.test.js, contract.test.js and copy-convention.test.js at the app root.
  - Evidence: docs/add-a-field.md:8, :33, :15-28 (labels vs hrefs), :56-63, :110-114; package.json:36; bridge/fulfilment-registry.test.js and contract.test.js live outside sets/live-animals

- **src/server/app/docs/add-a-page.md** _(important)_
  2 hard-dead paths (old root at line 8; 'model/obligations/sections/' at line 67) plus 29 links with old-layout labels over corrected ../sets/... hrefs; same broken 'npm run test:live-animals' verification claims (lines 78-81, 130, 147) as add-a-field since the script no longer covers the app-root/bridge guard tests.
  - Evidence: docs/add-a-page.md:8, :67, :14-30 and :137-236 (label/href mismatches), :78-81; package.json:36

- **src/server/app/docs/add-a-section.md** _(important)_
  5 hard-stale inline paths (old root line 19; 'nested folder under features/' line 8; 'flow/flow.js' line 10 and 'flow/task-rows.js' line 12 — both now under sets/live-animals/journeys/linear/flow/; 'model/obligations/sections/' line 67) plus 33 links with old-layout labels over corrected hrefs; the folder-shape diagram at lines 90-107 is rooted in the nonexistent base path.
  - Evidence: docs/add-a-section.md:8, :10, :12, :19, :67, :90-107, :25-45 (labels vs hrefs)

- **src/server/app/docs/add-a-collection.md** _(important)_
  1 wrong-module citation ('isValidIndex in engine/write/index.js' at line 331 — index.js is now a pure barrel; isValidIndex lives in engine/write/pipeline/predicates.js), 1 vague/stale location claim (line 29-31 says section modules like commodities/lines.js are 'exported by model/obligations/obligations.js' without saying they now live under sets/live-animals/obligations/sections/), plus 6 links with old features/* labels; API claims verified correct (appendEntry/removeEntry/…At all exported from engine/write/index.js, MAX_ENTRIES_FROM in bridge/obligation-source.js:38).
  - Evidence: docs/add-a-collection.md:331 vs engine/write/pipeline/predicates.js:1; docs/add-a-collection.md:29-31; :11,:14,:20,:199,:240,:257

- **src/server/app/docs/architecture.md** _(important)_
  The entry doc's layer narrative still describes the pre-re-parent flat layout — 'The four layers: features/ → flow/ → engine …' with single features/ and flow/ dirs — and never mentions sets/, journeys/linear/, or that flow is now split (dispatch/gates/navigation/section-status at L2 flow/ vs flow.js/run.js/task-rows.js at L4); 4 links carry old labels (flow/flow.js, flow/task-rows.js, features/index.js x2) over corrected sets/ hrefs, so the 'flow/' section silently mixes L2 and L4 files under one heading.
  - Evidence: docs/architecture.md:14-19, :102-121 (flow section mixing ../flow/dispatch.js with ../sets/live-animals/journeys/linear/flow/flow.js), :104, :114, :125, :130

- **src/server/app/docs/decisions.md** _(nice-to-have)_
  6 links carry old-layout labels (flow/flow.js, features/index.js, flow/task-rows.js) over corrected sets/ hrefs, and the 'three layers plus a seam' framing (lines 8-23) predates the sets/journeys split — it presents flow and features as single app-level dirs, so the doc's stated dependency layout no longer names the real tree.
  - Evidence: docs/decisions.md:13, :14, :33, :115, :116, :179

- **src/server/app/docs/features.md** _(important)_
  20 stale citations: the stated root 'src/server/obligation-based-app/obligation-sets/live-animals/' (line 9) does not exist, and 19 inline refs (features/<name>/, features/index.js, features/*/controller.js, flow/flow.js, flow/task-rows.js) resolve nowhere from the doc's location — the real paths are sets/live-animals/journeys/linear/features|flow/. Content itself verified accurate (e.g. the origin collects list at lines 120-129 matches the controller).
  - Evidence: docs/features.md:9, :14, :21, :46, :64-65, :113, :120, :139, :146-148, :172, :188, :194, :203, :217, :232, :237; origin controller collects verified at sets/live-animals/journeys/linear/features/origin/controller.js:25-30

- **src/server/app/docs/flow-and-gates.md** _(important)_
  ~10 stale citations rooted in the now-split flow layer: 'The code lives in flow/' (line 3) is no longer one dir; flow/flow.js (lines 7, 28), flow/task-rows.js (lines 9, 133, 135), flow/run.js (line 125) and features/index.js (line 78) all moved to sets/live-animals/journeys/linear/, while flow/gates.js, flow/dispatch.js, flow/navigation.js, flow/prerequisites.js, flow/run-state.js, flow/entry-guard.js, flow/section-status.js cited in the same doc genuinely remain at L2 flow/ — the doc gives the reader no way to tell which is which.
  - Evidence: docs/flow-and-gates.md:3, :7, :9, :28, :78, :125, :133, :135

- **src/server/app/docs/validation.md** _(important)_
  8 stale citations: features/import-type-filter, features/origin, features/declaration, features/cph-number (lines 53-56), features/cph-number/controller.js (line 151), features/transport/port-of-entry/... (line 173), features/addresses/create-address/... (line 205) all moved under sets/live-animals/journeys/linear/features/, and flow/task-rows.js (line 111) moved under sets/.../linear/flow/; the lib/validate/, bridge/obligation-source.js and flow/prerequisites.js|gates.js citations remain correct at L2.
  - Evidence: docs/validation.md:53-56, :111, :151, :173, :205

- **src/server/app/docs/scope-and-wipe.md** _(nice-to-have)_
  2 stale citations — 'the review section's authored gate (flow/flow.js)' at line 165 and 'rowStatus (flow/task-rows.js)' at line 170 both now live at sets/live-animals/journeys/linear/flow/; every other cited module (evaluator, bridge/scope|purge, engine/read|write, lib/path, analysis/flow-reachability) verified present at L2.
  - Evidence: docs/scope-and-wipe.md:165, :170

- **src/server/app/docs/obligation-model.md** _(nice-to-have)_
  2 stale citations: the stated root 'src/server/obligation-based-app/obligation-sets/live-animals/' (line 19) is dead, and the 'model has one file at its core: model/obligations/obligations.js' framing (lines 9-12, 53) is now misleading — obligations.js survives at L2 as a re-export barrel but every declaration it describes lives in sets/live-animals/obligations/sections/*.js, which the doc never mentions. The doc also interleaves generic model mechanics (keys, helpers, purity) with pure live-animals content (V4 manifest structure, groups, cph gates), making it the clearest candidate for the app-docs/set-docs split.
  - Evidence: docs/obligation-model.md:19, :9-12, :53, :75-98 vs model/obligations/obligations.js:58-123 (imports from ../../sets/live-animals/obligations/sections/)

- **src/server/app/docs/services.md** _(nice-to-have)_
  1 stale citation — the stated path root 'src/server/obligation-based-app/obligation-sets/live-animals/' at line 7; all services/* refs otherwise resolve correctly against L2 services/.
  - Evidence: docs/services.md:7

- **src/server/app/docs/testing.md** _(important)_
  3 stale citations plus a semantics drift: line 10 says test:live-animals runs 'src/server/obligation-based-app/obligation-sets/live-animals' (script now targets src/server/app/sets/live-animals, package.json:36, which no longer includes the model/bridge/engine/contract suites the doc groups with it); lines 61-63 say the features Playwright project finds specs 'under features/' with e2e/ subfolders — the specs are now under sets/live-animals/journeys/linear/features/ and playwright.config.js:44-45 still points at the dead old path, so the cited command currently collects zero specs.
  - Evidence: docs/testing.md:10, :61-63; package.json:36; playwright.config.js:44-46

- **src/server/app/docs/test-ownership.md** _(important)_
  2 stale citations: line 22's relative path '../../../../../../.github/workflows/e2e-tests.yml' climbs six levels — correct only from the old docs location (obligation-based-app/obligation-sets/live-animals/docs); from src/server/app/docs it needs four and currently points outside the repo; line 14 says feature specs live 'under features/'.
  - Evidence: docs/test-ownership.md:22, :14; workflow verified at repo root .github/workflows/e2e-tests.yml (4 levels up)

### engine

- **src/server/app/engine/mutators.test.js** _(important)_
  Engine mutator test imports flow dispatch and the live-animals journey's dispatchPages (L2 test -> sets/**) as wiring, even though sibling engine tests prove the set-free `configureReadyForCheckYourAnswers(() => false)` wiring suffices for write-path tests; the mutator behaviour under test is genuinely engine-generic, so the fix is to drop the sets import, not move the file.
  - Evidence: mutators.test.js:13-14 (buildDispatch from ../flow/dispatch.js, dispatchPages from ../sets/live-animals/journeys/linear/features/index.js), :55 (buildDispatch(dispatchPages) in beforeAll); contrast commit-purge-authority.test.js:48 and entry-write-purge-window.test.js:62 which use configureReadyForCheckYourAnswers instead

- **src/server/app/engine/journey.js** _(important)_
  Upward L2->L1 import: engine pulls BASE from the composition-layer config.js to build cookie options, so generic engine hardcodes the app's mount path instead of receiving it at boot (the same configure-at-boot seam its own persistence ports already use); it also brands its request memo Symbol 'liveAnimalsCurrentJourney' in a set-agnostic layer.
  - Evidence: journey.js:2 (import { BASE } from '../config.js'), :15 (path: BASE || '/'), :40 (Symbol('liveAnimalsCurrentJourney'))

- **src/server/app/engine/persistence/session.js** _(important)_
  Set knowledge in the generic session port: the three cookie names are hardcoded as liveAnimals* constants, so a second set would either share live-animals-branded cookies or force a rename of engine internals — the names should be injected/parameterised alongside the impl at boot.
  - Evidence: persistence/session.js:1-3 ('liveAnimalsKnownJourneys', 'liveAnimalsOpeningRun', 'liveAnimalsFlowOnlyAnswers'), re-exported and registered set-agnostically in journey.js:25-38

- **src/server/app/engine/read.js** _(nice-to-have)_
  Set-branded identifier in generic engine: the request-view memo Symbol is named 'liveAnimalsRequestView'; a second set would reuse this code under a misleading name.
  - Evidence: read.js:14 (Symbol('liveAnimalsRequestView'))

- **src/server/app/engine/store-contract.test.js** _(nice-to-have)_
  Systemic pattern (13 engine test files): every engine test wires the persistence ports by importing stub implementations from services/** — a letter-of-the-law engine->services dependency; an engine-owned in-memory fake exported from engine/test-support.js would sever it and keep engine tests self-contained.
  - Evidence: store-contract.test.js:4; same import pair in journey.test.js:18-19, read.test.js:5-6, submit.test.js:10-11, submit-is-finalise.test.js:10-11, commit-purge-authority.test.js:5-6, write-through-per-commit.test.js:5-6, resume-self-heal.test.js:4-5, entry-write-purge-window.test.js:6-7, request-view.parity.test.js:9-10, mutators.test.js:11-12, write/flow-only-session.test.js:9-10, write/write-guard.test.js:5-6

- **src/server/app/engine/evaluate/cardinality.js** _(nice-to-have)_
  Live-animals domain language in a generic engine doc comment ('the per-species at-least-one floor still bites at submit') — the mechanism itself is properly generic (cap declaration consumed from bridge's MAX_ENTRIES_FROM), only the rationale prose leaks the set.
  - Evidence: evaluate/cardinality.js:14 (per-species floor comment); :3, :23 (generic MAX_ENTRIES_FROM consumption from ../../bridge/obligation-source.js)

### import-sweep

- **src/config/nunjucks/nunjucks.js** _(blocker)_
  Nunjucks search path and hapi-vision path still point at dead dir src/server/obligation-based-app/obligation-sets, so no search path resolves the 'live-animals/...' template names used everywhere (layout.njk now lives at src/server/app/shared/layout.njk, only reachable as 'app/shared/layout.njk').
  - Evidence: nunjucks.js:18 path.resolve(dirname, '../../server/obligation-based-app/obligation-sets'); nunjucks.js:45 path: ['server', 'server/obligation-based-app/obligation-sets']; ls src/server shows no obligation-based-app dir; find shows only layout.njk at src/server/app/shared/layout.njk; ~40 templates extend "live-animals/shared/layout.njk" (e.g. sets/live-animals/journeys/linear/features/hub/template.njk:1, src/server/app/shared/error.njk:1, src/server/auth/unauthorised.njk:1) and src/server/common/helpers/errors.js:34 renders view 'live-animals/shared/error'

- **webpack.config.js** _(blocker)_
  Client bundle entry for the documents feature points at the dead pre-rename path; the code now lives at src/server/app/sets/live-animals/journeys/linear/features/documents/client/index.js (confirmed on disk), so the bundle silently disappears.
  - Evidence: webpack.config.js:28 '../server/obligation-based-app/obligation-sets/live-animals/features/documents/client/index.js'; ls confirms src/server/app/sets/live-animals/journeys/linear/features/documents/client/index.js exists

- **playwright.config.js** _(blocker)_
  Playwright test dir still points at the dead pre-rename features path, so colocated *.e2e.spec.js under sets/live-animals/journeys/linear/features will not be discovered.
  - Evidence: playwright.config.js:45 './src/server/obligation-based-app/obligation-sets/live-animals/features'; e2e specs now at e.g. src/server/app/sets/live-animals/journeys/linear/features/hub/hub.e2e.spec.js

- **vitest.config.js** _(blocker)_
  The e2e-spec exclusion glob still targets the dead pre-rename path, so vitest will now try to run every colocated *.e2e.spec.js under the new sets/ tree as unit tests.
  - Evidence: vitest.config.js:16 'src/server/obligation-based-app/obligation-sets/live-animals/features/**/*.e2e.spec.js' — dir does not exist; specs live under src/server/app/sets/live-animals/journeys/linear/features/**

- **.dependency-cruiser.cjs** _(blocker)_
  The architecture-lint config's root constant still points at the dead pre-rename path, so lint:arch/depcruise scripts (which package.json already points at src/server/app/sets/live-animals) cruise against rules scoped to a non-existent tree.
  - Evidence: .dependency-cruiser.cjs:12 const LA = 'src/server/obligation-based-app/obligation-sets/live-animals'; package.json:31-33 already updated to src/server/app/sets/live-animals

- **src/server/app/engine/request-view.parity.test.js** _(important)_
  Test files colocated in every L2 layer import live-animals journey features wholesale (engine, bridge, flow, shared, lib, analysis), so the generic layers' own test suites cannot run without the live-animals set present — under the second-set lens L2 is not independently testable.
  - Evidence: engine/request-view.parity.test.js:5,18-39 (24 imports from ../sets/live-animals/journeys/linear/features/**); engine/mutators.test.js:14; bridge/fulfilment-registry.test.js:4; bridge/status/status.test.js:4,8,13; flow/gates.test.js:3-9; flow/dispatch.test.js:2; lib/validate/persists-cleaned-value.test.js:10; shared/save-actions.test.js:11,14-18; shared/change-context.test.js:11,14-17; shared/journey-strip.test.js:16,19-23; analysis/simulate.test.js:4; analysis/flow-reachability/flow-reachability.test.js:5

- **src/server/app/shared/error.njk** _(important)_
  error.njk extends 'live-animals/shared/layout.njk' even though layout.njk is its own sibling in the same shared/ dir — a generic L2 template referencing itself through a set-named (and currently dead) template alias.
  - Evidence: shared/error.njk:1 {% extends "live-animals/shared/layout.njk" %}; layout.njk is at src/server/app/shared/layout.njk; no nunjucks search path maps 'live-animals/' onto app/shared (nunjucks.js:12-19)

- **src/server/app/shared/layout.test.js** _(important)_
  L2 shared layout test renders the layout via the set-named template alias 'live-animals/shared/layout.njk', which no current nunjucks search path can resolve (depends on the dead obligation-based-app path).
  - Evidence: layout.test.js:9 environment.render('live-animals/shared/layout.njk', ...) using nunjucksConfig from src/config/nunjucks/nunjucks.js whose only set-mapping path (line 18) is dead

- **src/server/common/helpers/errors.js** _(important)_
  Generic error helper renders the view 'live-animals/shared/error' — set-specific template name in a common helper, and the name only resolved via the now-dead obligation-based-app search path (the template is now src/server/app/shared/error.njk).
  - Evidence: errors.js:34 .view('live-animals/shared/error', ...); errors.test.js:70 const errorPage = 'live-animals/shared/error'

- **src/server/app/docs/obligation-model.md** _(nice-to-have)_
  Seven docs files still describe the dead src/server/obligation-based-app/obligation-sets/live-animals path as the code's home.
  - Evidence: docs/obligation-model.md:19, docs/add-a-field.md:8, docs/add-a-page.md:8, docs/testing.md:10, docs/add-a-section.md:19, docs/services.md:7, docs/features.md:9 all reference src/server/obligation-based-app/obligation-sets/live-animals

- **src/server/app/sets/live-animals/obligations/sections/commodities/aggregates.js** _(nice-to-have)_
  L3 obligations import functions from the IO-owning L2 services layer (services/commodities) in three section files — permitted as 'L2 helpers' by the letter of the rules, but it couples pure obligation definitions to the services tier; worth a purity ruling.
  - Evidence: obligations/sections/commodities/aggregates.js:4, obligations/sections/commodities/lines.js:1, obligations/sections/commodities/identifiers.js:7 all import from '../../../../../services/commodities/index.js'

- **src/server/app/sets/live-animals/journeys/linear/features/addresses/party-picker/_address-picker.test.js** _(nice-to-have)_
  Journey test escapes the app tree entirely with a 9-level relative import into src/config — the only import from inside the set that lands outside src/server/app.
  - Evidence: _address-picker.test.js:3 import { nunjucksConfig } from '../../../../../../../../../config/nunjucks/nunjucks.js' (resolves to src/config/nunjucks/nunjucks.js)

- **src/server/app/sets/live-animals/journeys/linear/features/hub/hub.e2e.spec.js** _(nice-to-have)_
  All ~19 colocated e2e specs climb 9-10 '../' segments out of src entirely to repo-root e2e/live-animals-journey.js — the target exists, but the escape depth means any further re-parent silently breaks every spec; a path alias or in-set helper would remove the fragility.
  - Evidence: e.g. features/hub/hub.e2e.spec.js:8, features/check-answers/check-answers.e2e.spec.js:8, features/transport/e2e/transporters.e2e.spec.js:9, features/documents/e2e/upload.e2e.spec.js:8 all import '../../../../../../../../../(../)e2e/live-animals-journey.js'; ls confirms e2e/live-animals-journey.js at repo root

### journey-features-A

- **webpack.config.js** _(blocker)_
  The documents client-JS entry still points at the deleted pre-move path, so the bundle the feature's template loads cannot build.
  - Evidence: webpack.config.js:26-29 imports '../server/obligation-based-app/obligation-sets/live-animals/features/documents/client/index.js'; the file now lives at src/server/app/sets/live-animals/journeys/linear/features/documents/client/index.js (old tree confirmed deleted); template.njk:105 loads getAssetPath('documents.js')

- **src/config/nunjucks/nunjucks.js** _(blocker)_
  Nunjucks search path still targets the deleted obligation-sets tree, and no updated path can satisfy the slice's view ids without a coordinated fix: TEMPLATES='live-animals' + '/features/...' assumes live-animals directly contains features/ (it now contains journeys/linear/features/), and every 'live-animals/shared/*.njk' extend/include is doubly stale because the shared templates moved to src/server/app/shared/.
  - Evidence: src/config/nunjucks/nunjucks.js:18,45 ('server/obligation-based-app/obligation-sets'); src/server/app/config.js:3 (TEMPLATES = 'live-animals'); documents/controller.js:40, commodities/search/search.controller.js:19, consignment-details.controller.js:29, animal-identification.controller.js:25 (view ids); documents/template.njk:1,7,13; commodities/search/search.njk:1,5,8; consignment-details/consignment-details.njk:1-4,7; animal-identification/animal-identification.njk:1,3,4,7; shared njk now at src/server/app/shared/{layout,save-actions,error-summary}.njk

- **playwright.config.js** _(blocker)_
  Playwright testDir still points at the old features path, so none of the five colocated e2e specs in this slice are discoverable.
  - Evidence: playwright.config.js:45 ('./src/server/obligation-based-app/obligation-sets/live-animals/features'); specs at src/server/app/sets/live-animals/journeys/linear/features/documents/e2e/{upload,scan-status}.e2e.spec.js and .../commodities/e2e/{search,consignment-details,identification}.e2e.spec.js

- **vitest.config.js** _(important)_
  The e2e-spec exclude glob still uses the old path, so the moved *.e2e.spec.js files are no longer excluded and unit runs over the new tree (test:live-animals already targets it) will try to execute Playwright specs under vitest.
  - Evidence: vitest.config.js:16 ('src/server/obligation-based-app/obligation-sets/live-animals/features/**/*.e2e.spec.js') vs package.json:36 ('vitest run src/server/app/sets/live-animals')

- **.dependency-cruiser.cjs** _(important)_
  The LA root constant still names the old tree while package.json's lint:arch scans the new tree, so every layer rule's from.path matches nothing and the machine-enforced architecture gate over this slice is silently vacuous.
  - Evidence: .dependency-cruiser.cjs:12 (LA = 'src/server/obligation-based-app/obligation-sets/live-animals') vs package.json:31 (depcruise src/server/app/sets/live-animals)

- **src/server/app/sets/live-animals/journeys/linear/features/documents/evaluation.js** _(important)_
  The journey's fulfilment bindings import the set's obligations through the generic L2 aggregator model/obligations/obligations.js instead of the set's own L3 obligations, keeping alive the exact model-to-sets edge that blocks a second set from reusing L2 unchanged.
  - Evidence: documents/evaluation.js:2-10 (from '../../../../../../model/obligations/obligations.js'); the same names are defined in src/server/app/sets/live-animals/obligations/sections/documents.js and merely re-exported by model/obligations/obligations.js:82-89

- **src/server/app/sets/live-animals/journeys/linear/features/commodities/evaluation.js** _(important)_
  Same as documents/evaluation.js — obligations reached via the L2 model aggregator rather than the set's own obligations/sections (commodities/{lines,identifiers}.js); evaluation.test.js and documents/controller.test.js repeat the pattern.
  - Evidence: commodities/evaluation.js:2-17; commodities/evaluation.test.js:4-8; documents/controller.test.js:27; definitions live in src/server/app/sets/live-animals/obligations/sections/commodities/ per model/obligations/obligations.js:59-89

- **src/server/app/sets/live-animals/journeys/linear/features/documents/contracts/max-documents.js** → `the maxDocuments() accessor itself belongs here (or in the set's obligations); bridge should keep only a generic maxEntriesOf(obligation) primitive` _(important)_
  MAX_DOCUMENTS is fetched from bridge/applicability.js whose maxDocuments() hardcodes the live-animals 'documents' obligation name inside generic L2 bridge — set knowledge leaked upward; the feature should pass its own obligation to a generic cap accessor.
  - Evidence: contracts/max-documents.js:1-3; src/server/app/bridge/applicability.js:47-48 (obligationByName.get('documents').requires.maxEntries). Contrast appliesForCommodity (applicability.js:33-38), which is genuinely generic and correctly used by identifier/fields.js:2

- **src/server/app/sets/live-animals/journeys/linear/features/commodities/consignment-details/consignment-details.controller.js** _(nice-to-have)_
  Imports lineKey from the sibling page's controller module (dragging in its routes/handlers) when the definition lives in search/selection/line-key.js — a controller-to-controller edge that would tangle a second journey style reusing the selection primitives.
  - Evidence: consignment-details.controller.js:7 (from '../search/search.controller.js'); search.controller.js:16 merely re-exports from './selection/line-key.js'; commit-selection.js:7 shows the direct import done right

- **src/server/app/sets/live-animals/journeys/linear/features/documents/template.njk** _(nice-to-have)_
  The client bundle is published under the flat global name 'documents.js' — a second set (or second journey style) with its own documents client JS would collide in the webpack entry namespace; worth set/journey-scoping the entry name while repointing webpack.
  - Evidence: template.njk:105 (getAssetPath('documents.js')); webpack.config.js:26 (entry key 'documents')

### journey-features-B

- **src/server/app/sets/live-animals/journeys/linear/features/check-answers/template.njk** _(blocker)_
  Systemic half-updated template namespace after the re-parent: every .njk in all four features still extends/includes the pre-move 'live-animals/...' root, and every controller view id omits 'journeys/linear', while the nunjucks search roots still point at the deleted obligation-based-app tree — feature templates and the shared layout cannot resolve.
  - Evidence: template.njk:1 extends "live-animals/shared/layout.njk" but layout now lives at src/server/app/shared/layout.njk; controller.js:14 view 'live-animals/features/check-answers/template' omits journeys/linear (actual path sets/live-animals/journeys/linear/features/...); src/config/nunjucks/nunjucks.js:18,45 still roots 'server/obligation-based-app/obligation-sets' which no longer exists (src/server now holds only app/); same stale namespace in addresses/template.njk:1, party-picker/party-picker.njk:1-2,5, create-address/create-address.njk:1,7, party-picker/_address-picker.test.js:11 (renders through the real environment via the old path), transport/*/*.njk:1 (all four), dashboard/template.njk:1, and every `view` constant (addresses/controller.js:21, party-picker.controller.js:21, create-address.controller.js:22, transporters.controller.js:13, transporters-select.controller.js:13, private-transporter-details.controller.js:18, transit-countries.controller.js:15, port-of-entry.controller.js:32, dashboard/controller.js:32)

- **src/server/app/sets/live-animals/journeys/linear/features/addresses/evaluation.js** _(important)_
  The journey binds its evaluation obligations through the L2 aggregator model/obligations/obligations.js instead of its own set's L3 obligations — and that L2 module itself imports sets/** (banned), so the set's obligation collection is effectively anchored in generic model code; a second set cannot slot in beside live-animals while L2 model re-exports this set's obligations.
  - Evidence: evaluation.js:2-8 imports consignor/consignee/importer/placeOfOrigin/placeOfDestination from '../../../../../../model/obligations/obligations.js'; that file imports from '../../sets/live-animals/obligations/sections/*' (model/obligations/obligations.js:58-114) — the real L3 source is src/server/app/sets/live-animals/obligations/sections/parties.js, which the journey should import (directly or via a set-level aggregate)

- **src/server/app/sets/live-animals/journeys/linear/features/transport/evaluation.js** _(important)_
  Same L3 bypass as addresses/evaluation.js: transport obligations are imported from the L2 model aggregator rather than the set's own obligations (sections/transport.js, sections/arrival.js), coupling the journey's bindings to a set-knowing L2 module.
  - Evidence: evaluation.js:2-12 imports arrivalDateAtPort, commercialTransporter, meansOfTransport, portOfEntry, privateTransporter, transitedCountries, transportDocumentReference, transportIdentification, transporterType from '../../../../../../model/obligations/obligations.js'; the set-local sources exist at src/server/app/sets/live-animals/obligations/sections/{transport,arrival}.js

- **src/server/app/sets/live-animals/journeys/linear/features/check-answers/view-model/cards/consignment/species/identifier-columns.js** _(important)_
  Reaches into a sibling feature's CONTROLLER module to get a display-label map, dragging the whole animal-identification controller (routes, engine, validation) into the check-answers view-model just for copy that actually lives two modules deeper.
  - Evidence: identifier-columns.js:3 imports IDENTIFIER_LABELS from '../../../../../commodities/animal-identification/animal-identification.controller.js'; the real source is commodities/animal-identification/identifier/summary.js:7 (`export const IDENTIFIER_LABELS = copy.identifierLabels`) — import the summary module (or the copy pair) instead of the controller re-export at animal-identification.controller.js:20

- **src/server/app/sets/live-animals/journeys/linear/features/addresses/controller.js** _(important)_
  The CPH-applicability rule has two divergent implementations reached by two different mechanisms: the addresses hub imports isCphApplicable from the cph-number CONTROLLER (commodities-service list), while check-answers derives the same gate from obligation metadata via bridge appliesForCommodity — if the service list and obligation metadata drift, the hub row and the CYA row disagree.
  - Evidence: addresses/controller.js:5 imports { isCphApplicable } from '../cph-number/controller.js' (cph-number/controller.js:26-29 uses commodities.cphCommodities()); check-answers/view-model/applicability.js:21-22 defines cphApplies via anyLineApplies('countyParishHoldingCph') backed by bridge/applicability.js:1 appliesForCommodity — one shared non-controller predicate should serve both

- **src/server/app/sets/live-animals/journeys/linear/features/transport/transporters-select/transporters-select.controller.js** _(important)_
  The oneOf allowlist snapshots the address-book service at module import time, so a later prime() (real mode) leaves validation on the stale list — breaking the codebase convention, pinned by tests elsewhere, that lists are read at POST time via a fields() thunk.
  - Evidence: transporters-select.controller.js:17-23 `const fields = compose(oneOf('commercialTransporter', addressBook.parties('commercialTransporter').map(...)))` evaluated at import, while render() at line 50 re-reads the book fresh; convention exemplars: create-address.controller.js:50 (`const fields = () => compose(...)`) with test create-address.test.js:198 'validate against the list as primed at POST time, not as imported', and port-of-entry.controller.js:48 with port-of-entry.controller.test.js:126

- **src/server/app/sets/live-animals/journeys/linear/features/transport/private-transporter-details/private-transporter-details.controller.js** _(important)_
  Same import-time capture: the country allowlist is baked into `fields` at module load (countries.addressCountries()), so real-mode priming after import is ignored by validation while the rendered select (countryItems) shows the fresh list.
  - Evidence: private-transporter-details.controller.js:50-64 `const fields = compose(... oneOf('country', countries.addressCountries(), ...))` at module scope vs countryItems() at 76-84 reading per-render; contrast create-address.controller.js:50-61 where the identical form uses a `fields()` thunk

- **src/server/app/sets/live-animals/journeys/linear/features/dashboard/notification-helper.js** _(nice-to-have)_
  English display copy embedded outside the copy modules: NOTIFICATION_SORT_OPTIONS carries hardcoded English `text` that view-model/sort-options.js then overwrites by fragile positional index, and buildPageResultsRangeLabel ships dead English fallbacks ('Showing 1 Results') that the controller always overrides with real copy.
  - Evidence: notification-helper.js:7-12 hardcoded option text; view-model/sort-options.js:8-18 re-zips copy leaves onto the array by index (order-coupled); notification-helper.js:131-140 fallback strings 'No Results'/'Showing 1 Results'/... never reached because dashboard/controller.js:73-79 always passes copy.pagination.results

- **src/server/app/sets/live-animals/journeys/linear/features/transport/private-transporter-details/private-transporter-details.njk** _(nice-to-have)_
  The Standard Address Block form is fully duplicated between this feature and addresses/create-address — near-identical controller logic (FIELD_ORDER, MANDATORY_MESSAGES, trimmedValues, countryItems with an inline divider constant) and byte-similar .njk field markup — a shared journey-level address-form partial/module would keep the two from drifting.
  - Evidence: private-transporter-details.njk:16-91 vs create-address/create-address.njk:17-92 (same nine govukInput/govukSelect blocks); private-transporter-details.controller.js:22-48,76-84,121-135 vs create-address.controller.js:28-66,70-81,114-128 (same tables/helpers; even the '──────────' divider is a named const COUNTRY_LIST_DIVIDER in one, create-address.controller.js:68, and an inline literal in the other, private-transporter-details.controller.js:78)

- **src/server/app/sets/live-animals/journeys/linear/features/check-answers/controller.js** _(nice-to-have)_
  All L4 controllers in the slice import L1 config.js for per-set/per-journey constants (TEMPLATES='live-animals', '/notifications' path builders, breadcrumbs with literal copy) — an upward dependency that makes the composition root behave as shared infrastructure and pins every future set/journey to the live-animals namespace and URL scheme.
  - Evidence: controller.js:2 imports breadcrumbs/hubPath/pagePath/TEMPLATES from '../../../../../../config.js'; config.js:3 TEMPLATES='live-animals', config.js:6-13 hardcoded '/notifications' slugs, config.js:15-18 breadcrumbs embed the English string 'Your notifications' in L1 JS; same import in addresses/controller.js:1, party-picker.controller.js:1, create-address.controller.js:1, all transport controllers:1, dashboard/controller.js:1-8, rows/change-link.js:1, species-card-actions.js:1, pagination/results-href.js:1 — these helpers belong in L2 shared (parameterised) or with the journey

### journey-features-C

- **src/server/app/sets/live-animals/journeys/linear/features/origin/origin.e2e.spec.js** _(blocker)_
  Every colocated e2e spec in this slice is orphaned: playwright.config.js testDir and vitest.config.js's e2e-exclude glob still point at the pre-move path src/server/obligation-based-app/obligation-sets/live-animals/features, so Playwright collects zero of these specs and Vitest's exclude no longer shields *.e2e.spec.js from the unit runner.
  - Evidence: playwright.config.js:45, vitest.config.js:16, webpack.config.js:28 (stale paths); specs at e.g. origin/origin.e2e.spec.js, hub/hub.e2e.spec.js, declaration/declaration.e2e.spec.js

- **src/server/app/sets/live-animals/journeys/linear/features/origin/evaluation.js** _(important)_
  All ten evaluation.js modules in this slice import their obligation objects from the L2 module model/obligations/obligations.js instead of the set's own L3 root (sets/live-animals/obligations/) — the L2 file is now just a re-export of the set's sections (a half-finished move), so the journey reaches its own set's data through a generic-layer middleman that a second set could not share.
  - Evidence: origin/evaluation.js:2-7, import-reason/evaluation.js:2, import-purpose/evaluation.js:2, destination-country/evaluation.js:2, port-of-exit/evaluation.js:2, exit-date/evaluation.js:2, additional-details/evaluation.js:2-5, cph-number/evaluation.js:2, contact/evaluation.js:2, system/evaluation.js:2; re-export shim at src/server/app/model/obligations/obligations.js:58-123; identity check pinning the pattern at src/server/app/bridge/fulfilment-registry.js:31

- **src/server/app/sets/live-animals/journeys/linear/flow/flow.js** _(important)_
  Right place for the journey's page order and section gates, but it is statically imported BY L2 generic flow (prerequisites.js, navigation.js), violating 'journey must not be imported by L2' — a second journey style cannot slot in beside linear/ while generic navigation hard-codes this journey's sections; the inversion seam already exists (buildDispatch(dispatchPages) is injected from L1) and sections should be injected the same way.
  - Evidence: src/server/app/flow/prerequisites.js:5 and src/server/app/flow/navigation.js:3 import ../sets/live-animals/journeys/linear/flow/flow.js; contrast injected dispatch at features/index.js:33-55 consumed via buildDispatch in every controller.test (e.g. origin/controller.test.js:29)

- **src/server/app/sets/live-animals/journeys/linear/flow/task-rows.js** _(important)_
  Task-row knowledge is correctly journey-owned, but L2 section-status.js imports taskRows/rowStatus to compute readyForCheckYourAnswers, so the generic submit-readiness roll-up is welded to this journey's rows — same L2-imports-journey inversion failure as flow.js.
  - Evidence: src/server/app/flow/section-status.js:3 imports ../sets/live-animals/journeys/linear/flow/task-rows.js; task-rows.js:1-2 correctly consumes L2 (bridge/status, flow/dispatch) in the allowed direction

- **src/server/app/sets/live-animals/journeys/linear/flow/run.js** _(important)_
  The opening-run sequence itself is correctly journey-owned, but it (and every controller in the slice) imports config.js from L1 for hubPath/pagePath/TEMPLATES — an L4-to-L1 dependency cycle (L1 routes.js wires the journey; the journey imports L1), and config.js bakes in set/journey specifics (TEMPLATES='live-animals', the hub-centred /notifications/{journeyId}/{slug} URL scheme) that a second set or a hub-less journey style would fork; the path/template helpers belong in L2 (or the journey), leaving L1 pure composition.
  - Evidence: flow/run.js:1, features/origin/controller.js:1, features/import-type-filter/controller.js:1-6, features/hub/controller.js:1, features/confirmation/controller.js:1-6 all import ../../../../../../config.js; src/server/app/config.js:3 (TEMPLATES = 'live-animals'), config.js:6-13 (journey-style URL scheme)

- **src/server/app/sets/live-animals/journeys/linear/features/additional-details/controller.js** _(nice-to-have)_
  Exported unweanedApplies has zero importers — check-answers re-implements the identical rule in its own applicability.js — leaving a dead export plus a duplicated domain-applicability rule (which commodities trigger the unweaned question) buried in two page controllers instead of one set-level home.
  - Evidence: additional-details/controller.js:26-29 (export, only used internally at :81/:87 via scope); duplicate at features/check-answers/view-model/applicability.js:18; grep shows no importer of the controller export

- **src/server/app/sets/live-animals/journeys/linear/features/cph-number/controller.js** _(nice-to-have)_
  isCphApplicable — the set-domain rule for which commodity selections require a CPH — lives in a page controller and is imported cross-feature by addresses/controller.js; applicability rules of this kind belong with the set's scope/obligation layer, not inside one page's controller as another page's dependency.
  - Evidence: cph-number/controller.js:26-29 (rule, built on services/commodities cphCommodities()); consumed at features/addresses/controller.js:5 and :48

### model

- **src/server/app/model/obligations/evaluator/index.js** _(important)_
  The generic evaluator hardcodes the live-animals manifest as its default: `createObligationEvaluator({ obligations = defaultObligations })` with `defaultObligations` imported from ../obligations.js. A set-agnostic engine must not know a default set — a second set calling `createObligationEvaluator()` silently gets live-animals, and once the manifest moves (previous finding) this becomes a direct L2→sets/** import. Remove the default and require explicit manifest injection (callers already pass it: whitelists.test.js:55, path-prefix-depth.test.js:47).
  - Evidence: src/server/app/model/obligations/evaluator/index.js:1 (import { obligations as defaultObligations } from '../obligations.js'), :48-50 (default parameter)

- **src/server/app/model/analysis/reachability/reachability.test.js** _(important)_
  Mixed altitude in one file: the synthetic prover tests and per-helper witness-inversion tests are correctly generic, but the file also imports the live manifest and pins live-animals fidelity — named lookups of regionOfOriginCode/countyParishHoldingCph/purposeInInternalMarket, the 9-site migration-fidelity block, and classification counts (≥14 synthesisable, specific animalIdentifier names). Split: generic blocks stay; the real-manifest blocks (lines 148-161, 505-573, 582-631, 651-737, 745-761) move to the set alongside the manifest, otherwise the manifest move breaks an L2 test.
  - Evidence: src/server/app/model/analysis/reachability/reachability.test.js:32 (import { obligations } from '../../obligations/obligations.js'), :509 (regionOfOriginCode), :565 (countyParishHoldingCph), :598-620 (≥14 synthesisable + animalIdentifier name pins), :651-737 (9-site migration fidelity)

- **src/server/app/model/no-display-keys.test.js** _(important)_
  The checker (no-display-keys.js) is rightly generic L2, but its test couples to the live manifest via `import { obligations } from './obligations/obligations.js'` for the two 'real model is clean' assertions. When the manifest moves those assertions dangle; they belong with the set (or in the L1 composition gate, which already runs assertNoDisplayKeys at boot via obligation-purity.js per no-display-keys.js:17-19). The positive-control and cycle-termination blocks are generic and stay.
  - Evidence: src/server/app/model/no-display-keys.test.js:3 (manifest import), :31-37 (real-model assertions); src/server/app/model/no-display-keys.js:17-19 (boot-time enforcement already wired via routes.js)

- **src/server/app/model/obligations/helpers/index.js** _(nice-to-have)_
  Comment-level set knowledge threaded through otherwise fully generic L2 code: the helper-taxonomy docstring explains itself via numberOfPackages/commodityLine/passport/unitRecord/cph examples, and the same pattern recurs in witness/synthesise.js (passport/tattoo/earTag/horseName/permanentAddress, identificationDetails), witness/kinds.js (accompanying-document siblings, regionCode) and scalar helper docstrings (equals-gate.js regionCode/purposeInInternalMarket, includes-gate.js transitedCountries). No structural coupling, but the comments will rot the day a second set exists and read as if the engine serves live-animals; rewrite with set-neutral examples when touched.
  - Evidence: src/server/app/model/obligations/helpers/index.js:50-68 (commodityLine/passport/unitRecord/cph examples); src/server/app/model/analysis/reachability/witness/synthesise.js:36-42, :73-75; src/server/app/model/analysis/reachability/witness/kinds.js:20-22; src/server/app/model/obligations/helpers/scalar/equals-gate.js:33-38; src/server/app/model/obligations/helpers/scalar/includes-gate.js:4-5

### services-other

- **src/server/app/services/mode.js** _(important)_
  The platform-wide stub/real run-mode switch is keyed on a set-named env var LIVE_ANIMALS_MODE, yet it governs generic L2 services (countries, ports, document-uploads, persistence) — set knowledge by name in L2; a second set would have to flip 'LIVE_ANIMALS_MODE' to run plant-products stubbed.
  - Evidence: mode.js:1 (process.env.LIVE_ANIMALS_MODE); generic consumers: countries/index.js:3, ports/index.js:3, document-uploads/index.js:1; also asserted as the platform mode in run-mode.test.js:131-145

- **src/server/app/services/countries/index.js** _(nice-to-have)_
  The generic countries service hardcodes the live-animals origin-country scope — prime() bakes in the 'GBNAG_SPS_EX' block, so a second set needing a different country block cannot reuse the service unchanged even though client.js already parameterises blocks; the block choice belongs to the set or composition root.
  - Evidence: index.js:9 (fetchCountries(['GBNAG_SPS_EX'])); client.js:4-11 shows blocks is already an injectable parameter; the same block is baked into the fixture capture at _capture/capture.js:13

- **src/server/app/services/_capture/capture.js** _(nice-to-have)_
  Generic fixture-capture tooling carries the same set-scoped country-block hardcoding as countries/index.js, and its npm script is set-named (capture:live-animals) despite capturing set-agnostic reference data — cosmetic set coupling that follows the countries fix.
  - Evidence: capture.js:13 (countries?blocks=GBNAG_SPS_EX target); package.json:37 (capture:live-animals script name); fixtures.js:9-13 and fixtures.test.js are otherwise clean generic loaders

- **src/server/app/services/address-book/index.js** _(nice-to-have)_
  The address-book core (search/pagination/addParty) is a clean set-agnostic L2 service, but the BY_ROLE registry hardcodes the seven live-animals party roles as L2 module state, so a second set with different roles must edit L2 to seed its books — the role-to-seed registry should be registered/injected from the set while the engine stays in L2.
  - Evidence: index.js:11-19 (BY_ROLE with consignor/consignee/importer/placeOfOrigin/destination/contact/commercialTransporter); interface itself is role-parameterised and tolerant of unknown roles (index.js:28-31); all consumers are sets/live-animals/journeys/linear/features/{addresses,contact,transport}/** (grep); stub/commercial-transporter.js:5,16 carries animal-transporter approvalNumbers, an extra field only that role has

### services-persistence

- **src/server/app/services/persistence/records/real/lifecycle/mutate.js** _(important)_
  The generic real records adapter hardcodes the two live-animals projections (mapper functions + notifications/proposed-notifications URLs) inside replaceFulfilment, so a second set cannot reuse the adapter without editing L2 — the canonical-first/retry/aggregate-failure machinery is generic but the projection list should be injected by L1 composition.
  - Evidence: real/lifecycle/mutate.js:2-5 (imports ../../mapper.js), mutate.js:43-54 (literal projection list naming 'current notification'/'proposed notification' with fulfilmentToNotification/answersToTargetNotification); real/config.js:6-7 (notificationsUrl/proposedNotificationsUrl)

- **src/server/app/services/persistence/records/fulfilment-codec/obligations/lookup.js** _(important)_
  The codec mechanics are genuinely generic (entries of obligationId/value/records, form + depth validation), but lookup.js statically binds the live-animals obligation manifest into L2 at module load — a second set's fulfilments would validate against the wrong registry and silently fall through to the unknown-stored fallback; the registry should be injected per set at composition.
  - Evidence: fulfilment-codec/obligations/lookup.js:1-4 (imports groups+obligations from model/obligations/obligations.js — the live-animals manifest); encode.js:26,34 (unknown obligations skip form validation via unknownStoredAsRecords); validate/current-form.js:5-6 (missing obligation returns without validating)

- **src/server/app/services/persistence/records/real/lifecycle/read.js** _(important)_
  Stub/real port asymmetry on list scoping: the stub list is session-scoped by required journeyIds while the real list ignores journeyIds entirely and returns the backend's unscoped page — the same port call yields differently-scoped data per mode (matches the known open security ticket about unscoped per-user listing).
  - Evidence: real/lifecycle/read.js:16-40 (list signature has no journeyIds and sends none to the backend) vs stub/lifecycle/read.js:13-24 (filters to requested journeyIds, empty list for empty ids); real/real.amend-list.test.js:77 pins it: journeyIds: ['session-id-is-ignored-in-real-mode']

- **src/server/app/services/persistence/records/real/real.integration.test.js** _(important)_
  The documented invocation for this gated integration test is dead after the re-parent: `npm run test:live-animals -- real.integration` now filters to src/server/app/sets/live-animals, which no longer contains this file, so the only documented way to run the real-backend IT silently runs zero tests.
  - Evidence: real/real.integration.test.js:21-22 (comment: LIVE_ANIMALS_IT=real npm run test:live-animals -- real.integration) vs package.json:36 (test:live-animals = vitest run src/server/app/sets/live-animals)

- **src/server/app/services/persistence/records/stub/marshal/list-item.js** _(important)_
  The records-port list-row shape is a live-animals dashboard projection baked into L2 in both adapters (commodity, originCountryCode, arrivalDate, consignor/consignee, projected from set answer keys like commodityLines/commoditySelection) — a second set forces a port-shape change; the row projection should be set-provided or the port should carry generic summary fields.
  - Evidence: stub/marshal/list-item.js:11-25 (projectAnswers then answers.commodityLines?.[0]?.commoditySelection, answers.countryOfOrigin, answers.arrivalDateAtPort, consignor/consignee); real/marshal/list-item.js:3-14 (same set-shaped row mapped from the backend's enriched fields); stub also duplicates isoFromDateParts (list-item.js:4-8) vs notification-mapper/shared/iso-date.js:1-5 with a null/undefined difference

- **src/server/app/services/persistence/records/stub/reference-number.js** _(nice-to-have)_
  The stub mints GBN-AG-YY-XXXXXX references — the animals set's reference scheme hardcoded in the generic stub (mirrors the real backend's format, so acceptable today, but under the second-set lens the prefix/format should come from set configuration via L1).
  - Evidence: stub/reference-number.js:12 (`GBN-AG-${year}-${body}`); real.integration.test.js:40 confirms the real backend mints the same scheme (REF_PATTERN /^GBN-AG-/)

- **src/server/app/services/persistence/records/records-port.test.js** _(nice-to-have)_
  The generic durable-port contract test uses the live-animals countryOfOrigin obligation as its fixture and asserts the GBN-AG reference format, tying the L2 port contract to set data — an opaque UUID fixture would keep it set-agnostic (and once model/obligations completes its move to sets/, this import becomes an explicit L2-test-to-L3 edge).
  - Evidence: records-port.test.js:9 (import countryOfOrigin from ../../../model/obligations/obligations.js), :19-21 (asserts ^GBN-AG- reference format)

- **src/server/app/services/persistence/session/real.js** _(nice-to-have)_
  real.js re-declares the three 'liveAnimals*' storage-key strings locally while stub.js imports the identical values from engine/persistence/session.js — duplicated constants across the stub/real pair are a drift hazard, and the liveAnimals branding on generic per-journey session keys is set naming in L2 (the constants' home in engine has the same issue).
  - Evidence: session/real.js:1-3 (local KNOWN_JOURNEYS='liveAnimalsKnownJourneys' etc.) vs session/stub.js:1-5 (imports KNOWN_JOURNEYS_COOKIE etc.); engine/persistence/session.js:1-3 (same string values)

- **src/server/app/services/persistence/it-mode.js** _(nice-to-have)_
  The integration-test gate for generic persistence adapters is keyed on a set-branded env var (LIVE_ANIMALS_IT), same pattern as services/mode.js's LIVE_ANIMALS_MODE — platform-level switches carrying set names read wrong once a second set exists.
  - Evidence: it-mode.js:1 (process.env.LIVE_ANIMALS_IT); consumed by session/real.redis.integration.test.js:8,60 and records/real/real.integration.test.js:8,91; services/mode.js:1 (LIVE_ANIMALS_MODE) is the same pattern one level up

- **src/server/app/services/persistence/records/stub/list-query.js** _(nice-to-have)_
  Stub/real sort asymmetry plus a set-domain literal: both adapters default sort to 'arrivalDate,desc' (a live-animals dashboard column) but the stub's comparator only ever sorts by createdAt, honouring just the asc/desc suffix — so 'arrivalDate,asc' in stub mode silently sorts by a different key than real mode.
  - Evidence: stub/list-query.js:6-10 (sortByCreatedAt ignores the sort key), stub/lifecycle/read.js:16 (default 'arrivalDate,desc'), real/lifecycle/read.js:18 (passes sort through to the backend verbatim)

### set-obligations

- **src/server/app/sets/live-animals/obligations/sections/commodities/lines.js** _(important)_
  Obligation definition binds to the L2 services (IO) tier and snapshots the allowlist at module-load time — packageCountCommodities() is called once at module scope inside the applyTo construction, so the gate freezes whatever the service returned at import; the target grants L3 'may import L2 helpers', and services own IO — if commodities moves from stub to real MDM (the stated direction), a sync module-scope call site breaks every gated obligation.
  - Evidence: lines.js:1 (import from '../../../../../services/commodities/index.js'), lines.js:81 (allowListed(commodityCode, packageCountCommodities(), ...) at module scope)

- **src/server/app/sets/live-animals/obligations/sections/commodities/identifiers.js** _(important)_
  Same services-tier binding as lines.js, at larger scale — five commodity allowlists are fetched at module scope (including twice more into SPECIFIC_IDENTIFIER_WHITELISTS), baking a load-time snapshot of service data into seven gated obligation definitions.
  - Evidence: identifiers.js:1-7 (import from services/commodities), :115, :129, :139, :149 (per-obligation allowListed calls), :164-169 (SPECIFIC_IDENTIFIER_WHITELISTS re-fetches four lists), :202-207 (permanentAddress)

- **src/server/app/sets/live-animals/obligations/sections/commodities/aggregates.js** _(important)_
  Same services-tier binding — cphCommodities() and unweanedCommodities() called at module scope inside anyAllowListed gate construction.
  - Evidence: aggregates.js:1-4 (import from services/commodities), :23 (cphCommodities()), :51 (unweanedCommodities())

- **src/server/app/sets/live-animals/obligations/sections/system.js** _(nice-to-have)_
  Stale mechanism reference left behind by the re-parent: the comment claims poApprovedReferenceNumber is 'on KNOWN_UNWIRED in obligations/coverage.test.js', but no KNOWN_UNWIRED identifier exists anywhere in src/server/app (only in this comment and obligations.js:44's comment), the actual coverage test asserts differently, and the relative path 'obligations/coverage.test.js' no longer resolves from the set folder (the test lives in model/obligations/).
  - Evidence: system.js:4 (comment), obligations.js:44 (same stale claim); grep for KNOWN_UNWIRED hits only these two comments; model/obligations/coverage.test.js:81-95 is the real check and has no such allowlist

### wiring-and-configs

- **webpack.config.js** _(blocker)_
  The `documents` bundle entry still imports the deleted old tree, so `npm run build:frontend` fails and pretest/prestart fail with it; the client JS now lives at src/server/app/sets/live-animals/journeys/linear/features/documents/client/index.js.
  - Evidence: webpack.config.js:26-29 imports '../server/obligation-based-app/obligation-sets/live-animals/features/documents/client/index.js'; new location confirmed by ls of src/server/app/sets/live-animals/journeys/linear/features/documents/client (index.js present)

- **vitest.config.js** _(blocker)_
  The Playwright-spec exclude glob still targets the old tree, so the colocated *.e2e.spec.js files under the new sets/ path match vitest's default spec include and `npm test` will try to execute Playwright specs under vitest.
  - Evidence: vitest.config.js:16 excludes 'src/server/obligation-based-app/obligation-sets/live-animals/features/**/*.e2e.spec.js'; live e2e specs now at e.g. src/server/app/sets/live-animals/journeys/linear/features/hub/hub.e2e.spec.js

- **src/config/nunjucks/nunjucks.js** _(blocker)_
  Both the nunjucks.configure root and the vision `path` still point at the deleted obligation-sets tree, so no current root resolves the `live-animals/...` view names every controller uses (e.g. `live-animals/features/hub/template` via TEMPLATES='live-animals') — and no single-root fix exists because shared templates moved to L2 (src/server/app/shared/layout.njk) while feature templates moved deeper (sets/live-animals/journeys/linear/features/); the view-name strategy needs a decision: roots src/server/app (set-agnostic `shared/...` names for L2 chrome) plus src/server/app/sets (set/journey-prefixed feature views), with the L1 TEMPLATES prefix updated to match; line 15's common/templates root is also dead (directory does not exist).
  - Evidence: nunjucks.js:18 and nunjucks.js:45 reference server/obligation-based-app/obligation-sets; view names built from TEMPLATES='live-animals' at src/server/app/config.js:3 and used at e.g. sets/live-animals/journeys/linear/features/hub/controller.js:23; layout now at src/server/app/shared/layout.njk; find shows src/server/common/templates does not exist (nunjucks.js:15, webpack.config.js:102)

- **playwright.config.js** → `testDir './src/server/app/sets/live-animals/journeys/linear/features'` _(blocker)_
  The `features` project testDir points at the deleted old tree, so `npm run test:features` finds zero specs; it must point at the journey's features directory.
  - Evidence: playwright.config.js:44-46 testDir './src/server/obligation-based-app/obligation-sets/live-animals/features' with testMatch '**/*.e2e.spec.js'; specs now under src/server/app/sets/live-animals/journeys/linear/features/**

- **e2e/live-animals-journey.js** _(blocker)_
  The happy-path fixture readFileSync URL still targets the old tree while the sibling imports at the top were already repointed, so the module throws on load and both Playwright projects fail before any test runs; the journey-level copy is the right target (an identical duplicate also exists at src/server/app/flow/fixtures/happy-path.json for L2 tests — diff shows byte-identical).
  - Evidence: e2e/live-animals-journey.js:65 '../src/server/obligation-based-app/obligation-sets/live-animals/flow/fixtures/happy-path.json' vs already-updated imports at lines 4-6; fixture exists at src/server/app/sets/live-animals/journeys/linear/flow/fixtures/happy-path.json

- **.dependency-cruiser.cjs** _(blocker)_
  The LA path prefix matches nothing in the new tree, so every severity:error layer rule is vacuous and `npm run lint:arch` passes while enforcing nothing — and a plain path substitution is not enough, because the config's taxonomy (model/bridge/engine/flow/features/services/lib/shared all under one set root) no longer matches the re-parented architecture: those layers are now L2 at src/server/app/{model,bridge,engine,flow,services,lib,shared} with only obligations/ and journeys/ under the set, so the rules need re-anchoring to src/server/app plus new rules encoding L1-L4 (L2 must not import sets/**, obligations must not import journeys/**, engine purity).
  - Evidence: .dependency-cruiser.cjs:12 LA='src/server/obligation-based-app/obligation-sets/live-animals'; rules at lines 24, 39, 56, 71, 83, 94, 103 all anchor on ^${LA}/; actual layers at src/server/app/{model,bridge,engine,flow} and features at src/server/app/sets/live-animals/journeys/linear/features (find listing); package.json:31 runs depcruise against src/server/app/sets/live-animals with this config

- **.dependency-cruiser-known-violations.json** _(important)_
  The single grandfathered bridge->flow edge is pinned at old-tree endpoints, and the edge still exists at the new paths, so as soon as the cruiser config is re-anchored the baseline will not match and lint:arch will fail on a known edge — it needs regenerating via `npm run depcruise:baseline` after the config rework.
  - Evidence: .dependency-cruiser-known-violations.json:4-5 pins obligation-based-app paths; the live edge is src/server/app/bridge/readiness-config.js:1 importing '../flow/section-status.js'

- **package.json** _(important)_
  lint:arch/depcruise:baseline/depcruise:graph scan only src/server/app/sets/live-animals, but after the re-parent the load-bearing edges the architecture forbids (L2 engine/bridge/services importing sets/**, obligations importing journeys/**) originate outside that subtree, so the arch gate can never see them — the scan root should be src/server/app; everything else in package.json is already correctly repointed (e2e:start, test:live-animals at src/server/app/sets/live-animals, capture:live-animals at src/server/app/services/_capture/capture.js which exists).
  - Evidence: package.json:31-33 depcruise commands scan 'src/server/app/sets/live-animals'; L2 layers at src/server/app/{model,bridge,engine,flow,services} per find listing; confirmed-good scripts at package.json:36-37

- **src/server/common/helpers/errors.js** _(important)_
  The generic catch-all renders view 'live-animals/shared/error' — the name is both stale (error.njk now lives at L2 src/server/app/shared/error.njk, and no nunjucks root resolves the old name) and a set-knowledge leak: the platform-wide error handler hardcodes one set's prefix, which breaks the second-set lens; the companion test pins the same name and must change with it.
  - Evidence: errors.js:34 h.view('live-animals/shared/error', ...); errors.test.js:70 const errorPage = 'live-animals/shared/error'; template at src/server/app/shared/error.njk (find listing)

- **src/server/auth/unauthorised.njk** _(important)_
  The generic auth failure page extends 'live-animals/shared/layout.njk' — stale (layout moved to L2 src/server/app/shared/layout.njk) and a set-knowledge leak in set-agnostic auth chrome; it should extend the L2 layout under a set-agnostic view name once the template roots are fixed.
  - Evidence: unauthorised.njk:1 {% extends 'live-animals/shared/layout.njk' %}; rendered from src/server/auth/controller.js:30 h.view('auth/unauthorised', ...); layout at src/server/app/shared/layout.njk


## Confirmed sorted (39)

### app-spine

- **src/server/app/routes.js** _(unrated)_
  Confirmed as the intended composition point: pulls the set's routes/dispatchPages in one place, wires persistence/session/dispatch via the configure* seams, and asserts purity and binding coverage at boot — but note it is NOT currently the only app→sets import point (six L2 production files also import sets/**, per the findings above).
  - Evidence: src/server/app/routes.js:3,15-36

- **src/server/app/flow/dispatch.js** _(unrated)_
  Notable confirmation: this is the exemplar of the correct L2 pattern — pages are injected via buildDispatch(pages) at L1 and obligations arrive via the bridge, so dispatch carries zero set knowledge; the sibling flow modules that instead import journey data statically should follow this shape.
  - Evidence: src/server/app/flow/dispatch.js:84-90 (injection seam), :1-4 (bridge-only imports)

- **src/server/app/lib/path.js** _(unrated)_
  Notable confirmation: lib/ production code (path.js, answered.js, http-status.js, validate/*) is cleanly generic — answered.js leans on the L2 model's is-blank-value and validators source only shared locale defaults; no sets/** imports anywhere in lib production code.
  - Evidence: src/server/app/lib/path.js:1-68; lib/answered.js:1; lib/validate/validators.js:1-10

- **src/server/app/contract.test.js** _(unrated)_
  Notable confirmation: the root convention/contract tests whose imports were already repointed (contract.test.js, indexed.test.js, store-ops.test.js, routes.test.js) are correctly placed L1 files — set knowledge is allowed here and their sets/** imports all resolve against the new tree.
  - Evidence: src/server/app/contract.test.js:19-39; indexed.test.js:9,12; store-ops.test.js:16; routes.test.js:3

### bridge

- **src/server/app/bridge/fulfilment-bindings.js** _(nice-to-have)_
  Notable confirmation: the binding DSL (scalar/grouped/feature/assembleFeature) is the one part of the fulfilment machinery with zero set knowledge and zero manifest imports — exactly what generic bridge should look like.
  - Evidence: fulfilment-bindings.js:1 (only import is sibling fulfilment-id.js); no obligation names anywhere

- **src/server/app/bridge/fulfilment-id.js** _(nice-to-have)_
  Notable confirmation: pure composite-id string machinery, no imports at all — safely generic.
  - Evidence: fulfilment-id.js:1-38 (no imports, token/index arithmetic only)

- **src/server/app/bridge/readiness-config.js** _(nice-to-have)_
  Notable confirmation: the mutable seam exists precisely to keep the import graph a DAG (scope.js <- readiness-config <- flow/section-status), and it carries no set knowledge itself.
  - Evidence: readiness-config.js:1-16 (single flow import, override setter, comment documenting the cycle-avoidance)

- **src/server/app/bridge/status/completeness/leaf.js** _(nice-to-have)_
  Notable confirmation for the whole status/completeness + classification + facets + vocabulary core: generic over injected state and structure, imports only model state-queries and lib — correct intra-L2 direction (set names appear only in comments).
  - Evidence: status/completeness/leaf.js:1-5, status/completeness/index.js:1-17, status/classification/index.js:1-5, status/facets.js:1, status/vocabulary.js:1-5, status/completeness/records.js, status/completeness/invariants.js (no manifest imports in any)

### depcruise

- **.dependency-cruiser.cjs** _(nice-to-have)_
  Notable confirmation: three of the target invariants are already clean in the code even though no rule currently enforces them — obligations import no journeys, no journey/L2 production file touches the model behaviour surface (evaluator/state-queries stay bridge-only), and engine production code imports no services — so those rules can land at severity error with an empty baseline.
  - Evidence: grep sets/live-animals/obligations for journeys/ -> no import hits; grep for obligations/evaluator|state-queries outside bridge//model/ -> comments only (sections/commodities/lines.js:26); engine services grep -> *.test.js only

### docs

- **src/server/app/docs/engine.md** _(unrated)_
  Confirmed sorted despite the re-parent: every cited module (model/obligations/evaluator.js and its evaluator/ submodules, state-queries, bridge/scope|purge|status|readiness-config, engine/read.js, engine/write/index.js, engine/store.js, flow/section-status.js) still resolves at L2; only the informal use of the old 'features/' name in prose (line 24) dates it.
  - Evidence: docs/engine.md:18-21, :24, :240-253 all verified against the L2 tree

- **src/server/app/docs/persistence.md** _(unrated)_
  Confirmed sorted: all citations (engine/persistence/*, services/persistence/records/{stub,real}, fulfilment-codec, mapper.js, engine/journey.js, engine/write/index.js) resolve, and the port-surface and mapper claims match the code; the doc is genuinely layer-clean L2 documentation.
  - Evidence: docs/persistence.md:18, :51, :81, :112, :144 verified against services/persistence/ and engine/ trees

- **src/server/app/docs/analysis.md** _(unrated)_
  Confirmed sorted: analysis/simulate.js, analysis/flow-reachability/index.js, model/analysis/reachability/, model/analysis/coverage.test.js and helper citations all resolve at L2 and the described prover contracts match the file layout.
  - Evidence: docs/analysis.md:7-15, :187-194 verified against analysis/ and model/analysis/ trees

- **src/server/app/docs/cardinality.md** _(unrated)_
  Confirmed sorted: bridge/obligation-source.js (MAX_ENTRIES_FROM at line 38), model/obligations/state-queries.js, engine/evaluate/cardinality.js, bridge/status/status.test.js and engine/mutators.test.js all resolve; no stale paths.
  - Evidence: docs/cardinality.md:5, :81-91, :124-126; bridge/obligation-source.js:38

- **src/server/app/docs/lighthouse.md** _(unrated)_
  Confirmed sorted: lighthouserc.cjs, tests/lighthouse/auth-setup.cjs, scripts/lighthouse/flag-simple-findings.cjs and .github/workflows/lighthouse.yml all exist at the cited repo-root locations; doc is app-level tooling documentation and correctly placed.
  - Evidence: docs/lighthouse.md:4, :16, :72, :84 — all four targets verified present

- **src/server/app/docs/limits.md** _(unrated)_
  Confirmed sorted path-wise (all links resolve at L2), though its examples are live-animals-specific (V4 document cap, Mapper A/B narrowing) mirroring set knowledge that currently genuinely lives in the L2 modules it documents — it inherits, rather than causes, that leak.
  - Evidence: docs/limits.md:12, :26, :48, :60, :94, :103, :118 all resolve

### engine

- **src/server/app/engine/persistence/records.js** _(nice-to-have)_
  Notable confirmation: 'persistence' inside engine looks alarming but both files are pure ports — mutable impl tables injected via configureRecords/configureSession at boot, zero IO imports; the adapters live in services/persistence/** and engine purity is preserved by dependency inversion.
  - Evidence: persistence/records.js:6-26 (unconfigured guard + configureRecords), persistence/session.js:5-20 (same pattern); grep confirms no engine source file imports services/** or sets/** (only test files do)

- **src/server/app/engine/write/pipeline/canonical.js** _(nice-to-have)_
  Notable confirmation: the whole write surface (commit, submit, entries/*, pipeline/*) is clean generic orchestration — set knowledge arrives only via bridge declarations (FLOW_ONLY_OBLIGATIONS, MAX_ENTRIES_FROM, assertRecognisedAnswerKeys) and persistence via the injected ports; nothing here would change for a second set or a second journey style.
  - Evidence: write/pipeline/split.js:1 (FLOW_ONLY_OBLIGATIONS from bridge), write/pipeline/canonical.js:2-5 (bridge purge/assemble only), write/entries/mutate.js:1-5 (lib/path + engine-internal only), write/submit.js:2-4 (bridge + records port)

- **src/server/app/engine/test-support.js** _(nice-to-have)_
  Notable confirmation: shared test harness consumed downward-legally by L1 root tests, shared/, lib/, services/ and ~45 live-animals feature specs (L4->L2 is allowed); its driveHandler/postHandlerOf helpers encode the flow feature-module shape, which is itself L2, so no journey leak despite being used mostly by journey tests.
  - Evidence: test-support.js:80-107 (driveHandler/postHandlerOf); consumers include src/server/app/contract.test.js, src/server/app/shared/save-actions.test.js, src/server/app/sets/live-animals/journeys/linear/features/**/controller.test.js, src/server/app/services/persistence/session/session.test.js

### import-sweep

- **src/server/app/services/persistence/records/real/status.js** _(nice-to-have)_
  Direction check services->engine: 14 services files import engine/persistence/{records,session}.js, but only port contracts/status constants (SUBMITTED, DRAFT, AMEND, DELETED, configureRecords/Session) — engine defines the port, services implement it, and no engine production file imports services (only engine *.test.js import service stubs); dependency-inversion confirmed intact.
  - Evidence: services/persistence/records/real/status.js:6, real/marshal/document.js:1, real/write-guards/assert-writable.js:5, stub/lifecycle/{read.js:1,transition.js:6,create.js:5}, stub/store/writable.js:1, session/stub.js:5 import '../../../..(/..)/engine/persistence/*'; grep of engine/ for 'services/' hits only *.test.js files

- **src/server/app/sets/live-animals/obligations** _(nice-to-have)_
  Check 2 confirmed clean: no import under sets/live-animals/obligations references journeys/** or L1 — outbound imports go only to model/obligations/helpers and services/commodities (both L2).
  - Evidence: grep -rn 'journeys' over sets/live-animals/obligations returns nothing; full relative-import enumeration shows only ../../../../model/obligations/helpers/index.js and ../../../../../services/commodities/index.js targets

### journey-features-A

- **src/server/app/sets/live-animals/journeys/linear/features/documents/client/index.js** _(nice-to-have)_
  Confirmed clean client/server seam: the browser bundle graph reaches only feature-local, dependency-free modules (scan-poll.js, upload-config.js, whose sole import is the feature's own copy) — no engine, services or config leaks into the client, so the bundle stays buildable once the webpack entry is repointed.
  - Evidence: client/oversize-validation/submit.js:1 and client/scan-status/poll.js:1, status-cell.js:1 (../../{upload-config,scan-poll}.js); upload-config.js:1 (./copy/copy.en.js only); scan-poll.js has zero imports

- **src/server/app/sets/live-animals/journeys/linear/features/documents/e2e/upload.e2e.spec.js** _(nice-to-have)_
  Confirmed the eye-catching ten-level escape in all five colocated e2e specs resolves correctly to the repo-root e2e/ helper from the new depth — the specs themselves moved intact and import only feature-local copy/config plus that helper.
  - Evidence: upload.e2e.spec.js:4-8, scan-status.e2e.spec.js:3-6, commodities/e2e/{search,consignment-details,identification}.e2e.spec.js:4-9 → ../../../../../../../../../../e2e/live-animals-journey.js; helper confirmed at repo-root e2e/live-animals-journey.js

- **src/server/app/sets/live-animals/journeys/linear/features/documents/controller.js** _(nice-to-have)_
  Confirmed all six-dot-escape imports across both features' JS were rewritten to the new depth and land on legitimate L1/L2 targets (config, engine, lib, shared, services, bridge, flow) — no stale obligation-based-app import remains anywhere in the slice's JS; only configs and .njk refs are stale.
  - Evidence: controller.js:3-14 (6 ups from feature root), form/errors.js:1-3 (7 ups from subdir), view-model/fragments/status.js:1 and animal-identification/address/fields.js:1-3 (8 ups from sub-subdir) — depth arithmetic verified against src/server/app/ layout for the full grep listing of both features

### journey-features-B

- **src/server/app/sets/live-animals/journeys/linear/features/check-answers/view-model/rows/change-link.js** _(nice-to-have)_
  Notable confirmation answering the cross-feature-reader question: check-answers gets its row-mapping knowledge cleanly — values/copy are local, and Change targets resolve obligation→owning-page→slug through the generic L2 dispatch registry (built from page metadata at L1), so it names obligations only, never sibling features' internals; the registry itself is set-agnostic (buildDispatch indexes whatever pages it is given).
  - Evidence: change-link.js:11-12 changeHref = pagePath(journeyId, slugOfPage(pageOfObligation(obligationId))); flow/dispatch.js:84-99 registry built from page.collects with duplicate-owner and full-coverage assertions; the only two exceptions that bypass dispatch are species-card-actions.js:2-5 (imports sibling commodities/page.js slugs directly) and identifier-columns.js:3 (reported separately)

### journey-features-C

- **src/server/app/sets/live-animals/journeys/linear/features/index.js** _(unrated)_
  Confirmed correct as the journey's self-registry: dispatchPages (the 21 collecting pages) and allRoutes aggregate every feature for L1 to wire in one import, so the journey composes itself and only L1 needs to know it exists — exactly the seam a second journey style needs.
  - Evidence: features/index.js:33-55 (dispatchPages), :57-88 (allRoutes); injected via buildDispatch in tests (origin/controller.test.js:29) rather than imported by L2

- **src/server/app/sets/live-animals/journeys/linear/features/hub/controller.js** _(unrated)_
  Confirmed correctly wired despite pulling from five modules: presentation grouping (GROUPS) and status copy are journey-owned here; row semantics come from the journey's own flow/task-rows.js and flow.js; only genuinely generic machinery (rowEntry/gates/section-status/run-state/status constants) comes from L2 — the dependency direction is right everywhere in this file.
  - Evidence: hub/controller.js:2,14 (journey flow imports), :3-15 (L2 imports), :28-44 (journey-owned GROUPS), :46-58 (status tags from feature copy, no copy in L2 or model)

- **src/server/app/sets/live-animals/journeys/linear/features/notification-actions/controller.js** _(unrated)_
  Confirmed fine: cross-feature imports (renderNotificationView, renderDashboard) stay inside the same journey and point downward only to L1 config + L2 kit/engine; action surfaces without page.js/dispatch entries are consistent with the other non-collecting features (delete-notification, cancel-amend, confirmation).
  - Evidence: notification-actions/controller.js:1-6 (imports), :5-6 (sibling-feature renderers); same pattern at delete-notification/controller.js:57-70 and cancel-amend/controller.js:63-76

### model

- **src/server/app/model/obligations/evaluator/converge-purge.js** _(nice-to-have)_
  Notable confirmation: the entire evaluator pipeline (converge-purge plus the 14 step modules under manifest-index/, enumeration/, internal/, implications/, scope/, purge/) is confirmed pure and set-agnostic — no IO, no services, no sets/** imports, all state injected per call; the only blemish in the subtree is the default-manifest parameter flagged separately on evaluator/index.js.
  - Evidence: src/server/app/model/obligations/evaluator/converge-purge.js:1-5 (relative-only imports), src/server/app/model/obligations/evaluator/implications/index.js:69-97, src/server/app/model/obligations/evaluator/purge/purge-storage.js:55-82 (pure functions over injected context)

- **src/server/app/model/analysis/reachability/index.js** _(nice-to-have)_
  Notable confirmation: the reachability prover tree (graph/, witness/, fidelity/) is genuinely generic — operates on {id, dependsOn} records and helper metadata sidecars only; fidelity/dependency-record.js's single cross-boundary import is the L2-internal helpers accessor, and analysis/coverage.test.js probes helpers with synthetic samples, not the manifest. A second set's manifest can be fed to proveWithWitnesses unchanged.
  - Evidence: src/server/app/model/analysis/reachability/graph/prove.js:21-34, src/server/app/model/analysis/reachability/fidelity/dependency-record.js:1 (imports ../../../obligations/helpers/index.js only), src/server/app/model/analysis/coverage.test.js:68-138 (synthetic SAMPLE_OBLIGATIONS)

### services-other

- **src/server/app/services/ports/index.js** _(nice-to-have)_
  Notable confirmation: ports is the exemplar of a correct L2 reference service — real client against shared reference-data, stub seeded from the captured fixture so stub and real cannot drift, prime()-cached sync accessors, no set knowledge anywhere.
  - Evidence: index.js:1-17 (mode-switched prime + cache), client.js:1-18 (parameter-free generic fetch), stub.js:1-3 (seeds from _capture/fixtures.js)

- **src/server/app/services/document-uploads/index.js** _(nice-to-have)_
  Notable confirmation: document-uploads is a generic upload-lifecycle adapter (upload/scanStatus/remove/streamFile) despite feeling journey-flavoured — real.js targets the platform's notifications/{journeyId} record resource shared with persistence, not set copy, and the stub's scan lifecycle plus placeholder PDF are set-agnostic; IO stays in services with behaviour tests at the fetch boundary.
  - Evidence: index.js:1-5 (mode switch), real.js:29-45 (initiate under the platform record resource), stub.js:30-49 (filename-driven scan lifecycle), real.test.js/stub.test.js mock at the network/interface boundary

- **src/server/app/services/run-mode.test.js** _(nice-to-have)_
  Notable confirmation: a services-root test is the right home for this — it pins the cross-service mode-resolution behaviour (stub served unprimed, prime() no-op in stub mode, cache replacement in real mode) across countries, ports and mode.js via vi.resetModules, which no single service's own test could own.
  - Evidence: run-mode.test.js:16-24 (module-cache reset + env restore), 68-129 (both modes for both services), 131-145 (mode defaulting)

### services-persistence

- **src/server/app/services/persistence/records/fulfilment-codec/encode.js** _(nice-to-have)_
  Notable confirmation: apart from the lookup.js binding, the whole codec (encode/decode, validate/, records/, shape/) is genuinely set-agnostic — it operates on obligationId/value/records entries and obligation shape (within/depth), with no set literals, and losslessly round-trips unknown obligation ids for forward compatibility.
  - Evidence: encode.js:19-41, decode.js:9-65, records/decode-records.js:6-38, validate/fulfilment-id.js:8-27 (depth from obligation shape only), fulfilment-codec.test.js:223-253 (unknown-UUID round-trip)

- **src/server/app/services/persistence/records/real/index.js** _(nice-to-have)_
  Notable confirmation: the real/stub adapter pair is otherwise cleanly symmetric — identical 11-method port surface, matching document marshal shape, matching write-guard semantics and error wording ('is submitted — writes blocked'), and the errors/http/projections/write-guards/status support files are generic IO with correct imports (engine status constants, common logger, @defra/hapi-tracing).
  - Evidence: real/index.js:11-23 vs stub/index.js:11-23 (same surface); real/write-guards/assert-writable.js:7-12 vs stub/store/writable.js:4-10; real/marshal/document.js:5-14 vs stub/marshal/document.js:3-9; errors.js:1-19; real/projections/put-projection.js:5-22

### set-obligations

- **src/server/app/sets/live-animals/obligations/sections/commodities/identifiers.js** _(nice-to-have)_
  Notable confirmation: the literal UUID list in unitRecord.requires.anyOfIds looks like a copy-paste smell but is deliberate (comment explains id-based deferred resolution avoids declaration-order coupling and keeps the requires-any-of edge legible as data to the reachability prover), and all six literals verifiably match the sibling declarations in the same file.
  - Evidence: identifiers.js:86-93 (literals with name comments) match :111 (passport), :125 (tattoo), :135 (earTag), :145 (horseName), :172 (identificationDetails), :185 (description)

- **src/server/app/sets/live-animals/obligations/sections/transport.js** _(nice-to-have)_
  Notable confirmation (representative also for origin.js, import-reason.js, lines.js, identifiers.js, aggregates.js): the reason objects' English 'explanation' strings look like display copy but are applicability diagnostics — the codes are machine keys, the explanations are never rendered (the only non-set reference is a test at bridge/fulfilments/fulfilments.test.js:455), and the boot-time display-key ban walks these objects without objection since they carry none of label/title/titleKey/hint/legend/widget; likewise requires.errorCode values are codes, not copy.
  - Evidence: transport.js:3-18 (reason objects), origin.js:3-6, import-reason.js:3-25; model/no-display-keys.js:24-31 (banned-key set), obligation-purity.js:7-9 (boot gate over the live manifest)

- **src/server/app/sets/live-animals/obligations/sections/documents.js** _(nice-to-have)_
  Notable confirmation: pure obligation data with zero imports; the mention of 'the documents feature also caps the Add affordance' is comment-only context, not a journey import — no journeys/** or L1 coupling anywhere in the slice.
  - Evidence: documents.js:14-16 (comment only), :19-70 (plain data objects, no import statements); grep across sections/ shows imports only from model/obligations/helpers, services/commodities, and sibling section files

### wiring-and-configs

- **README.md** _(nice-to-have)_
  Notable confirmation: the README was already repointed at the new tree (docs link and lighthouse guide both reference src/server/app/docs), so no stale paths remain here despite the scale of the move.
  - Evidence: README.md:7 links src/server/app/docs/README.md; README.md:190 links src/server/app/docs/lighthouse.md

- **src/server/router.js** _(nice-to-have)_
  Notable confirmation: the host router composes the platform through the single L1 entry (./app/routes.js) and knows nothing else about sets or layers — exactly the composition seam the target architecture wants, and already updated for the new layout.
  - Evidence: router.js:7 imports { liveAnimals } from './app/routes.js'; registered at router.js:20-26 alongside only health/signout/static concerns


## Dependency-cruiser: proposed rule set

Role: the depcruise config is the machine enforcement of the whole L1-L4 architecture, and right now it enforces nothing — the stale LA constant makes every rule vacuous AND the half-updated npm scripts scan only sets/live-animals (L3/L4), so even correctly-ported rules could not see the L2->sets edges that matter most. Migration order: (1) fix the scan root in all three package.json scripts to src/server/app; (2) rewrite the config — new APP constant, the six new rules (l2-set-agnostic, routes-sole-sets-gateway, sets-no-import-app-root, obligations-no-journeys, journey-isolation, no-cross-set), the widened engine-no-services, and the ported legacy rules with both stale pathNot sanctions (features/evaluation.js, features/*/page.js) deleted; (3) REGENERATE the baseline rather than fixing violations first — the new rules surface ~49 real edges (8 L2->sets production files, ~40 sets->config.js, 1 bridge->flow readiness edge) and blocking the branch on all of them would stall the re-parent; --ignore-known pins each edge by both endpoints so nothing new can sneak in behind them. (4) Burn-down priority for the pinned edges, highest structural value first: move the live-animals manifest out of model/obligations/obligations.js into the set (kills the only L2->L3 edge and fixes obligation-purity transitively); split config.js so journeys import shared/paths.js instead of L1 (kills ~40 edges at a stroke); then invert the five L2->journey edges (fulfilment-registry<-evaluation, section-status<-task-rows, entry-guard<-page identity, navigation/prerequisites/simulate/kit<-flow.js/run.js) by having routes.js inject journey topology into L2 at boot — that is the same configure* pattern engine persistence already uses, and it is exactly what the second-set/second-journey lenses require. Systemic observation: the re-parent has correctly separated generic machinery from set data everywhere except these injection seams — the code is one boot-wiring refactor away from genuinely supporting a second set, and the proposed rule set turns that finish line into a hard gate.

## Appendix: per-slice layer notes

### engine

Engine is in good structural health as a layer: no production source file under engine/ imports services/** or sets/** — IO is reached exclusively through two boot-injected ports (engine/persistence/records.js, engine/persistence/session.js), which is a defensible reading of 'engine is pure' even though the code freely handles hapi request/h objects and Boom errors (it is a web-journey engine, not a pure evaluator — the pure evaluator lives in model/). The load-bearing intra-L2 direction is engine->bridge: obligation-source, evaluation, purge, assemble-fulfilments and answer projection are all consumed from bridge, which acts as the set-facing seam. Caveat for the second-set lens, owned by other slices but material here: bridge/obligation-source.js imports model/obligations/obligations.js, and that manifest now imports sets/live-animals/obligations/sections/* directly (obligations.js:58-123) — so the engine is transitively mono-set at that single aggregation point; if the model slice fixes that (registry populated by L1), engine needs no code change, which is exactly the property the target wants. The engine's real weak spots are (1) its test files, which are the only place sets/** and services/** imports occur — one file (request-view.parity.test.js) is an outright journey test parked in engine, one (one-load-per-request.test.js) is an engine+real-adapter integration test, and the rest share a stub-wiring pattern from services — and (2) residual live-animals branding (cookie names, memo Symbols, one doc comment) plus one upward import of L1 config.js for the cookie path. All are mechanical fixes; none require redesign.

### model

The model layer is the workspace's generic obligation engine and it is in strong shape: the helpers tree (scalar + projection + introspection), helper-internals, is-blank-value, state-queries, the whole evaluator pipeline and the reachability prover are pure, IO-free, and operate only on injected manifests and metadata sidecars — a second set could reuse all of it unchanged. The layer's one systemic defect is that the re-parent stopped halfway: the live-animals section modules moved to sets/live-animals/obligations/sections/, but the manifest aggregator (model/obligations/obligations.js) stayed behind, importing sets/** from L2 and acting as the de-facto set registry. Grep shows ~60 files across bridge/, engine/, services/persistence, obligation-purity.js and every journeys/linear feature still resolve the set via 'model/obligations/obligations.js', so moving it is a wide but mechanical re-point (those importers are other slices' findings; several of them — bridge, services — arguably should receive the manifest via injection from L1 rather than import it at all, which is worth deciding before the mechanical re-point). Secondary systemic pattern: set-specific TESTS colocated with generic code (evaluator.test.js, whitelists.test.js, coverage.test.js, the real-manifest half of reachability.test.js, the real-model assertions in no-display-keys.test.js) — the generic/synthetic tests (evaluator.units.test.js, helpers.test.js, path-prefix-depth.test.js, state-queries.test.js, is-blank-value.test.js, analysis/coverage.test.js) are exemplary and stay. Tertiary: doc comments across L2 lean on live-animals examples (passport, cph, commodityLine) — cosmetic today, misleading under a second set.

### bridge

Bridge's algorithms are genuinely set-agnostic — binding DSL, composite-id machinery, answers<->fulfilments projection, scope/purge projection, the 5-way status rollup are all clean generic code with correct intra-L2 direction (model + lib only, no IO, no services in production code). The systemic defect is COMPOSITION LEAKING INTO THE LAYER: nearly every module binds at module scope to the live-animals manifest (via ../model/obligations/obligations.js — itself a set file parked in model, a model-slice finding) or to bridge's own set-wired singletons (fulfilmentRegistry, the evaluation.js evaluator). fulfilment-registry.js:2 is the slice's one hard production L2->L4 import. Injection seams already exist everywhere they're needed (createFulfilmentRegistry(features, manifest), createObligationEvaluator({obligations}), registry params on assemble/read) — so the fix is mechanical, not architectural: move singleton construction and the four set-data constants in obligation-source.js up to L1/the set and thread the composed registry/manifest through. Test placement mirrors the problem: bridge's test suite is ~90% live-animals characterisation (corpus/oracles fixtures, status.test.js importing L4 three times, the characterisation test asserting services mapper output), so under the second-set lens the directory currently has almost no set-independent proof of its own machinery — the synthetic-fixture cases scattered inside those tests (registry rejections, duplicate-contribution, path validation) are the seed of what bridge-local tests should become.

### services-persistence

This slice is the durable-port layer behind engine's configureRecords/configureSession seams: a records port (stub in-memory store vs real backend adapter over fetch) and a session port (cookie stub vs yar real), plus the fulfilment codec and the notification projection mappers. The lifecycle/store/http/write-guard mechanics are in good shape — genuinely generic, well-decomposed, and the stub/real pair is symmetric in surface and semantics (the two deliberate-looking asymmetries, list scoping and sort key, are both flagged). Set knowledge enters through exactly three funnels, all currently laundered through model/obligations/obligations.js rather than direct sets/** imports: (1) the obligation manifest binding (codec lookup.js + every notification-mapper section), (2) display/projection shapes (notification-mapper subtree, the list-row marshal in both adapters), and (3) set-branded identifiers (GBN-AG reference minting, liveAnimals* session keys, LIVE_ANIMALS_IT/MODE env vars). Because model/obligations is itself mid-migration (it already imports sets/live-animals/obligations/sections/*), every one of those manifest imports is a transitive L2→L3 edge that will become explicit the moment the manifest finishes moving — so the codec-registry injection, projection injection, and notification-mapper relocation should land in the same wave as the manifest move or the purity/depcruise rules will light up all at once. The clean target: records/session stay L2 with L1 composition injecting the set's obligation registry, projection mappers, list-row projection, and reference scheme; the notification-mapper subtree plus its two contract tests move wholesale into sets/live-animals. One config casualty of the re-parent found: real.integration.test.js's documented run command now matches zero files.

### services-other

The slice splits cleanly into two families, and the criterion that separates them is: a service belongs at L2 when its INTERFACE is set-agnostic (parameterised, or universally applicable so a second set could call it unchanged or ignore it) AND its stub is a stand-in for a genuinely shared upstream (reference-data MDM, the backend). It belongs in the set when the data IS the service — a hand-curated live-animals vocabulary with no client/real leg, a set-shaped accessor surface, and consumers exclusively under sets/live-animals — because a second set would write a parallel module, not reuse this one. Family A (correct L2): countries, ports, _capture, document-uploads, address-book core, mode — all have generic interfaces; residual set coupling is parametric (GBNAG_SPS_EX block, LIVE_ANIMALS_MODE env-var name, BY_ROLE seed registry) and fixable without moving files. Family B (mislocated set vocabulary): commodities, document-types, certification-purposes, import-reason-purpose, transport-reference, plus the mapper-a-enum-contract pin — every one stub-only, live-animals-worded, and imported solely by sets/live-animals (verified by grep; no slice file imports sets/**, so direction is clean today — the violation is knowledge placement, not import direction). Systemic consequence to coordinate with other slices: moving commodities into the set will surface three existing L2-side leaks that currently hide behind the L2-to-L2 import — services/persistence/records/notification-mapper/mapper-{a,b}/commodity.js, model/obligations/whitelists.test.js:38, and analysis/flow-reachability/fixtures/seeds.js — which would become L2-imports-set violations unless those consumers move into the set or receive the vocabulary by injection. The half-updated-config worry did not materialise in this slice: the only external reference is package.json's capture:live-animals script, which still resolves correctly to services/_capture/capture.js.

### app-spine

The spine splits sharply into three healths. (1) L1 root files are in good shape where they were hand-touched during the re-parent (routes.js, routes.test, contract/indexed/store-ops tests all repointed correctly), but the two filesystem-discovery tests (copy-convention, copy-parity) still scan a './features' root that no longer exists and will error at load — the discovery roots were missed exactly where imports weren't static. (2) The rendering/config plane is the most broken surface: nunjucks roots (src/config/nunjucks/nunjucks.js:18,45), webpack's documents-client entry (webpack.config.js:28), vitest's e2e exclude (vitest.config.js:16) and playwright's testDir (playwright.config.js:45) all still reference src/server/obligation-based-app/obligation-sets, while config.js's TEMPLATES/LAYOUT naming scheme ('live-animals/<...>') matches neither the new sets nesting (missing journeys/linear) nor the layout's new home in app/shared — as it stands no page template or layout name resolves. package.json and depcruise are the only configs already updated. (3) The generic L2 folders (flow, analysis, shared) have a systemic direction violation: six production modules import sets/live-animals/journeys/linear/** statically (section-status, prerequisites, navigation, entry-guard, kit, simulate), plus prover fixtures that are pure live-animals data. The repo already contains the correct pattern — buildDispatch(pages), configureRecords, configureSession are injected at routes.js — so the fix is mechanical, not architectural: add a configureJourneyFlow-style seam (sections, taskRows, allFlowPages, run order, flow-only keys, entry-surface policy) registered per journey at L1, and move journey-policy modules (entry-guard) and journey data fixtures down into the journey. app/flow vs sets/.../journeys/linear/flow is otherwise a clean machinery-vs-data split in intent: the journey flow folder holds flow.js/task-rows.js/run.js (data + order), app/flow holds algorithms — the overlap is only that the algorithms currently reach up for the data instead of having it injected. Test placement mirrors the production leak: many L2-folder tests are journey behaviour specs in disguise (shared/save-actions, journey-strip, change-context; flow/gates RULE suites; flow-reachability). Under the second-set lens nothing in L2 needs redesign — only these import edges and fixture locations force upheaval; under the second-journey-style lens the same six modules plus the opening-run session vocabulary (engine session's setOpeningRun, consumed by flow/run-state.js) are the pinch points.

### set-obligations

As a layer, obligations/sections/ is in genuinely good shape on the purity axes the standing rule cares about: all 11 files are data-first definitions (id/name/status/within/requires/applyTo), there is no display copy (reason 'explanation' strings are unrendered diagnostics; errorCode/reason codes are machine keys), no imports of journeys/**, L1, engine, bridge, or flow anywhere, and intra-slice imports (identifiers.js/aggregates.js -> lines.js) run in the right direction. The two systemic problems are both about what sits OUTSIDE the slice. (1) The set contract is decapitated: obligations/ has no index — the manifest, groups derivation, and container back-ref wiring live in L2 at model/obligations/obligations.js, which is the single importer of every section file and re-exports them to the 16 journey evaluation.js consumers. So today the layering is effectively L2 -> L3 -> L2, and 'obligations/ + journeys/' is only the complete set contract once that manifest (plus its set-pinned tests, whitelists.test.js and coverage.test.js) moves down to sets/live-animals/obligations/index.js and L1 wires the manifest into the generic evaluator. (2) The three commodities files bind to services/commodities at module-load time, and that service is live-animals vocabulary wearing a generic name — a double leak: set data in L2 services, and IO-tier dependency baked into supposedly-pure set root data via module-scope snapshot calls (packageCountCommodities() etc.), which would break outright when the stub becomes real async MDM. Under the future-proofing lenses: a second journey style would slot in cleanly (nothing in obligations knows about linear/), but a second set is blocked until the manifest and the commodity vocabulary move out of L2.

### journey-features-A

These two features are the strongest evidence the L4 layer works as designed: each is a self-contained page bundle (controller + view-model + form parsing + copy + .njk + colocated e2e + client JS for documents) importing downward only — engine for state, services for IO (document-uploads, document-types, commodities, countries), shared/lib for kit, and page identity from its own page.js. The standing no-display-logic rule is honoured: all labels/hints/messages live in copy modules inside the journey, and identifier/address field definitions are derived from copy at the journey layer (identifier/fields.js), not from obligations. The JS move itself is complete and internally consistent; what is half-done is everything OUTSIDE the slice that names it: webpack, nunjucks search path + the TEMPLATES-prefixed view-id scheme, playwright testDir, vitest e2e-exclude, and the depcruise LA root (package.json alone was updated). Two systemic direction problems recur: (1) journeys reach set obligations via the L2 model aggregator (evaluation.js files), which is what forces model/ to import sets/** — the journey-side halves of that edge are cheap to fix from here; (2) bridge/applicability.js carries a documents-specific accessor (maxDocuments) that belongs in the feature. Also flagging for the bridge/flow analysts: the old depcruise config sanctions bridge/fulfilment-registry.js reading features/evaluation.js (an L2→L4 up-edge, per .dependency-cruiser.cjs:30-46 comment) — the per-feature evaluation.js files in this slice are that edge's suppliers, so any redesign of the binding registry lands on them. Second-set lens: nothing inside these features would resist a plant-products set arriving beside live-animals except the global 'documents.js' bundle name; second-journey-style lens: obligations knowledge is confined to evaluation.js/max-documents, so a single-page journey could reuse the set's obligations, though it would want lineKey/selection primitives imported without dragging controllers (one nit filed).

### journey-features-B

This slice is the heavy L4 page layer and it is structurally very consistent: every feature follows page.js descriptor + controller + copy.{en,cy}.js pair + colocated unit/copy/e2e tests + view-model modules, copy stays out of view-models except via the copy modules, and behavioural test coverage is unusually strong (per-status CYA matrices, POST-time-priming pins, no-JS pagination round-trips). Downward imports to L2 (engine, bridge, services, shared, lib, flow) are the norm and correctly directed; obligations are referenced by id strings plus dispatch, which is exactly the future-proof shape. Four systemic patterns need attention: (1) the re-parent left the entire Nunjucks namespace behind — every template and view id still speaks the pre-move 'live-animals/...' dialect and the nunjucks roots point at the deleted tree, so nothing in this slice can render until config.js TEMPLATES, the extends/include paths and the nunjucks search roots are reconciled (blocker, one mechanical sweep); (2) journey evaluation bindings reach obligations through the L2 model aggregator (which itself imports sets/**) instead of the set's L3 sections — fixing the two evaluation.js imports is the journey-side half of untangling that L2 violation; (3) controller-to-controller imports are being used as the sharing mechanism (isCphApplicable, IDENTIFIER_LABELS, CREATE_ADDRESS_SLUG in party-picker/view-model/index.js:2 is the same pattern but benign since it only reads a slug constant) — shared predicates/label maps should live in non-controller modules; (4) L1 config.js acts as de-facto L2 shared: every controller imports its path builders and the 'live-animals' TEMPLATES constant, which under the second-set lens forks L1. One placement question: dashboard is the service landing ('/' + create endpoint) living inside journeys/linear — the second-journey-style hypothesis cannot be satisfied without hoisting it to the set level. check-answers itself is healthy as the cross-feature reader: it composes from answers + scope + evaluation and resolves Change targets generically via dispatch; its only leaks are the two direct sibling-feature imports called out in findings.

### journey-features-C

This slice is the healthiest layer in the re-parent: all 16 features share one strict shape (page.js identity object; controller owning meta.collects, validation, render, recoverable-save; copy/copy.{en,cy}.js + leaf test; colocated e2e; evaluation.js binding fields to obligations), copy discipline is fully honoured (no labels/hints in obligations or model — options come from services, copy from feature modules), and cross-feature imports never leave the journey. On the journey-flow vs app-flow split: the knowledge is partitioned correctly — flow/flow.js owns page order + section gates, flow/task-rows.js owns hub-row aggregation, flow/run.js owns the opening-run sequence, while L2 flow/ owns the generic machinery (dispatch, gates, prerequisites algebra, run-state cookie) — but the dependency direction is inverted in three places: L2 prerequisites/navigation import flow.js, L2 section-status imports task-rows.js, and L2 entry-guard imports the import-type-filter page. The repair is injection through L1, and the pattern already exists: dispatchPages is injected via buildDispatch, so sections/taskRows should follow it. The two genuine misplacements are the import-type filter (cross-set router living inside one set) and the pervasive L4-to-L1 config.js dependency (TEMPLATES='live-animals' and the hub-centred URL scheme are set/journey knowledge sitting in the composition layer). One move-correctness blocker: playwright/vitest/webpack configs still reference src/server/obligation-based-app/obligation-sets/..., so every colocated e2e spec in this slice is currently uncollected. Minor behavioural drift noticed in passing (not architecture): port-of-exit, exit-date, destination-country and import-type-filter re-render validation errors without the 400 status the other controllers set.

### wiring-and-configs

This slice is the outer shell — build, test, lint and template wiring that must agree with the app tree but lives outside it. Its health is split cleanly along what the owner touched by hand: package.json scripts, README, and the top-of-file imports in e2e/live-animals-journey.js are already on the new src/server/app/sets/live-animals layout, while everything he did not touch (webpack entry, vitest e2e-exclude, playwright features testDir, both dependency-cruiser files, the nunjucks template roots, and one readFileSync deeper in the e2e helper) still points at the deleted obligation-based-app tree. Net effect today: frontend build fails (webpack entry), npm test would ingest Playwright specs (vitest), test:features finds nothing (playwright), every server-rendered view including error pages cannot resolve (nunjucks), and the architecture lint is silently vacuous (depcruise) — the most dangerous of these being the vacuous lint, since it is green while enforcing nothing. Two systemic patterns worth the owner's attention: (1) the view-name strategy is now genuinely broken, not just stale — shared chrome templates moved to L2 (app/shared) while feature templates moved deeper (journeys/linear/features), so the old single 'live-animals/' prefix can no longer name both; the clean answer is two template roots (src/server/app for set-agnostic shared views, src/server/app/sets for journey views) with the L1 TEMPLATES constant carrying the full 'live-animals/journeys/linear' journey prefix; (2) generic chrome (errors.js catch-all, auth/unauthorised.njk) hardcodes the 'live-animals/' set prefix, which fails the second-set lens even after paths are fixed — those two callers should target the L2 shared templates under set-agnostic names. The dependency-cruiser config additionally needs conceptual rework, not find-and-replace: its whole taxonomy assumes the layers live under the set root, whereas they are now the shared L2 platform, and the arch gate's scan root (only the set subtree) can never see the L2-imports-sets edges the new architecture most needs to forbid.

### docs

The docs layer sits at src/server/app/docs (22 files) — app level in the new architecture. Health: split down the middle. The 8 docs that only cite L2 modules (engine, persistence, analysis, cardinality, limits, lighthouse, and mostly scope-and-wipe/services) survived the re-parent almost untouched. The 14 that cite the set/journey tree are all stale in a consistent, mechanical way, revealing two systemic patterns: (1) the owner's re-parent pass fixed markdown HREFS into ../sets/... but never the displayed LABELS, so every recipe still reads as if features/ and flow/flow.js sit at app level (add-a-field 19, add-a-page 29, add-a-section 33, add-a-collection 6, architecture 4, decisions 6 such links); (2) seven docs still declare the pre-re-parent root 'src/server/obligation-based-app/obligation-sets/live-animals/' as their path base — that string appears nowhere in the tree. A third, sneakier drift: the flow layer split (dispatch/gates/navigation/prerequisites/run-state/entry-guard/section-status stay L2; flow.js/run.js/task-rows.js went to L4 journeys/linear/flow/) is acknowledged by no doc — architecture.md and flow-and-gates.md present 'flow/' as one directory, mixing both layers under one heading. Placement judgement: docs SHOULD split. Platform docs (engine, persistence, scope-and-wipe, analysis, cardinality mechanics, services, validation mechanics, limits, lighthouse, testing, test-ownership, decisions, architecture) stay at app/docs; set/journey docs (README's journey framing, features.md, the journey-specific halves of flow-and-gates.md and obligation-model.md, and all four add-a-* recipes — which teach adding pages to THE LINEAR live-animals journey, citing its hub GROUPS, task rows and opening run) belong under sets/live-animals/ (recipes and features.md arguably under journeys/linear/docs/, since a second journey style would need different recipes while reusing the set's obligations). Two cross-slice flags for other analysts: (a) recipes' step-1 instruction to register set obligations via model/obligations/obligations.js documents and cements the L2→L3 import (obligations.js:58-123 imports ../../sets/live-animals/...); when the model slice relocates the manifest, all four recipes plus obligation-model.md need rewriting, so sequence doc fixes after that decision; (b) two config staleness items surfaced while verifying doc claims: playwright.config.js:44-45 features project testDir still points at the dead old path (the features E2E suite currently collects nothing), and package.json:36's narrowed test:live-animals target silently removed the app-root/bridge boot-guard tests from the command every recipe tells the developer to run as their red/green loop.

### import-sweep

The re-parent moved the code but not the resolution machinery: package.json scripts are updated to src/server/app/sets/live-animals, while nunjucks.js, webpack.config.js, playwright.config.js, vitest.config.js and .dependency-cruiser.cjs all still point at the dead src/server/obligation-based-app/obligation-sets path (src/server contains only app, auth, common, health, router.js, server.js, signout). Compounding this, the entire template namespace still uses 'live-animals/...' names (~40 extends/include/from lines plus errors.js view calls and TEMPLATES='live-animals' in app/config.js) which only ever resolved via the now-dead search path — so template resolution is broken repo-wide until either the search paths map 'live-animals/' onto the new tree or the names change. On the architecture itself: L3 obligations are clean (no journey or L1 imports), engine production is pure (no services imports; services depend on engine's persistence port, not vice versa), and L1 routes.js/config.js correctly own set knowledge. The violations concentrate in production files of model (obligations.js aggregates the set's sections), bridge (fulfilment-registry), flow (all four core files), shared (kit.js) and analysis (simulate.js) — i.e. the 'generic' layers are generic in name only; each has exactly one live-animals import that L1 injection would cure, except model/obligations.js which has eleven. L2 test suites are also wholesale coupled to the set (every layer's tests import dispatchPages/features), so a second set could not reuse L2's tests unchanged. Journey-side relative imports climb 6-7 levels to reach L2/L1 legally; the only true escapes are the colocated e2e specs (repo-root e2e/) and one test importing src/config.

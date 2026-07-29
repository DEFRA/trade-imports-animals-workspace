> **Provenance.** Produced by a pure-Claude design workflow (`wf_2487f6bf-a43`, 2026-07-29):
> 20 designers (one per crammed module + one for the data files) → 3 hardening lenses
> (layering-safety, nesting-depth [lean deep], convention-consistency) → synthesis. Read-only design;
> nothing implemented. Bias set to **prefer over-nesting to under-nesting** per Sam. The harden phase
> corrected the deep-nesting instinct where it over-reached (hollowing controllers into barrels,
> redundant internal barrels) and pinned two hard floors: layering-safety + not-misleading.

# Live-Animals Frontend — Structural Decomposition Proposal

## 1. Summary

Yes — the app is over-crammed **at the file level**, not at the function level. A companion JS-logic audit already confirmed the individual functions are clean; the problem is **file cohesion**: a handful of files each carry four-to-seven unrelated responsibilities behind one filename. The 20 candidates reviewed break into three shapes:

- **Fat controllers** (`features/**`) where the Hapi lifecycle is ~40% of the file and the rest is view-model assembly, validation, form marshalling and remove sub-flows — e.g. `features/check-answers/controller.js` (723 loc), `features/documents/controller.js` (649), `features/commodities/animal-identification.controller.js` (622).
- **Layer-modules** (`model/**`, `bridge/**`, `engine/**`, `services/**`) that bundle a public entry with several separately-testable helper clusters — e.g. `model/obligations/evaluator.js` (686), `model/analysis/reachability.js` (623), `model/obligations/helpers.js` (597).
- **Declarative data** — `model/obligations/obligations.js` (938) and `services/address-book/stub.js` (416), big because they are manifests, not because they are tangled.

**The fix, and the headline convention:** every crammed module becomes a **folder of cohesive small modules**, split along the seams the code already draws (banner comments, `buildSections`' section tree, the four-step `evaluate()` pipeline). Every move is **behaviour-preserving** — `git mv` + re-export + import repoint, **DOM-identical**, `lint:arch` stays green with **no new baseline exception**. The one headline rule: **the split follows the domain axis already visible in the code, and we LEAN DEEP** — Sam prefers over- to under-nesting, so a folder-per-small-module is the target, not a smell.

---

## 2. The split convention

Two reusable patterns plus one data rule. Introduce **no net-new micro-pattern** mid-pass (see the `copy.js`-barrel rejection below).

### Pattern A — feature fat-controller split

1. **`controller.js` (or `<page>.controller.js`) stays the Hapi door.** It keeps `meta` + `get`/`post` + `render` + `routes`. Pure helper clusters move to subfolders; the handlers **never** move out. Hollowing a controller into a pure re-export barrel actively misleads about where request handling lives (`check-answers` HARD STOP #3; `search` HARD STOP #2). This is the rule `dashboard` and `documents` originally broke — corrected below.
2. **Cluster subfolders use `decisions.md` §1's blessed vocabulary:** `view-model/`, `validation/`, `form/`. Not synonyms — standardise on `view-model/` (not `view/`).
3. **Multi-page features** (`<page>.controller.js` files: `commodities/*`, `addresses/party-picker`) use the **search pattern uniformly**: keep `<page>.controller.js` as the **thin entry beside** a sibling `<page>/` folder. This is zero-external-repoint and lets a re-export (e.g. `lineKey`) survive at the entry. Do **not** mix "move-in" (`<page>/controller.js`) with "beside" inside one feature.

### Pattern B — layer-module split

4. Promote `foo.js` → **`foo/index.js`** with a **single barrel at the module boundary**, matching `engine/index.js` and `services/*/index.js`. **Do not add per-internal-subfolder `index.js` barrels** — the repo's own internal groups (`engine/evaluate/`, `engine/persistence/`) are barrel-free and imported by path. Internal `index.js` files are allowed **only** when they hold real assembly logic (e.g. `mapper-a/index.js` owns `fulfilmentToNotification`), never as pure re-export layers.
5. Keep the **`foo.js`-beside-`foo/`** form **only** where a hard constraint forces it — never merely to save mechanical repoints.

### The three (and only) sanctioned reasons NOT to promote/split

1. **The barrel owns real assembly logic** — `model/obligations/obligations.js` owns the ordered `obligations` array, the `groups` filter, and the container back-ref mutation loop.
2. **A documented filename contract** — `model/obligations/evaluator.js` is pinned literally by the `model-behaviour-bridge-only` depcruise regex.
3. **The file is a single review/diff unit** — `features/commodities/copy.{en,cy}.js` is a parallel-language diff unit and the pending human Welsh-review artifact.

"Saving mechanical repoints" is **not** on that list — so `helpers.js`, `status.js`'s "cheaper alternative" and `flow-reachability.js`'s "zero-repoint alternative" all promote to `index.js`.

### The nesting principle — LEAN DEEP

Default to **more** subfolders and **deeper** grouping. Group by the **domain axis already latent in the code** (the `reduce`/`compose`/object-literal the assembler uses), not by which child happened to grow big. Keep depth **uniform across siblings** — the same concept (a port's verb set, a remove sub-flow, a mapper's per-section overlays) must nest identically wherever it appears. A folder-per-small-module is fine. The **only floors** are:

- **Layering-safety** — a fragment must not cross a layer boundary it shouldn't (model-tier files import only intra-model or `services/<name>/index.js`).
- **Not-misleading** — stop when a folder boundary would imply structure that isn't there, or would break a guard (e.g. `witness/synthesise.js` kept whole for `coverage.test.js`'s raw-source scan; `copy.{en,cy}.js` at feature root for the parity scanners).

---

## 3. Per-module plan

Verdicts below **fold in every blocker/major** from the hardening pass. `depcruise risk` is `none-intra-layer` throughout — all moves stay inside their tier, so the four `*-no-up` rules and `no-circular` (all matched by layer prefix) are invisible to nesting.

### Fat controllers (`features/**`)

| Module | loc | Verdict | Target tree (brief) | Churn |
|---|---|---|---|---|
| `check-answers/controller.js` | 723 | **split-folder** | `controller.js` (door) + `view-model/{index,applicability}.js`, `view-model/rows/{value-text,change-link,summary-row,party-row}.js`, **`view-model/cards/{consignment,movement,addresses}/…` mirroring `buildSections`' section tree** + `cards/documents.js` | medium |
| `documents/controller.js` | 649 | **split-folder** | **`controller.js` keeps `get/getStatus/getFile/postAdd/postRemove/post`**; extract `contracts/{upload-id,remove-action,max-documents}.js`, `form/{payload,errors}.js`, `scan/{status,summary-errors}.js`, `view-model/{render,refresh,rows,fragments/*}.js` (renamed from `view/`), `handlers/{load-page,reads/download}.js` for helper bodies. **Drop the `copy.js` barrel.** | medium |
| `commodities/animal-identification.controller.js` | 622 | **split-folder** | Thin `animal-identification.controller.js` entry **beside** `animal-identification/{fields.js, identifier/*, address/*, card/*, form/*, records/append.js, remove/}` | medium |
| `commodities/search.controller.js` | 241 | **split-folder** | Thin `search.controller.js` entry (keeps `render/get/post/routes/meta`, re-exports `lineKey`) **beside** `search/{selection/*, view-model/*, actions/*}` | low |
| `commodities/consignment-details.controller.js` | 235 | **split-folder** | Thin `consignment-details.controller.js` entry **beside** `consignment-details/{lines.js, fields.js, validation/*, view-model/*, remove/}`. **`linesOf` → `lines.js` leaf** (breaks controller↔remove cycle). **Drop `copy.js` barrel.** | medium |
| `dashboard/controller.js` | 209 | **split-folder** | **`controller.js` keeps `listGet/backToDashboard/amendPost/create/routes` + `renderDashboard`**; extract only `view-model/row/{index,actions}.js` + `view-model/sort-options.js` | low |
| `addresses/party-picker.controller.js` | 245 | **split-folder** | Thin `party-picker.controller.js` entry **beside** `party-picker/{request-params.js, selection.js, view-model/{index,address-lines,error-summary}.js, view-model/pagination/{index,results-href,page-numbers}.js}` | medium |
| `documents/client.js` | 367 | **split-folder** | `client/{index.js, dom.js, scan-status/*, oversize-validation/*}`. **Load-bearing:** repoint `webpack.config.js:30` `documents/client.js` → `documents/client/index.js` in the same change or the bundle 404s. | low |

**Folded corrections:**
- **`commodities/*` (was a BLOCKER):** the three co-located page controllers must **not** get three different resolutions. All use the search pattern — thin `<page>.controller.js` entry beside `<page>/`. `consignment-details` imports `{ lineKey }` from `./search.controller.js`, so keeping `search.controller.js` as the re-exporting entry means **zero repoint**.
- **`dashboard` / `documents` (major):** handlers stay in `controller.js`; only helper/view-model bodies move.
- **`check-answers` cards (major):** nest by the section tree `buildSections` builds — `aboutTheConsignment`→`cards/consignment/`, `movement`→`cards/movement/`, `addresses`→`cards/addresses/` — not flat siblings next to `species/` and `transport/`.
- **`check-answers` `summary-row.js` (minor):** split into `rows/value-text.js` (`toArray/valueText/dateText`), `rows/change-link.js` (the only `flow/dispatch`-touching leaf), `rows/summary-row.js` (`row/readOnlyRow`).
- **remove sub-flow consistency (minor):** where the remove flow is a full sub-controller (`animal-identification`, `consignment-details`) it lives in a `remove/` subfolder; where it is a single handler (`documents`) it stays a leaf file. One convention, applied.
- **`copy.js` barrel (minor) — DROPPED** from `documents` and `consignment-details`: no existing feature composes copy in a per-feature barrel; extracted modules import `copy.en.js`/`copy.cy.js` and call `copyFor` inline, or receive resolved copy from `controller.js`.

### Layer-modules (`model/`, `bridge/`, `engine/`, `services/`)

| Module | loc | Verdict | Target tree (brief) | Churn |
|---|---|---|---|---|
| `model/obligations/evaluator.js` | 686 | **split-folder** | **Keep `evaluator.js` as the pinned barrel** + `evaluator/index.js` (assembler) + `evaluator/{converge-purge, manifest-index/*, scope/*, enumeration/*, purge/*, implications/*, internal/*}`. **Import internal leaves by path — drop the per-subfolder `index.js` barrels** (keep `implications/index.js` only — it holds the real `buildImplication` dispatcher). | medium |
| `model/analysis/reachability.js` | 623 | **split-folder** | `reachability/index.js` + `graph/*`, `witness/{kinds,witness-shapes,synthesise}.js`, `fidelity/*`. `synthesise.js` **stays one file** (`coverage.test.js` text-scans it). | low |
| `model/obligations/helpers.js` | 597 | **split-folder** | **Promote to `helpers/index.js`** (barrel re-exports **exactly the 11 public factories, never internals**) + `scalar/*`, `projection/{allow-listed,not-in-union-of}.js`, `projection/internals/*`, `introspection/*`. Import leaves by path (**drop `validate/index.js`**). | low→med |
| `model/obligations/obligations.js` | 938 | **split-folder (data)** | `obligations.js` **stays the barrel** owning the assembly tail; `export *` from `sections/{system,origin,import-reason,parties,transport,arrival,misc,documents}.js` + `sections/commodities/{lines,aggregates,identifiers}.js` | medium |
| `bridge/status.js` | 332 | **split-folder** | `status/index.js` + `{vocabulary,obligation-lookup,facets}.js`, `structure/index.js`, `classification/index.js`, `completeness/{index,records,leaf,invariants}.js`. Recursive tree stays in `completeness/index.js` (cycle floor). | low |
| `bridge/fulfilments.js` | 206 | **split-folder** | `fulfilments/index.js` + `{obligation-graph,fail-projection,fulfilment-id-path}.js`, `project-answers/{index,projections,dense-indices,assemble}.js` | medium |
| `engine/write.js` | 222 | **split-folder** | `write/index.js` + `{commit,submit}.js`, `pipeline/{split,view,canonical,flow-only,predicates}.js`, `entries/{mutate,reconcile,by-obligation}.js` | medium |
| `analysis/flow-reachability.js` | 330 | **split-folder** | `flow-reachability/index.js` + `provers.js`, `path-key.js`, `problems/*`, `fixtures/{enumerate-answer-states.js, seeds/*, scope-states/*}.js` | low |
| `services/persistence/records/fulfilment-codec.js` | 237 | **split-folder** | `fulfilment-codec/index.js` + `{encode,decode,fail}.js`, `shape/object.js`, `obligations/lookup.js`, `validate/*`, `records/*` | medium |
| `services/persistence/records/notification-mapper.js` | 437 | **split-folder** | `notification-mapper/index.js` + `shared/{compact,iso-date}.js` + `shared/lines/*`, `mapper-a/{index,commodity}.js` + `mapper-a/sections/*`, `mapper-b/{index,commodity,documents}.js` + **`mapper-b/sections/{responsible-person,purpose,region-code,transport-extras}.js`** | low |
| `services/persistence/records/real.js` | 294 | **split-folder** | `real/index.js` + `{config,logger,status}.js`, `http/*`, `marshal/*`, `write-guards/*`, `projections/*`, **`port/lifecycle/{create,read,mutate,transition}.js` matching `stub`** | medium |
| `services/persistence/records/stub.js` | 253 | **split-folder** | `stub/index.js` + `records.js`, `reference-number.js`, `list-query.js`, `store/{state,owner,writable}.js`, `marshal/*`, `lifecycle/{create,read,mutate,transition}.js` | low |
| `services/address-book/stub.js` | 416 | **split-folder (data)** | `stub.js` barrel re-exports 7 role arrays; `stub/{from-row,consignor,consignee,importer,place-of-origin,destination,contact,commercial-transporter}.js` — **pending filename-contract open question (§6)** | low |

**Folded corrections:**
- **`evaluator.js` (major, layering) — the one guard-integrity fix:** keep `evaluator.js` as the barrel **and widen the `model-behaviour-bridge-only` `to.path`** from `^${LA}/model/obligations/(evaluator|state-queries)\.js$` to `^${LA}/model/obligations/(evaluator(\.js$|/)|state-queries\.js$)` in `.dependency-cruiser.cjs`, shipped in the same change. Without it the severity:error boundary silently narrows to a single file and stops protecting `evaluator/**`.
- **`evaluator` / `helpers` (major, convention):** drop the pure re-export internal `index.js` barrels; import group leaves by path, matching `engine/evaluate/collection-view.js`.
- **`helpers.js` / `status` / `flow-reachability` (major, convention):** promote to `index.js`; delete the "cheaper/zero-repoint beside-folder" alternatives — the repo has no `X.js`-beside-`X/` precedent except the two forced cases.
- **`real.js` vs `stub.js` port depth (major, nesting):** both get the same `lifecycle/{create,read,mutate,transition}.js` verb grouping — the same port verb-set must not read three-levels-grouped in `stub` and flat-in-one-object in `real`.
- **`notification-mapper` mapper-b depth (minor):** add `mapper-b/sections/` for the scalar overlays, mirroring `mapper-a/sections/`.
- **`helpers.js` internals (minor, layering — load-bearing):** the barrel re-exports **only** the 11 public names; `filterAndProject`/`deriveUnion`/`deriveDependsOn` stay in `internals/` and are never barrelled, or `analysis/coverage.test.js` invariant #4 goes red.

### Data files

| Module | loc | Verdict | Reason |
|---|---|---|---|
| `model/obligations/obligations.js` | 938 | **split-folder** | Big-but-cohesive **data**; already banner-sectioned; barrel keeps the single-manifest assembly tail. (See §3 above + §6.) |
| `services/address-book/stub.js` | 416 | **split-folder** | Seven independent canned role arrays + one `fromRow`; partitions cleanly by role. (See §6 for the filename-contract call.) |
| `features/commodities/copy.{en,cy}.js` | 160/167 | **LEAVE-AS-IS** | Parallel-language diff unit + pending human Welsh-review artifact. (See §5.) |

---

## 4. Ranked increment backlog

Every increment is behaviour-preserving (`git mv` + re-export + repoint), DOM-identical, and independently verifiable: **unit suite + one E2E leg + `npm run lint:arch`** (against the **existing** baseline — never regenerate it to clear a red result). Ordered highest-value / lowest-risk first. Maps onto `refactor-backlog.json`.

| # | Increment | Verify canary | Risk notes |
|---|---|---|---|
| 1 | **`services/persistence/records/fulfilment-codec.js` → folder** (Pattern-B canary — `services/` unconstrained, proves the promote-to-`index.js` form + gate) | unit + `lint:arch` | 8 path repoints; barrel preserves surface |
| 2 | `services/persistence/records/notification-mapper.js` → folder (add `mapper-b/sections/`) | unit | `mapper.js` barrel keeps prod wiring untouched |
| 3 | `services/persistence/records/stub.js` → folder (`lifecycle/*`) | records-port.test | Maps become ES-module singletons in `store/state.js` — verify `clear()` in `beforeEach` still resets |
| 4 | `services/persistence/records/real.js` → folder (**same `lifecycle/*` depth as stub**) | `real.*.test` | 5 specifiers repoint; watch `../` depth at new leaves |
| 5 | `bridge/status.js` → folder (Pattern-B intra-bridge canary) | `bridge/status.test`, `flow/task-rows.test` | 5 repoints; keep recursion in `completeness/index.js` |
| 6 | `bridge/fulfilments.js` → folder | 9 test files | 15 repoints (medium) but all trivial |
| 7 | `model/analysis/reachability.js` → folder | `reachability.test`, `coverage.test` | Only 2 test importers; repoint `coverage.test` scan-URL to `witness/synthesise.js` |
| 8 | `analysis/flow-reachability.js` → folder | 2 test files | Seeds are **data** — split by axis, keep `seedVariants` whole |
| 9 | `model/obligations/helpers.js` → `helpers/index.js` | `helpers.test`, `coverage.test` | **Barrel re-exports only the 11 public names** |
| 10 | `engine/write.js` → folder | `write-guard.test`, `flow-only-session.test` | `engine/evaluate` sets the barrel-free precedent |
| 11 | **`model/obligations/evaluator.js` → folder + `.dependency-cruiser.cjs` regex widen** | `evaluator.units.test` + `lint:arch` (the widen is the gate) | The one config edit; keep `evaluator.js` barrel; import internal leaves by path |
| 12 | `model/obligations/obligations.js` → `sections/` barrel (data) | full unit + `lint:arch` + one commodities E2E | Keep back-ref mutation loop in barrel; sections import only `services/commodities/index.js` |
| 13 | `services/address-book/stub.js` → folder (data) — **gated on §6 Q3** | `address-book` unit | Zero layering risk |
| 14 | **`features/documents/client.js` → `client/` folder + `webpack.config.js:30`** (feature-slice canary; proves bundle-config discipline) | E2E documents upload leg | Bundle 404s silently if the webpack line is missed |
| 15 | `features/check-answers/controller.js` → `view-model/` (section tree; `rows/` deep split) | CYA E2E + `check-answers.test` | Reference exemplar for Pattern A |
| 16 | `features/dashboard/controller.js` → `view-model/` (**handlers stay in `controller.js`**) | dashboard E2E | Barrel keeps `renderDashboard` + `routes` for `notification-actions` + `features/index.js` |
| 17 | `features/documents/controller.js` → folder (**handlers stay**; `contracts/max-documents.js` mandatory) | `lint:arch` (no-circular canary) + E2E | `MAX_DOCUMENTS` lives only in the leaf |
| 18 | `features/commodities/search.controller.js` → `search/` (thin entry beside folder; re-exports `lineKey`) | `search.controller.test` | Establishes the multi-page pattern |
| 19 | `features/commodities/consignment-details.controller.js` → thin entry + folder (`linesOf`→`lines.js`) | `lint:arch` + E2E | `remove/` imports `lines.js`, never `controller.js` |
| 20 | `features/commodities/animal-identification.controller.js` → thin entry + folder | `animal-identification.controller.test` + E2E | Fattest sibling; `remove/` folder shape |
| 21 | `features/addresses/party-picker.controller.js` → thin entry + folder | `party-picker.controller.test` + E2E | Same multi-page resolution as commodities; update 3 doc mentions |

Rationale for the ordering: `services/**` (1–4) is layering-unconstrained and highest-confidence, so it proves the Pattern-B mechanics before the delicate cases; `bridge`/`model`/`engine` layer-modules (5–12) are intra-tier with small importer surfaces; **evaluator (#11) is deliberately late** because it carries the one config edit; the feature slices (14–21) are highest-value but highest-churn and depend on the conventions being settled — `client.js` (#14) leads them as the bundle-config canary, `check-answers` (#15) as the reference exemplar.

---

## 5. Leave as-is

| Module | loc | Why it stays whole |
|---|---|---|
| `features/commodities/copy.{en,cy}.js` | 160/167 | **Parallel-language pair** — reviewers diff `en` against `cy` whole-file to spot missing keys; a `copy/en/*.js`+`copy/cy/*.js` tree destroys that. It is also the unit handed to the **pending human Welsh review** (the `copy.cy.js` machine-draft banner marks it). Smallest of the candidates, three shallow namespaces (`search`/`consignmentDetails`/`identification`) — not cramming. |
| `services/persistence/records/real.js`'s thin CRUD verbs (within its folder) | — | `load/has/finalise/amend/cancelAmend/copy/softDelete/clear` stay together in `port/lifecycle/*` grouped like `stub`, **not** one-file-per-verb — they are one cohesive object literal; only `replaceFulfilment` (real orchestration) is pulled out. |
| `model/obligations/obligations.js` assembly tail | — | The ordered `obligations` array, `export const groups = obligations.filter(...)`, and the **container back-ref mutation loop** must remain the single writer in the barrel after `export *`, or shared object identity breaks. Never distribute it. |
| `bridge/status/completeness/index.js` recursive core | — | `collectionSatisfied ↔ entrySatisfied ↔ memberSatisfied` are mutually recursive; splitting `collection.js` from `member.js` creates an ESM import cycle → `no-circular` (severity:error). Kept in one file. |
| `model/analysis/reachability/witness/synthesise.js` | — | `coverage.test.js` reads its **raw source** via `readFileSync` and regexes every `case '<label>':`; splitting the switch would make the scan miss labels. |
| sibling single-entity controllers below the split threshold | 236/241 | Only split because of genuine nested sub-forms/multiple clusters; a one-entity/one-page controller that reads as prose is **not** a split candidate — the signal is "multiple unrelated clusters", not raw LOC. |

---

## 6. Open questions for Sam

1. **`services/address-book/stub.js` vs `records/real.js`+`stub.js` — one filename convention.** `records/real.js` and `records/stub.js` promote to `real/` + `stub/` folders, which diverges from `services.md`'s documented "fixed shape: `index.js` + `stub.js` [+ `real.js`]". `address-book/stub.js` was kept as a file-barrel specifically to honour that contract. We must not ship opposite answers. **Recommendation:** bless the folder form in `services.md` and promote `address-book/stub.js` → `stub/index.js` too, for uniformity (R4 prefers promote; the doc is a one-line amend). Confirm, or keep the filename contract and make all three file-barrels beside folders.

2. **Should the obligation manifest split at all?** `model/obligations/obligations.js` (938 loc) is genuinely declarative data and the single-manifest invariants (boot-guards `obligation-purity.js`/`no-display-keys.js` walk the assembled array, the back-ref mutation loop needs shared identity). The proposal keeps all of that in the barrel and only lifts the literals into `sections/`. This is behaviour-identical, but it's the **first split of the manifest** and touches `add-a-field.md`/`add-a-collection.md`. In-scope for this pass, or parked as a higher-risk follow-up while the smaller wins land first?

3. **How deep on the feature slices?** The proposal leans deep (`check-answers/view-model/cards/consignment/species/{title,rows,actions,identifier-table}.js` — four levels below the feature). This is the first internal-subfolder split in `features/` (all feature folders are currently flat). Confirm the full section-tree depth as the convention-setter, versus a shallower `view-model/ + cards/` (two levels).

4. **Test-file co-location.** Several splits move/split test files alongside their new modules (`party-picker.controller.test.js` → `party-picker/controller.test.js`). Confirm tests should follow the code into the folders now, or stay flat this pass and migrate separately.

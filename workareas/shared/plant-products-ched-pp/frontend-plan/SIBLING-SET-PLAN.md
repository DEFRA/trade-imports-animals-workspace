# SIBLING-SET-PLAN — `sets/plant-products/` (CHED-PP frontend)

Phase C scaffold plan, written 2026-07-31 (headless overnight run). Build-ready: Phase D
per-increment planners cite sections of this document by heading. Grounded in:

- `recon/frontend-platform.md` (platform map, verified live this session against
  `repos/trade-imports-animals-frontend` branch `spike/trace-to-requirements`)
- `recon/recipe-cheatsheet.md` (recipes + verification ladder)
- `recon/chedpp-requirements.md` (rulings, 12-spoke hub, 39-page set)
- `backend-schema/SCHEMA-DESIGN.md` (Phase-B REST surface + document shape)

All frontend paths are relative to
`repos/trade-imports-animals-frontend/src/server/app/` unless stated.

**Standing decision (do not reopen):** plant-products is a sibling set under
`sets/plant-products/`, served via a **boot-time set switch** (env-selected served set,
precedent `LIVE_ANIMALS_MODE` in `services/mode.js:1`). One set per Node process.
Co-residency (per-set URL BASE, keyed singletons) is out of scope.

---

## D. Decisions recorded this phase (headless — decided, not asked)

| id | Decision | Rationale |
|---|---|---|
| FD-1 | Set switch env var is **`SERVED_SET`**, values `live-animals` (default) \| `plant-products` | Set-neutral name (a `PLANT_PRODUCTS_*` or `LIVE_ANIMALS_*` name would itself be a leak); default preserves today's behaviour for every existing deployment and test. |
| FD-2 | L1 gateway split: current `routes.js` body moves to **`routes-live-animals.js`**; new **`routes-plant-products.js`**; `routes.js` becomes the selector exporting `servedSet` | Keeps "one file per set names the set" symmetry; the selector is the only place `SERVED_SET` is read. Static imports of both gateways are safe: `configure*` runs only inside the selected plugin's `register`, so singletons are filled exactly once (see `routes.js:47-63` — all wiring is inside `register`). |
| FD-3 | Plugin name `'plant-products'`; session cookies `plantProductsKnownJourneys` / `plantProductsOpeningRun` / `plantProductsFlowOnlyAnswers` | Mirrors `routes.js:45` and `journeys/linear/config.js` cookie naming (`liveAnimals*` prefix per recon §1 row 9). |
| FD-4 | `shared/paths.js` is **unchanged** in pass 1 | With one set per process the global `/notifications/{journeyId}/{slug}` namespace (`shared/paths.js:3-10`) never collides. Per-set `BASE` is a co-residency concern, explicitly out of scope. |
| FD-5 | Plant-products persistence is a **set-owned records service** (`sets/plant-products/services/records/`) injected through the existing `configureRecords` seam — NOT a second L2 mapper | The L2 `services/persistence/records/` mapper is live-animals-shaped (recon §7.4); replicating plant vocabulary into L2 would repeat the wart and violate the no-display/no-set-knowledge-in-L2 principle. A set-owned impl passed by the L1 gateway breaks no dep-cruiser rule (the gateway is the whitelisted importer). `configureCommodityReference` is **not called** by the plant-products gateway — its only consumer is the L2 live-animals mapper (`services/persistence/records/notification-mapper/commodity-reference.js`, recon §1 row 3), which plant-products never executes. |
| FD-6 | Plant-products stub/real switch: **`PLANT_PRODUCTS_MODE`** (`stub` \| `real`, default `real`) in `sets/plant-products/services/mode.js` | Mirrors `services/mode.js:1` exactly. Left set-owned rather than generic because L2 `mode.js` reading `LIVE_ANIMALS_MODE` is itself a (cosmetic) leak — noted in §5 P-8, not fixed tonight. |
| FD-7 | Obligation-source vocabulary (`SYSTEM_POPULATED`, `ENFORCED_AT_CONTINUE`, `MAX_ENTRIES_FROM`, `SYSTEM_ANSWER_KEYS`) becomes a **`policy` export on the set manifest**, injected via `configureObligationSet` | These are live-animals obligation names sitting in L2 (`bridge/obligation-source.js:29,31-34,41-43,70` — verified live). Injection through the existing manifest seam is the smallest change that lets each set own its names. §5 P-1. |
| FD-8 | CHED-PP flow-only keys: `['importType', 'declaration']` | Direct mirror of live-animals (`flow/flow.js` per recon §3): CHED-PP's `import-type` is the pre-journey certificate-type filter (entry page, off-hub) and `declaration` is submit-time attestation persisted as `declaration{agreed,declaredAt}` at finalise. `commodity.inputMethod` is NOT flow-only — it persists on the document (SCHEMA-DESIGN §1.1), so it is an obligation. |
| FD-9 | Commodity nesting is modelled as depth-3 `within` chains: `commodityLines` → `species` → `varieties` | Matches SCHEMA-DESIGN §1.1 (`commodityComplement[].species[].varieties[]`). Depth 3 is UNPROVEN in the engine (live exemplar `animalIdentifiers` is depth 2) — §5 P-7 mandates a characterisation test in m0 before any commodity page is built. |
| FD-10 | Per-set app-root test strategy: **clone** singleton-touching tests as `*.plant-products.test.js` files; **parameterise in-file** the pure filesystem walkers | Vitest isolates files into separate workers, so per-set FILES sidestep the single-slot `configure*` singletons (recon §1 note); `copy-convention.test.js` / `copy-parity.test.js` are fs walks with no singleton use and can loop over both set roots in one file. §7. |
| FD-11 | Documents ride the answers tree as an `accompanyingDocuments` group obligation; the set-owned real records impl projects that group onto the backend sub-resource (`…/accompanying-documents` CRUD) at save | Keeps the frontend model uniform (one answers tree, engine-owned scope/wipe/completeness) while honouring the backend's separate-collection ruling. Naive replace-on-save (list + delete + recreate) is acceptable at pass-1 volumes; Phase D inc-025 owns the detail. |
| FD-12 | The hub's spoke 12 (Review and submit) is a flow **section with the authored gate `scope.readyForCheckYourAnswers`**, not a task row | Exact live-animals precedent (recon §3: the `review` section carries the one authored section gate). Spokes 1–11 are task rows; readiness derives from them. |
| FD-13 | The flow `sections` array OPENS with a `start` section `{ id: 'start', pages: [dashboardPage, importTypePage] }` — dashboard and the import-type entry filter live INSIDE `sections`, mirroring live-animals `flow/flow.js:32-36` | Round-2 verifier finding: the exemplar places both pages in a `start` FLOW section feeding `allFlowPages`/`sectionOfPage`/`answerSections` (`flow.js:89-98`); the round-1 plan wrongly kept them out of `sections`. `start` is a flow section, not a hub spoke — no task row, no GROUPS entry. `importType` stays flow-only (FD-8 unchanged); RUN_STEPS/opening-run mechanics (§1 `run.js`) are additional to, not instead of, section membership. |

---

## 1. Full folder/file tree of `sets/plant-products/`

Legend: **[m0]** = created by the m0 scaffold increment (inc-001/002/003 territory);
[m2]/[m3]/[m4]/[m5] = created by the increment that builds that area (Phase D names the
increment). Every [m0] entry states its exports. The tree mirrors
`sets/live-animals/` (verified live: `obligations/{index.js,sections/}`,
`journeys/linear/{config.js,flow/,features/,fixtures/}`, `services/`, `docs/`).

```text
sets/plant-products/
├── docs/
│   └── README.md                       [m0] set charter: CHED-PP scope, rulings pointers,
│                                            deviation log (this plan's D/FD tables distilled)
├── obligations/
│   ├── index.js                        [m0] THE MANIFEST — exports:
│   │                                        • every obligation object by name (re-export)
│   │                                        • `obligations` (array; m0: empty [])
│   │                                        • `groups` (derived: obligations.filter(o =>
│   │                                          obligations.some(other => other.within === o))
│   │                                          — same formula as live-animals, never hand-kept)
│   │                                        • `policy` (FD-7/§5 P-1): { systemPopulated: [],
│   │                                          enforcedAtContinue: [], maxEntriesFrom: {},
│   │                                          systemAnswerKeys: ['referenceNumber'] }
│   ├── sections/                       [m0] (dir; files land with their increments)
│   │   ├── origin.js                   [m2] countryOfOrigin, countryOfConsignment, internalReference
│   │   ├── purpose.js                  [m2] reasonForImport
│   │   ├── commodities/
│   │   │   ├── input-method.js         [m3] commodityInputMethod
│   │   │   ├── lines.js                [m3] commodityLines group + line leaves
│   │   │   ├── species.js              [m3] species group (within lines) + leaves
│   │   │   └── varieties.js            [m3] varieties group (within species) + leaves
│   │   ├── additional-details.js       [m3] totalGrossWeight, grossVolume, grossVolumeUnit
│   │   ├── transport.js                [m4] BCP/premises/means/identification/docRef/
│   │   │                                    arrivalDate/arrivalTime/usesContainers + containers group
│   │   ├── goods-movement.js           [m4] commonTransitConvention, movementReferenceNumber, usingGvms
│   │   ├── contacts.js                 [m4] responsiblePerson leaves + nominatedContacts group
│   │   ├── documents.js                [m4] accompanyingDocuments group (minEntries 1, c-015)
│   │   ├── parties.js                  [m4] consignor leaves, destination (+same-as gate), packer
│   │   └── billing.js                  [m5] isCuc + billing leaves (equalsGate on isCuc)
│   ├── coverage.test.js                [m0] structural integrity (clone of live-animals pattern:
│   │                                        within-chain termination, unique ids/names,
│   │                                        dependsOn coverage; trivially green on empty manifest)
│   └── whitelists.test.js              [m3] allowlist pins vs the set's reference services
├── journeys/
│   └── linear/
│       ├── config.js                   [m0] exports TEMPLATES = 'plant-products/journeys/linear'
│       │                                    (Nunjucks already mounts app/sets as a root —
│       │                                    src/config/nunjucks/nunjucks.js:16-17,44, no config change),
│       │                                    LAYOUT = 'shared/layout.njk' (unprefixed, other root),
│       │                                    SESSION_COOKIE_NAMES = { knownJourneys:
│       │                                    'plantProductsKnownJourneys', openingRun:
│       │                                    'plantProductsOpeningRun', flowOnlyAnswers:
│       │                                    'plantProductsFlowOnlyAnswers' } (FD-3)
│       ├── flow/
│       │   ├── flow.js                 [m0] exports FLOW_ONLY_KEYS = ['importType','declaration']
│       │   │                                (FD-8); `sections` (m0: [start, review] — `start`
│       │   │                                holds dashboardPage + importTypePage, FD-13/§2.3;
│       │   │                                grows per milestone); derived allFlowPages,
│       │   │                                sectionOfPage, answerSections (same formulas)
│       │   ├── task-rows.js            [m0] exports `taskRows` (m0: []) and
│       │   │                                `rowStatus(row, answers, inScope, evaluation)`
│       │   │                                delegating to L2 bridge/status statusOf (verbatim
│       │   │                                live-animals delegation)
│       │   ├── run.js                  [m0] exports RUN_STEPS (m0: [import-type step]) and
│       │   │                                `nextRunTarget(stepId, scope, journeyId)` via L2
│       │   │                                flow/gates pageGatePasses, hubPath fallback
│       │   ├── entry-guard.js          [m0] exports `entryGuardTarget(request, h)`: fresh
│       │   │                                deep-links redirect to the import-type filter
│       │   │                                (mirror live-animals policy; CHED-PP variant detail
│       │   │                                is Phase D inc-008's)
│       │   ├── task-rows.test.js       [m0] pins rows/status (grows per row)
│       │   └── fixtures/
│       │       └── happy-path.json     [m4] whole-journey E2E fixture (built when the journey closes)
│       ├── features/
│       │   ├── index.js                [m0] exports `dispatchPages` (m0: [importTypePage meta])
│       │   │                                and `allRoutes` (m0: dashboard + hub + import-type)
│       │   ├── evaluation.js           [m0] exports `featureEvaluationBindings` =
│       │   │                                Object.freeze([]) (grows one feature() per area)
│       │   ├── import-type/            [m0] entry filter (flow-only; collects: []) —
│       │   │   │                            page.js, controller.js, template.njk,
│       │   │   │                            copy/{copy.en.js,copy.cy.js,copy.test.js},
│       │   │   │                            controller.test.js, import-type.e2e.spec.js
│       │   ├── dashboard/              [m0] notifications-dashboard (list own; scoped to stubbed
│       │   │                                org) — same file shape [full build m4 inc-028]
│       │   ├── hub/                    [m0] notification-hub — controller.js exports GROUPS
│       │   │                                (spoke→row-id placement, §2), copy bundles,
│       │   │                                hub.e2e.spec.js [rows land per milestone]
│       │   ├── origin/                 [m2] country-of-origin + origin-of-import (group dir:
│       │   │                                page.js all identities, per-page controller+njk,
│       │   │                                group copy/, evaluation.js, e2e/)
│       │   ├── purpose/                [m2] about-the-consignment
│       │   ├── commodities/            [m3] commodity-input-method, commodity-search,
│       │   │                                commodity-basic-description,
│       │   │                                variety-of-genus-and-species, commodity-summary,
│       │   │                                commodity-bulk-details (+ csv-upload [m5])
│       │   ├── additional-details/     [m3] commodity-additional-details
│       │   ├── transport/              [m4] transport-before-bip
│       │   ├── goods-movement/         [m4] goods-movement-services
│       │   ├── contact/                [m4] contact-details
│       │   ├── nominated-contacts/     [m4] nominated-contact (single-page add-another loop,
│       │   │                                documents exemplar)
│       │   ├── documents/              [m4] accompanying-documents (single-page loop)
│       │   ├── traders/                [m4] traders-addresses, consignor-create,
│       │   │                                consignor-confirmation (+ consignor-search [m5])
│       │   ├── check-answers/          [m4] review-notification + view-model/cards/
│       │   ├── declaration/            [m4] declaration (flow-only key; submit trigger)
│       │   ├── confirmation/           [m4] confirmation (govuk-panel — c-014/inc-031 H1 fix)
│       │   ├── billing/                [m5] confirm-billing-details, billing-find-an-address,
│       │   │                                billing-select-the-address, billing-change-contact-details
│       │   ├── notification-actions/   [m5] delete/amend/copy actions (inc-039)
│       │   └── delete-notification/    [m5] delete confirm page (inc-039)
│       └── (sign-in short-circuit)     [m5] inc-042 — auth stub; NOT a set feature (fixed
│                                            signed-in user supplied by services/auth-stub)
├── services/
│   ├── mode.js                         [m0] exports mode() = process.env.PLANT_PRODUCTS_MODE ?? 'real',
│   │                                        isRealMode() (FD-6)
│   ├── commodities/                    [m1] index.js (lookup barrel) + fixture.js — ~10 CHED-PP
│   │                                        codes, tree, EPPO species per code, varieties per
│   │                                        species (inc-005; eppoCode is the join key)
│   ├── reference/                      [m1] one module per fixture vocabulary (inc-004/006/007):
│   │   ├── countries.js                     ~254 incl GB-ENG/SCT/WLS/NIR + optgroup data
│   │   ├── bcps.js                          144 BCPs + per-BCP control-point map
│   │   ├── package-types.js                 24 codes
│   │   ├── quantity-types.js                8 codes
│   │   ├── document-types.js                17 codes
│   │   ├── transport-options.js             means of transport (4 + placeholder), container opts
│   │   ├── gross-volume-units.js            2 units
│   │   └── purposes.js                      3 reasons for import
│   ├── records/                        [m0] the persistence adapter (FD-5, §6.2):
│   │   ├── index.js                         exports `records` — stub/real switch on mode()
│   │   ├── stub.js                          in-memory store satisfying the engine port
│   │   ├── real.js                          REST client vs /plant-products/notifications (§6.2)
│   │   └── mapper/                          answers-tree ⇄ PlantProductsNotificationDto
│   │       ├── to-dto.js / from-dto.js      (+ documents projection, FD-11)
│   │       └── mapper.test.js
│   └── auth-stub/                      [m5] fixed signed-in user + org (inc-042; dashboard scope)
```

**Every m0 file and its exports, flat list** (the m0 scaffold's definition of done —
the app boots with `SERVED_SET=plant-products`, serves dashboard, empty hub and the
import-type filter, and all boot assertions pass on the empty manifest):

1. `obligations/index.js` — `obligations` (=[]), `groups` (derived), `policy` (FD-7 shape).
2. `obligations/coverage.test.js` — structural suite (green on empty).
3. `journeys/linear/config.js` — `TEMPLATES`, `LAYOUT`, `SESSION_COOKIE_NAMES`.
4. `journeys/linear/flow/flow.js` — `FLOW_ONLY_KEYS`, `sections`, `allFlowPages`, `sectionOfPage`, `answerSections`.
5. `journeys/linear/flow/task-rows.js` — `taskRows` (=[]), `rowStatus`.
6. `journeys/linear/flow/run.js` — `RUN_STEPS`, `nextRunTarget`.
7. `journeys/linear/flow/entry-guard.js` — `entryGuardTarget`.
8. `journeys/linear/flow/task-rows.test.js` — status pins.
9. `journeys/linear/features/index.js` — `dispatchPages`, `allRoutes`.
10. `journeys/linear/features/evaluation.js` — `featureEvaluationBindings` (frozen []).
11. `journeys/linear/features/import-type/{page.js,controller.js,template.njk,copy/copy.en.js,copy/copy.cy.js,copy/copy.test.js,controller.test.js,import-type.e2e.spec.js}` — `importTypePage` `{id,slug}`; controller `meta` (`collects: []`) + `routes`.
12. `journeys/linear/features/dashboard/{…same shape…}` — dashboard route (list from records).
13. `journeys/linear/features/hub/{controller.js(+GROUPS),copy/…,hub.e2e.spec.js}` — hub route.
14. `services/mode.js` — `mode`, `isRealMode`.
15. `services/records/{index.js,stub.js,real.js,mapper/to-dto.js,mapper/from-dto.js,mapper/mapper.test.js}` — `records` engine-port impl.
16. `docs/README.md` — charter.

Plus the L1/platform edits of §4–§5 and the test scaffolding of §7 (same m0 increment
family).

---

## 2. The 12-spoke hub mapping (inc-020 ruling)

### 2.1 Spoke → flow section → task row → pages → obligation section file

Hub feature: `journeys/linear/features/hub/` — `GROUPS` in its `controller.js` places
task-row ids under numbered headings (live-animals precedent, recipe §2.6). Row ids
below are the canonical ids Phase D must use.

| # | Spoke (hub heading) | Flow section id | Task row id(s) | Pages behind it | Backing obligations file |
|---|---|---|---|---|---|
| 1 | Origin of the import | `origin` | `origin` | country-of-origin, origin-of-import | `sections/origin.js` |
| 2 | Purpose | `purpose` | `purpose` | about-the-consignment | `sections/purpose.js` |
| 3 | Commodity | `commodities` | `commodities` | commodity-input-method, commodity-search, commodity-basic-description, variety-of-genus-and-species, commodity-summary, commodity-bulk-details (+ csv-upload m5 branch variant) | `sections/commodities/{input-method,lines,species,varieties}.js` |
| 4 | Additional details | `additional-details` | `additional-details` | commodity-additional-details | `sections/additional-details.js` |
| 5 | Transport to the BCP | `transport` | `transport` | transport-before-bip | `sections/transport.js` |
| 6 | Goods movement services | `goods-movement` | `goods-movement` | goods-movement-services | `sections/goods-movement.js` |
| 7 | Contact details | `contact` | `contact` | contact-details | `sections/contacts.js` |
| 8 | Nominated contacts *(optional — never gates)* | `nominated-contacts` | `nominated-contacts` | nominated-contact | `sections/contacts.js` (nominatedContacts group) |
| 9 | Accompanying documents *(mandatory ≥1 doc, c-015)* | `documents` | `documents` | accompanying-documents (+ document-upload DEFERRED inc-037) | `sections/documents.js` |
| 10 | Traders | `traders` | `traders` | traders-addresses, consignor-create, consignor-confirmation (+ consignor-search m5 stub) | `sections/parties.js` |
| 11 | Billing *(conditional: true — hidden unless isCuc, c-007)* | `billing` [m5] | `billing` [m5] | confirm-billing-details, billing-find-an-address, billing-select-the-address, billing-change-contact-details | `sections/billing.js` |
| 12 | Review and submit *(unlocks when every mandatory row Completed — FD-12)* | `review` (authored gate `scope.readyForCheckYourAnswers`) | — (not a row) | review-notification, declaration, confirmation | — (declaration is flow-only; FD-8) |

Row-status mechanics are free: `rowStatus` delegates to L2 `bridge/status`; spoke 8 is
an `optional`-status row (does not gate readiness); spoke 11 sets `conditional: true`
so the hub hides a Not-applicable Billing row (recipe §3.6); spoke 9's minEntries-1
floor makes the row incomplete until one document exists (`bridge/collection-complete.js`).

### 2.2 All 39 pages accounted for

In scope, ON a spoke (27): the pages in rows 1–12 above — country-of-origin,
origin-of-import, about-the-consignment, commodity-input-method, commodity-search,
commodity-basic-description, variety-of-genus-and-species, commodity-summary,
commodity-bulk-details, csv-upload [m5], commodity-additional-details,
transport-before-bip, goods-movement-services, contact-details, nominated-contact,
accompanying-documents, traders-addresses, consignor-create, consignor-confirmation,
consignor-search [m5], confirm-billing-details, billing-find-an-address,
billing-select-the-address, billing-change-contact-details [all m5], review-notification,
declaration, confirmation.

In scope, OFF-hub (5): **notification-hub** (the hub itself, inc-020),
**import-type** (pre-journey entry filter, flow-only, inc-008),
**notifications-dashboard** (inc-028), **delete-notification** (lifecycle, inc-039 m5),
**sign-in** (auth-stub short-circuit, inc-042 m5 — not a data page).

Explicitly OUT (7, with reasons from the requirements digest):
**consignment-for**, **consignment-organisation** — DoA deferred (inc-033/034; G-5/G-6
settle with the DoA programme); **document-upload** — file bytes + AV deferred
(inc-037; metadata-only pass 1); **cloning-search**, **cloning-summary**,
**cloning-type** — cloning deferred (inc-041; success path never observed);
**split-consignment-confirm** — post-submission surface, out of scope entirely.

27 + 5 + 7 = 39. ✔ (slug list verified against
`workareas/shared/trace-requirements/ched-pp/pages/` this session.)

### 2.3 Flow `sections` array (target order)

**Corrected this round (FD-13):** the live-animals exemplar does NOT keep dashboard
and import-type out of `sections` — `flow/flow.js:32-36` has a `start` FLOW section
containing BOTH `dashboardPage` and `importTypeFilterPage`, and those pages feed
`allFlowPages`/`sectionOfPage`/`answerSections` through it (`flow.js:89-98`).
Plant-products mirrors this exactly. A flow `start` section is NOT a hub spoke —
sections and spokes are different surfaces (`start` has no task row and no GROUPS
entry; §2.1 stands unchanged).

m0 ships `[start, review]`: `start` = `{ id: 'start', pages: [dashboardPage,
importTypePage] }` (dashboard + entry filter, transposed from flow.js:32-36);
`review` carries the authored gate (FD-12). The full pass-1 order once m2–m4 land:

`start, origin, purpose, commodities, additional-details, transport, goods-movement,
contact, nominated-contacts, documents, traders, review` (+ `billing` inserted before
`review` at m5). Array order controls `nextInSection()` and strictly-earlier continue
prerequisites (recipe §3.5) — Phase D increments must append in THIS order (new
sections always after `start`, before `review`).

---

## 3. Obligations manifest for plant-products

### 3.1 Section list and contents (name → status/gate; all ids fresh UUIDs)

Names are camelCase answers keys AND DOM field names — path-safe (no `.[]`) or
`buildDispatch` throws at boot (recon §1 row 7). Grounded field-by-field in
SCHEMA-DESIGN §1.1; leaf-level detail beyond this table is Phase D's per-increment
work, but area shape and every group/gate is fixed here.

| File | Obligations |
|---|---|
| `origin.js` | `countryOfOrigin` (mandatory — origin.countryCode), `countryOfConsignment` (mandatory — origin.countryOfConsignmentCode; Open Q 9 overlap noted at inc-010), `internalReference` (optional) |
| `purpose.js` | `reasonForImport` (mandatory; normalised enum INTERNAL_MARKET \| RE_ENTRY \| RE_CONFORMITY_CHECK) |
| `commodities/input-method.js` | `commodityInputMethod` (mandatory; MANUAL \| CSV — persisted, NOT flow-only, FD-8) |
| `commodities/lines.js` | `commodityLines` **group** (`requires: { minEntries: 1, errorCode: … }`; no status — recipe §4.1) + members (all `within: commodityLines`): `commoditySelection` (the code picked in search; maps to commodityCode + ref-data-derived commodityDescription), `numberOfPackages`, `packageType`, `quantity`, `quantityType`, `netWeight`, `controlledAtmosphereContainer`, `finishedOrPropagated`, `intendedForFinalUsers`, `testAndTrial` |
| `commodities/species.js` | `species` **group** (`within: commodityLines`, `requires: { minEntries: 1 }`) + members (`within: species`): `eppoCode` (mandatory — THE join key), `genusAndSpecies` (mandatory, ref-data-derived), `speciesId` (optional, transient-ish round-trip value) |
| `commodities/varieties.js` | `varieties` **group** (`within: species`; optional — no minEntries) + members (`within: varieties`): `variety` (store the ID not the label — Open Q 2), `varietyClass` (`allowListed` against the commodities service's per-species class applicability; CLASS_I \| CLASS_II \| EXTRA_CLASS, null when N/A) |
| `additional-details.js` | `totalGrossWeight` (mandatory), `grossVolume` (optional), `grossVolumeUnit` (`presentGate(grossVolume, …)` — required iff grossVolume answered) |
| `transport.js` | `borderControlPost` (mandatory), `inspectionPremises` (`allowListed(borderControlPost, perBcpControlPoints, null, …)` — lazily resolved from `services/reference/bcps.js`), `meansOfTransport`, `transportIdentification`, `transportDocumentReference`, `arrivalDate`, `arrivalTime` (all mandatory), `usesContainers` (mandatory bool), `containers` **group** (`applyTo: equalsGate(usesContainers, true, …)`) + members (`within: containers`): `containerNumber`, `sealNumber`, `officialSeal` |
| `goods-movement.js` | `commonTransitConvention` (mandatory; ADD_MRN_NOW \| ADD_MRN_LATER \| NO), `movementReferenceNumber` (`equalsGate(commonTransitConvention, 'ADD_MRN_NOW', …)`), `usingGvms` (mandatory bool) |
| `contacts.js` | `responsiblePersonName` / `responsiblePersonEmail` / `responsiblePersonTelephone` (mandatory; entry page pass 1, POP-2 auto-pop deferred with inc-032), `nominatedContacts` **group** (optional — no floor) + members (`within: nominatedContacts`): `contactName`, `contactEmail`, `contactTelephone`, `contactIsAgent` (email-OR-telephone is a controller fieldset rule, NOT model — house D-13 parity) |
| `documents.js` | `accompanyingDocuments` **group** (`requires: { minEntries: 1, errorCode: … }` — c-015 MANDATORY) + members (`within: accompanyingDocuments`): `documentType` (17 opts), `documentReference`, `issueDate` (file bytes deferred — no files obligation in pass 1) |
| `parties.js` | consignor leaves: `consignorName`, `consignorAddressLine1..3`, `consignorCity`, `consignorPostcode`, `consignorCountry` (hand-entered, POP-4 — the one typed party); `destinationSameAsConsignee` (mandatory bool) + destination leaves gated `equalsGate(destinationSameAsConsignee, false, …)`; `packer*` leaves (optional — CHED-PP addition). Importer + consignee are server/stub-populated (POP-1/POP-3) — NOT obligations in pass 1. |
| `billing.js` [m5] | `isCuc` (optional bool — c-007 provisional, trigger swappable) + billing leaves (`billingAddressLine1..4`, `billingCityOrTown`, `billingCounty`, `billingPostalCode`, `billingEmail`, `billingTelephone`) all `equalsGate(isCuc, true, …)` |

### 3.2 Group/within chains (the commodity nesting)

```
commodityLines (group, minEntries 1)
└─ species (group, within: commodityLines, minEntries 1)      ← depth 2
   └─ varieties (group, within: species, optional)            ← depth 3 (FD-9 / P-7)
containers (group, gated on usesContainers)
nominatedContacts (group, optional)
accompanyingDocuments (group, minEntries 1)
```

`within` references are OBJECT IDENTITY (real imports), `groups` is derived, member
names are per-instance keys (`answers.commodityLines[i].species[j].varieties[k].variety`).
Grouped bindings must pass the full chain: `grouped({ field, obligation,
groups: [line, species, variety] })` — binding depth must equal the `within` chain
(recon §3, `bridge/fulfilment-bindings.js` contract).

### 3.3 Gate helpers used (all existing L2, `model/obligations/helpers/index.js`)

- `equalsGate` — containers, movementReferenceNumber, destination leaves, billing leaves.
- `presentGate` — grossVolumeUnit.
- `allowListed` — inspectionPremises (per-BCP control points), varietyClass (per-species
  class applicability); both resolve reference data lazily at gate execution (commodities
  gates are the exemplar — recipe §5).
- No `MAX_ENTRIES_FROM` cap declarations (no sibling-count cap in the CHED-PP model);
  `policy.maxEntriesFrom = {}`.
- `policy.enforcedAtContinue`: seeded `[]` at m0; Phase D inc-014 decides whether
  `commoditySelection` (and inc-009 whether `countryOfOrigin`) joins it, mirroring the
  live-animals pair.
- No new helper is anticipated; if a Phase D planner needs one it is an L2 change with
  its own blast radius (recipe §6 warning) and must be flagged, not smuggled.

---

## 4. L1 wiring — routes, seams, and the set switch

### 4.1 File moves/creations (all at `src/server/app/` root)

1. **`routes-live-animals.js`** [move] — the entire current `routes.js` body
   (`routes.js:1-77`, verified this session) moved verbatim; still exports
   `liveAnimals`. No behavioural change.
2. **`routes-plant-products.js`** [new] — exports `plantProducts`, plugin name
   `'plant-products'` (FD-3). Register body mirrors `routes.js:47-73` call-for-call —
   the ORDER IS LOAD-BEARING (config → assertions → dispatch → persistence → cookies →
   guard → priming → routes):

   | # | Call | Argument plant-products passes |
   |---|---|---|
   | 1 | `configureObligationSet(plantProductsObligationSet)` | `import * as plantProductsObligationSet from './sets/plant-products/obligations/index.js'` — namespace with `.obligations`, `.groups`, **`.policy`** (P-1) |
   | 2 | `configureFulfilmentRegistry(featureEvaluationBindings)` | from `./sets/plant-products/journeys/linear/features/evaluation.js` |
   | 3 | *(no `configureCommodityReference` call — FD-5)* | its only consumer is the L2 live-animals mapper, never executed under this set |
   | 4 | `configureJourneyFlow({ sections, taskRows, rowStatus, nextRunTarget, flowOnlyKeys: FLOW_ONLY_KEYS, entryGuardTarget, layout: LAYOUT })` | all from `./sets/plant-products/journeys/linear/flow/{flow,task-rows,run,entry-guard}.js` + `config.js` |
   | 5 | `assertObligationPurity()` | none — boot gate |
   | 6 | `assertFulfilmentBindingCoverage()` | none — boot gate |
   | 7 | `buildDispatch(dispatchPages)` | from `./sets/plant-products/journeys/linear/features/index.js` |
   | 8 | `configureRecords(records)` | `records` from `./sets/plant-products/services/records/index.js` — the SET-OWNED impl (FD-5) satisfying the engine port `{create, load, list, has, replaceFulfilment, finalise, amend, cancelAmend, copy, softDelete, clear}` (`engine/persistence/records.js`) |
   | 9 | `configureSession(session, SESSION_COOKIE_NAMES)` | L2 `session` from `services/persistence/session/index.js` (set-agnostic, reused) + plant cookie names from the set's `config.js` |
   | 10 | `registerJourneyCookie(server)` | as-is |
   | 11 | `server.ext('onPreHandler', …)` entry-guard wrapper | as-is (wraps the injected `journeyEntryGuardTarget`) |
   | 12 | *(no `countries.prime()` / `ports.prime()`)* | plant-products reference data is fixture-backed (`services/reference/*`), nothing to prime; the L2 primed caches are live-animals-mode machinery |
   | 13 | `server.route(allRoutes)` | from the set's `features/index.js` |

3. **`routes.js`** [rewrite → selector] — the ONLY reader of `SERVED_SET` (FD-1/FD-2):

   ```js
   import { liveAnimals } from './routes-live-animals.js'
   import { plantProducts } from './routes-plant-products.js'

   const SETS = { 'live-animals': liveAnimals, 'plant-products': plantProducts }
   export const servedSetName = () => process.env.SERVED_SET ?? 'live-animals'
   export const servedSet = () => {
     const set = SETS[servedSetName()]
     if (!set) throw new Error(`Unknown SERVED_SET "${servedSetName()}"`)
     return set
   }
   ```

   (Unknown value = loud boot failure, never a silent default.)
4. **`src/server/router.js:7,20`** [edit] — `import { servedSet } from './app/routes.js'`;
   `const routes = [servedSet()]`.

### 4.2 What happens to `shared/paths.js`

Nothing (FD-4). `BASE = ''`, `/notifications/{journeyId}/{slug}`, `dashboardPath '/'`
(`shared/paths.js:1-10`) are safe with one served set per process. The cookie-path
coupling (`engine/journey.js:15`, `path: BASE || '/'`) is likewise untouched. Per-set
BASE is recorded as the first work item of any future co-residency programme, nowhere
else.

### 4.3 Acceptance for §4

- `SERVED_SET` unset → app serves live-animals exactly as today (full existing ladder
  green, no env changes in CI).
- `SERVED_SET=plant-products` → app boots, `/` renders the plant dashboard,
  `/notifications/{id}` renders the (initially empty) hub, all boot assertions pass.
- `SERVED_SET=garbage` → boot fails with the unknown-set error.

---

## 5. Platform work items (each L2/L1 leak from recon §7 → concrete change)

Every item names files, the change, and an acceptance check. These are m0-family
increments; P-1..P-5 are prerequisites for the first plant page (m2).

**P-1 — Inject obligation-source policy via the manifest** (FD-7)
- Files: `bridge/obligation-source.js` (lines 29, 31-34, 41-43, 70 — verified live:
  `SYSTEM_POPULATED = new Set(['poApprovedReferenceNumber'])`, `ENFORCED_AT_CONTINUE =
  new Set(['countryOfOrigin','commoditySelection'])`, `MAX_ENTRIES_FROM = {
  animalIdentifiers: 'numberOfAnimalsQuantity' }`, `SYSTEM_ANSWER_KEYS = new
  Set(['referenceNumber'])`); `model/obligations/manifest.js` (accept + expose the
  optional `policy` namespace member); `sets/live-animals/obligations/index.js` (gains
  `export const policy = { systemPopulated: ['poApprovedReferenceNumber'],
  enforcedAtContinue: ['countryOfOrigin','commoditySelection'], maxEntriesFrom: {
  animalIdentifiers: 'numberOfAnimalsQuantity' }, systemAnswerKeys:
  ['referenceNumber'] }`).
- Change: `obligation-source.js` derives all four surfaces from the configured
  manifest's `policy` (empty-safe defaults); the four literals leave L2.
- **Full consumer list (grep-verified this round — the round-1 list was
  understated).** Importers of `SYSTEM_POPULATED` / `ENFORCED_AT_CONTINUE` /
  `MAX_ENTRIES_FROM` / `SYSTEM_ANSWER_KEYS` from `bridge/obligation-source.js`:
  - `flow/dispatch.js`
  - `flow/prerequisites.js`
  - `engine/evaluate/cardinality.js`
  - `bridge/scope.js`
  - `bridge/collection-complete.js`
  - `bridge/status/structure/index.js`
  - `analysis/flow-reachability/provers.js`
  - `analysis/flow-reachability/problems/obligation-problem.js`
  - `sets/live-animals/journeys/linear/flow/entry-guard.js` — **a SET-side file
    importing the L2 policy surface**; whatever export shape P-1 lands, this
    import keeps working (it is legal set→L2 direction, but it means the set is
    in the blast radius too)
  - name-visible non-runtime references the increment must sweep:
    `sets/live-animals/journeys/linear/flow/flow-reachability.test.js` and
    `sets/live-animals/docs/add-a-collection.md`.
- **Export-shape constraint:** today the exports are static module-load consts
  (`const SYSTEM_POPULATED = new Set(...)`, obligation-source.js:29), but the
  manifest arrives only when `configureObligationSet` runs — so the derived
  values CANNOT be computed at module load. The P-1 increment must either (a)
  keep the same export names as lazily-derived views resolved on first read
  after configuration (consumers' import sites unchanged), or (b) switch to
  accessor functions — in which case EVERY file in the list above changes and
  is in scope of the increment. Preference: (a); the increment planner decides
  with the full list in hand either way.
- Acceptance addition: `grep -rn 'SYSTEM_POPULATED\|ENFORCED_AT_CONTINUE\|MAX_ENTRIES_FROM\|SYSTEM_ANSWER_KEYS' src/server/app`
  after the change shows only obligation-source.js (definition site) plus the
  consumers importing whatever shape (a)/(b) chose — no stragglers on the old
  shape.
- Acceptance: zero obligation-name literals remain in `bridge/obligation-source.js`
  (grep); full live-animals suite green unchanged (`npm test`); a unit test proves a
  manifest with a different `policy` changes the derived sets.

**P-2 — Records mapper containment (live-animals-shaped L2 mapper)** (FD-5)
- Files: none in L2 change for plant-products; new
  `sets/plant-products/services/records/**` (§1, §6.2). The leak —
  `services/persistence/records/notification-mapper/` maps the live-animals answer
  tree (recon §7.4) — is CONTAINED, not migrated: it remains the live-animals impl,
  injected only by `routes-live-animals.js`.
- Acceptance: `routes-plant-products.js` imports nothing under
  `services/persistence/records/`; `configureCommodityReference` never called on the
  plant path; dep-cruiser clean; a follow-up note (docs/README.md) records the future
  option of retiring the L2 mapper into `sets/live-animals/services/`.

**P-3 — Router registers the served set only** (§4.1.3-4)
- Files: `routes.js` (selector rewrite), `src/server/router.js:7,20`.
- Acceptance: §4.3 checks; `routes.test.js` still passes for live-animals (default).

**P-4 — Dependency-cruiser gateway + sets-not-l1 updates**
- Files: `.dependency-cruiser.cjs:31` (`routes-is-the-gateway` `pathNot` gains
  `^${APP}/routes-live-animals\.js$` and `^${APP}/routes-plant-products\.js$` —
  verified the current allowlist is exactly `[^app/sets/, ^app/routes\.js$,
  .test.js]`); the `sets-not-l1` rule's forbidden-target list gains the two new
  gateway files (sets must not import ANY routes-*.js).
- Acceptance: `npm run lint:arch` green with the new files in place; a deliberate
  probe import (set → gateway) fails the rule; `.dependency-cruiser-known-violations.json`
  NOT regenerated to absorb anything (baseline discipline).

**P-5 — App-root convention tests generalised/cloned** (FD-10 — detail in §7)
- Files: `copy-convention.test.js:10`, `copy-parity.test.js:16-53` (parameterise
  in-file over both set roots); `contract.test.js:19-39,65`, `routes.test.js:3`,
  `indexed.test.js:9-12`, `store-ops.test.js:16`, `one-load-per-request.test.js`
  (clone per set as `*.plant-products.test.js` composing the plant set —
  `routes.test.js:3` hardcoding verified live this session; `one-load-per-request`
  confirmed NOT set-hardcoded by grep, so it needs only a clone IF it composes a set
  at runtime — cloner verifies).
- Acceptance: for each cloned suite, the plant variant runs green against the m0
  skeleton; live-animals variants unchanged; test COUNT for existing suites does not
  drop (recipe §8 tripwire).

**P-6 — Boot-mode knobs audit**
- Files: `routes-plant-products.js` step 12 (no priming); `services/mode.js`
  untouched (live-animals'). New `sets/plant-products/services/mode.js` (FD-6).
- Acceptance: `PLANT_PRODUCTS_MODE=stub SERVED_SET=plant-products` boots with the
  in-memory records stub (Playwright self-host mode); `real` targets the Phase-B
  backend.

**P-7 — Depth-3 collection characterisation test** (FD-9)
- Files: new L2-fixture test (pattern: the bridge characterisation tests that compose
  a set as fixture, recon §6) building a 3-deep synthetic manifest
  (`lines → species → varieties`) and exercising: grouped-binding registration at
  depth 3, `state.appendEntryAt`/`updateEntryAt`/`removeEntryAt` at
  `['lines', i, 'species', j, 'varieties']`, per-instance scope + wipe at depth 3,
  `collection-complete` rollup, dispatch coverage inheritance from the nearest
  ancestor group.
- Acceptance: green = m3 commodity increments proceed on the platform as-is; any red
  = a NEW platform work item raised before inc-012 (which is already a halt-for-review
  model-extension gate).

**P-8 — Recorded, not fixed (cosmetic leaks)**
- `services/mode.js:1` reads `LIVE_ANIMALS_MODE` (L2 file, set-named env var) — plant
  side-steps via FD-6; unify later.
- `package.json:33` `depcruise:graph` emits `live-animals-arch.svg` — rename to
  `app-arch.svg` opportunistically.
- `contract.test.js:65` posts `importType: 'live-animals'` — vocabulary lives in the
  set, handled by the P-5 clone.

---

## 6. Services

### 6.1 Set-owned (`sets/plant-products/services/`)

- **`commodities/`** (m1, inc-005): the plant analogue of
  `sets/live-animals/services/commodities/` — pure lookup barrel (`index.js`) over
  `fixture.js`: ~10 CHED-PP commodity codes as a browsable tree, EPPO species per code
  (`eppoCode` join key; `speciesId` transient), per-species varieties + class
  applicability. Consumed by: obligations gates (`varietyClass` allowlist), the
  commodity feature's pickers/search (POST→302→GET, zero client XHR), and the records
  mapper (code → description). This is the ONE lookup that eventually goes real —
  fixture-backed in pass 1 by ruling.
- **`reference/`** (m1, inc-004/006/007): fixture modules per vocabulary —
  `countries.js` (~254 incl GB subdivisions, optgroup structure for the dashboard,
  c-012 'Republic of Ireland', c-026), `bcps.js` (144 BCPs + per-BCP control-point
  map; the filtering rule is a recorded gap — the association is data, the rule
  arrives later), `package-types.js` (24), `quantity-types.js` (8),
  `document-types.js` (17, c-016 dedupe), `transport-options.js`,
  `gross-volume-units.js` (2), `purposes.js` (3). Each exports options arrays +
  label-for-code lookups; no priming needed (hence §4.1 step 12).
- **`records/`** (m0, FD-5): see §6.2.
- **`mode.js`** (m0, FD-6) and **`auth-stub/`** (m5, inc-042: fixed signed-in user +
  org id the dashboard scopes on).

### 6.2 The records port — set-owned impl against the Phase-B REST surface

`services/records/real.js` implements the engine port (surface pinned by
`engine/persistence/records.js`: `create, load, list, has, replaceFulfilment,
finalise, amend, cancelAmend, copy, softDelete, clear`) against SCHEMA-DESIGN §3
(base `/plant-products/notifications`):

| Engine port op | HTTP call |
|---|---|
| `create` | `POST /plant-products/notifications` (blank referenceNumber; 201 + body carries the minted `GBN-PP-…` ref) |
| `load` | `GET /plant-products/notifications/{ref}` (response embeds `accompanyingDocuments` — folded back into the answers tree by `mapper/from-dto.js`, FD-11) |
| `list` | `GET /plant-products/notifications?page&sort&referenceNumber` (1-based page; DELETED hidden server-side) |
| `has` | `GET …/{ref}` → 200 true / 404 false |
| `replaceFulfilment` | `PUT /plant-products/notifications/{ref}` (whole-document, last-write-wins — Open Q 3) + documents projection: reconcile the `accompanyingDocuments` group against `GET/POST/PUT/DELETE …/{ref}/accompanying-documents[/{id}]` (naive replace acceptable pass 1 — FD-11, detail owned by inc-025) |
| `finalise` | `PUT …/{ref}/status` `{ status: 'SUBMITTED' }` |
| `amend` | `PUT …/{ref}/status` `{ status: 'AMEND' }` |
| `cancelAmend` | `PUT …/{ref}/status` `{ status: 'SUBMITTED', discardChanges: true }` (D-4) |
| `copy` | `POST …/{ref}/copies` (201; new DRAFT, new ref, documentless — D-19) |
| `softDelete` | `PUT …/{ref}/status` `{ status: 'DELETED' }` (idempotent) |
| `clear` | stub-only test hook (real impl: not supported, throws — mirrors the L2 precedent) |

`mapper/to-dto.js` maps the answers tree → `PlantProductsNotificationDto` (camelCase,
D-10; server-set fields never sent: `referenceNumber` path-driven, `status`/
`ownership`/`chedType` server-owned); `from-dto.js` inverts for draft resume.
`stub.js` is an in-memory store with identical semantics (incl. status-transition
legality) so the Playwright self-hosted ladder needs no backend.

### 6.3 L2 shared services reused as-is

`services/persistence/session/` (engine session impl — set-agnostic, injected with
plant cookie names), `shared/kit.js`, `lib/validate/`, the whole
model/bridge/engine/flow platform (recon §7 "genuinely set-agnostic" list). L2
`services/{countries,ports}` and `services/persistence/records/` are live-animals-only
and are NOT imported by anything plant (P-2 acceptance).

---

## 7. Test scaffolding work items (named)

- **T-1 `test:plant-products` npm script** — `package.json` (beside line 36):
  `"test:plant-products": "TZ=UTC vitest run src/server/app/sets/plant-products --no-coverage"`.
  Substitutes for `test:live-animals` in the verification ladder for every plant
  increment (recipe §9 note). Acceptance: runs the m0 set suites green.
- **T-2 parameterise fs-walk convention tests** — `copy-convention.test.js` (line 10
  features-dir URL) and `copy-parity.test.js` (lines 16-53) loop over
  `['live-animals', 'plant-products']` set roots in-file (no singletons involved —
  FD-10). Acceptance: plant features get copy-completeness + en/cy-parity enforcement
  from their first `.njk`.
- **T-3 clone singleton-composing app-root suites** — per-set files (FD-10):
  `contract.plant-products.test.js` (fresh manual table; first case lands with the
  first collecting controller, m2), `routes.plant-products.test.js` (auth walk over
  the plant `allRoutes`), `indexed.plant-products.test.js`,
  `store-ops.plant-products.test.js`, `one-load-per-request.plant-products.test.js`
  (if set-composing). Acceptance: each green against the m0 skeleton; live-animals
  originals untouched; no existing-suite test-count drop.
- **T-4 dep-cruiser config edit** — P-4 (gateway whitelist + sets-not-l1). Acceptance
  as P-4.
- **T-5 contract-table entries** — standing Phase D rule restated: EVERY collecting
  plant controller adds its valid-POST case to `contract.plant-products.test.js`
  (manual table — an unlisted controller is invisible, recipe §8). The m0 scaffold
  creates the file with the harness + zero cases.
- **T-6 per-set Playwright feature project + webServer env** (corrected this round —
  the round-1 "scope existing test:features" step is a NO-OP: the `features` project
  is ALREADY live-animals-scoped via
  `testDir: './src/server/app/sets/live-animals/journeys/linear/features'`
  at `playwright.config.js:43-45`; no change to it). The real work:
  1. NEW Playwright project in `playwright.config.js`: name
     `features-plant-products`, `testDir:
     './src/server/app/sets/plant-products/journeys/linear/features'`,
     `testMatch: '**/*.e2e.spec.js'`, same `use` block as `features`.
  2. NEW npm script `"test:features:plant-products"` =
     `SERVED_SET=plant-products PLANT_PRODUCTS_MODE=stub playwright test --project=features-plant-products`.
  3. **webServer env pass-through (state it, don't assume):** the shared
     `webServer` block (`playwright.config.js:54-63`) hardcodes
     `env: { PORT, LIVE_ANIMALS_MODE: 'stub' }` with
     `reuseExistingServer: false`. `SERVED_SET`/`PLANT_PRODUCTS_MODE` reach the
     self-hosted server ONLY because Playwright merges the explicit `env` over
     `process.env` (additive, not a replacement) — the config's env block is
     NOT the complete server environment. The increment records this mechanism
     in a config comment; the hardcoded `LIVE_ANIMALS_MODE: 'stub'` is inert
     under the plant set; `reuseExistingServer: false` guarantees no stale
     live-animals server is reused.
  Same split for `test:e2e` when the whole-journey plant suite exists (m4).
  Acceptance: m0's `import-type.e2e.spec.js` + `hub.e2e.spec.js` + dashboard spec
  pass under the new script — at least one of them asserts plant-set content that
  CANNOT render under live-animals (proves the env actually reached the webServer);
  existing `test:features` untouched and green.
- **T-7 set-owned structural suites** — `obligations/coverage.test.js` (m0, empty-safe)
  and `obligations/whitelists.test.js` (m3, pins `varietyClass` + `inspectionPremises`
  allowlists against the set services with a control value).
- **T-8 depth-3 characterisation test** — P-7 (platform-level, m0 gate for m3).
- **Plant verification ladder** (Phase D increments cite this): baseline
  `npm run test:plant-products` BEFORE editing → after: `test:plant-products`,
  `npm test`, `npm run lint`, `PORT=3050 npm run test:features:plant-products`
  (+ `test:e2e` split when it exists), `npm run format` before commit. PLUS the
  sibling-safety check: `npm run test:live-animals` and default-`SERVED_SET` boot
  must stay green on every platform-touching increment (P-1..P-6).

---

## 8. GAPS — where no existing recipe covers the work

The recipe corpus (`sets/live-animals/docs/` + the `frontend-change` skill) covers
add-a-field / add-a-page / add-a-section / add-a-collection / obligation maintenance /
flow maintenance — all INSIDE an existing, booted set. Phase D planners citing a
recipe for those shapes are covered. The following have NO recipe; each lists what a
recipe would need to specify (Phase D must treat these as first-class plan content,
not recipe-verbatim steps):

**G-A — No "add a set" recipe (the expected headline finding).** A recipe would need,
step by step:
1. Choose the set name; state the one-set-per-process rule and the `SERVED_SET`
   contract (FD-1).
2. Create the L3 skeleton: `obligations/index.js` with empty `obligations`, the
   derived-`groups` formula verbatim, and the `policy` export shape (P-1).
3. Create the L4 skeleton: `config.js` (TEMPLATES prefix, unprefixed LAYOUT, three
   set-prefixed cookie names), `flow/{flow,task-rows,run,entry-guard}.js` minimal
   exports, `features/{index,evaluation}.js` empty registries — naming exactly which
   exports each file must have for `configureJourneyFlow`/`buildDispatch` to accept
   them (§1 m0 list).
4. Write the L1 gateway: the 13-row call table (§4.1.2) with the load-bearing order
   and per-seam argument shapes; which seams are optional (`configureCommodityReference`)
   and when priming applies.
5. Register in the selector + router (§4.1.3-4); unknown-set boot failure semantics.
6. Edit dep-cruiser (gateway whitelist + sets-not-l1) WITHOUT touching the violations
   baseline (P-4).
7. Add the set-scoped Vitest script, per-set Playwright script, cloned app-root
   suites, empty contract table (T-1..T-6).
8. Stand up set services: mode switch, records adapter against the set's backend
   surface (port-op → HTTP table like §6.2), reference fixtures.
9. Minimal surfaces to be usable: dashboard, hub (+ GROUPS), entry filter,
   entry-guard policy.
10. The two-sided verification ladder: new set green AND default set unchanged (§7
    last bullet).
This plan IS that recipe for plant-products; extracting it into
`docs/add-a-set.md` afterwards is a recommended (not required) m4+ chore.

**G-B — No depth-3 nested-collection recipe.** add-a-collection's nested exemplar
(`animalIdentifiers`) is depth 2. A recipe would need: grouped-binding `groups`
arrays of length 3, `…At` path discipline (`['lines', i, 'species', j, 'varieties']`),
parent-index validation at TWO levels before any write, scope/wipe/completeness
expectations at depth, and the P-7 characterisation gate. Until P-7 is green this is
unproven platform ground.

**G-C — No "create the hub from scratch" recipe.** Recipe §3.6 assumes an existing hub
(add a row id to GROUPS). Creating `features/hub/` needs: controller GROUPS shape,
numbered group captions in both locales, row title/hint copy contract,
`conditional: true` hide semantics, the review-spoke unlock wiring
(`scope.readyForCheckYourAnswers` — free from L2 bridge), and hub axe/e2e baselines.
m0 builds it by transposing the live-animals hub feature file-for-file.

**G-D — No records-adapter recipe.** The recipes' persistence step is "edit the L2
notification-mapper" (§1.6) — inapplicable under FD-5. What's needed: the engine-port
surface (11 ops), the op→HTTP table (§6.2), stub/real parity requirements
(status-transition legality in the stub), mapper omission-assertion discipline (a
field with no backend home gets an explicit omission test, never an invented
property), and the documents sub-resource projection (FD-11).

**G-E — No entry-guard / opening-run authoring recipe.** Flow maintenance (§6) covers
CHANGING flow data; authoring `entry-guard.js` + `run.js` from nothing needs the
policy contract: what `entryGuardTarget` may return (redirect target or falsy), its
allowed L2 reads, deep-link redirect policy, and which pages belong in RUN_STEPS
(CHED-PP: import-type only at m0; extend as m2 lands the first real pages).

**G-F — No check-answers-from-scratch recipe.** §1.5/§3.7 extend existing cards.
Creating `features/check-answers/` needs the view-model/cards directory contract,
`row()`/`changeAction()` obligation-name resolution through dispatch, scope-driven
row omission, and the review-page → declaration → confirmation exit spine. m4's
inc-029 transposes the live-animals feature.

**G-G — No dashboard/lifecycle recipe.** notifications-dashboard, delete-notification
and the amend/copy actions have live exemplars (`features/dashboard`,
`features/notification-actions`, `features/delete-notification` — verified present in
the live-animals features dir) but no recipe doc; Phase D planners for inc-028/inc-039
must plan by exemplar transposition, citing concrete live-animals files.

**G-H — No flow-only-key recipe.** import-type + declaration ride
`FLOW_ONLY_KEYS`/session, not the manifest (FD-8). Recipe fragments exist (§6 recap)
but no end-to-end script (key → session store → entry filter behaviour → finalise-time
inclusion). inc-008/inc-030 planners transpose `import-type-filter`/`declaration`
features.

**G-I — No CSV-branch recipe.** inc-035's branch-replacement pattern (same 12
obligations, alternate collection surface) has no live-animals analogue at all. m5
problem; flagged now so nobody expects a recipe.

---

## 9. Increment-order constraints handed to Phase D

1. m0 = §1 m0 file list + §4 wiring + P-1..P-6 + T-1..T-8 (P-7 before any m3 work).
2. Platform items P-1..P-5 land BEFORE the first obligation-bearing page (m2) — the
   policy seam and cloned contract table must exist for inc-009 to register cleanly.
3. §2.3 fixes the `sections` append order; §2.1 fixes row ids and hub GROUPS.
4. Every page increment follows the §1–§4 recipes of the cheat-sheet with the §7
   plant ladder substituted; every platform-touching increment adds the
   sibling-safety check (live-animals green, default boot unchanged).
5. inc-012 (commodity model extension) remains a HALT-FOR-REVIEW gate; P-7 evidence
   attaches to it.

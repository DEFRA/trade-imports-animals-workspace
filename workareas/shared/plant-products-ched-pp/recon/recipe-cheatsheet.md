# Frontend recipe cheat-sheet (planner template)

Distilled 2026-07-31 from the live-animals recipe docs
(`repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/docs/`)
and the workspace `frontend-change` skill. A planner reading only this file plus
a page spec must be able to plan an increment. For CHED-PP as a sibling set,
substitute `sets/plant-products/` (or the chosen sibling name) for
`sets/live-animals/` in every path pattern — the recipes are set-relative.

All relative paths below are under `src/server/app/sets/<set>/` unless they
start `src/server/app/`. Repo root = `repos/trade-imports-animals-frontend`.

---

## 0. Architecture frame (from frontend-change SKILL.md)

Four layers; dependency-cruiser (`npm run lint:arch`) enforces them:

- **L1** `src/server/app/` root — composition. `routes.js` is the ONLY file that
  may name the set; everything is injected through `configure*` seams
  (`configureObligationSet()`, `configureJourneyFlow()`,
  `configureCommodityReference()`).
- **L2** `app/{engine,model,bridge,flow,services,lib,shared,analysis}` —
  set-agnostic platform. Never imports `sets/**`, never contains set copy or
  vocabulary. If a change wants set knowledge in L2, the knowledge belongs in
  the set/journey and reaches L2 through the existing `configure*` seams.
- **L3** `sets/<set>/obligations/` — the set's manifest + section data. No
  display copy, no journey knowledge.
- **L4** `sets/<set>/journeys/linear/` — features (pages, views, copy,
  co-located `*.e2e.spec.js`) and the journey's flow data.

---

## 1. Recipe: ADD A FIELD (scalar field on an existing page)

Exemplar: the **origin** feature (fields, conditional scope, service-backed
options, validation, persistence, check-answers rows). Normalising input:
**cph-number**.

Ordered steps and files touched:

1. **Obligation** — add to the matching file under `obligations/sections/`;
   give it a new UUID `id`, a path-safe `name` (no `.` `[` `]`),
   `status: 'mandatory' | 'optional'` (unless an `applyTo` helper supplies
   status). Use `within: <group>` for a collection member. Use a helper from
   `src/server/app/model/obligations/helpers/index.js` when another answer
   controls scope/mandate — the helper metadata must name its dependency.
   Import + export in `obligations/index.js` and add to its `obligations`
   array. NO label/title/hint/legend/option/display logic — `obligation-purity`
   enforces copy-free obligations at boot.
   Run `npm run test:live-animals` (set-scoped Vitest, see §9 for the CHED-PP
   equivalent name): registration fails with an unowned leaf — expected;
   continue.
2. **Binding** — add to the owning feature's
   `journeys/linear/features/<feature>/evaluation.js`:
   `scalar({ field, obligation })` for top-level;
   `grouped({ field, obligation, groups })` (full group path) for a collection
   member; `convert` only when canonical fulfilment needs a different value
   from the cleaned page value. First binding file for a feature → import its
   `evaluationBindings` in `journeys/linear/features/evaluation.js` and add to
   `featureEvaluationBindings`.
   Re-run set tests: registry error gone; dispatch now reports "collected by no
   page".
3. **Controller** — add the obligation name to the owning controller's
   `meta.collects` (a page owning a repeatable collection names only the root
   group). Controller order is fixed: (1) GET calls `state.get()` once,
   prefills from `answers`; (2) POST reads raw `request.payload`; (3) validates
   with factories from `src/server/app/lib/validate/index.js`; (4) invalid POST
   re-renders the user's RAW values, status 400; (5) valid POST commits cleaned
   values via `state.commit()`; (6) redirect via
   `await kit.nextTarget(request, page, committed.scope)`.
   Service-backed membership rules are built inside POST (or a function POST
   calls) from boot-primed values — never freeze a service list in a
   module-level schema. Conditional field: `scope.has(fieldName)` decides
   render + validate; never commit a hidden value (the evaluator purges data
   when an obligation leaves scope). Wrap the write in
   `kit.recoverableSave()`; a marked persistence failure re-renders with
   `recoverableError: true`, status 500; other errors throw.
   Update the controller's case in `src/server/app/contract.test.js` (valid
   payload + scope seed; the case must commit exactly the committable names in
   `meta.collects`). The contract table is MANUAL — an unlisted controller is
   not detected; add the case even when green. Run `npm test` (L1 contract is
   not in the set-scoped run).
4. **Copy + markup** — add English AND Welsh copy to the feature's
   `copy/copy.en.js` and `copy/copy.cy.js` (same leaf paths and value kinds in
   both); resolve with `copyFor({ en, cy })` in the controller. Render the
   field with a GOV.UK or MoJ macro in the feature's `.njk`. Keep input name,
   input id and validation error key identical so the error-summary link
   `#<fieldName>` moves focus to the control. Update the feature's
   `copy/copy.test.js`. Convention tests that react:
   `src/server/app/copy-convention.test.js` (every templated feature owns a
   complete `copy/` folder) and `src/server/app/copy-parity.test.js` (en and cy
   bundles same shape — the first check to fail when only one locale changes).
5. **Check-answers row** — add to the matching card under
   `journeys/linear/features/check-answers/view-model/cards/`; labels and
   displayed value labels in BOTH check-answers copy bundles. `row()` for an
   editable scalar; pass the obligation name so `changeAction()` resolves the
   owning page through the dispatch index; service label function when the
   stored value is a code; conditional rows shown only while the obligation
   path is in scope. Extend
   `journeys/linear/features/check-answers/check-answers.e2e.spec.js` (value +
   Change link).
6. **Notification mapper (only if the backend projection has a field home)** —
   update the matching module under
   `src/server/app/services/persistence/records/notification-mapper/` and
   extend `notification-mapper.test.js`. Mapper B layers extra fields over
   Mapper A — check both outputs before choosing the edit. NO backend home →
   leave the mapper unchanged and add an explicit omission assertion; never
   invent a payload property.
7. **Client JS (only if needed; prefer server-rendered)** — entry module under
   the feature (exemplar `features/documents/client/index.js`), a named
   `entry` in repo-root `webpack.config.js`, loaded from the template with
   `getAssetPath('<entry>.js')`. Missing webpack entry → template renders but
   the bundle 404s SILENTLY.
8. **Unit tests** — extend `controller.test.js`: GET prefill; every validation
   branch; raw input on 400; cleaned input on commit; conditional
   render/validate/purge; marked recoverable-save failure → 500; unexpected
   errors throw. Focused model/gate/mapper/check-answers tests when those
   contracts change.
9. **Playwright feature spec** (co-located, see §8 conventions) covering:
   initial render (label, hint, options); happy-path save + redirect + reload +
   persisted value; each validation rule in its own test; raw entered value +
   other values preserved on error; error-summary link moves focus;
   conditional show/hide/purge; check-answers value + Change link.
10. **Axe** for BOTH states the field changes: initial render and validation
    error state. `AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa'])`, fail
    on any `serious`/`critical` impact. Filter a component false positive only
    when the exemplar does and the same markup proves it applies.
11. **Full ladder** (§9).

---

## 2. Recipe: ADD A PAGE (one new journey page)

Exemplar: **import-reason** (smallest complete collecting page); **origin**'s
e2e spec for per-rule validation + axe pattern. Read
`journeys/linear/features/index.js`, `journeys/linear/flow/flow.js`,
`journeys/linear/flow/task-rows.js` before registering.

Feature folder shape (single-page feature):

```text
journeys/linear/features/<name>/
├── controller.js
├── controller.test.js
├── copy/
│   ├── copy.cy.js
│   ├── copy.en.js
│   └── copy.test.js
├── evaluation.js
├── page.js
├── template.njk
└── <name>.e2e.spec.js
```

Ordered steps:

1. **Page identity + files** — `page.js` exports only `{ id, slug }` and
   imports NOTHING (controller and flow import the same object; prevents a
   flow↔controller module cycle). Page joining an existing multi-page feature:
   controller + template inside that group, spec in the group's `e2e/` folder.
   Create both locale bundles + copy test as soon as the template exists
   (copy-convention scans feature folders).
2. **Model + binding** — per add-a-field steps 1–2 for every field the page
   collects: obligation under `obligations/sections/`, re-export in
   `obligations/index.js`, bind in the feature's `evaluation.js`, register the
   bundle in `journeys/linear/features/evaluation.js`. No display text, options
   or validation rules in the obligation model — copy in `.njk`/copy files,
   validation in the controller.
3. **Controller** — `export const meta = { ...page, collects: ['fieldName'] }`
   (`collects: []` only when the page owns no obligation or edits a collection
   whose root another page owns). One `render()` helper for GET and POST
   errors; build the common view with `kit.base()`; pass `journey` so the
   shared reference strip renders; normal back link is
   `hubPath(journey.journeyId)`. GET/POST behaviour identical to add-a-field
   step 3 (validate → 400 raw → commit → `kit.nextTarget` →
   `kit.recoverableSave`). Routes:
   `export const routes = kit.pageRoutes(page, { get, post })` — explicit Hapi
   route objects only when more than a GET/POST pair is needed.
4. **Copy + view** — both bundles same shape, `copyFor({ en, cy })`. Template
   extends `shared/layout.njk` (resolves from the `src/server/app` Nunjucks
   root — do NOT prefix the layout). View name = `TEMPLATES` prefix from
   `journeys/linear/config.js` (`live-animals/journeys/linear` — sibling set
   gets its own prefix). Shared error summary + save actions; GOV.UK/MoJ
   macros; input name = id = error key.
5. **Register routes + dispatch** — import the controller namespace in
   `journeys/linear/features/index.js`: add `meta` to `dispatchPages` (INCLUDING
   `collects: []` pages — id/slug must be indexed for gates and navigation);
   spread `routes` into `allRoutes`. `buildDispatch(dispatchPages)` rejects an
   unsafe obligation name, two page owners, an uncovered obligation. Never add
   a second owner to silence coverage.
6. **Place in flow + task row** — import the page identity into
   `journeys/linear/flow/flow.js`, into the right `sections` entry (array
   position controls `nextInSection()` and strictly-earlier prerequisites).
   Import into `journeys/linear/flow/task-rows.js`: existing row when the pages
   form one user task; new row only when the page needs its own hub entry. A
   task row = hub entry; a flow section = navigation sequence. If adding a task
   row also: add the row id to one `GROUPS` entry in
   `journeys/linear/features/hub/controller.js`; matching en+cy `rows` copy in
   the hub feature; update `hub/copy/copy.test.js`, `hub/hub.e2e.spec.js`, and
   `journeys/linear/flow/task-rows.test.js`. `pageGatePasses()` derives the
   normal gate from `collects` + earlier continue-enforced fields — add an
   authored `gate` on the page identity only when that rule cannot express the
   page. Add to `journeys/linear/flow/run.js` only when the page belongs in the
   opening run (update run tests if so).
7. **Check-answers + mapper** — as add-a-field steps 5–6.
8. **Client JS** — as add-a-field step 7.
9. **Unit + contract tests** — add the controller's valid POST case to
   `src/server/app/contract.test.js` (manual table — a missing new controller
   does NOT fail the test; adding the case is required work; run `npm test`).
   `controller.test.js` covers: GET prefill + view model; every validation
   rule; raw values + no commit on 400; cleaned values + redirect on success;
   conditional fields and gates; recoverable failure → 500; unexpected errors
   throw. Flow tests for section order, skip, task-row entry, status,
   opening-run behaviour.
10. **Playwright spec** — small feature:
    `features/<name>/<name>.e2e.spec.js`; multi-page feature:
    `features/<group>/e2e/<page>.e2e.spec.js`. Cover: initial render (heading,
    copy, hints, controls, service-backed options); happy-path save + correct
    next-page/hub redirect; reload persistence of every entered value; each
    validation rule in its own test; values preserved on error; every
    error-summary link focuses its control; back / Save-and-return / Cancel /
    Change navigation; conditional scope, skip, purge; check-answers rows +
    Change links.
11. **Axe** — one check for initial render, one for the error state (same
    builder/tags/threshold as §1.10).
12. **Full ladder** (§9).

---

## 3. Recipe: ADD A SECTION (feature group + flow section + task row)

Use when several new pages form ONE user task and one hub entry. Exemplar:
**transport** (5-page flow section rendered as 3 task rows). Three distinct
terms — never conflate:

- **feature group** — nested folder under `journeys/linear/features/` owning
  related pages, copy, bindings
- **flow section** — entry in `journeys/linear/flow/flow.js`; page order +
  `nextInSection()`
- **task row** — entry in `journeys/linear/flow/task-rows.js`; the hub item and
  submit-readiness unit

Group folder shape:

```text
journeys/linear/features/<group>/
├── copy/            (copy.cy.js, copy.en.js, copy.test.js — group-owned,
│                     namespaced by page, both locales same shape)
├── e2e/<group>.e2e.spec.js   (all browser specs live here)
├── <first-page>/<first-page>.controller.js + .controller.test.js + .njk
├── <second-page>/...
├── evaluation.js    (feature('<group>', [...]) with scalar()/grouped())
└── page.js          (ALL { id, slug } objects, import-free)
```

Ordered steps:

1. **Choose stable ids up front**: group folder name, flow-section id,
   task-row id, one page id + slug per page, obligation names + UUIDs. One
   obligation = one page owner; a later page that only edits an earlier
   collection page's data uses `collects: []`. Add obligations to
   `obligations/sections/`, re-export in `obligations/index.js`; `applyTo`
   helpers when answers gate later fields/branches. Copy-free model.
2. **Create the group + bindings** (shape above); bind every leaf; register the
   bundle in `journeys/linear/features/evaluation.js`.
3. **Build each page in journey order** per add-a-page step 3–4 (GET once via
   `state.get()`; POST validate → 400 raw → commit → `kit.nextTarget()`;
   `kit.recoverableSave()` everywhere; `scope.has()` for conditional fields;
   never render/validate/commit out-of-scope; evaluator purges). Complete both
   copy bundles + group copy test before continuing (copy-convention +
   copy-parity fail here otherwise).
4. **Register every controller** in `journeys/linear/features/index.js`
   (`dispatchPages` incl. `collects: []` pages; `routes` → `allRoutes`). One
   valid-POST contract case per collecting controller in
   `src/server/app/contract.test.js` (manual list; run `npm test`).
5. **Flow section** — one `sections` entry
   `{ id: '<section-id>', pages: [firstPage, secondPage] }`; array order =
   journey order; section position controls strictly-earlier continue
   prerequisites. Authored `gate` only for a fact derived rules cannot express.
   Focused navigation + gate tests for every conditional page/branch. `run.js`
   only if product behaviour puts pages in the opening run.
6. **Task row + hub** — one row
   `{ id: '<task-row-id>', pages: [firstPage, secondPage] }`. Row status
   defaults to the union of the pages' `collects`; `parts` only for a
   collection facet; `conditional: true` only when the hub must hide a
   Not-applicable row. Add the row id to the right hub `GROUPS` object; row
   title + hint in both hub copy bundles; new numbered hub group only when the
   design requires a new heading (caption in both locales). Update
   `task-rows.test.js` (Not yet started / In progress / Completed / Optional /
   Not applicable, row gate, first entry page), `hub/copy/copy.test.js`,
   `hub/hub.e2e.spec.js`. Every task row participates in
   `readyForCheckYourAnswers` — a mandatory new row BLOCKS Check and submit
   until complete; prove blocked AND complete states in `task-rows.test.js`.
   Registration for a group is ONLY: (1) controllers → `dispatchPages` +
   `allRoutes`; (2) binding bundle → `featureEvaluationBindings`; (3) page
   identities → `sections` + `taskRows`; (4) task-row ids + copy → hub;
   (5) `run.js` only if opening-run. `journeys/linear/config.js` (template
   prefix, layout name, 3 session cookie names) and the
   `configureJourneyFlow()` call in `routes.js` change ONLY when the journey's
   template/cookie identity or injected policy surface itself changes —
   routes.js injects the whole exported arrays.
7. **Check-answers** — section/cards under
   `features/check-answers/view-model/`; en+cy headings, row labels, value
   labels; obligation names into `row()`/`changeAction()`; `scope` to omit
   out-of-scope rows; extend `check-answers.e2e.spec.js` for every value +
   Change target.
8. **Mapper when applicable** — as §1.6 (check Mapper A and B separately;
   omission assertions when no home).
9. **Client JS when needed** — as §1.7.
10. **Unit tests** — controller test beside every controller (full add-a-page
    list) + focused tests for bindings, model gates, flow order, branch
    skipping, task-row status, hub rendering, check-answers rows, notification
    mapping.
11. **Playwright specs** in `features/<group>/e2e/` covering the COMPLETE task:
    hub row initial status + first-page link; happy path through every page and
    back to the hub; per-page reload persistence; each validation rule in its
    own test; values preserved on error; error-summary focus; each conditional
    branch, skipped page, out-of-scope purge; Back / Save-and-return / Cancel /
    Change; completed hub-row status; all check-answers values + Change
    targets.
12. **Axe** — every new page in both states; extend the hub axe test when the
    new row or a new group heading changes the hub state.
13. **Full ladder** (§9) — plus explicitly check the new hub row reaches its
    first page.

---

## 4. Recipe: ADD A COLLECTION (repeatable group)

Three live layout exemplars:

- **documents** — single-page add-another loop (entry form + read-back table +
  per-row Remove on one page).
- **commodities** — two-page batch: search page reconciles the selection;
  consignment-details page (`collects: []`) edits every line in place. Carries
  a per-instance conditional field and a collection floor.
- **animalIdentifiers** — nested collection (`within` a commodity line) with a
  per-instance count cap.

Ordered steps:

1. **Manifest** — a collection = a GROUP obligation + member obligations that
   name it in `within`. Group carries `id` (UUID) + `name` (request-local
   answers key and DOM field name) + optional
   `requires: { minEntries, errorCode }`; NO `status`, no value of its own — it
   becomes a group purely because members point at it. `within` references the
   group object BY IDENTITY (a real import). `groups` is derived
   (`obligations.filter(o => obligations.some(other => other.within === o))`),
   never hand-maintained. Member names are keys inside each instance object
   (`answers.commodityLines[0].commoditySelection`) and DOM field names —
   path-safe or `buildDispatch` throws at boot. Nesting = same declaration one
   level deeper (a group whose `within` points at another group; instances at
   `answers.lines[i].units[j]`).
2. **Grouped bindings** — in the feature's `evaluation.js`, describe each group
   as `{ field, token, obligation }` then bind each leaf with
   `grouped({ field, obligation, groups: [line] })` (or `[line, unit]` at
   depth). Boot rejects a missing leaf, duplicate UUID owner, inconsistent
   group token, or binding depth disagreeing with the `within` chain.
   Fulfilment ids (`line0`, `line0/unit1`) are SNAPSHOT-LOCAL positions, not
   durable identities — every save replaces the whole snapshot; removing an
   earlier item may renumber the rest.
3. **Per-instance conditional field** — an `applyTo` closure built with a
   helper (e.g. `allowListed(gate, values, projectionGroup, reasons)`).
   Projection group: `null` when gate and gated field sit at the same identity
   level; a GROUP when the gated field is deeper than its gate (line-level
   decision projects onto every unit). Out-of-scope instance value → the engine
   wipes THAT FIELD in that instance (not a whole-instance delete). Reveal
   markup is page-side; scope + wipe stay in the model.
4. **Free from the engine** (write no scope/wipe code): per-instance scope
   (`bridge/scope.js`); per-path wipe (`bridge/purge.js`); per-instance
   completeness (`bridge/collection-complete.js` — group complete when the
   `requires` floor is met and every instance is complete); dispatch coverage
   at depth (a member inherits its owning page from the nearest ancestor group,
   so a loop page declares only the group in `collects`, e.g. `['documents']`).
5. **Loop pages** — hand-written controllers over engine primitives (read facts
   from the engine barrel `src/server/app/engine/index.js`; NEVER touch the
   evaluator directly). `state.collectionView(answers, collectionPath)` returns
   facts only `[{ index, path, entry, complete }]` — no hrefs/labels/view-models;
   the controller builds its own rows.
   - *Single-page loop* (documents): `meta.collects = ['documents']`; POST
     branches on the submit button — `action === 'add'` validates + appends via
     `state.appendEntry(request, h, 'documents', entry)`; plain Continue
     advances with no write; Remove is a third branch of the SAME POST (submit
     button `action=remove:<index>` so the crumb travels and no GET can
     delete) via `state.removeEntry(...)`. Look the instance up first and
     refuse an index with no entry (forged/stale index). A leaf-less entry is
     not persisted — commit only after validation produced at least one bound
     leaf.
   - *Batch split* (commodities): search page collects the group and on save
     calls `state.reconcileEntriesAt(request, h, ['commodityLines'], lineKey,
     selected.map(seedLine))` — keys by `keyOf`, keeps still-selected data
     (incl. nested records), drops deselected with wipe semantics. Details page
     `collects: []`, per-row Remove + Add-another, in-place edits via
     `state.updateEntryAt(request, h, ['commodityLines'], index, …)`.
   - *Nested loop*: `state.appendEntryAt(request, h,
     ['commodityLines', index, 'animalIdentifiers'], unit)`; reads via the same
     `collectionView` with the deeper path.
   - `appendEntry`/`updateEntry`/`removeEntry` are conveniences delegating to
     the `…At` forms with a single-segment path.
   - **Change context**: wrap every internal link/redirect (row actions, back
     links, add/remove/save round-trips) in
     `kit.withChangeContext(request, href)`; exit Continue via
     `kit.nextTarget(request, page, scope)` with a hub exit winning first via
     `kit.hubExitTarget(request)`. Only the EXIT repoints to check-your-answers;
     mid-loop actions never bounce there early.
6. **Count cap (when the model demands it)** — declaration is data in
   `src/server/app/bridge/obligation-source.js`
   (`MAX_ENTRIES_FROM = { animalIdentifiers: 'numberOfAnimalsQuantity' }`);
   computed by `engine/evaluate/cardinality.js` `collectionCapAt()` (returns
   the cap or `null` when none declared / count unanswered / not a non-negative
   integer — an unanswered count is deliberately NO cap; the per-instance floor
   still bites at submit). Enforcement is on the write path: `appendEntryAt`
   returns `null` (no write) at the cap, so a stale form is rejected.
7. **Write guards (never remove)** — (1) validate the parent index in a nested
   loop before touching the store
   (`Number.isInteger(index) && index >= 0 && index < lines.length`) — the
   primitives write at whatever path you give them and an out-of-range parent
   would fabricate a phantom instance; (2) the engine's `isValidIndex`
   (`engine/write/pipeline/predicates.js`) uses `Number.isInteger` because
   `splice(NaN, 1)` coerces to `splice(0, 1)`.
8. **Contract case** — assert the loop page's declaration (`meta.collects`
   equals the group); drive the committing handler (`action === 'add'` POST or
   the reconcile save) with a valid payload; seed the gating answer for a
   conditionally-scoped collection (else reconcile wipes the fresh write);
   assert exactly the declared ids committed.
9. **The one hard limit** — an `applyTo` gate reads values at the SAME identity
   level, or projects a shallower gate down via the projection group. It CANNOT
   read a sibling frame at the same depth: per-unit-gated-on-per-unit-sibling
   is expressible; gated across unrelated frames is not.

---

## 5. Obligation maintenance ("change an obligation") — guard rails

Definitions in `sets/<set>/obligations/sections/*`, aggregated in
`obligations/index.js` (the manifest). Guides:
`sets/<set>/docs/obligation-model.md`, platform `docs/obligation-model.md`,
`docs/scope-and-wipe.md`, `docs/cardinality.md`.

- Obligations are pure data-first definitions:
  `id / name / status / within / requires / applyTo`. NO copy, NO journey
  imports, NO IO at module load — reference-data bindings resolve lazily at
  gate execution (commodities gates are the exemplar). `obligation-purity.js`
  and the boot guard enforce this.
- A gate/scope change RIPPLES: an answer leaving scope gets WIPED by the engine
  (purge behaviour is the contract, not intuition). Re-read scope-and-wipe
  before changing `applyTo`; re-read cardinality for floors/caps
  (`requires.maxEntries`, `recordCountEquals`).
- The reachability analysis (`analysis/`, runs inside `npm test`) proves every
  obligation can be both satisfied and violated. A state made unreachable turns
  those suites red — the tripwire working. Fix the model, never weaken the
  prover.
- Set-pinned tests beside the manifest (`whitelists.test.js`,
  `coverage.test.js`) walk the concrete manifest — update them WITH the change,
  same increment.
- Manifest wiring: `routes.js` passes the manifest namespace to
  `configureObligationSet()`; generic model/bridge reads it via
  `model/obligations/manifest.js`. Feature bindings import THE SAME obligation
  objects (shared object identity is how the registry checks single ownership
  and `within`-chain depth).

## 6. Flow maintenance ("change the journey flow") — guard rails

Journey owns its flow data: `journeys/linear/flow/` — `flow.js` (ordered
`sections`; live-animals has ten; the `review` section carries the one authored
section gate `scope.readyForCheckYourAnswers`), `task-rows.js` (twelve rows in
live-animals), `run.js` (opening run, exports `nextRunTarget`),
`entry-guard.js` (pre-handler redirect policy), plus `config.js`. Machinery in
`app/flow/` is generic and consumes via `configureJourneyFlow()` in
`routes.js`. Guides: `sets/<set>/docs/journey-flow-and-gates.md`, platform
`docs/flow-and-gates.md`.

- Page order, section membership, task rows and entry-guard policy change in
  the JOURNEY's files. A change that seems to need editing `app/flow/*` is a
  platform (L2) change — different blast radius; re-read
  `docs/flow-and-gates.md` first.
- Task rows drive both the hub AND submit readiness
  (`readyForCheckYourAnswers`) — a row change is BEHAVIOUR, not presentation.
  `task-rows.test.js` and the hub feature specs pin it.
- Adding entries to the existing `sections`/`taskRows` arrays needs no new L1
  wiring (routes.js injects the whole exports); new EXPORT SHAPES do.
- `FLOW_ONLY_KEYS` (live-animals: `importType`, `declaration`) use the
  session's flow-only store, not canonical obligation fulfilment.
- Row status = union of the pages' `collects`; `parts` narrows to a collection
  facet; `conditional: true` hides a Not-applicable row. Hub `GROUPS` (in
  `features/hub/controller.js`) places task-row ids under headings and orders
  them.

---

## 7. How obligations gate pages (requires / applyTo / within) — summary

- **`within`** — collection membership: member obligation references its group
  object by identity; nesting is `within` chains; the request projection
  exposes instances as `answers.<group>[i].<member>`. Dispatch: a member
  inherits its owner page from the nearest ancestor group, so pages collect
  only group roots.
- **`applyTo`** — per-answer/per-instance scope closures built from helpers in
  `model/obligations/helpers/index.js` (e.g.
  `allowListed(gate, values, projectionGroup, reasons)`); helper metadata must
  name its dependency. Same-level gate → `null` projection; deeper field gating
  on a shallower value → pass the deeper group as projection. Cannot gate
  across sibling frames (§4.9). Out-of-scope → engine wipes the value
  (field-level within an instance).
- **`requires`** — cardinality on a group: `minEntries` floor (+ `errorCode`);
  caps via `MAX_ENTRIES_FROM` sibling-count declarations and
  `collectionCapAt()`; also `requires.maxEntries` / `recordCountEquals` exist
  (see `docs/cardinality.md`). Documents are capped at TEN entries (manifest
  declares, feature enforces on the write path).
- **Page gates** — `pageGatePasses()` derives the normal gate from
  `meta.collects`, in-scope obligations and strictly-earlier continue
  prerequisites (flow-section order). Authored `gate` on a page identity, and
  authored section gates, are exceptional.
- **Task rows → submit** — every row contributes to
  `readyForCheckYourAnswers`; a mandatory incomplete row blocks Check and
  submit.

## 8. Testing conventions

- **Co-located Playwright feature specs**: small single-page feature →
  `features/<name>/<name>.e2e.spec.js`; multi-page group →
  `features/<group>/e2e/<page>.e2e.spec.js`. Every test independent, starts its
  own notification. NO page objects. Raw role/label/visible-copy locators.
  Playwright assertions + locator auto-waiting; `expect.poll` for non-locator
  state; NEVER a sleep.
- **Axe**: every changed page, TWO states (initial render + validation error
  state after inline error + error summary appear).
  `AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa'])`; fail on any violation
  with `impact` `serious` or `critical`; filter only a proved component false
  positive matching the exemplar's condition.
- **Layered suites**: set-scoped Vitest (`npm run test:live-animals`) covers
  obligation-set tests, controllers, copy, bindings, flow policy, journey
  behaviour — but NOT L1/L2. `npm test` adds route composition, dispatch,
  fulfilment-registry, copy-convention, copy-parity, reachability analysis and
  the L1 controller contract table. `PORT=3050 npm run test:features` builds
  the frontend and runs the co-located specs. `npm run test:e2e` runs the
  whole-journey `journeys` project under `e2e/` (fixture:
  `journeys/linear/flow/fixtures/happy-path.json`) — run it when the change
  affects the complete journey or shared E2E helpers.
- **Convention tests are the rails**: contract table (manual — add cases
  yourself), copy-convention, copy-parity and dynamically-counted suites react
  to new files. A test count that DROPS with unchanged file count means
  discovery silently narrowed — hunt it, never shrug.
- **Contract test shape**: one valid-POST case per collecting controller;
  payload + scope seed; must commit exactly the committable names in
  `meta.collects`.

## 9. Verification ladder (verbatim; run from the frontend repo root)

Recipe in-repo form (docs):

```bash
npm run test:live-animals
npm test
PORT=3050 npm run test:features
npm run lint
```

frontend-change skill form (workspace, ordered — each green before the next,
one Playwright run at a time):

```bash
npm --prefix ~/git/defra/trade-imports-animals-workspace/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals-workspace/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals-workspace/repos/trade-imports-animals-frontend run lint
PORT=3050 npm --prefix ~/git/defra/trade-imports-animals-workspace/repos/trade-imports-animals-frontend run test:features
PORT=3050 npm --prefix ~/git/defra/trade-imports-animals-workspace/repos/trade-imports-animals-frontend run test:e2e
```

Green = every command exits 0, no failed Vitest tests, no failed Playwright
specs, no lint errors. The Playwright suites self-host the app in stub mode —
no workspace stack needed; `PORT=3050` avoids a running stack on :3000. Run
`npm run format` before any commit (pre-commit hook enforces format + lint +
full units). Baseline guard: run `test:live-animals` BEFORE editing; red
baseline = STOP and report.

NOTE for the sibling set: `test:live-animals` is a set-scoped Vitest script.
The plant-products set will need its own equivalent
(`test:plant-products` scoped to `src/server/app/sets/plant-products`) added to
`package.json` as part of set scaffolding — plan it in m0, and substitute it in
the ladder thereafter.

## 10. Copy rules (recap)

- ALL user-facing text in the feature's `copy/copy.en.js` + `copy/copy.cy.js`;
  both bundles structure-identical (same leaf paths and value kinds);
  `copy-parity.test.js` enforces shape equality; `copy-convention.test.js`
  requires a complete `copy/` folder (en, cy, copy.test.js) for any feature
  with a `.njk` template. Resolve with `copyFor({ en, cy })`.
- NO display logic in the model/obligations/domain: no labels, titles, hints,
  legends, options, route names or template choices. `obligation-purity.js`
  enforces at boot. Copy in `.njk` + copy files; validation in the controller;
  options from real services (boot-primed), never frozen module-level lists.
- GDS plain English. GOV.UK/MoJ macros only — stay inside the govuk-frontend
  toolbox, no custom CSS.

## 11. Limits and gotchas (limits.md + recipe warnings)

- **Documents capped at ten** — manifest declares cardinality, feature enforces
  on the write path.
- **Commodity rules are set data** — species options, Cow Domestic/Game
  mapping, allow-lists come from the set-owned commodities service
  (`sets/<set>/services/commodities/` + `stub.js`); stub data, not proof of
  compatibility with an external master-data source. Boot passes the service to
  `configureCommodityReference()` so generic mapper code never imports the set.
  Whitelist tests pin allow-lists against the set-owned service.
- **Backend notification projections differ** — canonical fulfilment can hold
  values a projection cannot represent; Mapper B layers over Mapper A; a new
  obligation ALWAYS needs a feature binding but only gets a mapper field when
  the backend schema has a real home; otherwise assert the omission.
- **Collection positions are snapshot-local** — `line0`/`unit1` renumber when
  earlier entries are removed; never treat them as durable ids.
- **Silent webpack 404** — client JS without a named webpack entry renders fine
  and 404s the bundle.
- **Manual contract table** — unlisted controllers are invisible to the test.
- **`page.js` is import-free** — breaking this creates a controller–flow cycle.
- **`LAYOUT` is unprefixed** (`shared/layout.njk`, other Nunjucks root); view
  names carry the journey template prefix from `config.js`.
- **Never commit a hidden value; never freeze a service list in a module-level
  schema; never add a second `collects` owner to silence dispatch coverage.**
- **applyTo cannot gate across sibling frames** (§4.9).
- Generic platform constraints: platform `docs/limits.md`.

## 12. What the frontend-change skill forbids / demands

- Recipes are STRICT SCRIPTS: read the whole recipe before editing; follow
  verbatim, vary as little as possible; exemplars are the idiom — match them,
  don't invent.
- ONE increment per invocation, then stop; multi-element requests → do the
  first, list the remainder. Staged, not committed (commit is the caller's
  call).
- Baseline guard before editing (red baseline = stop and report).
- Self-repair budget: at most 3 fix attempts per red step, then stop and report
  honestly.
- Layer discipline: a change fighting a dependency-cruiser rule is in the wrong
  layer — stop and reconsider; never touch the rules or the baseline to pass.
- Standing constraints (violations are defects even with green tests): no
  display logic in model; L2 set-agnostic; webpack entry for any browser JS;
  convention tests are rails (investigate dropped test counts); every change
  carries its co-located Playwright spec + axe test.
- Out of scope for the skill: `prototypes/` work, the tests repo's E2E suite,
  Jira ticket planning.

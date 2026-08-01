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

> ## REVISION 2 — 2026-08-01 — SYMMETRIC MOUNTS (R7) + TESTS-REPO COVERAGE (R8)
>
> Two further rulings, later the same day. Both are decided; do not reopen.
>
> **R7 — SYMMETRIC MOUNTS. FD-16 IS REVERSED.** Sam does not accept the asymmetry
> where live-animals keeps the root mount and only plant-products is prefixed. His
> reasoning: this stuff is still in development, so refactoring live-animals is fine —
> have the two sets match up; change URLs if that is what symmetry requires, and make
> sure the `-tests` repo is updated as well. **Both sets therefore mount under their own
> prefix: `/live-animals` and `/plant-products`.** Live-animals' URLs WILL change and
> that is accepted. See the rewritten FD-16, the new §4.3 mount table, the enumerated
> migration list in the new **§4.6**, and the rewritten P-10.
>
> Consequence for the round-2 acceptance bars: any increment whose proof is "every
> existing URL assertion passes UNEDITED — that is the proof the root mount is a no-op"
> is now asserting the wrong thing. That bar is replaced everywhere by an explicit,
> enumerated URL migration whose correctness is proven by UPDATED assertions. P-10 /
> pp-057 is the increment this bites hardest; §4.5 and §9 are restated to match.
>
> **R8 — TESTS-REPO COVERAGE WAS MISSING FROM THE PLAN.** Sam asked whether updating
> `repos/trade-imports-animals-tests` with the plant-products work was in the plan. The
> honest answer was no: across all 58 increments only pp-053 and pp-057 mentioned that
> repo, and only to assert it should not break. There were ZERO increments adding
> plant-products coverage to it. That gap is closed by the new **§10 — Tests-repo
> strategy**, which owns the branch prerequisite, the parameterise-vs-clone ruling, the
> suites plant-products needs, how the two sets' suites are selected, and the named
> files to create or change.
>
> Nothing else in this document is reversed by R7/R8. Co-residency (R3), the recipe-first
> ordering (R6), copy idempotency (R4) and every FD other than FD-16 stand as written.

> ## REVISION 2026-08-01 — CO-RESIDENCY REPLACES THE SET SWITCH
>
> Sam's ruling R3 reverses the boot-time single-set-per-process decision that the
> 2026-07-31 draft recorded as SD-9 / FD-1 / FD-2 / FD-4. **live-animals and
> plant-products must be servable side by side from ONE Node process.**
>
> Why the reversal: the L1–L4 architecture was *explicitly designed* to be
> set-agnostic — L2 never imports a set, sets arrive only through L1 `configure*`
> seams, and dep-cruiser enforces that at error severity. The blocker was never the
> design. It is two implementation details: (a) every `configure*` seam stores its
> value in a **module-level single-slot singleton**, and (b) `shared/paths.js` hardcodes
> a **global URL namespace**. Both are fixable inside the seams that already exist.
> So the platform work to key the seams by set is now IN SCOPE and SCHEDULED (§4, §5
> P-3/P-9/P-10/P-11), not deferred to a hypothetical future programme.
>
> Also revised this round: **R6** — `docs/add-a-set.md` is authored BEFORE the m0
> scaffold and the scaffold increments follow it (§8 G-A, §9). **R4** — copy
> idempotency mirrors live-animals exactly on both sides, sequenced before the Copy
> button ships (§6.2). Sections not touched by the reversal (§1 tree, §2 hub mapping,
> §3 manifest, §6.1/§6.3) stand as written; FD-5 (set-owned records), FD-7
> (obligation policy on the manifest), FD-8/9/11/12/13 are unaffected.

**Standing decision (do not reopen):** plant-products is a sibling set under
`sets/plant-products/`, **co-resident** with live-animals in a single Node process.
Both L1 gateways register; every `configure*` seam is keyed by set id; the set for a
request is resolved from the route's owning plugin realm; URLs are namespaced by a
per-set mount prefix, and **every set takes a prefix — no set owns the root** (R7).
`/` is a redirect to the default set. See §4, and §10 for the tests-repo half.

---

## D. Decisions recorded this phase (headless — decided, not asked)

| id | Decision | Rationale |
|---|---|---|
| FD-1 | **REVISED (R3).** No served-set env var. **Both** gateways register in one process; the served set is a property of the REQUEST, not of the process | Sam's ruling. A boot switch would have made "which set" a deployment concern and left the singletons in place; keying them is the work the architecture was designed for. Deleting `SERVED_SET` also removes a whole class of "wrong env in CI" failure. |
| FD-2 | **REVISED (R3).** L1 gateway split stands, but `routes.js` becomes a **barrel**, not a selector: current body → **`routes-live-animals.js`** (exports `liveAnimals`), new **`routes-plant-products.js`** (exports `plantProducts`), `routes.js` re-exports both. `src/server/router.js` registers BOTH | Keeps "one file per set names the set" symmetry and keeps `routes.js` the single dep-cruiser-whitelisted gateway name in the barrel sense; the two bodies are the real gateways and get their own whitelist entries (P-4). |
| FD-3 | Plugin name `'plant-products'`; session cookies `plantProductsKnownJourneys` / `plantProductsOpeningRun` / `plantProductsFlowOnlyAnswers` | Mirrors `routes.js:45` and `journeys/linear/config.js` cookie naming (`liveAnimals*` prefix per recon §1 row 9). Under co-residency the set-prefixed names are now **load-bearing, not cosmetic**: both sets' cookies are live in the same browser at the same time. |
| FD-4 | **REVISED (R3).** `shared/paths.js` gains a **per-set base**, and its exports split into *route-shape builders* (prefix-free, evaluated at module load) and *link builders* (prefix-bearing, evaluated per request) | `kit.pageRoutes` calls `pageRoutePath(slug)` at MODULE LOAD (`shared/kit.js:120-133`), long before any `configure*` runs — so route paths cannot come from request context. Hapi's plugin `routes.prefix` supplies the mount instead; only the link builders need the request-resolved base. §4.3. |
| FD-5 | Plant-products persistence is a **set-owned records service** (`sets/plant-products/services/records/`) injected through the existing `configureRecords` seam — NOT a second L2 mapper | The L2 `services/persistence/records/` mapper is live-animals-shaped (recon §7.4); replicating plant vocabulary into L2 would repeat the wart and violate the no-display/no-set-knowledge-in-L2 principle. A set-owned impl passed by the L1 gateway breaks no dep-cruiser rule (the gateway is the whitelisted importer). `configureCommodityReference` is **not called** by the plant-products gateway — its only consumer is the L2 live-animals mapper (`services/persistence/records/notification-mapper/commodity-reference.js`, recon §1 row 3), which plant-products never executes. |
| FD-6 | Plant-products stub/real switch: **`PLANT_PRODUCTS_MODE`** (`stub` \| `real`, default `real`) in `sets/plant-products/services/mode.js` | Mirrors `services/mode.js:1` exactly. Left set-owned rather than generic because L2 `mode.js` reading `LIVE_ANIMALS_MODE` is itself a (cosmetic) leak — noted in §5 P-8, not fixed tonight. Co-residency makes per-set mode vars a FEATURE: one process can run live-animals against the real backend and plant-products against its stub. |
| FD-7 | Obligation-source vocabulary (`SYSTEM_POPULATED`, `ENFORCED_AT_CONTINUE`, `MAX_ENTRIES_FROM`, `SYSTEM_ANSWER_KEYS`) becomes a **`policy` export on the set manifest**, injected via `configureObligationSet` | These are live-animals obligation names sitting in L2 (`bridge/obligation-source.js:29,31-34,41-43,70` — verified live). Injection through the existing manifest seam is the smallest change that lets each set own its names. §5 P-1. |
| FD-8 | CHED-PP flow-only keys: `['importType', 'declaration']` | Direct mirror of live-animals (`flow/flow.js` per recon §3): CHED-PP's `import-type` is the pre-journey certificate-type filter (entry page, off-hub) and `declaration` is submit-time attestation persisted as `declaration{agreed,declaredAt}` at finalise. `commodity.inputMethod` is NOT flow-only — it persists on the document (SCHEMA-DESIGN §1.1), so it is an obligation. |
| FD-9 | Commodity nesting is modelled as depth-3 `within` chains: `commodityLines` → `species` → `varieties` | Matches SCHEMA-DESIGN §1.1 (`commodityComplement[].species[].varieties[]`). Depth 3 is UNPROVEN in the engine (live exemplar `animalIdentifiers` is depth 2) — §5 P-7 mandates a characterisation test in m0 before any commodity page is built. |
| FD-10 | **RESTATED (R3).** Per-set app-root test strategy: still **clone** the set-composing suites as `*.plant-products.test.js`, still **parameterise in-file** the pure filesystem walkers — but the *reason* changes and one suite is ADDED | The old reason (vitest file isolation dodges the single slots) is gone: the slots are keyed now, and FD-17's sole-set fallback means a one-set test file needs no context plumbing at all. The reason to keep separate files is plain readability + independent failure attribution. ADDED: a **co-residency suite** (`co-residency.test.js`, P-3/P-9) that boots ONE server with BOTH gateways and asserts a page from each set — that suite is the thing the old plan had no way to write. §7. |
| FD-14 | **NEW (R3).** The de-singleton mechanism is a **set-keyed registry per seam plus an `AsyncLocalStorage` request context**: new L2 module `shared/set-context.js` owns the ALS, the mount table, `withSetContext(setId, fn)`, `enterSetContext(setId)`, `currentSetId()`, `currentSetBase()`, and a `setKeyed(label)` factory that every seam uses to hold its per-set value. Every `configure*` / `build*` gains **`setId` as its first parameter**; every READ accessor keeps its existing signature and resolves through `currentSetId()` | Chosen over threading a `setId` argument through L2 call sites because *every read accessor is already a function or a delegating facade* (`obligations()`, `groups()`, `journeySections()`, `journeyLayout()`, `records.load()`, `session.knownJourneyIds()`, `pagePath()`) — ALS lets all of those keep their signatures, so the blast radius is the ~9 seam modules plus the two module-load `BASE` captures, NOT the several hundred controller/view-model call sites. Threading would touch pure model code and view-models that have no `request` in hand at all. One mechanism, applied identically to all seams. |
| FD-15 | **NEW (R3).** Set resolution is by **route ownership, not URL string parsing**: each gateway registers a realm-scoped `server.ext('onPreAuth', …)` that calls `enterSetContext(SET_ID)` before anything else. Hapi scopes request-lifecycle extensions added inside a plugin to that plugin's own routes | Robust by construction — no prefix-matching table to keep in sync with the routes, and it works identically whatever mount prefix a set is given. It also matches the existing pattern: the live-animals entry guard is ALREADY a realm-scoped `onPreHandler` (`routes.js:65-68`), so the mechanism is proven in this codebase; `onPreAuth` simply runs earlier in the same lifecycle. **Realm scoping is a load-bearing assumption and P-3 must pin it with a test** (a request to a plant route must not run the live-animals entry guard). |
| FD-16 | **REVERSED (R7).** ~~live-animals keeps the root mount~~ — **SYMMETRIC MOUNTS. Every set mounts under `/<setId>`: live-animals at `/live-animals`, plant-products at `/plant-products`. No set is registered at prefix `''`.** Both are applied identically via `server.register(gateway, { routes: { prefix: '/<setId>' } })`. `/` is served by a server-wide 302 redirect to the default set's dashboard (`/live-animals`), registered in `src/server/router.js` OUTSIDE both gateways so it never enters a set context. Live-animals' URLs change; that is accepted and its migration is enumerated in §4.6, including `repos/trade-imports-animals-tests` (§10) | Sam's ruling. The service is still in development, so refactoring live-animals is fine and the two sets should match up. The round-1 rationale for asymmetry (avoiding a migration) is exactly the debt Sam is declining to take on: an asymmetric scheme puts a permanent special case in `shared/paths.js`, in `registerSetMount`, in `add-a-set.md` ("the incumbent keeps the root, newcomers take a prefix") and in every future set's planning. It also HIDES the class of bug the prefix work can introduce — see the trap note in P-10. Symmetry costs one enumerated migration once; asymmetry costs a special case forever. §4.3, §4.6, §10. |
| FD-17 | **NEW (R3).** `currentSetId()` falls back to the **sole registered set** when exactly one set is mounted, and throws `No set context` when two or more are mounted and no context is active | Keeps every existing unit test, `contract.test.js`, `routes.test.js`, `indexed.test.js`, `store-ops.test.js` and each set's own suites working UNCHANGED (they compose exactly one set), while making a missing context a loud failure in the co-resident server where it actually matters. Without this the reversal would rewrite hundreds of green tests for no behavioural gain. |
| FD-18 | **NEW (R7).** What serves `/` once neither set owns it: a **server-wide 302 redirect to `/live-animals`** (the default set), declared in `src/server/router.js` next to `health` and `signout` — NOT inside either gateway, so it never enters a set context and never appears in either set's `allRoutes`. Explicitly **302, never 301** | Chosen over a set-picker landing page and over a 404. It is the only option that keeps the OIDC dance working with ZERO auth edits: `src/server/auth/controller.js:11,63,73,114,122` all fall back to `'/'` as the post-sign-in / post-sign-out target and `getSafeRedirect` only permits relative paths, so a 404 at `/` would break sign-in for any user arriving without a stored `redirect`. A picker page needs new copy in two locales, a11y baselines and a design decision nobody has made — gold-plating for a two-set service still in development. 302 because a 301 is cached by browsers indefinitely and would be painful to unpick when a picker page eventually replaces the redirect. Recorded upgrade path: swap the redirect for a picker page when a third set lands or when product asks for a landing page. **No legacy `/notifications/*` compatibility shim** — no external bookmarks to honour at this stage, and a shim would have to guess which set a bare journey id belongs to. |
| FD-19 | **NEW (R7).** `signout` **must be hoisted out of the prefixed registration**. Today `src/server/router.js:20-24` pushes `signout` into the same `routes` array as `liveAnimals` and registers them in one `server.register(routes)` call. Under R7 that call gains `{ routes: { prefix: '/live-animals' } }`, which would silently move `/signout` to `/live-animals/signout` and break the OIDC sign-out leg | This is a defect the symmetric mount INTRODUCES if it is not planned for, and it is invisible in unit tests (the route registers fine, just at the wrong path). `signout` gets its own unprefixed `server.register([signout])`. Same reasoning check applied and cleared for `health` (already its own register, `router.js:16`) and `serveStaticFiles` (own register after the routes, `router.js:29` → `serve-static-files.js:32` `${config.get('assetPath')}/{param*}`) — both stay server-wide and unprefixed. P-3/pp-006 must assert all three. |
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
**one** app boots with BOTH sets registered, serves live-animals under `/live-animals`
AND serves the plant dashboard, empty hub and import-type filter under
`/plant-products`, with `/` 302ing to `/live-animals` and all boot assertions passing
for both manifests — REVISED by R7, the old wording "live-animals unchanged at the
root" is retired):

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
| `parties.js` | consignor leaves: `consignorName`, `consignorAddressLine1..3`, `consignorCity`, `consignorPostcode`, `consignorCountry` (hand-entered, POP-4 — the one typed party); `destinationSameAsConsignee` (mandatory bool) + destination leaves gated `equalsGate(destinationSameAsConsignee, false, …)`; `packer*` leaves (optional — CHED-PP addition). Importer and consignee are **TWO SEPARATE MODEL FIELDS** (R1/SD-14 — not one party under two names), both server/stub-populated from the acting organisation (POP-1/POP-3) — NOT obligations in pass 1. Pass-1 behaviour is unchanged: both are written from `stubOrganisationOperator()`. A later planner must not collapse them into a single field. |
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

## 4. L1 wiring — co-residency: both gateways in one process

> **Sub-heading renumbering (2026-08-01).** §4 grew from three sub-sections to five,
> and REVISION 2 adds a sixth. Anything citing the OLD numbering should re-point: old
> §4.1 (file moves + gateway call table) → **new §4.4**; old §4.2 (`shared/paths.js`) →
> **new §4.3**; old §4.3 (acceptance) → **new §4.5**. New §4.1 and §4.2 are the
> co-residency mechanism and did not exist before. **New §4.6 (R7) is the enumerated
> live-animals URL migration**, sequenced in the document immediately after §4.3
> because it is that section's consequence — §4.4 and §4.5 follow it. Top-level §1–§9
> numbering is unchanged; REVISION 2 adds a new top-level **§10** (tests-repo strategy).

### 4.1 `shared/set-context.js` — the one new L2 module (FD-14/FD-15/FD-17)

Everything else in §4 and §5 is expressed in terms of this module. It is L2
(set-agnostic: it stores set *ids* and *prefixes* handed to it, and imports nothing
under `sets/`), so dep-cruiser is satisfied without a new rule.

```js
import { AsyncLocalStorage } from 'node:async_hooks'

const storage = new AsyncLocalStorage()
const mounts = new Map()                       // setId -> prefix, always '/<setId>' (R7)

export const registerSetMount = (setId, prefix) => {
  if (!prefix?.startsWith('/')) throw new Error(`Set "${setId}" needs a mount prefix`)
  mounts.set(setId, prefix)
}
export const mountedSetIds = () => [...mounts.keys()]

const soleSetId = () => (mounts.size === 1 ? [...mounts.keys()][0] : undefined)

export const currentSetId = () => {
  const id = storage.getStore()?.setId ?? soleSetId()
  if (!id) throw new Error('No set context — no active set and more than one mounted')
  return id
}
export const currentSetBase = () => mounts.get(currentSetId()) ?? ''
// R7: the `?? ''` is a defensive default only — no registered set has an empty prefix.
// `registerSetMount` rejects one, and P-11's tripwire asserts none exists at boot.

export const withSetContext = (setId, fn) => storage.run({ setId }, fn)   // boot-time
export const enterSetContext = (setId) => storage.enterWith({ setId })    // request-time

export const setKeyed = (label) => {
  const bySet = new Map()
  return {
    configure: (setId, value) => bySet.set(setId, value),
    current: () => {
      const setId = currentSetId()
      if (!bySet.has(setId)) throw new Error(`${label} not configured for set "${setId}"`)
      return bySet.get(setId)
    },
    has: (setId) => bySet.has(setId)
  }
}
```

**How a request is resolved to its set.** Not by parsing the URL. Each gateway
registers, as the FIRST thing in its `register` body, a realm-scoped extension:

```js
server.ext('onPreAuth', (request, h) => { enterSetContext(SET_ID); return h.continue })
```

Hapi scopes request-lifecycle extensions added inside a plugin to the routes that
plugin registers, so a request routed to a plant page enters the plant context and a
request routed to a live-animals page enters the live-animals context, with no shared
table to drift. `enterWith` persists for the remainder of that request's async
context, so every later lifecycle step, handler, view-model and L2 accessor resolves
the right set without any of them taking a new argument.

**Two risks the m0 platform increment must retire, not assume** (P-3 acceptance):
1. *Realm scoping is real.* Pin it: a request to a plant route must NOT execute the
   live-animals `onPreHandler` entry guard, and vice versa.
2. *`enterWith` survives interleaving.* Pin it: two concurrent requests, one per set,
   with the slower one deliberately awaiting inside its handler, must each still read
   their own manifest/flow/records. If this fails, the contingency (flagged, NOT
   planned) is explicit `setId` threading via `request.app` plus signature changes —
   a materially larger increment that would have to be re-planned.

**Boot-time reads.** `assertObligationPurity()`, `assertFulfilmentBindingCoverage()`
and `buildDispatch()` read through `currentSetId()` but run outside any request, so
each gateway wraps its whole `register` body in `await withSetContext(SET_ID, async () => { … })`.

### 4.2 Per-seam de-singletoning (the exact mechanism, seam by seam)

Uniform rule: **every `configure*` / `build*` gains `setId` as its first parameter and
stores into a `setKeyed(...)` registry; every read accessor keeps its current signature
and resolves via `currentSetId()`.** No read call site in L2, L3 or L4 changes, except
where a value was captured as a module-load CONST (rows 8–11 below) — those become
functions and their consumers are listed exhaustively.

| # | Seam (file:line today) | Today | After |
|---|---|---|---|
| 1 | `model/obligations/manifest.js:1` | `let configuredSet` | `const store = setKeyed('obligation set')`. **`configureObligationSet(setId, obligationSet)`**. `obligationSet()`, `obligations()`, `groups()`, `obligationByName(name)` — signatures UNCHANGED, each reads `store.current()`. |
| 2 | `bridge/fulfilment-registry.js:167` | `let configuredRegistry` (built lazily from the bindings) | `setKeyed('fulfilment registry')` holding `{ bindings, registry? }` per set; **`configureFulfilmentRegistry(setId, bindings)`**; the lazy build and its cache become per-set. `assertFulfilmentBindingCoverage()` and every registry reader — signatures UNCHANGED. |
| 3 | `flow/journey-flow.js:7` | `let configured` | `setKeyed('journey flow')`. **`configureJourneyFlow(setId, journeyFlow)`**. `journeySections()`, `journeyTaskRows()`, `journeyRowStatus(...)`, `journeyNextRunTarget(...)`, `journeyFlowOnlyKeys()`, `journeyEntryGuardTarget(...)`, `journeyLayout()` — signatures UNCHANGED. |
| 4 | `flow/dispatch.js:6-9` | three module-level `Map`s + `let dispatchBuilt`, cleared by `resetDispatchState()` | `setKeyed('dispatch')` holding one `{ pageOfObligation, collectsByPage, slugByPage, built }` record per set. **`buildDispatch(setId, pages)`** (it already resets its own state first — that reset now scopes to the set's record only). `isDispatchBuilt()`, `pageOfObligation(id)`, `collectsOf(pageId)`, `slugOfPage(pageId)` — signatures UNCHANGED. |
| 5 | `engine/persistence/records.js:10` | `let impl` + a delegating `records` facade | `setKeyed('records')`. **`configureRecords(setId, impl)`**. The `records` facade object is UNCHANGED in shape — each of its 11 methods delegates to `store.current().<op>(...)`. Every caller (`engine/journey.js`, controllers) untouched. |
| 6 | `engine/persistence/session.js:9` | `let impl` + a delegating `session` facade | `setKeyed('session')` holding `{ impl, cookieNames }`. **`configureSession(setId, impl, cookieNames)`**. The `session` facade is UNCHANGED in shape. |
| 7 | `services/persistence/records/notification-mapper/commodity-reference.js:1` | `let implementation` | `setKeyed('commodity reference')`. **`configureCommodityReference(setId, impl)`** — called only by the live-animals gateway (FD-5). Under plant-products the slot is simply absent and the L2 mapper is never invoked, so the "not configured" throw is unreachable rather than suppressed. |
| 8 | `engine/persistence/session.js:1-3` | `export let KNOWN_JOURNEYS_COOKIE / OPENING_RUN_COOKIE / FLOW_ONLY_ANSWERS_COOKIE` — **mutable exported bindings**, rewritten by `configureSession` | Become accessors **`knownJourneysCookie()` / `openingRunCookie()` / `flowOnlyAnswersCookie()`** reading the current set's `cookieNames`. Production consumers to edit: `engine/journey.js:5-7,12,26,30,34` (incl. its re-export), `services/persistence/session/real.js:2-4,11,16,21,33,42,59`, `services/persistence/session/stub.js:2-4,11,16,21,33,42,59`, `engine/test-support.js:2,59`. Test consumers to sweep: `one-load-per-request.test.js`, `engine/journey.test.js`, `engine/write/flow-only-session.test.js`, `services/persistence/session/session.test.js`, and five live-animals feature/flow specs (`cancel-amend`, `notification-actions`, `dashboard` controller + copy, `documents`, `flow/opening-run`). |
| 9 | `bridge/obligation-source.js:29,31-34,41-43,70` | four module-load consts (`SYSTEM_POPULATED`, `ENFORCED_AT_CONTINUE`, `MAX_ENTRIES_FROM`, `SYSTEM_ANSWER_KEYS`) | Become accessor FUNCTIONS derived from the current set's manifest `policy` (FD-7). **The reversal forces P-1 option (b): the "lazily-derived view keeping the same export names" option is DEAD**, because under co-residency the value differs per request, not per process. Full consumer list in §5 P-1. |
| 10 | `shared/paths.js:1` | `export const BASE = ''` | **DELETED** as an exported const; replaced by `setBase() = currentSetBase()` used inside the link builders. Value consumers to edit: `engine/journey.js:2,15` (row 11) and `sets/live-animals/journeys/linear/flow/entry-guard.js:1,13` (`const JOURNEY_PREFIX = \`${BASE}/notifications/\`` → `const journeyPrefix = () => \`${setBase()}/notifications/\``, called per request). Plus `sets/live-animals/journeys/linear/flow/opening-run.test.js:4,376`. |
| 11 | `engine/journey.js:14-23` | `cookieOptions` frozen at module load with `path: BASE \|\| '/'` | Built per set inside **`registerJourneyCookie(server, { base, cookieNames })`** — the gateway passes its own mount prefix and cookie names. Live-animals gets `path: '/'` (unchanged); plant-products gets `path: '/plant-products'`, which scopes its three cookies to its own subtree. |

### 4.3 The URL namespace (FD-4/FD-16)

**`shared/paths.js` splits into two families.**

*Route-shape builders* — evaluated at MODULE LOAD when controllers build their route
tables, therefore **prefix-free**; Hapi's plugin `routes.prefix` supplies the mount:

| Export | Returns | Used at |
|---|---|---|
| `pageRoutePath(slug)` | `/notifications/{journeyId}/${slug}` | `shared/kit.js:123,129` (`pageRoutes`) |
| `hubRoutePath()` | `/notifications/{journeyId}` | live-animals `features/hub/controller.js:169` |
| **`dashboardRoutePath()`** [NEW] | `/` | live-animals `features/dashboard/controller.js:114` (today calls `dashboardPath()`) |
| **`createRoutePath()`** [NEW] | `/notifications` | live-animals `features/dashboard/controller.js:126` (today calls `createPath()`) |

The two NEW exports exist because `dashboardPath()` and `createPath()` are currently
used BOTH as route paths (module load) and as links (request time) in the same file —
under a prefix those two uses must produce different strings. This is a two-line edit
in the live-animals dashboard controller. **REVISED (R7): it is no longer "the only
live-animals source change the URL work requires"** — that claim was true only while
live-animals sat at prefix `''`. The full live-animals change list is §4.6.

*Link builders* — evaluated per request, therefore **prefix-bearing** via
`setBase()`; every one of their ~55 call sites across `sets/`, `flow/navigation.js`
and `analysis/` is UNCHANGED:

`pagePath(journeyId, slug)`, `hubPath(journeyId)`, `dashboardPath()` (returns
`setBase()` — under R7 that is never `''`, so the `|| '/'` fallback the asymmetric plan
needed is gone), `createPath()`, `breadcrumbs(journeyId, title)`.

**The mount scheme (REWRITTEN — R7): `prefix = '/' + setId`.**

Every set mounts under a prefix derived mechanically from its set id. No set is
registered at prefix `''`, and `registerSetMount` is never called with an empty string.

Why this scheme and not the alternatives:

- **`/<setId>` (CHOSEN).** The set id is *already* the key for everything else in this
  design — `setKeyed()`, `withSetContext(setId, …)`, `enterSetContext(setId)`, the Hapi
  plugin name (FD-3), the cookie-name prefix (`liveAnimals*` / `plantProducts*`), the
  `sets/<setId>/` directory, the Nunjucks `TEMPLATES` root, the dep-cruiser path regexes,
  the npm scripts (`test:live-animals` / `test:plant-products`) and the Playwright project
  names. Making the mount prefix one more derivation of the same id means there is ONE
  fact per set and no mount table to keep in sync with the routes. It also reads as what
  the user is doing ("live animals", "plant products").
- **`/ched-a` and `/ched-pp` (rejected).** CHED type is a *certificate* type, not a set
  identity — a set can carry more than one CHED type later (the live-animals set already
  fronts a filter that could route to CHED-D). Pinning the URL to a certificate code
  would force a URL migration the first time that happens.
- **`/sets/<setId>` (rejected).** `sets/` is an internal source-tree layer name (L3/L4);
  leaking it into a public URL buys nothing and dates badly.
- **Asymmetric (`''` + `/plant-products`) — REVERSED by R7.** See FD-16.

**The mount table.**

| Set | Prefix | Dashboard | Create | Hub | Page |
|---|---|---|---|---|---|
| live-animals | `/live-animals` | `/live-animals` | `/live-animals/notifications` | `/live-animals/notifications/{journeyId}` | `/live-animals/notifications/{journeyId}/{slug}` |
| plant-products | `/plant-products` | `/plant-products` | `/plant-products/notifications` | `/plant-products/notifications/{journeyId}` | `/plant-products/notifications/{journeyId}/{slug}` |

Route shapes are declared prefix-free and identical for both sets (`/`,
`/notifications`, `/notifications/{journeyId}`, `/notifications/{journeyId}/{slug}`);
Hapi's `routes.prefix` supplies the mount. Hapi's prefixing rule handles the dashboard
cleanly: a route registered as `/` under prefix `/live-animals` is served at
`/live-animals` (no trailing slash).

**What is NOT prefixed** (server-wide, registered outside both gateways, never enters a
set context): `/health` (`src/server/router.js:16`), `/signout`
(`src/server/signout/index.js:14` — see FD-19, it must be HOISTED out of the array that
now carries a prefix), the static-asset route
(`src/server/common/helpers/serve-static-files.js:32`,
`${config.get('assetPath')}/{param*}`), the `/auth/*` OIDC routes, and the new `/`
redirect (FD-18).

**What happens to live-animals' existing URLs: THEY MOVE.** Every live-animals URL gains
the `/live-animals` prefix. This is a real migration and it is enumerated call site by
call site in **§4.6** (in-repo) and **§10** (tests repo). It is not a side effect to be
discovered during implementation — every item in those lists is planned work.

### 4.6 Migration blast radius — moving live-animals off the root (R7)

Enumerated so P-10 / pp-057 can be executed as a checklist rather than a hunt. Every
row was verified live this session at the file:line given. **In-repo** items land inside
pp-057 (they must, or the repo is red between increments); **tests-repo** items land in
pp-059 immediately after (a different repo cannot be atomic with the frontend anyway).

**A. Frontend production source**

| # | File:line | Today | After |
|---|---|---|---|
| 1 | `src/server/app/shared/paths.js:1` | `export const BASE = ''` | deleted; `setBase() = currentSetBase()` used inside the link builders (§4.2 row 10) |
| 2 | `src/server/app/shared/paths.js:10` | `dashboardPath = () => '/'` | `dashboardPath = () => setBase()` — under R7 `setBase()` is never `''`, so the `|| '/'` fallback that FD-16 needed is GONE |
| 3 | `src/server/app/shared/paths.js:3-9` | `pagePath`/`hubPath`/`createPath` interpolate `BASE` | interpolate `setBase()` per request; route-shape twins (`pageRoutePath`, `hubRoutePath`, new `dashboardRoutePath`, new `createRoutePath`) stay prefix-free |
| 4 | `src/server/app/engine/journey.js:14-23` | `cookieOptions` frozen at module load with `path: BASE \|\| '/'` | built per set inside `registerJourneyCookie(server, { base, cookieNames })`. **live-animals' journey cookie path CHANGES from `/` to `/live-animals`** — under FD-16 it did not. Existing browser sessions are invalidated; acceptable at this stage, but the increment must say so |
| 5 | `src/server/app/sets/live-animals/journeys/linear/flow/entry-guard.js:1,13` | `const JOURNEY_PREFIX = \`${BASE}/notifications/\`` (module load) | `const journeyPrefix = () => \`${setBase()}/notifications/\`` (per request) |
| 6 | `src/server/app/sets/live-animals/journeys/linear/flow/entry-guard.js:16,18` | `path.startsWith(JOURNEY_PREFIX)`, `path.slice(JOURNEY_PREFIX.length)` | **behavioural, not cosmetic.** `request.path` under a Hapi prefix INCLUDES the prefix. Today `BASE === ''` makes the guard's prefix and the request path agree by accident; once mounted, both the `startsWith` test and the `slice` length must use the prefixed `journeyPrefix()`. Getting this wrong silently disables the deep-link guard |
| 7 | `src/server/app/sets/live-animals/journeys/linear/flow/entry-guard.js:16` | `path === createPath()` | `createPath()` is now prefixed too — consistent, but pin it with a test |
| 8 | `src/server/app/sets/live-animals/journeys/linear/features/dashboard/controller.js:114,126` | route table calls `dashboardPath()` / `createPath()` (link builders) at module load | call the new prefix-free `dashboardRoutePath()` / `createRoutePath()`. Unchanged from the FD-16 plan; what changes is that the LINK builders now emit a different string from the ROUTE builders for BOTH sets, so a mix-up fails loudly on both (see the P-10 trap note) |
| 9 | `src/server/router.js:7` | `import { liveAnimals } from './app/routes.js'` | `import { liveAnimals, plantProducts } from './app/routes.js'` |
| 10 | `src/server/router.js:20-24` | `const routes = [liveAnimals]; if (authEnabled) routes.push(signout); await server.register(routes)` | **FD-19.** `await server.register(liveAnimals, { routes: { prefix: '/live-animals' } })`; `await server.register(plantProducts, { routes: { prefix: '/plant-products' } })`; `if (authEnabled) await server.register([signout])` as its own UNPREFIXED call |
| 11 | `src/server/router.js` (new) | — | the `/` → `/live-animals` 302 (FD-18), registered server-wide |
| 12 | `src/server/auth/controller.js:11,63,73,114,122` | `'/'` post-auth fallbacks, via `getSafeRedirect` | **NO EDIT** — the FD-18 redirect forwards them. This is a deliberate no-change and must be PROVEN, not assumed: an e2e leg that signs in with no stored `redirect` and lands on `/live-animals` |
| 13 | `src/server/common/helpers/serve-static-files.js:32` | `${config.get('assetPath')}/{param*}` | **NO EDIT** — registered in its own `server.register([serveStaticFiles])` (`router.js:29`), outside the prefixed calls. Assert it: a prefixed registration would silently move `/public/*` and every stylesheet would 404 |
| 14 | `src/server/signout/index.js:14` | `/signout` | **NO EDIT to the file** — but see row 10; the fix is in `router.js` |

**B. Frontend unit / controller tests asserting redirects or links**

| File:line | Value today | After |
|---|---|---|
| `sets/live-animals/.../features/dashboard/controller.test.js:403` | `expect(h.captured.redirect).toBe('/')` | `'/live-animals'` |
| `sets/live-animals/.../features/dashboard/controller.test.js:33` | `handlerOf('GET', '/')` | UNCHANGED (route shape, prefix-free) — verify, do not blanket-replace |
| `sets/live-animals/.../features/dashboard/copy/copy.test.js:56` | `route.path === '/'` | UNCHANGED (route shape) |
| `sets/live-animals/.../features/dashboard/notification-helper.test.js:64,75` | `buildPaginationLinks(page, '/', …)` | `'/live-animals'` (the argument is the emitted base path) |
| `sets/live-animals/.../features/delete-notification/controller.test.js:56,80,83` | `noHref: '/'`, `redirect: '/'` ×2 | `'/live-animals'` |
| `sets/live-animals/.../features/cancel-amend/controller.test.js:104` | `redirect: '/'` | `'/live-animals'` |
| `sets/live-animals/.../features/notification-actions/controller.test.js:132` | `expect(response.redirect).toBe('/')` | `'/live-animals'` |
| `sets/live-animals/.../features/hub/copy/copy.test.js:85,86` | `backLink` / `dashboardHref` `=== '/'` | `'/live-animals'` |
| `sets/live-animals/journeys/linear/flow/opening-run.test.js:4,376-377` | imports `BASE`; `guardedJourneyPath('/')` | import `setBase`; the guard cases become prefixed |
| `src/server/app/routes.test.js` | auth walk over `allRoutes` | route shapes are prefix-free → expected UNCHANGED; verify rather than assume |
| `src/server/common/helpers/content-security-policy.test.js:25` | `url: '/'` | UNCHANGED (server-wide route) |

**C. Frontend in-repo `*.e2e.spec.js` — the enumerated spec migration**

Three mechanical edits, applied file by file: `page.goto('/')` → `page.goto('/live-animals')`;
`form[action="/notifications"]` → `form[action="/live-animals/notifications"]`;
`toHaveURL('/')` / `toHaveAttribute('href', '/')` → `'/live-animals'`. Plus one
JUDGEMENT edit: the `/\/notifications\/[^/]+…/` regexes are unanchored at the front, so
they keep passing after the move **without proving anything about the prefix** — every
one must be re-anchored to `/^\/live-animals\/notifications\/…/`. That re-anchoring is
the actual proof of the migration; a spec left on the loose regex is a spec that would
also pass if the prefix were dropped.

Files and lines (all under `src/server/app/sets/live-animals/journeys/linear/`):

- `features/dashboard/dashboard.e2e.spec.js:26,43,50,56,79,122,159,167,186,208,234,255,279,282`
- `features/import-type-filter/import-type-filter.e2e.spec.js:7,9,41,67,85,99,110`
- `features/declaration/declaration.e2e.spec.js:11,13,18,87,124,126`
- `features/exit-date/exit-date.e2e.spec.js:7,9,14,28,129,167`
- `features/cph-number/cph-number.e2e.spec.js:7,9,14,20,101`
- `features/contact/contact.e2e.spec.js:8,10,15,57,95`
- `features/import-purpose/import-purpose.e2e.spec.js:9,11,16,26,90`
- `features/notification-actions/notification-actions.e2e.spec.js:18,40,62,70,86`
- `features/delete-notification/delete-notification.e2e.spec.js:16,34,37,47`
- `features/import-reason/import-reason.e2e.spec.js:9,11,16,81`
- `features/port-of-exit/port-of-exit.e2e.spec.js:8,10,15,81`
- `features/destination-country/destination-country.e2e.spec.js:8,10,15,74`
- `features/origin/origin.e2e.spec.js:11,13,19,199`
- `features/hub/hub.e2e.spec.js:54,57,61,102`
- `features/confirmation/confirmation.e2e.spec.js:37,92,96`
- `features/cancel-amend/cancel-amend.e2e.spec.js:26,55`
- `features/check-answers/check-answers.e2e.spec.js:100,111`
- `features/additional-details/additional-details.e2e.spec.js:142`

**D. Frontend repo-root E2E harness (`e2e/`) — missed by the round-2 plan**

- `e2e/live-animals-journey.js:11` — `new URL(page.url()).pathname.match(/\/notifications\/([^/]+)/)` (journey-id extraction; re-anchor).
- `e2e/live-animals-journey.js:17` — `` `${BASE}/notifications/${journeyIdFromPage(page)}…` `` — this file has its own `BASE`; it must become `/live-animals`.
- `e2e/live-animals-journey.js:76,88` — `page.goto('/')`, `page.goto(journeyUrl(page))`.
- `e2e/journey-smoke.spec.js:20,25,27,68,78,84` — `page.goto('/')` and `journeyUrl(...)` calls.
- `e2e/check-workspace-stack.js:14` — `fetch(\`${backendUrl}/notifications\`)` is the **BACKEND** API, not the frontend. **NO EDIT.** Called out explicitly so the sweep does not "helpfully" prefix it.
- `playwright.config.js:20-24` (`journeys` project `baseURL`), `:43-50` (`features` project `testDir`/`baseURL`), `:53-63` (`webServer`) — `baseURL` is host-only (`http://localhost:${port}`) and stays host-only; the prefix lives in the specs, not the base URL. **NO EDIT** to baseURL, and the increment must say why (a baseURL ending in `/live-animals` would break `/health`, `/signout` and `/public/*`).

**E. Tests repo** — see §10.4 for the same treatment with file:line detail.

### 4.4 File moves/creations (all at `src/server/app/` root unless stated)

1. **`shared/set-context.js`** [new, L2] — §4.1.
2. **`routes-live-animals.js`** [move] — the current `routes.js` body
   (`routes.js:1-77`, verified this session), with: the `withSetContext('live-animals', …)`
   wrapper, the `onPreAuth` context extension, `setId` added to the seven `configure*`
   / `buildDispatch` calls, `registerJourneyCookie(server, { base: '/live-animals', cookieNames: SESSION_COOKIE_NAMES })`,
   and `registerSetMount('live-animals', '/live-animals')`. Still exports `liveAnimals`.
   **REVISED (R7): this is no longer a no-op.** The gateway body is call-for-call
   identical to today, but live-animals' emitted URLs and its journey cookie `path` both
   move to `/live-animals` — the migration of §4.6 lands in the same increment.
3. **`routes-plant-products.js`** [new] — exports `plantProducts`, plugin name
   `'plant-products'` (FD-3). Register body mirrors `routes-live-animals.js`
   call-for-call — the ORDER IS LOAD-BEARING (context → mount → config → assertions →
   dispatch → persistence → cookies → guard → priming → routes):

   | # | Call | Argument plant-products passes |
   |---|---|---|
   | 0 | `registerSetMount('plant-products', '/plant-products')` then `server.ext('onPreAuth', …enterSetContext('plant-products')…)`, whole body inside `withSetContext('plant-products', …)` | FD-14/FD-15/FD-16 |
   | 1 | `configureObligationSet('plant-products', plantProductsObligationSet)` | `import * as plantProductsObligationSet from './sets/plant-products/obligations/index.js'` — namespace with `.obligations`, `.groups`, **`.policy`** (P-1) |
   | 2 | `configureFulfilmentRegistry('plant-products', featureEvaluationBindings)` | from `./sets/plant-products/journeys/linear/features/evaluation.js` |
   | 3 | *(no `configureCommodityReference` call — FD-5)* | its only consumer is the L2 live-animals mapper, never executed under this set; with per-set keying its slot is simply never filled |
   | 4 | `configureJourneyFlow('plant-products', { sections, taskRows, rowStatus, nextRunTarget, flowOnlyKeys: FLOW_ONLY_KEYS, entryGuardTarget, layout: LAYOUT })` | all from `./sets/plant-products/journeys/linear/flow/{flow,task-rows,run,entry-guard}.js` + `config.js` |
   | 5 | `assertObligationPurity()` | none — boot gate, reads the active context |
   | 6 | `assertFulfilmentBindingCoverage()` | none — boot gate, reads the active context |
   | 7 | `buildDispatch('plant-products', dispatchPages)` | from `./sets/plant-products/journeys/linear/features/index.js` |
   | 8 | `configureRecords('plant-products', records)` | `records` from `./sets/plant-products/services/records/index.js` — the SET-OWNED impl (FD-5) satisfying the engine port `{create, load, list, has, replaceFulfilment, finalise, amend, cancelAmend, copy, softDelete, clear}` (`engine/persistence/records.js`) |
   | 9 | `configureSession('plant-products', session, SESSION_COOKIE_NAMES)` | L2 `session` from `services/persistence/session/index.js` (set-agnostic, reused) + plant cookie names from the set's `config.js` |
   | 10 | `registerJourneyCookie(server, { base: '/plant-products', cookieNames: SESSION_COOKIE_NAMES })` | per-set cookie `path` (§4.2 row 11) |
   | 11 | `server.ext('onPreHandler', …)` entry-guard wrapper | as-is (wraps the injected `journeyEntryGuardTarget`); realm-scoped, so it never fires on live-animals routes |
   | 12 | *(no `countries.prime()` / `ports.prime()`)* | plant-products reference data is fixture-backed (`services/reference/*`), nothing to prime; the L2 primed caches are live-animals-mode machinery |
   | 13 | `server.route(allRoutes)` | from the set's `features/index.js` — paths are prefix-free; the prefix comes from the registration in step 5 below |

4. **`routes.js`** [rewrite → barrel] (FD-2):

   ```js
   export { liveAnimals } from './routes-live-animals.js'
   export { plantProducts } from './routes-plant-products.js'
   ```

5. **`src/server/router.js:7,20-26`** [edit] — **REWRITTEN (R7/FD-18/FD-19).** Import
   both; register each set under its OWN prefix in its OWN call; hoist `signout` out of
   the prefixed array; add the root redirect:

   ```js
   import { liveAnimals, plantProducts } from './app/routes.js'
   ...
   await server.register(liveAnimals, { routes: { prefix: '/live-animals' } })
   await server.register(plantProducts, { routes: { prefix: '/plant-products' } })

   if (authEnabled) {
     await server.register([signout])          // FD-19 — MUST stay unprefixed
   }

   server.route({
     method: 'GET',
     path: '/',
     handler: (_request, h) => h.redirect(DEFAULT_SET_BASE)   // '/live-animals', 302
   })
   ```

   Three things are load-bearing here and each needs its own assertion in P-3:
   (a) one `register` call per set, because `routes.prefix` applies to the whole call;
   (b) `signout` is no longer in the same array as a set gateway (FD-19) — otherwise
   `/signout` silently becomes `/live-animals/signout`;
   (c) the `/` route is declared with `server.route`, not inside a gateway, so it never
   enters a set context and never appears in either set's `allRoutes`.
   `DEFAULT_SET_BASE` is a single named constant in `router.js` (or `config`), not a
   literal repeated anywhere — changing the default set must be a one-line edit.

### 4.5 Acceptance for §4

- **One process, both sets.** A single booted server serves `/live-animals` (live-animals
  dashboard) and `/plant-products` (plant dashboard) in the same run — proven by the
  co-residency test of §5 P-3, not by two separate boots.
- **REVISED (R7): live-animals is MIGRATED, not untouched.** The old bar ("green with NO
  spec edits for URL changes") is retired — it is now the wrong bar, because zero spec
  edits would mean the mount did nothing. The replacement bar: every call site
  enumerated in §4.6 A–D has been updated, the full existing ladder (`npm test`,
  `npm run test:live-animals`, `npm run test:features`, `test:e2e`) is green AFTER those
  edits, and `grep -rn "goto('/')\|toHaveURL('/')\|action=\"/notifications\"" src/server e2e`
  returns nothing. No new env vars anywhere in CI.
- **Symmetry check.** No entry of the `shared/set-context.js` mount registry has an
  empty or non-`'/' + setId` prefix (P-11 asserts this mechanically); every set's
  dashboard, create, hub and page URL begins with its own `/<setId>` segment; the two
  sets' route SHAPES are byte-identical to each other.
- `/` returns a 302 to `/live-animals` (FD-18). `/health`, `/signout` and the static
  asset route are reachable at their unprefixed paths with a set registered (FD-19).
- Sign-in with no stored `redirect` lands on `/live-animals`, with no edit to
  `src/server/auth/controller.js`.
- Every plant page renders under `/plant-products/…` and every live-animals page under
  `/live-animals/…`; neither set ever emits the other's prefix, and neither ever emits
  a bare `/notifications/…`.
- Cookies: `liveAnimals*` at path `/live-animals`, `plantProducts*` at path
  `/plant-products`; a journey started in one set is invisible to the other. Note the
  live-animals cookie path CHANGES (was `/`), invalidating existing browser sessions —
  acceptable at this stage, but stated in the increment rather than discovered.
- Realm scoping and ALS interleaving are pinned by tests (§4.1 risks 1 and 2).
- No `SERVED_SET` (or any other served-set env var) exists anywhere in the repo —
  grep-verified.

---

## 5. Platform work items (each L2/L1 leak from recon §7 → concrete change)

Every item names files, the change, and an acceptance check. These are m0-family
increments; P-1..P-5 and P-9..P-11 are prerequisites for the first plant page (m2).

**Two-sided verification rule (REVISED — R3).** It is no longer "the new set works
under its env AND the old set works under the default env". Under co-residency it is:
**both sets must serve correctly FROM THE SAME RUNNING PROCESS.** Every
platform-touching increment (P-1..P-6, P-9..P-11) proves this the same way — via the
**co-residency suite** introduced by P-3:

> `src/server/app/co-residency.test.js` — boots ONE Hapi server, registers BOTH
> gateways, each under its own prefix (`{ routes: { prefix: '/live-animals' } }` and
> `{ routes: { prefix: '/plant-products' } }` — R7), then in a single
> test file: injects `GET /live-animals` and asserts live-animals dashboard content;
> injects `GET /plant-products` and asserts plant content that CANNOT render under
> live-animals; injects `GET /` and asserts a 302 to `/live-animals` (FD-18); injects
> `GET /signout` and the static-asset path and asserts both resolve UNPREFIXED (FD-19);
> injects a page from each set and asserts each resolved its OWN
> manifest, journey flow, records impl and cookie names; and runs one interleaved
> pair (both in flight at once, the first awaiting inside its handler) to prove the
> ALS context did not bleed. This one file is the standing evidence that co-residency
> holds; every platform increment must leave it green and extend it when it adds a
> seam.

The old per-set-boot checks remain as cheap smoke tests but are no longer sufficient
on their own.

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
- **Export-shape constraint — DECIDED BY THE REVERSAL (R3).** The round-1 plan
  offered (a) same export names as lazily-derived one-shot views, or (b) accessor
  functions, and preferred (a). **(a) is now dead.** A lazily-derived view resolves
  ONCE per process; under co-residency the correct value differs per REQUEST, so a
  cached view would serve live-animals' `ENFORCED_AT_CONTINUE` to a plant request.
  P-1 therefore takes **(b): accessor functions** —
  `systemPopulated()`, `enforcedAtContinue()`, `maxEntriesFrom()`,
  `systemAnswerKeys()`, each deriving from `obligationSet().policy` (empty-safe
  defaults) on every call. EVERY file in the consumer list above is in scope of the
  increment; there is no smaller option. `flow/dispatch.js:3,77` (`SYSTEM_POPULATED.has(...)`)
  and `sets/live-animals/journeys/linear/flow/entry-guard.js` are the two that must
  be edited most carefully — the first runs at boot inside `buildDispatch`, the
  second per request.
- Acceptance addition: `grep -rn 'SYSTEM_POPULATED\|ENFORCED_AT_CONTINUE\|MAX_ENTRIES_FROM\|SYSTEM_ANSWER_KEYS' src/server/app`
  after the change returns NOTHING — the SCREAMING_SNAKE const names are gone
  entirely, replaced by the four accessors. No stragglers on the old shape.
- Acceptance: zero obligation-name literals remain in `bridge/obligation-source.js`
  (grep); full live-animals suite green unchanged (`npm test`); a unit test proves a
  manifest with a different `policy` changes the derived sets; **and the co-residency
  suite proves the two sets read DIFFERENT `enforcedAtContinue` values in the same
  process** (this is the assertion the old plan could not write).

**P-2 — Records mapper containment (live-animals-shaped L2 mapper)** (FD-5)
- Files: none in L2 change for plant-products; new
  `sets/plant-products/services/records/**` (§1, §6.2). The leak —
  `services/persistence/records/notification-mapper/` maps the live-animals answer
  tree (recon §7.4) — is CONTAINED, not migrated: it remains the live-animals impl,
  injected only by `routes-live-animals.js`.
- Acceptance: `routes-plant-products.js` imports nothing under
  `services/persistence/records/`; `configureCommodityReference` never called on the
  plant path — and under per-set keying (§4.2 row 7) its plant slot is provably
  ABSENT, not overwritten, so a plant request that somehow reached the L2 mapper
  would throw loudly rather than silently map with live-animals vocabulary. Add that
  as a negative test. dep-cruiser clean; a follow-up note (docs/README.md) records the
  future option of retiring the L2 mapper into `sets/live-animals/services/`.

**P-3 — Both gateways register in one process** (REVISED from "gateway split +
`SERVED_SET` selector" — R3; §4.4, §4.1)
- Files: `routes.js` (→ two-line barrel, FD-2), new `routes-live-animals.js` (moved
  body + context wrapper + mount registration + `setId` args), new
  `routes-plant-products.js`, `src/server/router.js:7,20-26` (register EACH set under
  its own prefix, hoist `signout`, add the `/` redirect — §4.4.5), new
  `src/server/app/co-residency.test.js`.
- Change: no served-set env var exists; `router.js` registers live-animals under
  `/live-animals` and plant-products under `/plant-products` (R7 — the round-2 wording
  "registers live-animals exactly as today" is retired). Each gateway wraps its register
  body in `withSetContext(SET_ID, …)` and installs the realm-scoped `onPreAuth` context
  entry (§4.1).
- Acceptance: all of §4.5. Specifically — the co-residency suite is green; a request
  to a plant route does NOT run the live-animals entry guard (realm-scoping pin); two
  interleaved cross-set requests each resolve their own set (ALS pin); `routes.test.js`
  still passes for live-animals (route SHAPES are prefix-free, so this suite is expected
  unchanged — verify, do not assume); `grep -rn 'SERVED_SET' .` is empty.
- **Added by R7** — three assertions that only exist because no set owns the root:
  `GET /` 302s to `/live-animals` (FD-18); `GET /signout` resolves (FD-19 — this fails
  loudly if `signout` was left in the prefixed array); `GET ${assetPath}/…` resolves.
- Depends on: P-9 (the seams must be keyed before two sets can be registered) and
  P-10 (URLs must be namespaced before two sets can both claim `/notifications/…`).
  P-3 is the increment that PROVES the pair, so it lands immediately after them.

**P-4 — Dependency-cruiser gateway + sets-not-l1 updates**
- Files: `.dependency-cruiser.cjs:31` (`routes-is-the-gateway` `pathNot` gains
  `^${APP}/routes-live-animals\.js$` and `^${APP}/routes-plant-products\.js$` —
  verified the current allowlist is exactly `[^app/sets/, ^app/routes\.js$,
  .test.js]`); the `sets-not-l1` rule's forbidden-target list gains the two new
  gateway files (sets must not import ANY routes-*.js).
- **Restated for R3:** `routes.js` becomes a pure barrel (FD-2) and therefore no
  longer imports `sets/**` itself — but it stays on the `routes-is-the-gateway`
  `pathNot` list, because removing it would be a semantic change unrelated to this
  work. Both real gateway files join it. The `sets-not-l1` forbidden-target regex
  `^${APP}/(routes|obligation-purity)\.js$` widens to
  `^${APP}/(routes|routes-live-animals|routes-plant-products|obligation-purity)\.js$`.
  `shared/set-context.js` needs NO rule change — it is ordinary L2 that imports
  nothing under `sets/`.
- Acceptance: `npm run lint:arch` green with the new files in place; a deliberate
  probe import (set → any gateway) fails the rule; `.dependency-cruiser-known-violations.json`
  NOT regenerated to absorb anything (baseline discipline).

**P-5 — App-root convention tests generalised/cloned** (FD-10 — detail in §7)
- Files: `copy-convention.test.js:10`, `copy-parity.test.js:16-53` (parameterise
  in-file over both set roots); `contract.test.js:19-39,65`, `routes.test.js:3`,
  `indexed.test.js:9-12`, `store-ops.test.js:16`, `one-load-per-request.test.js`
  (clone per set as `*.plant-products.test.js` composing the plant set —
  `routes.test.js:3` hardcoding verified live this session; `one-load-per-request`
  confirmed NOT set-hardcoded by grep, so it needs only a clone IF it composes a set
  at runtime — cloner verifies).
- **Revised by R3:** each cloned file composes exactly ONE set, so FD-17's sole-set
  fallback means the clones need no `withSetContext` plumbing — they read as the
  live-animals originals with the set swapped. The one file that DOES need explicit
  context is the new `co-residency.test.js` (P-3), which is not a clone.
- Acceptance: for each cloned suite, the plant variant runs green against the m0
  skeleton; live-animals variants unchanged; test COUNT for existing suites does not
  drop (recipe §8 tripwire).

**P-6 — Boot-mode knobs audit**
- Files: `routes-plant-products.js` step 12 (no priming); `services/mode.js`
  untouched (live-animals'). New `sets/plant-products/services/mode.js` (FD-6).
- Acceptance: `PLANT_PRODUCTS_MODE=stub` boots the plant set on the in-memory records
  stub (Playwright self-host mode) **while live-animals in the SAME process continues
  to honour `LIVE_ANIMALS_MODE` independently** — the co-residency suite asserts one
  set on a stub and the other on a fake real client simultaneously; `real` targets the
  Phase-B backend. Also: `isRealMode()` priming (`countries.prime()`/`ports.prime()`)
  runs once, on the live-animals gateway only, and is not re-triggered by the plant
  registration.

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

**P-9 — NEW (R3): set-context module + key every `configure*` seam by set** (FD-14,
FD-15, FD-17; §4.1, §4.2)
- Files: new L2 `shared/set-context.js`; then rows 1–8 of the §4.2 table —
  `model/obligations/manifest.js`, `bridge/fulfilment-registry.js`,
  `flow/journey-flow.js`, `flow/dispatch.js`, `engine/persistence/records.js`,
  `engine/persistence/session.js` (incl. the three exported mutable cookie-name
  bindings → accessors), `services/persistence/records/notification-mapper/commodity-reference.js`;
  plus the cookie-name consumer sweep enumerated in §4.2 row 8 (`engine/journey.js`,
  `services/persistence/session/{real,stub}.js`, `engine/test-support.js`, and nine
  test files).
- Change: each seam swaps its module-level single slot for `setKeyed(label)`; each
  `configure*`/`buildDispatch` takes `setId` first; every read accessor keeps its
  signature. Nothing outside the seam modules and the row-8 sweep changes.
- **This is the single largest platform increment in the programme** and it is the
  one Sam's ruling says the architecture was designed to make possible. It lands
  BEFORE either gateway is rewritten, with live-animals still the only registered set
  — FD-17's sole-set fallback means the ENTIRE existing suite must stay green with
  zero test edits beyond the mechanical cookie-accessor rename. That is the acceptance
  bar: if a test needs a behavioural change, the keying is wrong.
- Acceptance: `npm test` + `npm run test:live-animals` + `npm run test:features` +
  `test:e2e` green with only mechanical edits; `npm run lint:arch` green (no new
  dep-cruiser rule needed — `shared/set-context.js` imports nothing under `sets/`);
  a unit test per seam proving two different `setId`s hold two different values
  simultaneously and that `currentSetId()` throws when two sets are mounted with no
  active context.

**P-10 — REWRITTEN (R7): symmetric per-set URL namespace + the live-animals URL
migration** (FD-4, FD-16, FD-18, FD-19; §4.3, §4.6)

This is no longer a no-op dressed as a platform change. It is a **URL migration**, and
it is ATOMIC — it cannot be split, because the moment live-animals is registered under
a prefix, every unmigrated call site is broken. All of §4.6 A–D lands in this one
increment (pp-057); the tests-repo half lands in pp-059 immediately after (§10).

- Files — platform: `shared/paths.js` (delete `BASE`; add `setBase()`; split route-shape
  vs link builders; add `dashboardRoutePath()` and `createRoutePath()`); `engine/journey.js:2,14-23`
  (`cookieOptions` → per set inside `registerJourneyCookie(server, { base, cookieNames })`);
  `src/server/router.js:7,20-26` (per-set prefixed registers, `signout` hoisted, the `/`
  redirect — §4.4.5).
- Files — live-animals set: `features/dashboard/controller.js:114,126`;
  `flow/entry-guard.js:1,13,16,18` (the `startsWith`/`slice` pair is BEHAVIOURAL —
  §4.6 A row 6).
- Files — tests: the 11 unit/controller/copy files of §4.6 B, the 18 `*.e2e.spec.js`
  files of §4.6 C, and the `e2e/` harness of §4.6 D.
- Change: as §4.3. **Both** sets mount under `/<setId>`; no set is at `''`.
- **Acceptance — REPLACED. The old bar was "EVERY existing URL assertion in the repo
  passes unchanged (no spec edits)". That bar is now WRONG**: under symmetric mounts,
  an unchanged assertion is either an assertion that never proved anything about the
  prefix, or a bug. The new bar is an explicit migration proven by UPDATED assertions:
  1. Every call site in §4.6 A–D is updated (checklist, ticked file by file).
  2. `grep -rn "goto('/')\|toHaveURL('/')\|action=\"/notifications\"\|'/notifications/" src/server e2e`
     returns nothing outside the deliberate exclusions (§4.6 D `check-workspace-stack.js`,
     which is the backend API).
  3. Every migrated regex is **front-anchored** on the set prefix
     (`/^\/live-animals\/notifications\//`). A spec still matching the loose
     `/\/notifications\/[^/]+/` is a spec that would pass with the prefix dropped, and
     counts as unmigrated.
  4. A unit test proves `pagePath()` returns `/live-animals/…` under a live-animals
     context and `/plant-products/…` under a plant context IN THE SAME PROCESS.
  5. Route-shape builders proven prefix-free: `pageRoutePath('x')` has no leading set
     segment, and `dashboardRoutePath()` is exactly `/`.
  6. `/` 302s to `/live-animals`; `/health`, `/signout` and `${assetPath}/{param*}`
     resolve unprefixed (FD-18/FD-19).
  7. The journey cookie `path` is `/live-animals` for live-animals and
     `/plant-products` for plant-products.
  8. Full ladder green AFTER the edits: `npm test`, `npm run test:live-animals`,
     `npm run test:features`, `test:e2e`.
- **The trap this REMOVES — and it is the strongest argument for R7.** Under the
  asymmetric plan, live-animals sat at prefix `''`, which means a *doubled* prefix
  (`setBase()` used where a route shape was wanted) and a *dropped* prefix (a route
  shape used where a link was wanted) both produced the SAME correct-looking string for
  live-animals — `'' + '/notifications'` is `/notifications` either way. The bug would
  only ever surface on the plant side, in code the live-animals suite never exercises,
  and the "every live-animals assertion passes unedited" bar would actively certify it
  as fine. With neither set at `''`, both mistakes fail visibly for BOTH sets on the
  first request. Symmetric mounts are strictly safer here, not merely tidier.
- Depends on: P-9 (`setBase()` reads `currentSetBase()`).
- Followed by: pp-059 (§10) — the tests repo must be migrated in the same branch.

**P-11 — NEW (R3): sibling-safety guard rails against re-singletoning**
- Files: new convention test `src/server/app/no-set-singletons.test.js`. (No
  dep-cruiser rule — the constraint is about a function's parameter shape, which
  dep-cruiser cannot express.)
- Change: a cheap, mechanical tripwire so a future increment cannot quietly
  reintroduce a single-slot seam. The convention test walks the L2 dirs (`model/`,
  `bridge/`, `flow/`, `engine/`, `services/`) and fails any file that exports a
  `configure*` function whose first parameter is not named `setId`. Allow-list is
  empty by design. (Dep-cruiser cannot express this; the fs-walk convention test is
  the same pattern `copy-convention.test.js` already uses, so it is idiomatic here.)
- **Added by R7 — the symmetry tripwire.** The same file also asserts that **no set is
  mounted at prefix `''`**: with both gateways registered, every entry of the mount
  registry has a prefix matching `/^\/[a-z][a-z0-9-]*$/` and equal to `'/' + setId`.
  This is what stops a later increment quietly reinstating the asymmetry FD-16 reversed,
  and it is what keeps the doubled/dropped-prefix bug class visible (see the P-10 trap
  note).
- Acceptance: the test is red if `setId` is dropped from any seam, red if any set is
  registered at `''` or at a prefix that is not `'/' + setId`, and green on the
  P-9/P-10 output; documented in `docs/add-a-set.md` (G-A steps 1 and 4) so the next
  set's author meets both rules before they write the gateway.

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
| `copy` | `POST …/{ref}/copies` with an **`Idempotency-Key` header** (201; new DRAFT, new ref, documentless — D-19). **R4:** the engine port already carries the key — `engine/journey.js:125` `copyJourney(request, h, journeyId, idempotencyKey)` — so the frontend side is a straight transposition of live-animals: a `randomUUID()` minted per RENDERED copy action (live-animals does this in `features/dashboard/view-model/row/actions.js` and `features/check-answers/controller.js`), carried in a hidden input named `idempotencyKey`, and sent as the `Idempotency-Key` header by the set's `records/real.js` (live-animals equivalent: `services/persistence/records/real/lifecycle/create.js`). `stub.js` mirrors it with a dedupe key. Records-port contract tests pin "one new draft per idempotency key" and "copy idempotency scoped to the source reference". **NOTE the transposition:** live-animals implements idempotency on the FULFILMENT resource; the plant-products design puts `/copies` on the NOTIFICATION resource — transpose the pattern, not the code. This must be in place BEFORE the Copy button ships (m5 inc-039). |
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
- **T-6 per-set Playwright feature project** (REVISED for co-residency — R3). Two
  corrections carry over from round 1: the `features` project is ALREADY
  live-animals-scoped via
  `testDir: './src/server/app/sets/live-animals/journeys/linear/features'`
  (`playwright.config.js:43-45`), so no change to it. **What the reversal changes is
  the project/env story: there is now ONE server serving BOTH sets, so the plant
  project is not a different SERVER, only a different `testDir` and `baseURL`
  path-space.** The webServer env-pass-through problem simply disappears — there is
  no `SERVED_SET` to smuggle through. The work:
  1. NEW Playwright project in `playwright.config.js`: name
     `features-plant-products`, `testDir:
     './src/server/app/sets/plant-products/journeys/linear/features'`,
     `testMatch: '**/*.e2e.spec.js'`, same `use` block as `features`. Plant specs
     navigate to `/plant-products/…`. **REVISED (R7): live-animals specs do NOT keep
     navigating to `/…`** — all 18 of them move to `/live-animals/…` under P-10/pp-057
     (§4.6 C). By the time this project is added, both sets' specs are prefixed and
     symmetric, which is what makes one shared `webServer` and one `baseURL` work for
     both. `baseURL` stays host-only for both projects; the prefix lives in the specs.
  2. NEW npm script `"test:features:plant-products"` =
     `PLANT_PRODUCTS_MODE=stub playwright test --project=features-plant-products`.
     `PLANT_PRODUCTS_MODE` is the ONLY new env var, and it selects the plant records
     stub — it does not select a set.
  3. **Shared `webServer` block (`playwright.config.js:54-63`) needs one edit, not
     three:** add `PLANT_PRODUCTS_MODE: 'stub'` alongside the existing
     `LIVE_ANIMALS_MODE: 'stub'`. Both sets then run on their stubs in the
     self-hosted server, and the two projects can share one server process.
     `reuseExistingServer: false` stays.
  4. **Because one server now serves both, the two projects CAN be run in the same
     Playwright invocation.** Add `"test:features:all"` = `playwright test --project=features --project=features-plant-products`
     as the co-residency E2E proof: one webServer, specs from both sets, all green.
     This is the E2E-level counterpart to `co-residency.test.js`.
  Same treatment for `test:e2e` when the whole-journey plant suite exists (m4).
  Acceptance: m0's `import-type.e2e.spec.js` + `hub.e2e.spec.js` + dashboard spec
  pass under the new script, each asserting plant-set content that CANNOT render
  under live-animals; existing `test:features` untouched and green; and
  `test:features:all` green in a single run against a single server.
- **T-7 set-owned structural suites** — `obligations/coverage.test.js` (m0, empty-safe)
  and `obligations/whitelists.test.js` (m3, pins `varietyClass` + `inspectionPremises`
  allowlists against the set services with a control value).
- **T-8 depth-3 characterisation test** — P-7 (platform-level, m0 gate for m3).
- **T-9 NEW (R3): the co-residency suite** — `src/server/app/co-residency.test.js`,
  created by P-3, extended by every later platform increment. Contents specified in
  §5's two-sided verification rule. This is the ONE test that can fail for
  "co-residency broke" and nothing else, so it must never be folded into another file.
- **T-10 NEW (R3): the re-singletoning tripwire** — `src/server/app/no-set-singletons.test.js`,
  P-11. **Extended by R7** to also assert no set is mounted at `''` and every prefix is
  `'/' + setId`.
- **T-11 NEW (R7/R8): the cross-repo E2E suite in `repos/trade-imports-animals-tests`.**
  Everything above is IN-repo (frontend) testing. The workspace's real end-to-end suite
  lives in a different repo and was absent from this plan entirely — see **§10**, which
  owns its branch prerequisite, its URL migration, and the plant-products coverage it
  must gain. Nothing in §7 substitutes for it: the in-repo `*.e2e.spec.js` specs run
  against a self-hosted stub server, whereas the tests repo runs against the real
  workspace stack with the real backend, Mongo and OIDC.
- **Plant verification ladder** (Phase D increments cite this): baseline
  `npm run test:plant-products` BEFORE editing → after: `test:plant-products`,
  `npm test`, `npm run lint`, `PORT=3050 npm run test:features:plant-products`
  (+ `test:e2e` split when it exists), `npm run format` before commit.
  **PLUS the sibling-safety check, REVISED (R3):** on every platform-touching
  increment (P-1..P-6, P-9..P-11) also run `npm run test:live-animals`,
  `npm run test:features` and `npm run test:features:all`, and leave
  `co-residency.test.js` green. The bar is no longer "the other set still boots on
  its own env" — it is "**both sets serve correctly from the same running process**".

---

## 8. GAPS — where no existing recipe covers the work

The recipe corpus (`sets/live-animals/docs/` + the `frontend-change` skill) covers
add-a-field / add-a-page / add-a-section / add-a-collection / obligation maintenance /
flow maintenance — all INSIDE an existing, booted set. Phase D planners citing a
recipe for those shapes are covered. The following have NO recipe; each lists what a
recipe would need to specify (Phase D must treat these as first-class plan content,
not recipe-verbatim steps):

**G-A — No "add a set" recipe. REVISED (R6): the recipe is now written FIRST.**

Round 1 said "this plan IS the recipe; extracting `docs/add-a-set.md` afterwards is a
recommended m4+ chore". Sam's ruling R6 reverses that ordering. **`docs/add-a-set.md`
is authored BEFORE the m0 scaffold, and the m0 scaffold increments then FOLLOW it —
recipe-verbatim, exactly as `add-a-field.md` / `add-a-page.md` / `add-a-collection.md`
are followed by the `frontend-change` skill.** Writing the recipe first is what closes
the gap; extracting it afterwards would only document whatever happened to be built.

Location: `src/server/app/sets/live-animals/docs/add-a-set.md` is WRONG — a set-level
doc cannot own a cross-set procedure. It goes at **`src/server/app/docs/add-a-set.md`**,
alongside `architecture.md`, as an L1/platform-level recipe. The plant-products
increments cite it by heading; the recipe cites THIS plan for the CHED-PP specifics.

Required contents (the 10-step list stands, restated for co-residency):
1. Choose the set name; the **mount prefix is then not a choice — it is `'/' + setId`**
   (FD-16 as reversed by R7). State the co-residency contract — every gateway registers
   in one process, every seam is keyed by set id, the request resolves its set from the
   owning plugin realm (FD-1/FD-14/FD-15). State the symmetry rule plainly: **no set
   owns `/`**; `/` is a server-wide 302 to the default set (FD-18); `/health`,
   `/signout`, `/auth/*` and the static-asset route are server-wide and must NEVER be
   inside a prefixed `server.register` call (FD-19). The round-1 wording "the incumbent
   set keeps the root, a new set takes a prefix" is RETIRED and must not appear.
2. Create the L3 skeleton: `obligations/index.js` with empty `obligations`, the
   derived-`groups` formula verbatim, and the `policy` export shape (P-1).
3. Create the L4 skeleton: `config.js` (TEMPLATES prefix, unprefixed LAYOUT, three
   set-prefixed cookie names — load-bearing under co-residency, FD-3),
   `flow/{flow,task-rows,run,entry-guard}.js` minimal exports,
   `features/{index,evaluation}.js` empty registries — naming exactly which exports
   each file must have for `configureJourneyFlow`/`buildDispatch` to accept them
   (§1 m0 list).
4. Write the L1 gateway: the call table of §4.4.3 with the load-bearing order,
   `setId` as the first argument of every `configure*`/`buildDispatch`, the
   `withSetContext` wrapper, the `onPreAuth` context entry, `registerSetMount`, the
   per-set `registerJourneyCookie(server, { base, cookieNames })`; which seams are
   optional (`configureCommodityReference`) and when priming applies. Point at the
   P-11 tripwire so the author meets the `setId`-first rule before writing the file.
5. Add it to the `routes.js` barrel and register it in `src/server/router.js` with
   `{ routes: { prefix } }` (§4.4.4-5).
6. Edit dep-cruiser (gateway whitelist + `sets-not-l1`) WITHOUT touching the
   violations baseline (P-4).
7. Add the set-scoped Vitest script, the per-set Playwright project, the cloned
   app-root suites, the empty contract table, and a new case in
   `co-residency.test.js` (T-1..T-6, T-9). **Then cross the repo boundary (R8):** add
   the set to `repos/trade-imports-animals-tests` — a per-set page-object tree, a per-set
   flow, and a Playwright project selecting it (§10). A set with no cross-repo E2E
   coverage is not done.
8. Stand up set services: mode switch, records adapter against the set's backend
   surface (port-op → HTTP table like §6.2, incl. the `Idempotency-Key` contract for
   `copy`), reference fixtures.
9. Minimal surfaces to be usable: dashboard, hub (+ GROUPS), entry filter,
   entry-guard policy.
10. **The two-sided verification ladder, co-residency form: every set already in the
    tree AND the new set must serve correctly from ONE running process** — the
    co-residency suite plus `test:features:all` (§7 last bullet). The old
    "new set green AND default set unchanged under its own env" wording is retired.

Sequencing consequence: authoring `docs/add-a-set.md` is the FIRST m0 increment, and
it lands after P-9/P-10 (so it can describe the seams as they actually are) but before
any `sets/plant-products/` file exists. See §9.

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

**G-J — NEW (R7). No URL-migration procedure.** The recipe corpus has nothing about
moving a live service's URLs. Round 2 did not need one because FD-16 avoided the
migration; R7 requires it. What a recipe would need to specify: how to tell a ROUTE
shape from a LINK (the only distinction that matters, and the one `dashboardPath()` /
`createPath()` currently blur by serving both roles in
`features/dashboard/controller.js:114,126`); the front-anchoring rule for URL regexes
in specs (a suffix-anchored regex survives the migration while proving nothing); which
routes are server-wide and must be hoisted out of a prefixed `server.register`
(FD-19 — the `/signout` trap); the cookie-`path` consequence; and the cross-repo order
(frontend first, tests repo in the same branch, §10.1). **§4.6 IS that procedure for
this migration** — pp-057 follows it as a checklist. Extracting a general
`docs/moving-a-set-mount.md` is NOT planned tonight; flagged so nobody expects one.

**G-K — NEW (R8). No cross-repo E2E authoring recipe.** Every recipe in the corpus
stops at the frontend repo boundary. Adding a set's coverage to
`repos/trade-imports-animals-tests` — page objects, flows, fixtures, API seeds,
Playwright projects, the cross-repo branch rule — has no recipe at all. §10 is the
plan-level substitute; a `-tests` repo recipe is a candidate chore once the plant tree
exists and its shape has been proven by use, not before.

---

## 9. Increment-order constraints handed to Phase D

**REVISED (R3/R6), AMENDED (R7/R8).** The order has a distinct **platform phase that
lands entirely against live-animals-only**, before any `sets/plant-products/` file is
created. That is deliberate: most platform increments are then verifiable by "the
existing suite is green with no behavioural test edits", which is a far sharper signal
than "the new set also works".

**R7 carves out ONE exception, and it must be stated rather than left to bite.** P-10 /
pp-057 is a URL migration, so "green with no test edits" is precisely the WRONG signal
for it — no edits would mean the mount did nothing. pp-057's signal is instead "green
after the enumerated §4.6 edits, with every URL regex front-anchored on the set prefix".
Every other platform increment keeps the original bar.

**R8 adds a second repo to the sequence.** `repos/trade-imports-animals-tests` is now
in the plan (§10), on the same branch name (`spike/trace-to-requirements`, which must be
CUT there first — that repo is currently on `spike/EUDPA-288-model-retrofit`). Its
migration increment (pp-059) is pinned immediately after pp-057, and its plant-products
coverage increments trail the frontend milestones they cover (§10.6).

**Phase m0-a — platform, live-animals only, no plant files yet:**

1. **P-9** — `shared/set-context.js` + key all seven `configure*` seams by set +
   the cookie-name accessor sweep. Sole registered set = live-animals, so FD-17's
   fallback keeps the whole suite green with only mechanical edits.
2. **P-1** — obligation-source policy onto the manifest, as accessor FUNCTIONS
   (option (b), forced by P-9). Depends on P-9 for `obligationSet()` being per-set.
3. **P-10 (pp-057) — REWRITTEN (R7).** Symmetric per-set URL namespace in
   `shared/paths.js` + the route-shape/link builder split + per-set cookie `path` +
   `router.js` per-set prefixed registers + the `/` redirect (FD-18) + the `signout`
   hoist (FD-19) + **the full enumerated live-animals URL migration of §4.6 A–D**.
   live-animals mounts at `/live-animals`, NOT `''`. Atomic — cannot be split without
   leaving the repo red. The old bar ("every existing URL assertion must pass unedited")
   is retired.
3a. **pp-059 (tests repo) — NEW (R7/R8).** Cut `spike/trace-to-requirements` in
   `repos/trade-imports-animals-tests`, then migrate its URL layer to `/live-animals`
   (§10.4). Pinned to land immediately after pp-057 and before anything else in that
   repo — between the two, the workspace E2E suite is red, and that window must be as
   short as possible.
4. **P-11** — the `setId`-first convention test (tripwire), so nothing after this
   point can re-singleton a seam. **R7 extends it** to assert no set is mounted at `''`
   and every prefix is `'/' + setId`, so nothing after this point can reinstate the
   asymmetry either.
5. **P-4** — dep-cruiser gateway whitelist + `sets-not-l1` widening (needs the new
   gateway filenames to exist as targets, so it lands with step 6).
6. **P-3** — split `routes.js` into the barrel + `routes-live-animals.js`, register
   live-animals through the new shape, and create `co-residency.test.js` with the
   live-animals half only. The plant half is added in m0-b.

**Phase m0-b — the recipe, then the set:**

7. **G-A: author `src/server/app/docs/add-a-set.md`** (R6). This is the first m0-b
   increment. It lands AFTER P-9/P-10 so it describes the seams as they actually are,
   and BEFORE any `sets/plant-products/` file so the scaffold can follow it verbatim.
8. **The m0 scaffold** — §1 m0 file list + `routes-plant-products.js` (§4.4.3) +
   P-2, P-5, P-6 + T-1..T-3, T-5..T-7, T-9, T-10 — each increment citing the
   `add-a-set.md` step it is executing. P-3's `co-residency.test.js` gains its plant
   half here; §4.5 acceptance is met at the end of this phase.
9. **P-7** (depth-3 characterisation) before any m3 work.

**Standing constraints (unchanged in substance):**

10. Platform items P-1..P-6 and P-9..P-11 all land BEFORE the first
    obligation-bearing page (m2) — the policy seam, the URL namespace and the cloned
    contract table must exist for inc-009 to register cleanly.
11. §2.3 fixes the `sections` append order; §2.1 fixes row ids and hub GROUPS.
12. Every page increment follows the §1–§4 recipes of the cheat-sheet with the §7
    plant ladder substituted; every platform-touching increment adds the
    sibling-safety check — **co-residency form: both sets green from one process**
    (`co-residency.test.js` + `test:features:all`), not "default boot unchanged".
13. inc-012 (commodity model extension) remains a HALT-FOR-REVIEW gate; P-7 evidence
    attaches to it.
14. R4 (copy idempotency, §6.2 `copy` row) is sequenced BEFORE the Copy button ships
    (m5 inc-039) — the records-port contract tests land with the plant records
    adapter, not with the button.
15. R5: the 11 m5 increments remain unplanned stubs. Nothing in this revision plans
    them.
16. **NEW (R7).** pp-057 and pp-059 are a PAIR across two repos. They share the branch
    name `spike/trace-to-requirements` (CLAUDE.md rule 2) and must not be separated by
    other work: between them the workspace E2E suite is red by construction.
17. **NEW (R8).** Every tests-repo plant increment trails the frontend increment that
    builds the pages it covers — there is nothing to drive until the pages exist. The
    trailing map is §10.6. The corollary is a standing rule: a frontend milestone is
    not complete until its tests-repo increment has landed.

---

## 10. Tests-repo strategy — `repos/trade-imports-animals-tests` (R8)

**Why this section exists.** Sam asked whether updating the `-tests` repo with the
plant-products work was in the plan. It was not. Across all 58 increments only pp-053
and pp-057 mentioned that repo, and only to assert it should not break. There were ZERO
increments adding plant-products coverage to it. Two distinct bodies of work were
missing and are planned here: (A) migrating the repo's live-animals URLs for R7, and
(B) giving plant-products real coverage there.

This repo is not optional extra assurance. The frontend's in-repo `*.e2e.spec.js` specs
run against a self-hosted server on the records STUB; the `-tests` repo runs the same
journeys against the real workspace stack — real backend, real Mongo, real OIDC. Only
the second proves a set actually works.

### 10.1 Branch prerequisite (do this first, in every tests-repo increment's step 1)

The tests repo is currently on **`spike/EUDPA-288-model-retrofit`**, not
`spike/trace-to-requirements`. CLAUDE.md rule 2 requires cross-repo branches to share
the same name — the workspace stack's `--branch` flag probes each repo for a matching
branch-tagged image and falls back to `:latest` per service, so a mismatched name breaks
the linked-branch pickup.

**Step 1 of pp-059 (the first tests-repo increment) is to cut
`spike/trace-to-requirements` in `repos/trade-imports-animals-tests` from its current
head.** Every later tests-repo increment verifies it is on that branch before editing.
Nothing lands on `spike/EUDPA-288-model-retrofit`.

### 10.2 Parameterise or clone? — the ruling

**Neither, wholesale. It is a LAYER question, and the answer differs per layer.** The
one-word answers ("clone everything" / "parameterise everything") are both wrong here.

| Layer | Ruling | Why |
|---|---|---|
| **URL construction + auth** (`page-objects/base/base-page.ts`) | **PARAMETERISE** | Already fully centralised — verified live: `:33-41` `navigateToFrontend`/`navigateToAdminPortal` are the only two `page.goto` entry points, and `:79-95` `expectedUrl` / `journeyIdFromUrl` / `currentJourneyUrl` are the only three URL builders. Adding a set base to `BasePage`/`NotificationPage` makes the WHOLE page-object tree set-aware in one small edit. `signInWhenRequested` (`:43-68`) is genuinely shared — one OIDC stub, one sign-in form, both sets. Cloning this layer would duplicate the single thing that is actually common. |
| **Page objects** (`page-objects/notification/**`) | **CLONE (per set)** | Nothing is shared. `origin-of-import-page.ts` locates "Where is this consignment coming from?"; the CHED-PP equivalent locates different headings, different fields, different copy. CHED-PP has 39 pages of its own (§2.2). A parameterised page object would be a switch statement per locator — the worst of both. |
| **Flows** (`flows/journey.ts`) | **CLONE (per set)** | `flows/journey.ts:29-41` `startNotification()` checks `pages.importType.liveAnimals` and waits on `originOfImport`; the plant flow picks a CHED-PP certificate type and walks a 12-spoke hub. Different journeys, not one journey with options. |
| **Specs** (`tests/**`) | **CLONE (per set)** | Follows the page objects. |
| **Domain constants + API/db models** (`domain/**`) | **CLONE into a per-set subtree** | `commodity-species.ts`, `import-reasons.ts` etc. are live-animals vocabulary. Plant needs EPPO codes, CHED-PP purposes, plant document types. `domain/types/date-time-input.ts` and similar genuinely-generic types stay shared. |
| **Adapters, config, utils, fixtures** (`adapters/**`, `config/**`, `utils/**`, `fixtures/**`) | **SHARE, extend where needed** | `rest-client.ts`, `mongodb-client.ts`, `a11y-utils.ts`, `with-project-base-urls.ts` are transport/harness, set-agnostic. `notification-api-client.ts` gains a plant sibling because the base path differs (`/plant-products/notifications`, §6.2). |

The short form for a planner: **one set-aware URL layer, two of everything above it.**

### 10.3 Target tree

Symmetric with the mount decision — the tests repo grows the same two-sided shape the
frontend has. The live-animals side MOVES (pp-060), which is churn, but leaving one set
at the root of `page-objects/` while the other sits in a named subdir is exactly the
asymmetry R7 rejected.

```text
page-objects/
├── base/
│   ├── base-page.ts            [CHANGE] set-aware: BasePage takes a set base;
│   │                                    NotificationPage builds prefixed URLs
│   └── sets.ts                 [NEW]    SET_BASES = { liveAnimals: '/live-animals',
│                                        plantProducts: '/plant-products' } — ONE place
│                                        the prefixes are written down in this repo
├── auth/                       [KEEP]   sign-in / sign-out — shared, unprefixed
├── admin/                      [KEEP]   different SERVICE; never prefixed (see 10.4 D)
├── live-animals/               [MOVE]   ← everything in today's page-objects/notification/
└── plant-products/             [NEW]    the CHED-PP page objects (10.5)
flows/
├── live-animals/               [MOVE]   ← journey.ts, api-journey.ts, notification-actions.ts
├── plant-products/             [NEW]    journey.ts, api-journey.ts, notification-actions.ts
└── admin-navigation.ts         [KEEP]
domain/
├── shared/                     [MOVE]   genuinely generic types
├── live-animals/               [MOVE]   ← today's constants + api/db models
└── plant-products/             [NEW]
adapters/http/
├── notification-api-client.ts  [KEEP]   live-animals (/notifications)
└── plant-products-api-client.ts[NEW]    /plant-products/notifications
tests/
├── a11y/{live-animals,plant-products,admin}/
├── e2e/features/{live-animals,plant-products,admin}/
├── e2e/pages/{live-animals,plant-products,admin}/
├── e2e/journeys/{live-animals,plant-products}/
└── cross-browser/              [CHANGE] journey-smoke gains a plant case
page-objects/{factory.ts,index.ts}  [CHANGE] per-set factories
seeds/mongodb/                  [NEW]    plant notification seed fixtures
```

`fixtures/ui.ts` (verified: `:19-42`) exposes `pages`, `journey`, `apiJourney` etc. as
Playwright fixtures. Under two sets it exposes both — `liveAnimalsPages` /
`plantProductsPages`, `liveAnimalsJourney` / `plantProductsJourney` — rather than one
fixture that switches, so a spec's imports say which set it is testing.

### 10.4 The R7 URL migration in this repo (pp-059) — enumerated

Verified live this session at every file:line below.

**A. The URL layer — 6 edits, and they cover most of the repo**

| File:line | Today | After |
|---|---|---|
| `page-objects/base/base-page.ts:33-36` | `navigateToFrontend(path = '/')` → `page.goto(\`${baseUrl}${path}\`)` | takes the set base into account; `path` becomes set-relative so callers stop writing prefixes by hand |
| `page-objects/base/base-page.ts:79-82` | `expectedUrl(journeyId)` → `` `/notifications/${journeyId}${suffix}` `` | `` `${this.setBase}/notifications/${journeyId}${suffix}` `` |
| `page-objects/base/base-page.ts:85` | `pathname.match(/^\/notifications\/([^/]+)/)` | front-anchored on the set base: `` new RegExp(`^${setBase}/notifications/([^/]+)`) `` — the `^` is why this MUST change rather than silently keep working |
| `page-objects/base/base-page.ts:92-95` | `currentJourneyUrl()` → `` `/notifications/${…}${suffix}` `` | prefixed, same as `expectedUrl` |
| `page-objects/base/base-page.ts:71-77` | `NotificationPage` constructor takes `(page, slug)` | takes the set base too (or reads it from a per-set subclass) |
| `page-objects/base/sets.ts` | — | NEW: the one place `/live-animals` and `/plant-products` are written in this repo |

**B. The dashboard page object — the hardcoded root, 4 sites**

`page-objects/notification/notification-dashboard-page.ts` (→ `page-objects/live-animals/`
at pp-060): `:12` `readonly expectedUrl = '/'` → `'/live-animals'`; `:142`
`navigateToFrontend(pageNumber <= 1 ? '/' : \`/?page=${pageNumber}\`)`; `:211` and `:220`
`navigateToFrontend('/')`. These four are the only places the frontend root is written
outside `base-page.ts`.

**C. Specs asserting a bare path**

MUST change (they name the root or a bare `/notifications` path):
- `tests/a11y/notification-view-states.spec.ts:26` — `` navigateToFrontend(`/notifications/${submitted.id}/confirmation`) ``
- `tests/e2e/features/notification-delete.spec.ts:14` — `` page.goto(`/notifications/${journeyId}/delete`) ``
- `tests/e2e/features/notification-dashboard-search.spec.ts:77` — `page.goto('/?referenceNumber=…&page=2')`
- `tests/e2e/features/headers.spec.ts:6` — `new URL(response.url()).pathname === '/'` (waits for the dashboard document response; becomes `/live-animals`)
- `tests/e2e/pages/notification-dashboard.spec.ts:7` — `` toHaveURL(new RegExp(`/notifications/${journeyId}$`)) `` (also front-anchor)
- `tests/e2e/journeys/promoted-notification.spec.ts:11` — same shape
- `tests/e2e/features/auth.spec.ts:77` — `` new RegExp(`/notifications/${journeyId}/origin$`) ``

PASS EITHER WAY but must be **front-anchored** so they prove the prefix (same rule as
§4.6 C — a suffix-anchored regex that survives the migration proved nothing):
- `tests/e2e/features/change-from-cya.spec.ts:17,21,30,34`
- `tests/e2e/features/cancel-amend-ui.spec.ts:24,37,64`
- `tests/e2e/pages/notification-view-states.spec.ts:40,52`
- `tests/e2e/features/notification-dashboard-sort.spec.ts:28`
- `tests/e2e/pages/notification-dashboard-pagination.spec.ts:17`
- `tests/e2e/features/notification-dashboard-search.spec.ts:24,40,48,56,69,70,81`
- `tests/e2e/features/auth.spec.ts:15` (`toHaveURL(pages.notificationDashboard.expectedUrl)` — follows B automatically, but assert the new value)

Resolve via the page object, no edit needed: `tests/e2e/pages/notification-dashboard.spec.ts:25`.

**D. Explicitly NOT in the sweep** — call these out in the increment so nobody
"helpfully" prefixes them:
- `page-objects/admin/admin-dashboard-page.ts:5,24,34`, `admin-notifications-page.ts:5,78,99`,
  `admin-outbox-events-page.ts:5`, `admin-dlq-events-page.ts:5,8` — a DIFFERENT SERVICE
  (`TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL`). `admin-notifications-page.ts:5`
  `expectedUrl = '/notifications'` is the single most likely false positive in the repo.
- `page-objects/auth/sign-in-page.ts:4`, `sign-out-page.ts:4` — OIDC provider URLs.
- `adapters/http/notification-api-client.ts:27,32` and `flows/api-journey.ts:65` —
  BACKEND API paths (`/notifications/{id}`, `/proposed-notifications/{id}`), not frontend.

**E. Config — no baseURL change, and the increment must say why**

`playwright.config.ts:10-13` maps project name → base URL; `utils/playwright/shared-config.ts:25-42`
defines `frontend-chromium` / `admin-chromium`; `playwright.e2e.config.ts` and
`package.json:25` supply `TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL`. **All stay
host-only.** A base URL ending in `/live-animals` would break `/signout`, `/health`,
`${assetPath}/*` and the OIDC callback, and would make the second set unreachable from
the same project. The prefix belongs in `page-objects/base/sets.ts`, nowhere else.

**F. Incidental**

`utils/a11y-utils.ts:31` — `new URL(url).pathname || '/'` names a11y scan results by
path; those names now carry the prefix, so allure labels change. Behaviourally fine,
but if any baseline or report assertion keys off the old names it must be updated.

### 10.5 Plant-products coverage — the suites it needs

Mirroring what live-animals has, since a sibling set needs sibling assurance:

| Suite | Files (new) | Covers |
|---|---|---|
| **Journey smoke / whole journey** | `tests/e2e/journeys/plant-products/plant-products-notification.spec.ts`, `flows/plant-products/journey.ts` | dashboard → import-type filter → 12 spokes → review → declaration → confirmation, against the real stack |
| **Pages** | `tests/e2e/pages/plant-products/{origin,purpose,commodities,varieties,additional-details,transport,goods-movement,contact,nominated-contacts,documents,traders,review,declaration,confirmation}.spec.ts` | per-page render, validation, save-and-continue, back link — one spec per page as the page lands |
| **Features** | `tests/e2e/features/plant-products/{hub-groups-and-cya-rows,import-type-routing,entry-guard-deep-link,commodity-depth-3,documents-min-entries,containers-conditional,dashboard-search,dashboard-sort,dashboard-pagination,notification-lifecycle}.spec.ts` | the cross-cutting behaviours: the 12-spoke hub + CYA row parity, the conditional Billing spoke (m5), the mandatory ≥1 document floor (c-015), the depth-3 commodity add/remove (FD-9), `usesContainers` gating |
| **a11y** (`@a11y`) | `tests/a11y/plant-products/{initial-state,filled-state,error-state,dashboard-views,dashboard-viewports}.spec.ts` | mirrors the five live-animals a11y specs |
| **Cross-browser** | extend `tests/cross-browser/journey-smoke.spec.ts` | one plant happy path |
| **API / persistence** | `adapters/http/plant-products-api-client.ts`, `flows/plant-products/api-journey.ts`, `domain/plant-products/models/api/*`, `domain/plant-products/models/db/*`, `seeds/mongodb/*` plant fixtures | API-seeded drafts for resume/view/amend/copy/delete specs without walking the whole UI (the live-animals `api-journey.ts` pattern) |
| **Co-residency** | `tests/e2e/features/co-residency.spec.ts` (set-neutral) | the cross-repo counterpart of `co-residency.test.js`: one deployed service, a live-animals journey and a plant journey in the SAME browser context, each with its own cookies, neither seeing the other's drafts. This is the one spec that can only exist here — the in-repo suites run on stubs |

### 10.6 How the two sets' suites are selected

**Playwright projects, not grep tags.** The repo already selects by project
(`utils/playwright/shared-config.ts:25-42`) and by tag for orthogonal concerns
(`@a11y`, `@integration`, `@visual` — `package.json:28-36`). Sets are a project-level
split; tags stay orthogonal so `@a11y` still means "accessibility", not "a set".

- `utils/playwright/shared-config.ts` — replace the single `frontend-chromium` with
  **`frontend-live-animals-chromium`** and **`frontend-plant-products-chromium`**, each
  with `testMatch` scoped to its own `tests/**/live-animals/**` or
  `tests/**/plant-products/**` paths. `admin-chromium` is unchanged.
- `playwright.config.ts:10-13` `projectBaseUrls` — **both** frontend projects map to the
  SAME frontend base URL. One service, two mounts. Getting this wrong (a per-set base
  URL) is the failure mode §10.4 E warns about.
- `playwright.e2e.config.ts`, `playwright.integration.config.ts`,
  `playwright.docker-compose.config.ts`, `playwright.cross-browser.config.ts` — each
  lists projects; all gain the plant project.
- `package.json:25` `_test_e2e` runs `--project=e2e --project=admin`; the per-set
  projects join that list. Add `test:plant-products` and `test:live-animals` convenience
  scripts so either set can be run alone during development.
- `.github/workflows/workspace-e2e-tests.yml` and `check-pull-request.yml` — whatever
  project/script names they pin must be updated in the same increment, or CI silently
  stops running a whole set.

**Trailing map** (each tests-repo increment lands after the frontend increment that
builds what it covers):

| Tests-repo increment | Lands after |
|---|---|
| pp-059 URL migration | pp-057 (immediately — see §9 constraint 16) |
| pp-060 per-set tree + projects | pp-059 |
| pp-061 plant API client + seeds | pp-060, pp-001, pp-007 |
| pp-062 plant m0/m2 coverage | pp-060, pp-020 |
| pp-063 plant m3 commodities | pp-062, pp-028 |
| pp-064 plant m4 pages + hub/CYA | pp-063, pp-040 |
| pp-065 plant whole journey + cross-browser | pp-064, pp-041 |
| pp-066 plant a11y | pp-064 |
| pp-067 plant lifecycle via API seed | pp-061, pp-045 |

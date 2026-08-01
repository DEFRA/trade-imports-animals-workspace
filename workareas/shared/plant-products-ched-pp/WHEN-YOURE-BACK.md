# WHEN YOU'RE BACK — plant-products/CHED-PP planning run

Running log of decisions the overnight orchestrator made and things Sam needs to look at.
Newest at the top. Each item is 3–4 sentences: what, why, what to check.

> Format: `## [timestamp-ish / phase] short title` then 3–4 sentences.

---

## [2026-08-01, SAM'S RULINGS APPLIED] Co-residency replaces the set switch — backlog now 58 increments
Sam walked the open decisions and reversed the biggest one: live-animals and plant-products must be
served **from one Node process**, because the L1–L4 architecture was designed set-agnostic and the
singletons were an implementation limit, not a design one. That killed the boot-time SERVED_SET switch
and added two large platform increments: **pp-056/P-9** (an AsyncLocalStorage set context in a new
`shared/set-context.js`; every `configure*` takes `setId` first, every read accessor resolves via
`currentSetId()`; requests resolve to a set by route ownership through a realm-scoped `onPreAuth`, not
URL parsing) and **pp-057/P-10** (per-set URL namespace: `shared/paths.js` splits into prefix-free
route-shape builders and prefix-bearing link builders). **Live-animals keeps the root mount and its URLs
do not change at all** — plant-products mounts under `/plant-products`; the asymmetry is deliberate
because moving live-animals' URLs would ripple into the tests-repo E2E suite, bookmarks and the cookie
path. The whole platform phase lands against live-animals-only before any plant file exists, so the
existing suite passing unedited is the proof the refactor was behaviour-preserving.

## [2026-08-01, caught in review] The re-plan left 19 increments with stale framing — swept
The workflow that applied the reversal only amended the increments it had itself listed as affected, so
everything outside that list kept round-1 framing: seven increments still used `SERVED_SET=` as a live
env var and seventeen still asserted plant pages at the root `/notifications/...` instead of the new
mount. Left alone, an implementor building pp-035 would have registered the traders page at the wrong
path. A sweep corrected 19 files and re-synced them into `backlog.json`, also adding the route-shape vs
link-builder distinction wherever an increment registers routes or emits links — the failure mode there
is a doubled prefix or a dropped one, and with live-animals at prefix `''` neither shows up until a
second set mounts. Worth knowing as a pattern: a decision reversal needs a full sweep, not a
targeted-edit list.

## [2026-08-01] Sam's other five rulings
**add-a-set recipe written UPFRONT** (pp-053, first in the array, before any m0 work) rather than
extracted after the fact — the scaffold increments then follow it, as with the other recipes.
**Copy idempotency matches live-animals exactly** (pp-054 backend, pp-055 frontend), sequenced before
pp-045 ships the Copy button; live-animals already has the full implementation (required header, blank
rejected, unique partial index, return-existing-on-repeat, contract tests pinning one draft per key) —
the transposition detail is that it lives on *fulfilment* copy there and on the *notification* resource
here. **SD-14 amended**: consignee and importer are two separate fields, both auto-populated from the
acting org — the legacy IPAFFS conflation is deliberately not inherited. **Lombok domain model
confirmed**, no rework. **The 11 m5 stubs stay unplanned.**

## [Phase E, DONE] backlog.json is the plan of record — 52 increments, validated
The run is complete. `backlog.json` holds 52 increments in dependency order (2 done, 45 todo, 5
deferred) with scopeDecisions SD-1..SD-14, deviations DV-1..DV-18, 12 sequencing rules, gaps G-A..G-I
and milestones m0..m5. I re-ran the validation myself rather than trusting the assembler: `jq empty`
clean, zero dangling `dependsOn`, topological order holds, no planned increment is thin, and no
increment defers to "see the markdown". Start at `HANDOVER.md` for how to iterate it.

## [Phase E, decision] Consignee has no writer in either repo — frontend fills it (SD-14)
Two critics independently found that `consignee` is declared in the backend model but nothing writes it:
the Java service only stamps the stub organisation. Ruling made headless: for pass 1 consignee = importer
= the single stubbed org, written by the frontend mapper in pp-035, recorded as scopeDecision SD-14 and
back-propagated into `obligation-field-map.md` and `SCHEMA-DESIGN.md`. This is the one entry here that
changes a data contract — if you disagree, SD-14 and pp-035 are the two places to edit. The alternative
(backend fills it) was actively refuted against the source: nothing in the Java writes that field.

## [Phase E] 23 critic findings folded in — none punted to a report
Two adversarial critics (coverage lens, buildability lens) ran over the assembled backlog and returned
23 findings. All were resolved IN the artefact: fixes applied where the critic was right (duplicate
`create` of the same file in two increments, a missing dependency edge that would have let the depth-3
gate be walked out of order, the 11th hub spoke having no carrier at m4, a stubbed-organisation service
with no owning increment), and rejected with file:line evidence where the critic was wrong. Nothing was
recorded as an open question by the editor and no findings report file exists — by design.

## [Phase D] All 39 planner-bound increments planned (7 lost to a session limit, recovered)
Three batches produced one detailed JSON object per increment. Batch 3 lost 7 planners to the usage
limit that resets at 00:30; 11 of the 13 had already written their file to disk before failing, so only
pp-039 genuinely needed a re-run — it was re-planned after the reset. I checked every file for the full
21-key set and non-trivial content rather than trusting the workflow's success list; two (pp-016,
pp-021) were missing `sizeGuess` and I filled them in (M and L).

## [Phase C] SIBLING-SET-PLAN.md written, adversarially verified, fixed in place
The scaffold plan for `sets/plant-products/` is complete under `frontend-plan/`: full set folder tree,
the 12-spoke hub→section→task-row→page mapping over all 39 pages, the manifest/within-chains for the
commodity depth-3 nesting, the exact L1 gateway split (routes.js → routes-live-animals.js +
routes-plant-products.js selected by SERVED_SET), platform items P-1..P-8 (obligation-policy literals
out of bridge/obligation-source.js with a 9-importer blast radius; records-mapper containment; dep-cruiser
and convention-test work), and a two-sided verification ladder (plant ladder AND live-animals stays
green). An adversarial verifier refuted 3 claims (start-section shape, P-1 consumer list, Playwright
project scoping) — all fixed in the doc, not just noted. The gap catalogue G-A..G-I is the honest
finding: there is NO add-a-set recipe, and §8 G-A enumerates the 10 steps such a recipe needs — worth
extracting to `docs/add-a-set.md` once plant-products proves it. Also no depth-3 collection precedent:
P-7 mandates a platform characterisation test BEFORE any m3 commodity work.

## [Phase B, gate PASSED] mvn verify green after wiring fix (backend 75763b9)
The corrective fix landed: `@EnableMongoRepositories` scoped to the plantproducts package only, ordering
pinned with `@AutoConfigureAfter(MongoRepositoriesAutoConfiguration.class)`. Full `mvn verify` is green —
449 Surefire units + 184 Failsafe ITs, 0 failures (log: `logs/phase-b-verify2.log`). Note the
plantproducts package has NO tests of its own yet (deliberately out of tonight's scope) — the backlog
carries backend test increments, so the schema is compile+wiring-verified, not behaviour-verified.

## [Phase B, gate] IT gate CAUGHT the wiring hazard — animals ITs failed, fix in flight
The deferred `mvn verify` gate failed exactly as the designer warned: `PlantProductsAutoConfiguration`
listed the animals package in its `@EnableMongoRepositories`, but Boot's own Mongo auto-config had
already registered those repositories from the `@SpringBootApplication` base package, so every animals
repository bean was defined twice and the ApplicationContext failed for all animals ITs. Fix applied by
a corrective agent: scope the annotation to `uk.gov.defra.trade.imports.plantproducts` only and add
`@AutoConfigureAfter(MongoRepositoriesAutoConfiguration.class)`; full `mvn verify` re-run logged to
`logs/phase-b-verify2.log`. The green/red outcome is recorded in a later entry — if the top entry above
doesn't say the gate passed, treat the backend schema as compile-verified only.

## [Phase B, deviation] Domain model is Lombok @Data/@SuperBuilder, NOT records
The orchestrator prompt said "compilable Java records", but the designer ruled that mirroring the
animals house shape wins: the NotificationBase-style split relies on @SuperBuilder inheritance (records
can't extend), and an all-nullable draft aggregate is record-hostile. Records with compact-constructor
null guards ARE used at every API boundary (DTOs, requests), exactly like the animals package — so the
house rule is honoured where it applies. Check SCHEMA-DESIGN.md decision list (D-1..D-20) if you want
to reverse this; it's a rename-level change, not structural.

## [Phase B] Backend plant-products schema committed (backend a7961ac), compile green
New package `uk.gov.defra.trade.imports.plantproducts` (56 files): notification aggregate with
commodity→species→variety nesting, separate `plant_products_accompanying_documents` collection
(async-scan boundary ruling), REST at `/plant-products/notifications` with a PUT `{ref}/status`
sub-resource instead of house action paths (rest-nouns ruling), GBN-PP-{YY}-{XXXXXX} reference minting,
and a PlantProductsAutoConfiguration registered via AutoConfiguration.imports (animals package
untouched). Its `@EnableMongoRepositories` lists BOTH packages — Boot's repo auto-config backs off, so
if this is mis-wired the animals repositories silently vanish; the designer's mandated gate (run the
animals ITs) was deferred by the implementor, so the orchestrator is running `mvn verify` as a
background gate now — result logged in a later entry. Design + obligation→field map under
`backend-schema/`.

## [Phase A, decision] Sibling set planned as boot-time set switch, not co-residency
Recon found every L1 injection seam (manifest, fulfilment-registry, journey-flow, dispatch, records,
session, commodity-reference) is a module-level singleton — one obligation set per Node process — and
`shared/paths.js` claims a global URL namespace both sets would collide on. Decision: plan m0 around a
boot-time set switch (env-selected served set, precedent `LIVE_ANIMALS_MODE` in `services/mode.js`), so
plant-products runs as *the* set in its own process; true co-residency is recorded as an open question,
not planned tonight. The known L2 leaks (obligation NAMES hardcoded in `bridge/obligation-source.js`,
the live-animals-shaped records mapper, `router.js` registering only `[liveAnimals]`, dep-cruiser's
`routes-is-the-gateway` whitelist, and app-root convention tests hardcoding live-animals paths) become
explicit platform increments in the backlog rather than surprises mid-build.

## [Phase A, decision] m5 todo increments carried as thin stubs, not re-planned
The source CHED-PP backlog is 37 todo + 5 deferred, not "5 unblocked" as the orchestrator prompt said —
the m0–m4 own-org happy path is 31 increments and each gets a full planner agent. The six m5 todos
(CSV branch, CUC billing, consignor-search, draft lifecycle, Article 72, auth stub) are carried into the
new backlog as thin `todo` stubs with their rulings but no detailed plan, alongside the 5 `deferred`
stubs (DoA layer, consignment-for, consignment-organisation, document-upload bytes+AV, cloning).
Rationale: the prompt scopes detailed planning to m0–m4; planning m5 tonight would burn agents on work
behind unbuilt dependencies.

## [Phase A] Recon complete — 4 maps under recon/
Four parallel readers mapped: the frontend platform (13-step boot sequence, exact `configure*`
signatures, boot-time purity/coverage assertions that fail a mis-wired set at server start), the six
recipes distilled into a planner-sufficient cheat-sheet (`recon/recipe-cheatsheet.md`), the backend
animals notification aggregate (field tree, 6 Mongo collections, REST surface, reference-number
scheme), and the CHED-PP requirements digest (8 rulings, 39 page specs all present, 354 fields,
12-spoke hub). Notable for planning: Nunjucks is already multi-set ready; dep-cruiser set-isolation
rules generalise to a second set with no config change; the L1 contract table and set-scoped
`test:plant-products` npm script are manual artefacts every increment/scaffold must add to explicitly.

## [setup, pre-run] Branches merged + created, foundation pushed
The evening session merged `spike/EUDPA-288-model-retrofit` into `spike/trace-to-requirements`
in the workspace repo (clean, disjoint paths — the merge only added the model-retrofit platform on
top of the trace-requirements docs) so the branch now carries the `frontend-change` skill and the
EUDPA-288 obligation-model + promotion corpus. New `spike/trace-to-requirements` branches were cut off
`spike/EUDPA-288-model-retrofit` in both the frontend and backend repos and pushed. Nothing to check
here — this is the starting state; the orchestrator's own decisions follow above this line.

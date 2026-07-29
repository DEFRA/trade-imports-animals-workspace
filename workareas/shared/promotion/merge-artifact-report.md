# Merge-artifact review — Lane B report

Date: 2026-07-22. Branch: `spike/EUDPA-288-model-retrofit` (tip 190661c),
system under review: `prototypes/standalone/live-animals/` in
`repos/trade-imports-animals-frontend`. All paths below are relative to that
prototype root unless prefixed. Analysis only — no code was modified.

Test question applied to every suspect: *"if this system had been designed
from scratch — page-owned controllers over this obligation model — would this
exist?"*

Backlog items appended: **p-101..p-106** (questions, blocked-on-sam) and
**p-107..p-114** (mechanical refactors, todo) in
`workareas/shared/promotion/BACKLOG.json`, theme `merge-artifact`.

---

## 1. Structural decisions for Sam (questions)

### 1.1 The answers-shape / bridge-existence question (p-101)

`bridge/fulfilments.js` exists because the two lineages disagree on the
storage shape:

- Pages store **nested, name-keyed** answers in `lib/path.js`'s `a.b[0].c`
  grammar (`bridge/fulfilments.js:4-8`).
- The evaluator wants a **flat, UUID-keyed** fulfilments map whose grouped
  values are records-maps keyed by composite ids `line0/unit1`
  (`bridge/fulfilments.js:10-16`, `GROUP_SEGMENT_PREFIXES`
  `bridge/fulfilments.js:45`).

Every evaluator consultation round-trips through `answersToFulfilments`
(`bridge/scope.js:112-123`, `bridge/status.js:323`, `bridge/purge.js:64-70`,
`bridge/collection-complete.js:44`) and the reverse direction exists only for
this translation (`fulfilmentsToAnswers`, `bridge/fulfilments.js:280-285`,
explicitly lossy on commodities `bridge/fulfilments.js:26-29`).

From-scratch analysis:

- The **nested name-keyed store is the natural shape** for page-owned
  controllers and for the persisted notification (the Mongo notification is
  nested and name-addressed — `services/persistence/records/notification-mapper.js`).
  Nobody designing this system fresh would persist flat UUID-keyed maps.
- The **UUID keying is pure lineage**: obligation `name` is already unique and
  is the lookup key everywhere outside the evaluator (`byAId`
  `bridge/fulfilments.js:51-53`, and four sibling maps — see p-113). The `id`
  UUIDs come from the upstream manifest; nothing user-facing or persisted uses
  them.
- The **composite `line0/unit1` record ids** are a re-encoding of positional
  indices the store already has (`fulfilmentIdToPath`
  `bridge/fulfilments.js:215-223`, `instanceFulfilmentId`
  `bridge/fulfilments.js:232-243`) — invented so the flat map can address
  instances the nested arrays address for free.

So the from-scratch shape is **(c) make the evaluator accept the stored
shape**: evaluator keyed by obligation *name*, records addressed by the
positional path the store already uses. That deletes `answersToFulfilments`/
`fulfilmentsToAnswers`, the segment-token machinery, and the composite↔
positional conversions in scope/purge/collection-complete. It is also the
largest single change proposed by this review: it rewrites the evaluator's
internal indexing (`model/obligations/evaluator.js` — `dropUnknownFulfilments`
/`buildObligationsById`), all evaluator tests, and every bridge projection.
Behaviour (scope, purge, status) should be byte-identical; persistence shapes
do NOT change (answers are already the stored/persisted shape — that is the
point).

Options are in the backlog item. Recommendation: **option (c)** as a staged
increment set, or if the evaluator rework is judged too expensive for the
promotion window, option (a′): keep the translation but rename/reframe it as
the model boundary projection (no "bridge" vocabulary) and drop the UUID layer
only (`name` becomes the fulfilment key — a much smaller change that kills
half the translation and all five duplicate name→obligation maps).

### 1.2 One vocabulary end-to-end (p-102)

`VOCAB` (`bridge/fulfilments.js:115-125`) exists only because the lineages
named values differently: camel↔kebab (`reasonForImport`), title↔kebab
(`transporterType`, `meansOfTransport`), GB-prefix strip (`portOfEntry`),
string↔number (`numberOfAnimalsQuantity`), name↔CN-code
(`commoditySelection`).

The standing ruling says names = **the notification model's vocabulary**. The
decisive evidence on which side that is:

- The persisted notification stores **camelCase** `internalMarket`
  (`src/server/common/helpers/notification-view-helper.js:8`; Mapper A passes
  `answers.reasonForImport` through raw —
  `services/persistence/records/notification-mapper.js:157-167`).
- The manifest's gates compare **kebab** `internal-market`
  (`model/obligations/obligations.js:249-251`) and `road-vehicle`
  (`model/obligations/obligations.js:431`).

So the manifest constants are the *upstream branch's* vocabulary, not the
notification's. From scratch there is one vocabulary and the gate constants
simply ARE the stored values.

Proposal: rewrite the manifest gate constants (and `notInUnionOf` unions) in
the stored vocabulary; delete the `VOCAB` regex transforms, `normaliseToB`/
`normaliseToA` and the direction-named `toB`/`toA` keys; delete
`bridge/vocab-coverage.test.js` (`bridge/vocab-coverage.test.js:8-19` states
its own reason to exist is the convention bridging). Two genuine residues
remain and need Sam's call:

1. **Commodity name vs CN code.** Stored `commoditySelection` is the picker
   name (`Cow`); gates carry CN codes (`0102`,
   `model/obligations/obligations.js:589,764-798`). This one is not just
   spelling: the code is the stable identifier, the name is display. Either
   (i) store the code and derive display (flips the journey's stored value —
   touches canned data, mappers, E2E fixtures, and the known non-injective
   `Cat`/`Dog`→`01061900` collapse disappears), or (ii) keep storing the name
   and rewrite the gate allowlists in names — which would also collapse the
   **duplicate allowlists** (`services/commodities/stub.js` picker-name lists
   vs manifest CN-code lists) currently held in sync only by
   `services/commodities/allowlist-drift.test.js:5-13` ("Nothing structural
   ties the two together"). Single-sourcing the allowlists kills that guard
   too.
2. **`numberOfAnimalsQuantity` string→number** (`bridge/fulfilments.js:101-110`)
   is not lineage — HTTP payloads are strings and `recordCountEquals` compares
   numbers. It survives in whatever shape the boundary takes (or moves to
   controller-side coercion at write time).

Recommendation: adopt the stored/notification vocabulary in the manifest;
choose (ii) for commodities unless Lane E wants code-keyed storage for MDM
alignment; keep only the numeric coercion, relocated to the write path.

### 1.3 The vendored-tree framing and process documents in-tree (p-103)

The upstream branch is dead as a vendor source (handover: "Paul's branch is
upstream-read-only", the retrofit is over). What remains in-tree:

- `PROVENANCE.md` (18 lines, root) — car-insurance spike lineage.
- `DESIGN-DELTA.md` (761 lines, root) — documents divergences of files that
  **no longer exist** (`engine/evaluate/predicate.js`, `registry.js#walk`,
  `engine/evaluate/complete.js`, `engine/evaluate/cross-frame.test.js` — all
  deleted in the retrofit; see `DESIGN-DELTA.md:7-13,21-24,50-57`).
- `model/PROVENANCE.md` (66 lines) — now **factually false**: "This subtree
  is dark. Nothing in A imports it" (`model/PROVENANCE.md:10-11`) while
  `bridge/status.js:37-42`, `bridge/scope.js:24-25` and others import it live.
- `model/DESIGN-DELTA.md` (1775 lines) — B-vs-Paul's-branch delta register.
- `retrofit/DELTA-REGISTER.md`, `retrofit/DIVERGENCE-REGISTER.md`,
  `retrofit/SEMANTICS.md` — M0-gate working papers addressed "For: Sam, at
  the M0 gate (inc-004)" (`retrofit/SEMANTICS.md:4`).
- `spec/journey-spec.json` + `spec/conflicts.json` — journey-builder digest
  artifacts referenced by **no code** (only `spec/fixtures/happy-path.json`
  is imported: `bridge/scope.test.js:12`, `flow/task-rows.test.js:22`).

Standing rulings already cover this: git history is the source of truth; no
migration notes in-tree; rationale lives in docs/. Recommendation: delete all
of the above except `spec/fixtures/` (move it next to its consumers, e.g.
`flow/fixtures/`), after a one-pass mine of any still-true behaviour rationale
into `docs/` topics (the DESIGN-DELTA numbers are cited by some comments —
those citations are scrubbed by p-109 anyway). The **import-boundary guard
stays** — `obligation-purity.js:67-79` enforces the ruled model purity, which
is a from-scratch design rule, not vendor framing; only its "vendored model"
wording changes (p-109).

### 1.4 Dead flow-shaped engine exports (p-104)

`model/engine/index.js` exports a page/flow API — `firstApplicablePage:42`,
`firstUnfulfilledPage:55`, `firstUnfulfilledPageForLine:78`,
`firstUnfulfilledPageForUnit:113`, `firstPagePresentingObligation:141`,
`expandPresents:204`, `pageStatus:390`, `containerStatus:417`,
`groupInvariantErrorsForContainer:666`, `journeyState:688` — that operates on
the upstream branch's `flow` shape (`presents` / `presentsForEach` pages),
**a shape that does not exist anywhere in this codebase** (this system's
`flow/flow.js` is a different structure; grep shows the only consumers of
these exports are `model/engine/index.test.js` itself). Outside model/, only
`effectiveStatus` and `groupInvariantErrors` are imported
(`bridge/status.js:40`, `bridge/collection-complete.js:39`).

From scratch, none of the flow-shaped functions would exist here.
Recommendation: delete them and their tests; keep `effectiveStatus`,
`groupInvariantErrors`, `STATUSES`. Follow-on naming: with the file reduced to
status helpers, the awkward **two-`engine/` layout** (`engine/` = journey
read/write/persistence vs `model/engine/` = evaluator-state helpers — itself
an A-engine/B-engine merge artifact) can be resolved by folding the survivors
into `model/obligations/` or renaming `model/engine/` to `model/status/`.
Blocked-on-Sam because "kept — pre-existing policy" was an explicit earlier
ruling this reverses.

### 1.5 Dual notification mappers and the skeleton framing (p-105)

`services/persistence/records/notification-mapper.js` carries **Mapper A**
(skeleton-exact, `notification-mapper.js:4-8`) and **Mapper B** ("target",
lossless, `notification-mapper.js:10-14,291`), selected at runtime by
`LIVE_ANIMALS_MAPPER=a|b` (`services/persistence/records/mapper.js:14`).
Mapper A exists to mirror `src/server/common/clients/notification-client.js`
— the journey being nuked — and is pinned by
`services/persistence/records/skeleton-equivalence.test.js` and the parity
E2E (`docs/testing.md:101-103`). It is deliberately lossy
(`notification-mapper.js:215-217`).

From scratch there is exactly one mapper: the shape the service persists.
While `src/server` lives, Mapper A + parity is the superset-proof harness
(Lane A depends on it), so this is a **sequencing decision, not a delete-now**:
rule that at promotion Mapper B's lossless shape becomes *the* notification
shape (a backend-schema conversation), then delete Mapper A, the runtime
switch, `skeleton-equivalence.test.js`, and the "skeleton"/"Mapper A/B"/
"target" vocabulary (`docs/persistence.md:140-173`, `docs/limits.md:62-71`).
Feeds Lane E; flagged here so the vocabulary is on the scrub list.

### 1.6 Two blank-value predicates (p-106)

- `lib/answered.js:1-8` `isBlank`: trims strings (`String(value).trim()`),
  recurses composites to any depth.
- `model/engine/is-blank-value.js:29-41` `isBlankValue`: no trim, one level of
  composite depth, plus a 27-line second-code-review war story in the header
  comment (`is-blank-value.js:15-27` — process reference, scrubbed by p-109).

Both sides of the answers/fulfilments boundary judge "blank" with different
semantics: `' '` is blank to one and content to the other; a nested all-empty
composite likewise. Divergence is exactly the class of bug the
`is-blank-value.js` header says the extraction existed to kill. From scratch:
one predicate. The model import boundary permits `lib/` → `model/`
(`obligation-purity.js:48-53` restricts only model's own imports), so
`lib/answered.js` can derive `isAnswered = (v) => !isBlankValue(v)`.
Blocked-on-sam because semantics must be chosen (trim or not; deep or
one-level) and the choice is user-visible at the margins.

---

## 2. Mechanical scrubs (refactors, status todo)

### 2.1 `retrofit/` directory (p-107)

`retrofit/path-prefix-depth.test.js:3` still opens "SKIPPED UNTIL inc-006 —
un-skip this whole file there" — but the file is **not skipped** (plain
`describe`, `path-prefix-depth.test.js:33`), it runs green because the fix it
pins landed (`model/obligations/helpers.js:554` carries the exact
`key === '' || path === key || path.startsWith(\`${key}/\`)` form), and its
dynamic `await import`s (`path-prefix-depth.test.js:34-39`) exist only because
the model "is not vendored until inc-005". The test itself is a valuable
regression pin (including its negative control,
`path-prefix-depth.test.js:101-117`). Move it to
`model/obligations/path-prefix-depth.test.js`, static imports, header rewritten
to describe the behaviour it pins (a depth-≥2 gate's projection must be
prefix-matched, not first-segment-sliced), and delete the then-empty
`retrofit/` dir (registers go with p-103).

### 2.2 Stale root `TODO.md` (p-108)

`TODO.md` is the 2026-07-08/09 wave plan ("Wave 1 — DONE", items 6-13 with
orchestration notes, `TODO.md:8-92`) — all done or superseded by the shared
promotion backlog. Delete.

### 2.3 Process-reference comment/test-name scrub (p-109)

The rulings say comments near-bare, no process references. The tree is
saturated with increment/plan/review vocabulary that only a merge participant
can parse. Representative inventory (grep-verified, not exhaustive — the item
carries the full sweep):

- `inc-0xx` citations: `store-ops.test.js:177,380,492`, `contract.test.js:293`,
  `bridge/collection-complete.test.js:118`, `bridge/scope.test.js:136`,
  `bridge/fulfilments.test.js:263,268`,
  `features/check-answers/controller.js:184`,
  `features/commodities/search.controller.js:15`,
  `features/commodities/animal-identification.controller.test.js:54`,
  `features/commodities/consignment-details.controller.test.js:91`,
  `services/persistence/records/notification-mapper.js:45`, and more.
- `EUDPA-288 Phase x` / "blend plan": `model/analysis/reachability.test.js:2,402`,
  `model/analysis/coverage.test.js:2,105`,
  `model/obligations/evaluator.test.js:1266`,
  `model/obligations/coverage.test.js:143,161,177`,
  `model/obligations/helpers.test.js:390`.
- PLAN/oracle/review artifacts: `bridge/fulfilments.test.js:151` ("an oracle
  blind spot (PLAN §3, D-notes)"), `bridge/collection-complete.test.js:82`,
  `model/engine/is-blank-value.js:15-27` ("Second-code-review context:
  findings #4…#7"), `model/no-display-keys.js:111` ("the form M3 wires…"),
  `model/no-display-keys.test.js:12,40`.
- "vendored" wording in live code: `bridge/fulfilments.js:18,48`,
  `obligation-purity.js:10`, `obligation-purity.test.js:10`,
  `analysis/flow-reachability.js:314`, `analysis/flow-reachability.test.js:93`,
  `docs/services.md:16,42,74`.
- Spike/car-insurance: `model/obligations/obligations.js:5,195,560`,
  `model/obligations/evaluator.units.test.js:18`,
  `model/obligations/coverage.test.js:131`, `model/engine/index.js:7`
  (EUDPA-277 references), `lib/validate/validate.test.js:46`
  (`estimatedValue` fixture name).

Rule for the implementor: keep the behavioural content of a comment where it
still explains the code; delete the provenance citation. Test *names* keep
behaviour, lose increment ids ("(inc-063, D16)" etc.).

### 2.4 `*-under-b` test files and A/B framing (p-110)

`engine/mutators-under-b.test.js` and `engine/submit-under-b.test.js` are
named for the cutover ("under B") and their prose is pure lineage:
"storage is A-positional, purge is B-authoritative"
(`mutators-under-b.test.js:20-29,47`), "submitJourney — B-derived scope gate,
A finalise" (`submit-under-b.test.js:15-18,23`). Rename to
`engine/mutators.test.js` / `engine/submit.test.js`; rewrite describe blocks
and comments in system terms (storage is positional; the purge is
evaluator-authoritative).

### 2.5 `t1-`/`t2-` root tests and the orphan currency validator (p-111)

`t1-currency-persist.test.js` and `t2-hub-copy.test.js` are named for the
T1–T11 cleanup pipeline (`PROVENANCE.md:4-5`) and sit at the tree root.
Additionally the `currency` validator they exercise has **no feature
consumer**: grep shows only its definition (`lib/validate/validators.js:122`),
its copy keys (`shared/copy.en.js:49`, `shared/copy.cy.js:35`), its unit tests
(`lib/validate/validate.test.js:46,147-158` — still using the car-insurance
`estimatedValue` fixture) and the t1 test. A live-animals import journey has
no currency field; the mirror ruling (match the real FE, no gold-plating) says
delete it. Action: delete `currency` + its copy keys + its unit tests; keep
t1's real subject ("cleaned values are persisted, not the raw payload") by
re-pinning it on a validator the journey actually uses, relocated to
`lib/validate/` or `engine/`; move t2 to `features/hub/` as
`controller.test.js` (or merge into existing hub coverage).

### 2.6 `engine/readiness-config.js` boot-injection (p-112)

The injection seam exists "keeping the module graph a clean DAG"
(`engine/readiness-config.js:1-12`) — but the cycle it guards against **no
longer exists**. Verified: the transitive closure of
`flow/section-status.js` (→ `bridge/status.js`, `flow/dispatch.js`,
`flow/task-rows.js` → `features/*/page.js`, which are pure metadata,
e.g. `features/origin/page.js:1`) contains **no** import of `bridge/scope.js`
or `engine/read.js`. From scratch, readiness is a flow-level roll-up composed
where the read model is assembled: drop `readyForCheckYourAnswers` from
`makeScope` (`bridge/scope.js:170-179`), have `engine/read.js` import
`flow/section-status.js` directly and attach readiness in `readViewOf`
(consumers: `engine/write.js:114`, `flow/flow.js:82` — both receive the
composed object), delete `engine/readiness-config.js` and the
`configureReadyForCheckYourAnswers` boot wiring (`routes.js:6,22`) plus the
~10 test `beforeAll` wirings that exist only to satisfy the injection.

### 2.7 One manifest index; lineage variable names (p-113)

Five modules each build their own name→obligation map:
`bridge/fulfilments.js:51` (`byAId`), `bridge/status.js:53-56` (`bByAId`/
`bOf`), `bridge/applicability.js:23`, `flow/obligation-source.js:14,21`
(`byNameMap`/`byPathMap`), `bridge/collection-complete.js:46` (`byAName`) —
plus a duplicated group-set derivation (`flow/obligation-source.js:68-72` vs
`bridge/fulfilments.js:55-59` `groupObligations`) and a duplicated
ancestor-chain walk. From scratch these are one manifest-index module (natural
home: `model/obligations/` or the surviving boundary module from p-101).
Also scrub the lineage identifier names: `aId`/`byAId`/`bByAId`/`bOf`/
`aColl`/`bColl`/`aObl` (`bridge/status.js:53-56,232-236,286`,
`bridge/fulfilments.js` throughout) → plain `name`/`obligationByName`/
`collection` etc. Sequencing: after p-101/p-102 rulings (their outcome decides
which of these modules survive), though the naming scrub is safe any time.

### 2.8 "Obligations v2 spike" naming (p-114)

`README.md:1-3` titles the system "Obligations v2 spike"; internal copy keys
still say `spikeHome` (`shared/copy.en.js:20`, `shared/copy.cy.js:13`) and the
phase banner reads "Obligations v2 spike standalone — a non-functional
prototype" (`shared/copy.en.js:15`). Rename README + the `spikeHome` key to
live-animals terms now; the *user-visible banner text* is a product statement
that stays true until promotion — its removal belongs to Lane E, so change the
key, keep the wording, and note it in the promotion plan.

---

## 3. Suspects examined and CLEARED (would exist from scratch)

- **`flow/obligation-source.js`** — mostly inherent config, not adapter
  residue. `SYSTEM_POPULATED` (`:25-29`) exists because the notification
  model declares fields no page collects (a real property of the domain);
  `ENFORCED_AT_CONTINUE` (`:31-34`) is flow policy consumed by
  `flow/prerequisites.js:1,10`; `MAX_ENTRIES_FROM` (`:41-43`) is the ruled
  admission-control declaration; `FLOW_ONLY_OBLIGATIONS` (`:54`) +
  `SYSTEM_ANSWER_KEYS`/`AUX_ENTRY_KEYS` (`:59-66`) are the deliberate
  layering of journey-only keys over a notification-only model — a from-
  scratch system with the "manifest = notification model" ruling needs
  exactly this. The `walkObligations` templatePath walk is genuinely consumed
  by dispatch ownership (`flow/dispatch.js:10-24,68-79`). Its duplicate maps
  fold into p-113; nothing else to do.
- **`bridge/scope.js` / `bridge/purge.js` / `bridge/collection-complete.js` /
  `bridge/status.js` as functions** — scope projection, wipe projection,
  per-instance completeness and the 5-way status are inherent presentation/
  write-path logic any from-scratch build needs; only their *translation
  plumbing* (fulfilments round-trip, composite ids) and *vocabulary* are
  merge-born (p-101/p-102/p-113). `bridge/applicability.js` is a genuinely
  state-free question ("which identifier fields for commodity C before any
  record exists", `bridge/applicability.js:5-11`) — keeps its job whatever
  p-101 decides.
- **`obligation-purity.js` and `model/no-display-keys.js`** — enforce the
  ruled no-display-logic boundary; from-scratch rules, not merge residue.
  Only wording ("vendored model") is scrubbed (p-109).
- **`analysis/flow-reachability.js` vs `model/analysis/reachability.js`** —
  not a duplicate pair: graph/value-level prover vs flow-level prover, each
  states the other's gap (`analysis/flow-reachability.js:1-24`,
  `model/analysis/reachability.js:1-31`). Both earn their keep.
- **`model/engine/is-blank-value.js` as a module** — the single-blank-check
  extraction is good design; the *duplication* with `lib/answered.js` is the
  problem (p-106), not the module.
- **`spec/fixtures/happy-path.json`** — live test input; relocates rather
  than dies (p-103).
- **`services/_capture/capture.js`**, stub/real service split, `docs/`
  recipes — canned-data workflow per the run-mode design; no lineage.
- **"third way" phrasing** — zero hits in the tree; already gone.

## 4. Cross-lane notes

- p-105 (mappers) and p-114 (banner copy) hand sequencing to **Lane E**; the
  parity E2E and `skeleton-equivalence.test.js` must outlive Lane A's
  superset verification.
- p-101/p-102 are the two items that change *what* gets promoted — Lane E is
  gated on them per the dependency map in `HANDOVER.md`.
- The comment scrub (p-109) intersects files nearly everywhere; the
  implementor loop should schedule it AFTER the structural deletions
  (p-103/p-104/p-107) so it doesn't polish text that is about to be deleted.

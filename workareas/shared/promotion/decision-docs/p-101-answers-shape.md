# p-101 worked example — the answers shape, the bridge, and the UUID question

Decision-support for Sam. Backlog item p-101 (`workareas/shared/promotion/BACKLOG.json`),
Lane B report §1.1 (`workareas/shared/promotion/merge-artifact-report.md`).

The system is `prototypes/standalone/live-animals/` in
`repos/trade-imports-animals-frontend`. Every path below is relative to the
prototype root unless it is prefixed.

Every JSON block below is either verbatim fixture data or the exact shape pinned
by a named passing test. Nothing is invented.

## At a glance

- **This decision is structural only.** p-101 chooses how the obligation
  evaluator keys its data: by obligation **name** or by **UUID**, and whether
  records use nested/composite or flat/positional addressing.
- **Option (a) — status quo.** Keep today's UUID layer. Zero modules change. You
  carry a translation layer, a dual key space, and a live bug class you do not need.
- **Option (a′) — name-as-key, thin projection.** The name becomes the fulfilment
  key; the composite-id tokens and converters stay. About 10 modules change, low
  risk, no change to the evaluator algorithm.
- **Option (c) — name-keyed evaluator, positional paths.** Delete the translation
  layer, the tokens and the converters. Wider change, moderate risk, most merge
  residue removed. Option (b) — id-keyed storage end to end — is already rejected
  on the merits.
- **The versioning headline: the UUID-as-versioning hypothesis does not hold.** No
  version machinery exists, and "same name, new id" is already a build failure
  today. Deleting the UUID layer forecloses nothing that (a) keeps.
- **No recommendation is made here.** Lane B's recommendation is on the backlog item.

### What has already landed

Four refactors that reshaped the surface Lane B described in §1.1 have since
landed on the prototype. This document is traced against the code as it stands
after all four:

- **p-102 (vocabulary).** The evaluator now works in the **stored vocabulary**.
  `VOCAB`, `normaliseToB`, `normaliseToA` and `vocab-coverage.test.js` are
  deleted. Answers and the manifest's gates share one vocabulary, so the bridge
  no longer re-spells anything: `reasonForImport` stays `"internalMarket"`,
  `commoditySelection` stays `"Cow"`. The one surviving value transform is the
  animal-count coercion, now consolidated into `modelValue`
  (`bridge/fulfilments.js:84`).
- **p-113 (identifier renames).** The bridge's private name→obligation maps were
  renamed to plain names (`obligationByName` and friends). This was
  **rename-only** — the five duplicate maps were **not** consolidated. That half
  is deferred pending THIS p-101 ruling, so the maps still exist, just renamed.
- **p-103 (lineage docs).** The happy-path fixture moved to
  `flow/fixtures/happy-path.json`; `spec/journey-spec.json` and
  `spec/conflicts.json` are gone.
- **p-104 (engine fold-in).** `model/engine/index.js` was deleted and its
  survivors folded into `model/obligations/`; `is-blank-value.js` now lives at
  `model/obligations/is-blank-value.js`.

None of these decides p-101. What remains for p-101 is purely **structural**:
name-vs-UUID keying, and nested-vs-flat/composite record addressing.

---

## 1. Current state, end to end

The bridge translates between two shapes (`bridge/fulfilments.js:1-28`):

- **`answers`** — a nested POJO keyed by obligation **name**, with collections as
  positional arrays (`lib/path.js` grammar
  `commodityLines[0].animalIdentifiers[1].animalIdentifierPassport`).
- **`fulfilments`** — a flat map keyed by obligation **UUID** (`obligation.id`).
  Grouped values are records-maps keyed by composite ids, built from segment
  tokens plus indices (`line0`, `line0/unit1` — `GROUP_SEGMENT_PREFIXES`,
  `bridge/fulfilments.js:42`).

The translation runs on every evaluator consultation, per request. Here is where:

| Call site | Direction | Purpose |
|---|---|---|
| `bridge/scope.js:108-119` | answers→fulfilments, then project implications back to pathKeys | `makeScope` for controllers/hub (`engine/read.js`) |
| `bridge/status.js:335,339` | answers→fulfilments | `statusOf` 5-way task/section status (`flow/task-rows.js`, `flow/section-status.js`) |
| `bridge/purge.js:64-70` | answers→fulfilments, diff in/out, project wiped keys back | `wipeSet` feeding `engine/write.js` |
| `bridge/collection-complete.js:44,144` | answers→fulfilments + `instanceFulfilmentId` | per-entry `complete` flag (`engine/evaluate/collection-view.js`) |

One thing to note: the full inverse `fulfilmentsToAnswers`
(`bridge/fulfilments.js:222-227`) has **zero production consumers**. Only
`bridge/fulfilments.test.js` imports it (plus the docs mention it).

Production code never converts a whole fulfilments map back. It only converts
individual composite ids back to positional paths (`fulfilmentIdToPath`,
`bridge/fulfilments.js:161-169`).

### 1.1 Simple field: `reasonForImport`

**Hop 0 — stored answers.** These live in the session (via yar/Redis) and persist
to Mongo, name-addressed by the notification mapper. Verbatim
`flow/fixtures/happy-path.json:22`:

```json
{ "reasonForImport": "internalMarket" }
```

**Hop 1 — `answersToFulfilments`.** See `bridge/fulfilments.js:139-149`, the
scalar branch `:115-118`, keyed by `obligation.id` at `:145`. The value passes
through unchanged — no vocabulary re-spell (p-102 landed). The output, pinned by
`bridge/fulfilments.test.js:199`:

```json
{ "d34e5f6a-7b8c-4d9e-8f01-2a3b4c5d6e7f": "internalMarket" }
```

`d34e5f6a-…` is `reasonForImport.id` (`model/obligations/obligations.js:247`).

**Hop 2 — the evaluator consumes it.** The gate on `purposeInInternalMarket`
(`model/obligations/obligations.js:255-268`) is
`equalsGate(reasonForImport, 'internalMarket', …)`. Its closure reads the flat
map by UUID: `fulfilments[gateObligation.id] === value`
(`model/obligations/helpers.js:322`).

The implication is keyed by the gated obligation's UUID (`buildImplications`,
`model/obligations/evaluator.js:535-544`; `buildImplication` stamps
`implicationsByObligation[obligation.id]` at `:538`). Its `mandatory` status is
pinned by `bridge/fulfilments.test.js:319-322`; the reason shape is the gate's
whenTrue branch (`obligations.js:261-265`, reason at `:91-95`):

```json
{
  "e45f6a7b-8c9d-4e01-8f23-4a5b6c7d8e9f": {
    "inScope": true,
    "status": "mandatory",
    "reasons": [{ "code": "obligation.purposeInInternalMarket.applicable.becauseInternalMarket",
                  "explanation": "purposeInInternalMarket applies when reasonForImport is internalMarket" }]
  }
}
```

`e45f6a7b-…` is `purposeInInternalMarket.id` (`obligations.js:256`). Note the
explanation reads `internalMarket`, not `internal-market` — the manifest now
speaks the stored vocabulary (p-102).

**Hop 3 — back out.** `bridge/scope.js:88-90,102-105` projects the in-scope
scalar implication to the bare name key `'purposeInInternalMarket'` in the
`inScope` Set the controllers consume.

The value-level inverse (`fulfilmentsToAnswers`, `bridge/fulfilments.js:222-227`)
recovers `"internalMarket"` unchanged — there is no re-spell to reverse. Only the
round-trip tests exercise it (`bridge/fulfilments.test.js:47-110`).

So for one scalar the layer does two re-keys: name→UUID on the way in, UUID→name
on projection. The vocabulary re-spell that used to sit between them is gone
(p-102). The two re-keys are what p-101 is about.

### 1.2 Collection/unit field: `animalIdentifierEarTag`

**Hop 0 — stored answers.** Verbatim `flow/fixtures/happy-path.json:9-21`,
trimmed to the relevant fields:

```json
{
  "commodityLines": [
    {
      "commoditySelection": "Cow",
      "numberOfAnimalsQuantity": "1",
      "animalIdentifiers": [
        { "animalIdentifierEarTag": "UK123456789012" }
      ]
    }
  ]
}
```

**Hop 1 — `answersToFulfilments`** walks the nested arrays
(`collectGroupedRecords`, `bridge/fulfilments.js:93-113`), minting composite
record ids from depth tokens (`segmentToken`, `:69-71`; prefixes `:42`).

The output — shapes pinned by `bridge/fulfilments.test.js:160-163`
(`line0/unit0`), `:190,300-302` (commodity stays `Cow`), `:136-139` (count
string→number):

```json
{
  "21f60718-192a-4d4e-8bcd-17e8f9a0b1c3": { "line0": "Cow" },
  "24192a3b-4c5d-4a71-8ef0-4ab1c2d3e4f6": { "line0": 1 },
  "3b879ca2-b3c4-4fe8-8567-a1283a4a6c73": { "line0/unit0": "UK123456789012" }
}
```

Here `21f60718` = `commoditySelection`, `24192a3b` = `numberOfAnimalsQuantity`,
`3b879ca2` = `animalIdentifierEarTag`
(`model/obligations/obligations.js:527,554,704`).

Two transforms and one coercion happened:

- name→UUID key;
- positional index → tokened composite (`[0]`→`line0`, `[0][0]`→`line0/unit0`);
- the animal count `"1"`→`1` — the sole surviving value transform, applied by
  `modelValue` (`bridge/fulfilments.js:84`). The commodity is NOT converted:
  `Cow` stays `Cow` (p-102 killed the old `Cow`→`0102` re-spell).

**Hop 2 — the evaluator consumes it.** Group instances are inferred from
composite-key prefixes (`enumerateGroupPathsFromStorage`,
`model/obligations/evaluator.js:337-358`, via `groupInstancePaths`/
`instancePathPrefixesFromRecord` `:299-328`): `commodityLines` → `['line0']`,
`animalIdentifiers` → `['line0/unit0']` (pinned `bridge/fulfilments.test.js:333-339`).

The ear-tag gate `allowListed(commodityCode, earTagCommodities(), unitRecord, …)`
(`model/obligations/obligations.js:703-711`) reads the commodity records-map by
UUID, filters the passing line keys, and projects to unit instance-paths by
string prefix (`model/obligations/helpers.js:93-116,554-597`). The implication is
built by `derivedLeafImplication` (`evaluator.js:584-593`), stamping
`obligation.status` (`optional`) per record; the `line0/unit0` record is pinned by
`bridge/fulfilments.test.js:315-316`:

```json
{
  "3b879ca2-b3c4-4fe8-8567-a1283a4a6c73": {
    "inScope": true,
    "reasons": [{ "code": "obligation.earTag.applicable.becauseEarTagCommodity", "explanation": "…" }],
    "records": [{ "fulfilmentId": "line0/unit0", "status": "optional" }]
  }
}
```

**Hop 3 — back out.** Three separate composite↔positional converters do this:

- `bridge/scope.js:81-85` (`leafRecordKeys`) —
  `fulfilmentIdToPath([commodityLine, unitRecord], 'line0/unit0', 'animalIdentifierEarTag')`
  → `['commodityLines', 0, 'animalIdentifiers', 0, 'animalIdentifierEarTag']`
  → pathKey `commodityLines[0].animalIdentifiers[0].animalIdentifierEarTag`. The
  trailing-integer regex `indexOfSegment` (`bridge/fulfilments.js:159`) strips the
  cosmetic token.
- `bridge/purge.js:36-46` (`wipedRecordKeys`) — the same conversion for wiped keys.
- `bridge/collection-complete.js:144` — the opposite direction:
  `instanceFulfilmentId(['commodityLines', 0, 'animalIdentifiers'], 0)` →
  `'line0/unit0'` (`bridge/fulfilments.js:178-189`).

Two more references matter here. The `recordCountEquals` invariant on `unitRecord`
references the count field by literal UUID (`fieldId: numberOfAnimals.id`,
`model/obligations/obligations.js:664-667`), consumed in
`checkRecordCountEquals` (`model/obligations/state-queries.js:119-145`). And
`requires.anyOfIds` lists the six identifier obligations as literal UUID strings
(`model/obligations/obligations.js:655-662`).

---

## 2. The proposal — option (c): evaluator keys by name, records by positional path

Option (c) does not change the evaluator's algorithm. It changes the **keys**:
obligation name instead of UUID, bare positional composites instead of tokened ones.

The algorithm is already defined over a *flat* record-map view: prefix enumeration
(`evaluator.js:299-358`), purge as key filtering (`:417-493`), and `applyTo`
closures over records-maps (`helpers.js:554-597`). That survives untouched.

The nested→flat walk survives too — it becomes the evaluator's input adapter, or an
`evaluate(answers)` entry point. What dies is the *re-keying* and the inverse.

### 2.1 Same two examples under (c)

The stored answers are **unchanged** — that is the point. With p-102 already
landed, the flat view the evaluator sees is:

```json
{
  "reasonForImport": "internalMarket",
  "commoditySelection": { "0": "Cow" },
  "numberOfAnimalsQuantity": { "0": 1 },
  "animalIdentifierEarTag": { "0/0": "UK123456789012" }
}
```

Three things to note about that view:

- The keys are the manifest `name`s — the same keys the store, the dispatch layer,
  the Mongo notification and the write-guard already use.
- The record ids are bare positional composites (`0`, `0/0`). The `line`/`unit`
  tokens are documented as "cosmetic and reversible — the evaluator treats a
  fulfilmentId as opaque; only the trailing integer carries the positional index"
  (`bridge/fulfilments.js:36-42`), so from scratch they would not exist.
- `numberOfAnimalsQuantity` is `1` (a number) because `modelValue` coerces it —
  a value transform owned by p-102, not p-101.

The gate under (c) is `equalsGate(reasonForImport, 'internalMarket', …)`, which reads
`fulfilments['reasonForImport']`. Gates already hold the obligation by binding, not
a UUID lookup ("a gate reads its trigger obligation by binding, so renaming it
touches one call site", `docs/decisions.md:39-41`), so the closure change is
`gateObligation.id` → `gateObligation.name` — seven read sites in
`model/obligations/helpers.js:101,157,182,243,264,322,381`.

The implications under (c), keyed by name:

```json
{
  "purposeInInternalMarket": { "inScope": true, "status": "mandatory", "reasons": ["…"] },
  "animalIdentifierEarTag": {
    "inScope": true,
    "records": [{ "fulfilmentId": "0/0", "status": "optional" }]
  }
}
```

Projection back to a pathKey is now a zip of the obligation's `within` chain with
the split indices — `'0/0'` + `[commodityLines, animalIdentifiers]` →
`commodityLines[0].animalIdentifiers[0].animalIdentifierEarTag`. No token regex, no
name lookup, no vocabulary reversal. `instanceFulfilmentId` becomes
`indices.join('/')`.

### 2.2 What dies, what changes, what survives (verified per module)

**Dies outright:**

- `bridge/fulfilments.js` as a module: `obligationByName` (`:48-50`),
  `segmentToken` + `GROUP_SEGMENT_PREFIXES` (`:42,69-71`), `indexOfSegment`
  (`:159`), `fulfilmentsToAnswers` (`:222-227` — already production-dead), and
  `answersToFulfilments` as a re-keying translator.
- The A→B→A round-trip test suite (`bridge/fulfilments.test.js`) — there is no
  longer a second shape to round-trip to.
- The composite↔positional conversion sites in `bridge/scope.js:81-85`,
  `bridge/purge.js:36-46`, `bridge/collection-complete.js:144`, replaced by the
  trivial zip.
- Four of the five duplicate name→obligation maps (p-113 renamed but did not
  consolidate them): `bridge/fulfilments.js:48`, `bridge/status.js:56`,
  `bridge/applicability.js:21`, `bridge/collection-complete.js:46`. The
  fulfilment/implication key IS the name, so the lookups vanish or collapse onto
  `flow/obligation-source.js:14`.

**Changes (mechanical but wide):**

- `model/obligations/evaluator.js` — `buildObligationsById:194-196` becomes
  by-name. Every `obligation.id` used as a fulfilment/implication key re-keys to
  `name`: `dropUnknownFulfilments:287-295`, `purgeStorage:466-493`,
  `buildImplications:535-544`, and the id-keyed internal maps at `:199-278`. The
  algorithm — fixpoint, prefix enumeration, projection — is untouched.
- `model/obligations/helpers.js` — the 7 closure reads above, plus
  `metadata.obligation` values (consumed by `bridge/applicability.js:34` and the
  reachability prover).
- `model/obligations/obligations.js` — `requires.anyOfIds:655-662` and
  `recordCountEquals.fieldId:665` can stay literal UUIDs **only if the `id` field
  is kept**. If ids are dropped entirely they become names. Names give the same
  declaration-order-free deferred resolution — they are just strings.
- `model/domain/index.js:106-116` — the registry re-keys from `x.id` to `x.name`
  (9 entries, one line each).
- The completeness sites that p-104 folded out of the old `model/engine/index.js`
  and into the bridge — `bridge/status.js` (`recordMap:169`,
  `leafInScopeForRecord:185`, `singletonFulfilled:204`) and
  `bridge/collection-complete.js:57,109-111` — swap `.id` for `.name`. The read-
  side queries in `model/obligations/state-queries.js` (`effectiveStatus:26`,
  `groupInvariantErrors` reads at `:70-145`) re-key too.
- `model/analysis/reachability.js` — the prover's records/dependsOn graph
  (`:70-146,503-506`) re-keys; the structure is unchanged.
- Tests: the evaluator, units and helpers model suites, plus the four bridge
  suites (`scope`, `status`, `collection-complete`, `applicability`). Many
  expectations are computed refs (`fulfilments[earTag.id]`) and re-key
  mechanically. The evaluator suites also contain hand-written flat-map literals
  that need rewriting — this is the bulk of the work.

**Survives:**

- The nested→flat enumeration walk (today `collectGroupedRecords`) in some form —
  the evaluator's algorithm needs a flat view. Stated honestly: (c) deletes the
  translation *layer* (re-key + inverse + tokens), not the *flattening*.
- The evaluator algorithm, all gate semantics, `effectiveStatus`,
  `groupInvariantErrors`, the write-guard and dispatch — all untouched.
- The `modelValue` number coercion (p-102).

**Behaviour:** intended byte-identical. The honest risk: the evaluator/helpers
tests that pin the behaviour are re-keyed in the same change, which weakens their
pinning power exactly while the internals move.

A golden-master harness de-risks this — evaluate a corpus of generated answers on
old and new, then compare projected scope/status/wipe output. The E2E suite and
the Mongo parity spec are unaffected observers on the answers side.

**Persistence: none.** Verified: `grep -rln fulfilments engine/ services/`
returns zero hits. Fulfilments are constructed per request inside the four bridge
call sites and never stored.

The session (yar/Redis), the Mongo notification (both mappers) and
`flow/fixtures/happy-path.json` are all answers-shaped and unchanged. The E2E
fixtures and specs drive pages and are unchanged.

---

## 3. The fallback — option (a′): name becomes the fulfilment key, thin renamed projection kept

Option (a′) keeps today's structure and drops only the UUID indirection. The flat
view for the same data:

```json
{
  "reasonForImport": "internalMarket",
  "commoditySelection": { "line0": "Cow" },
  "numberOfAnimalsQuantity": { "line0": 1 },
  "animalIdentifierEarTag": { "line0/unit0": "UK123456789012" }
}
```

The ear-tag implication is as today but keyed `"animalIdentifierEarTag"`, and the
records stay `[{ "fulfilmentId": "line0/unit0", "status": "optional" }]`.

**Changes:**

- key emission in the walk (`bridge/fulfilments.js:145,204` — `obligation.id` →
  `obligation.name`);
- `buildObligationsById` re-keys to name and `buildImplications` emits name keys
  (`evaluator.js:194-196,535-544`);
- the same 7 helper-closure reads as (c);
- the domain-map keying choice;
- every consumer of `state.obligations[x.id]` / `state.fulfilments[x.id]`
  (`bridge/status.js:169,185,204`, `bridge/collection-complete.js:109-111`,
  `model/obligations/state-queries.js:26,84,123`) swaps to `.name`.

Test expectations re-key via their computed refs. `requires.anyOfIds` can stay
UUID-literal — it resolves to obligation objects, not fulfilment keys.

**Stays:** the tokened composite ids and the segment machinery; the three
composite↔positional converters in scope/purge/collection-complete; the walk; and
the (test-only) inverse if wanted. The module is renamed out of "bridge" vocabulary
per the p-101 item text (a merge-born name, commit 0b39e3e).

**What it buys:** it kills the name↔UUID double re-key, and it lets four of the five
duplicate name→obligation maps collapse (finishing what p-113 renamed) — with no
evaluator-algorithm risk and a much smaller test-literal rewrite. The evaluator
suites' flat-map literals re-key from `[x.id]:` to name strings, but the record
shapes are untouched.

**What it leaves:** the composite-id token machinery and the three converters —
merge residue by Lane B's own analysis — plus a from-scratch reading in which
`line0/unit1` is still a re-encoding of indices the store has for free.

---

## 4. The versioning / A-B question

Sam's challenge: *are the UUIDs there to allow versioning / A-B testing of
obligations — a new version gets a new id while keeping the same name — and does
deleting the UUID layer foreclose that?*

The short answer is no. The evidence below shows the capability was never there,
and every realistic versioning mechanism survives without the UUID layer.

### 4.1 Evidence of what ids are actually used for today

**No version machinery exists.** `grep -rln "version\|supersedes\|variant" model/ bridge/`
returns zero files. No obligation carries a `version`, `supersedes`, `variant` or
date field. No manifest-selection switch exists. (The `schema_version: 1` in the
fixture is a fixture-file version, in `flow/`, not an obligation field.)

**The id policy in the docs is uniqueness, not versioning.**
`docs/add-a-field.md:46-47`: "`id` is a UUID and is the obligation's storage key.
Mint a fresh one (`uuidgen`); never reuse another obligation's id."
`docs/obligation-model.md:30`: the id is "The key under which the obligation's
value is stored in the flat `fulfilments` map, and the key the domain registry
uses." That is the complete stated purpose.

**Ids never leave the process.** Fulfilments — the only id-keyed data — are never
persisted (§2.2). Nothing user-facing, session-stored, Mongo-stored or E2E-visible
carries an obligation UUID. The full inventory of id use:

- evaluator internal maps + implication keys (`evaluator.js:194-296,535-544`);
- gate-closure reads + metadata (`helpers.js`);
- the domain registry (`model/domain/index.js:106-116`);
- `requires.anyOfIds` / `recordCountEquals.fieldId` (`obligations.js:655-667`);
- the reachability prover's graph (`model/analysis/reachability.js:70-146,503-506`);
- the bridge translation itself.

**"Same name, new id" is a build failure today.**
`model/obligations/coverage.test.js:117-126` asserts no duplicate names in the
manifest, with the comment: "Duplicate names silently corrupt every name-keyed
downstream… Mutation 11 in docs/testing.md is exactly this." The assertion is
`duplicatesOf(obligations, (obligation) => obligation.name)).toEqual([])`.

And it would. The five `new Map(...)`-over-name lookups — `obligationByName`
(`bridge/fulfilments.js:48`), `obligationByName` (`bridge/status.js:56`),
`obligationByName` (`bridge/applicability.js:21`), `byNameMap`/`byPathMap`
(`flow/obligation-source.js:14,21`) and `obligationByName`
(`bridge/collection-complete.js:46`) — would each last-win silently on a duplicate
name. Pages `collect` obligations by name, the answer-key guard recognises names
(`flow/obligation-source.js:90-136`), and the store is name-keyed.

So the hypothesised capability — two obligation versions distinguished by id under
one name — is **already foreclosed by the current system**, deliberately, by its own
guard. The UUID layer is not preserving it.

**The one id-evolution affordance never fires.** `dropUnknownFulfilments`
("tolerate-and-amend", `evaluator.js:287-295`) would tolerate stored fulfilments
whose id left the manifest — meaningful in a world that persists fulfilments. Here
the input map is rebuilt from answers on every call and contains only
current-manifest ids, so in production the branch is dead.

**A dual-key bug found while tracing.** This is cited as evidence of what two key
spaces cost. `bridge/status.js:159-160`'s `isValueFulfilled(name, value)` calls
`domain.get(name)` with the obligation **name**, but the domain registry is keyed
by **UUID** (`model/domain/index.js:106-116`, header line 4 "keyed by obligation
id"). The lookup always misses, so `statusOf` falls back to `!isBlankValue`
(`status.js:164`) for every top-level address — bypassing the partial-address
handling the file's own header (`status.js:26`) claims is in play.

Its one surviving sibling passes the UUID and hits
(`bridge/collection-complete.js:57`, called with `leaf.id` at `:91,:98`). (The
third sibling the earlier trace named lived in `model/engine/index.js`, which
p-104 deleted.) The miss is currently *load-bearing*: the domain's required
sub-fields (`name`, `addressLine1`, `town`, `postcode`, `country`, `telephone`,
`email` — `model/domain/index.js:31-39`) do not match the stored top-level address
composite shape (`{ name, address: { addressLine1… } }`,
`happy-path.json:39-47`), so a "fixed" lookup would mark every happy-path address
incomplete.

Whatever the p-101 ruling, this needs its own backlog item. It is cited here because
it is a concrete, current instance of the failure mode two parallel key spaces
create — the exact class a single-key design removes and a dual-key design keeps
generating.

### 4.2 What each option means for versioning/A-B if it is needed later

**Option (a) — status quo.** Keeping the UUID layer does **not** keep a versioning
capability, because the capability was never there. The name-unique guard, the
name-keyed store, and every name-keyed map above would all have to change before
"same name, two ids" could exist.

To get there you would effectively be choosing option (b) — id-keyed storage end to
end — which the backlog already rejects on the merits (hostile to controllers and
persistence). What (a) genuinely preserves is an inert indirection that a future
re-keying-to-ids programme could build on. The cost is carrying the translation
layer, the dual key space, and its bug class (§4.1, last bullet) indefinitely.

**Option (c) — name-keyed evaluator.** Forecloses only the simultaneous coexistence
of two same-named obligation versions *within one evaluation with separately keyed
storage* — a thing no current layer can feed or read, and which (a) forecloses too.

Every realistic versioning/experimentation mechanism survives unchanged, because
they operate at manifest level, not key level:

- **manifest-variant selection** — the evaluator already takes the manifest by
  injection (`createObligationEvaluator({ obligations })`, `evaluator.js:51-53`), so
  an A/B test is "build two manifests, choose per session/user at construction". It
  works identically under name or UUID keys.
- **versioned names** (`animalsCertifiedFor2`) when both versions must coexist as
  distinct data — works under both keyings, and is the only shape the name-keyed
  *store* could hold anyway.
- **behaviour-only versioning** (same name, new gate/status/allowlist) — a manifest
  edit, with no key involved.

If a *stable external identity* is ever needed — analytics continuity across a
rename, or cross-service manifest export — an `id` field can be reintroduced, or
simply kept, as inert metadata without being the storage key. Keeping the field
costs nothing under (c), and it also keeps `requires.anyOfIds` literal-id resolution
working as-is.

**Option (a′) — name-keyed fulfilments, projection kept.** Identical versioning
posture to (c). The fulfilment key is the name, so same-name multi-version storage
is out (as it already is), and manifest-level selection, versioned names and
metadata ids all remain available.

**The underlying trade, in one line:** UUID-keyed storage buys rename freedom
(change a name, ids and data survive); name-keyed storage buys identity legibility
(one key from page to store to evaluator). This system has already spent the rename
freedom. The store, Mongo notification, guard surface and page dispatch are
name-keyed, so renaming an obligation is a data migration today under every option,
including (a).

---

## 5. Comparison

| | (a) status quo | (a′) name-as-key, thin projection | (c) name-keyed evaluator, positional paths |
|---|---|---|---|
| **Modules changed** | 0 | ~10, few lines each: walk key emission (`fulfilments.js:145,204`), evaluator key maps (`evaluator.js:194-196,535-544`), 7 helper reads, domain map, `status.js`/`collection-complete.js`/`state-queries.js` `.id`→`.name` swaps, module rename out of `bridge/` | Those, plus: composite machinery deleted (`fulfilments.js` largely gone), 3 converter sites replaced by the zip, evaluator internal maps re-keyed, `model/analysis/reachability.js`, `obligations.js` anyOfIds (only if `id` field dropped) |
| **Tests touched** | 0 | Mechanical re-key of computed refs + evaluator flat-map literals (evaluator/units/helpers model suites; the four bridge suites); none deleted | Same suites; `fulfilments.test.js` deleted with the module; evaluator literals rewritten to name/positional shapes — the bulk of the effort |
| **Fixtures** | — | `flow/fixtures/happy-path.json`, canned data, E2E fixtures all unchanged (answers-shaped) | Same — unchanged |
| **Behaviour risk** | none | low — key substitution, structure identical | moderate — evaluator internals move while their pinning tests are re-keyed; mitigate with a golden-master corpus + E2E/parity (unchanged observers) |
| **Persistence impact** | none | none (verified §2.2) | none (verified §2.2) |
| **Merge residue removed** | none (p-113 map collapse still pending) | name↔UUID re-key + 4 of 5 duplicate name maps; tokens/converters stay | all of it: re-key, tokens, converters, inverse, duplicate maps |
| **Forecloses (versioning)** | nothing gained: same-name/new-id already blocked by `coverage.test.js:117-126` + name-keyed store; enabling it = option (b), already rejected | same-name multi-version storage (already blocked); manifest-selection A/B, versioned names, metadata ids all fine | identical to (a′); keep the `id` field as inert metadata at zero cost if external identity is ever wanted |
| **Dual-key bug class** | keeps it (live instance: `status.js:160` vs `model/domain/index.js:106` — §4.1) | removed for fulfilment/implication keys; `id` remains only as inert cross-ref | removed |

---

*Every JSON block above is fixture-verbatim or pinned by the cited test.
Regenerated against the current committed tip of the live-animals prototype in
`repos/trade-imports-animals-frontend` (unit suite ~1190 passing) after the p-102,
p-113, p-103 and p-104 refactors landed. Independent of the p-101 ruling, the
`status.js:160` domain-lookup miss (§4.1) warrants its own backlog item.*

# P-101 option (e): fulfilment as the persisted source of truth

This plan implements Sam's option (e) ruling. It does not reconsider whether the
name-keyed answers tree should also be persisted: it should not. The durable
journey state is one fulfilment document, and the current and proposed
notification documents are downstream projections of it
(`workareas/shared/promotion/decision-docs/p-101-option-e-direction.md:21-50`).

Unless a path starts with `workareas/`, `src/` or `docs/`, code citations in this
plan are relative to `prototypes/standalone/live-animals/`.

## At a glance

- Persist one canonical document, shaped as `{ id, fulfilment }`. Recommend that
  `fulfilment` is an array of obligation entries at rest, while the frontend
  deterministically decodes it to the evaluator's existing UUID-keyed map before
  every evaluation. This is structural deserialisation, not re-derivation from a
  notification. The evaluator still receives exactly the map documented at
  `model/obligations/evaluator.js:3-16` and returned at
  `model/obligations/evaluator.js:116-119`.

- Persist three separate resources for the same journey id: the canonical
  fulfilment, the current skeleton-compatible notification, and the full-fat
  proposed notification. All three frontend mappers start from the canonical
  fulfilment. The backend receives and stores the resulting documents; it does
  not own obligation-name, UUID, collection or commodity mapping
  (`workareas/shared/promotion/decision-docs/p-101-option-e-direction.md:34-50`;
  `services/persistence/records/notification-mapper.js:43-53,132-164,305-362`).

- Replace the documents feature's special `AUX_ENTRY_KEYS` allowance with two
  optional manifest obligations: `uploadId` and `filename`, both within the
  document-entry group. The real upload contract returns only `uploadId`; the
  frontend already owns the original `filename`. There is no returned storage
  `path` in the frontend or prototype contracts, so do not invent a path
  obligation in this increment
  (`features/documents/controller.js:367-415`;
  `services/document-uploads/real.js:21-69`;
  `src/server/accompanying-documents/controller/post/payload.js:38-50`).

- Keep `scanStatus` transient. Both frontends fetch it from the upload service
  when building the page model, and neither stores it in the document record.
  Persisting it would make a polled, time-varying service result look like user
  fulfilment and would go stale
  (`features/documents/controller.js:102-129`;
  `src/server/accompanying-documents/controller/page-model.js:19-32`).

- Treat `line0` and `line0/unit1` as durable identity only within one stored
  snapshot. Positional IDs are safe when every save atomically replaces the
  complete fulfilment and there are no per-record patches, external references,
  merges or reorder operations. They are not stable business identifiers across
  snapshots: removing array element 0 shifts every following position
  (`engine/write.js:65-75`; `bridge/fulfilments.js:91-113,155-169`).

- The biggest frontend risk is not decoding the array. It is making
  `fulfilmentsToAnswers` load-bearing for every render and controller. The
  inverse currently has no production caller, returns animal counts as numbers
  rather than the original HTTP strings, and cannot reconstruct completely
  empty started records
  (`bridge/fulfilments.js:212-227`;
  `bridge/fulfilments.test.js:67-93,167-172`;
  `workareas/shared/promotion/decision-docs/p-101-answers-shape.md:82-88`).

- Build in narrow, reversible increments: add upload obligations and remove the
  auxiliary-key exception; add the at-rest codec and golden equivalence tests;
  change the records port to save/load canonical fulfilments and rehydrate page
  answers; then rewrite and parity-test the current and full-fat projections.
  Only after Sam selects the backend branch should the frontend real adapter be
  wired to the three backend resource paths
  (`engine/persistence/records.js:8-31`;
  `package.json:45`;
  `workareas/shared/promotion/decision-docs/p-101-option-e-direction.md:81-90`).

- Do not preserve an empty `{ commodityLines: [{}] }` or an otherwise empty
  in-progress record. Groups have no stored fulfilment of their own and are
  inferred from descendant leaf records; Sam has explicitly accepted that loss
  (`bridge/fulfilments.js:18-23,139-148`;
  `bridge/fulfilments.test.js:167-172`;
  `workareas/shared/promotion/decision-docs/p-101-option-e-direction.md:52-54`).

## Encoding design

### The invariant at the evaluator boundary

The evaluator contract is fixed. A top-level scalar is stored directly under an
obligation UUID. A grouped leaf is stored under its obligation UUID as a
records-map keyed by composite fulfilment id. `dropUnknownFulfilments` iterates
the object's UUID entries, group discovery scans the keys of each records-map,
and purge returns another object in the same shape
(`model/obligations/evaluator.js:285-358,414-493`).

The in-memory evaluator shape therefore remains:

```json
{
  "<obligation UUID>": "<scalar or composite value>",
  "<grouped obligation UUID>": {
    "<composite fulfilment id>": "<value>"
  }
}
```

No persistence choice may change that input. In particular, an array at rest
must be decoded before calling `evaluate`; the evaluator must not learn about
Mongo encoding, entry arrays, envelopes, schema versions or mapper metadata
(`model/obligations/evaluator.js:51-72`).

### Encoding A: the current map at rest

The smallest persistence change is to store the evaluator map directly:

```json
{
  "id": "GBN-AG-26-ABC123",
  "fulfilment": {
    "d34e5f6a-7b8c-4d9e-8f01-2a3b4c5d6e7f": "internalMarket",
    "21f60718-192a-4d4e-8bcd-17e8f9a0b1c3": {
      "line0": "Cow"
    },
    "3b879ca2-b3c4-4fe8-8567-a1283a4a6c73": {
      "line0/unit0": "FIRST",
      "line0/unit1": "SECOND"
    }
  }
}
```

The scalar UUID is `reasonForImport`; the depth-1 UUID is
`commoditySelection`; the depth-2 UUID is `animalIdentifierEarTag`
(`model/obligations/obligations.js:246-250,526-530,703-711`). The current bridge
produces the depth-2 keys by walking `commodityLines[0].animalIdentifiers[0..1]`
and joining its `line` and `unit` segments
(`bridge/fulfilments.js:91-113`;
`bridge/fulfilments.test.js:148-164`).

Advantages:

- Loading can pass `document.fulfilment` directly to the evaluator with no
  decode step.
- The JSON is exactly the evaluator's current contract, so the first migration
  has a very small semantic surface.
- Whole-document replacement is straightforward. The current records port
  already replaces the entire answers object rather than updating one key
  (`services/persistence/records/stub.js:68-71`;
  `services/persistence/records/real.integration.test.js:162-180`).
- Every UUID and composite id is JSON-safe for the values currently produced.
  UUIDs use hyphens; composite ids use `/`, and the backend's primary store is
  MongoDB (`docs/backend.md:14-20`).

Costs:

- Obligation UUIDs and composite ids become dynamic Mongo field names. They are
  legal here, but individual querying, indexing and diagnostics must know
  property paths rather than ordinary fields.
- A version or provenance stamp for one obligation cannot be added beside its
  value without wrapping that value. Wrapping would stop the document being
  evaluator-ready and would require a decoder anyway.
- Validation must distinguish scalar objects such as addresses and date parts
  from grouped records-maps by consulting the manifest. Shape alone cannot do
  it: the evaluator deliberately treats any non-array object as a keyed record
  in its internal helper (`model/obligations/evaluator.js:646-648`), while
  top-level obligation values can themselves be objects.
- JavaScript object insertion order becomes part of byte-level golden tests if
  the persistence round-trip is required to reproduce `JSON.stringify` output,
  even though evaluator semantics do not depend on UUID order.

### Encoding B: an array of obligation entries at rest

Recommend an array with one entry per answered obligation, and one nested record
entry per answered group instance:

```json
{
  "id": "GBN-AG-26-ABC123",
  "fulfilment": [
    {
      "obligationId": "d34e5f6a-7b8c-4d9e-8f01-2a3b4c5d6e7f",
      "value": "internalMarket"
    },
    {
      "obligationId": "21f60718-192a-4d4e-8bcd-17e8f9a0b1c3",
      "records": [
        {
          "fulfilmentId": "line0",
          "value": "Cow"
        }
      ]
    },
    {
      "obligationId": "3b879ca2-b3c4-4fe8-8567-a1283a4a6c73",
      "records": [
        {
          "fulfilmentId": "line0/unit0",
          "value": "FIRST"
        },
        {
          "fulfilmentId": "line0/unit1",
          "value": "SECOND"
        }
      ]
    }
  ]
}
```

Use a discriminated structural rule rather than a `kind` string:

- a scalar entry has exactly `obligationId` and `value`;
- a grouped entry has exactly `obligationId` and `records`;
- one entry cannot have both `value` and `records`;
- `records` is never empty; an unanswered obligation is absent;
- obligation ids are unique within the array;
- fulfilment ids are unique within one `records` array.

Those rules mirror current omission behaviour. `answersToFulfilments` omits an
undefined scalar and omits a grouped obligation whose records-map is empty
(`bridge/fulfilments.js:115-123,139-148`).

The frontend codec owns two pure operations:

```text
encodeEvaluatorFulfilments(map) -> persisted entry array
decodePersistedFulfilment(entry array) -> evaluator map
```

`decodePersistedFulfilment` reconstructs the exact current map:

```json
{
  "d34e5f6a-7b8c-4d9e-8f01-2a3b4c5d6e7f": "internalMarket",
  "21f60718-192a-4d4e-8bcd-17e8f9a0b1c3": {
    "line0": "Cow"
  },
  "3b879ca2-b3c4-4fe8-8567-a1283a4a6c73": {
    "line0/unit0": "FIRST",
    "line0/unit1": "SECOND"
  }
}
```

That decoded object, unchanged, is the argument to
`createObligationEvaluator().evaluate(...)`
(`model/obligations/evaluator.js:51-72`). Loading the persisted fulfilment
straight into the evaluator still holds: decoding JSON storage syntax is
equivalent to unmarshalling a DTO, not reconstructing state from the current or
proposed notification.

Advantages:

- UUID, composite id and value are ordinary fields. Mongo diagnostics can
  inspect `fulfilment.obligationId` and
  `fulfilment.records.fulfilmentId` without treating ids as field names.
- Each obligation is an explicit version-bearing unit. The UUID already tells
  the frontend which obligation version wrote the value; future metadata such
  as `capturedAt`, `supersedes` or a mapper provenance stamp can be added to an
  entry without wrapping the evaluator value. No such stamp is required for v1:
  the UUID is the version signal Sam wants to preserve
  (`workareas/shared/promotion/decision-docs/p-101-option-e-direction.md:14-19,46-50`).
- A decoder can reject duplicate obligation ids and duplicate record ids rather
  than accepting last-write-wins object construction.
- The at-rest JSON makes scalar versus grouped storage explicit, which improves
  contract validation and logging.

Costs:

- Every read and write crosses a small codec. That codec is now load-bearing and
  needs property, malformed-input and byte-equivalence tests.
- Array order must be canonical if byte identity matters. Encode obligations in
  manifest order and records in their existing object-key order. Decode in the
  same order so `JSON.stringify(decoded)` matches today's
  `answersToFulfilments` output. The current bridge itself emits UUIDs in
  manifest order and records while visiting arrays in index order
  (`bridge/fulfilments.js:93-113,139-148`).
- Direct partial updates to one record are tempting with arrays but must be
  forbidden in this design. The frontend still writes a complete, evaluated
  snapshot.

### Recommendation

Choose Encoding B, the array of obligation entries, subject to Sam's final
sign-off.

It has one deliberate conversion at the storage boundary but gives the
persisted document an explicit, extensible versioning grain. The current map is
optimised for a JavaScript evaluator call; the array is a better database and
cross-service contract. The conversion is mechanical and exactly testable,
whereas bolting per-obligation metadata onto a dynamic-key map would eventually
create a second, less regular conversion.

Do not put names, labels, manifest status or current notification field paths in
the persisted entries. Persist only the durable keys and values. Names remain a
current-manifest projection; adding them would create two identity authorities
inside the canonical record.

Do not add an encoding version in the first payload unless the backend branch
already mandates one. The two allowed entry forms are enough to validate v1,
and the contract can add an optional top-level `schemaVersion` compatibly later.
The essential version stamp is the obligation UUID itself.

## Composite ids at rest

### What the ids mean today

`line0/unit1` is not an animal identifier. It is a serialisation of the current
answers positions: commodity line index `0`, animal identifier index `1`.
`collectGroupedRecords` generates each segment while visiting arrays, and the
inverse reads the trailing integer from each segment to rebuild array positions
(`bridge/fulfilments.js:91-113,155-169`).

The evaluator does need the composite shape. It:

- takes prefixes to discover line and unit instances
  (`model/obligations/evaluator.js:297-358`);
- uses a line prefix to project line-level commodity gates to unit records
  (`model/obligations/helpers.js:551-578`);
- compares exact ids for `anyOfIds` and counts unit ids below one parent
  (`model/obligations/state-queries.js:70-96,119-144`);
- filters one derived leaf record without removing its siblings
  (`model/obligations/evaluator.js:414-433`).

The evaluator's scheme must not change. Option (e) persists the same composite
ids the evaluator already consumes.

### Safety inside one atomic snapshot

Positional composite ids are internally consistent inside one complete
snapshot. All leaf record maps are generated from the same array positions, so
`commoditySelection["line0"]`, `numberOfAnimalsQuantity["line0"]` and
`animalIdentifierEarTag["line0/unit1"]` agree about the parent-child join. The
evaluator sees the entire map in one pure call
(`bridge/fulfilments.js:91-148`;
`model/obligations/evaluator.js:10-16,51-67`).

They are safe to persist under all of these conditions:

1. Every save is a full replacement of the fulfilment document, never a patch
   to one UUID or one record.
2. The complete snapshot is evaluated and purged before it is made durable.
3. All leaf maps in the snapshot use indices from the same projected answers
   tree.
4. No downstream system treats `line0` or `line0/unit1` as a business key.
5. The two notification projections are generated from exactly the same
   canonical snapshot, not from separately loaded or partially updated state.
6. Concurrent writers are prevented or detected at document level, for example
   with an ETag/`If-Match`; they are not merged by composite record id.

The current port's whole-map replacement behaviour supports condition 1
(`services/persistence/records/stub.js:68-71`;
`services/persistence/records/real.integration.test.js:162-180`). The new
contract must preserve it.

### Fragility across snapshots

Removing `commodityLines[0]` or `animalIdentifiers[0]` shifts later array
positions. The current mutators use `toSpliced`, so this is normal behaviour,
not a theoretical edge
(`engine/write.js:65-75`). On the next full assembly, an animal previously at
`line0/unit1` can become `line0/unit0`, and a line previously at `line1` can
become `line0`.

That is acceptable for evaluator addressing, but it means:

- a diff between two snapshots cannot assume equal composite ids mean the same
  real-world animal after a reorder;
- a partial record update against an old id can update the wrong record;
- an audit or notification comparison must compare business values and
  structure, not claim record continuity from `line0/unit1`;
- a projection written from snapshot N must not be paired with the canonical
  fulfilment from snapshot N+1.

### Are stable per-record ids needed?

Not for the option (e) increment as ruled. Stable record ids are only required
if a later requirement introduces per-record PATCH, reorder-with-identity,
concurrent merge, cross-document references or longitudinal audit at animal or
line grain. None of those operations exists in the records port: it exposes
whole-answer saves, and the evaluator contract is positional/composite
(`engine/persistence/records.js:8-31`;
`services/persistence/records/stub.js:68-71`).

Do not change the evaluator's id scheme and do not add a hidden stable-id to
composite-id translation in this build. That would weaken the "load straight
into the evaluator" property and introduce two record identities. Instead:

- document in the persisted contract that `fulfilmentId` is snapshot-local;
- prohibit record-level backend update APIs;
- use the journey `id` plus whole-document revision/ETag for concurrency;
- revisit stable line/unit ids only with a concrete partial-update or audit
  requirement.

## Rehydration and the answers projection

### Target load path

The target request path is:

```text
GET canonical fulfilment resource
  -> validate `{ id, fulfilment: entry[] }`
  -> decode entry[] to the evaluator's UUID-keyed map
  -> `evaluator.evaluate(decodedMap)`
  -> retain evaluator state `{ fulfilments, obligations }`
  -> `fulfilmentsToAnswers(state.fulfilments)` for page-shaped reads
  -> render controller and template
```

The evaluator is the first semantic consumer after storage decode. There is no
current-notification-to-answers or proposed-notification-to-answers hop. Today
the real adapter does the opposite: it GETs a notification and calls
`toAnswers(stripNulls(notification))`
(`services/persistence/records/real.js:31-56,74-108`). That reverse
notification path must leave journey rehydration.

Use the evaluator's returned, post-purge `state.fulfilments` for page projection,
scope, status and the next save. The evaluator first drops UUIDs absent from the
current manifest and then converges purge to a stable view
(`model/obligations/evaluator.js:67-119,136-186`). Keep the raw decoded snapshot
alongside the evaluated state only for version-detection diagnostics and
historic notification mapping; do not expose two mutable sources of truth.

The request-level journey object should become conceptually:

```js
{
  journeyId,
  userId,
  status,
  createdAt,
  submittedAt,
  fulfilment,     // decoded canonical evaluator map
  evaluation,    // request-local derived evaluator result
  answers         // request-local projection for existing page code
}
```

Only `fulfilment` is durable. `evaluation` and `answers` are rebuildable request
views. The current journey memo already guarantees at most one load per request
and deep-clones its result, so it is the right seam for this assembly
(`engine/journey.js:35-49,59-70`).

### What must round-trip losslessly

The storage codec and `fulfilmentsToAnswers` projection must retain:

- every answered scalar value, including arrays and composite address objects;
- every grouped value under its exact composite id;
- dates and other object-valued leaves without stringification;
- the number coercion the evaluator already sees for
  `numberOfAnimalsQuantity`;
- `uploadId` and `filename` once they are manifest obligations;
- blank-but-present values, because the bridge currently distinguishes
  `undefined` from `''`
  (`bridge/fulfilments.js:97-100,115-118`;
  `bridge/fulfilments.test.js:104-109`);
- unknown historic UUID entries in the raw persisted document, even though the
  current evaluator's recognised view drops them. Keeping them at rest is what
  lets a version-aware mapper detect and deliberately adapt old data
  (`model/obligations/evaluator.js:285-295`).

For a current-manifest snapshot, require:

```text
decode(encode(evaluatorMap)) deep-equals evaluatorMap
encode(decode(persistedArray)) equals its canonical normal form
```

For the migration golden corpus, require the stronger boundary assertion:

```text
JSON.stringify(decode(encode(answersToFulfilments(answers))))
  === JSON.stringify(answersToFulfilments(answers))
```

The corpus must cover top-level scalars, blank values, composite objects,
multi-line/multi-unit collections, all document leaves, upload metadata,
out-of-scope purge, and the `"25"` to `25` animal-count conversion. The existing
bridge suite already supplies most of these cases
(`bridge/fulfilments.test.js:47-110,116-226,235-287`).

### What is deliberately lost

Lose completely empty started collection records. A group carries no stored
value and the evaluator infers it only from descendant leaf records; an empty
array and `[{}]` therefore both flatten to `{}`. Sam has accepted this
(`bridge/fulfilments.js:18-23`;
`bridge/fulfilments.test.js:167-172`;
`workareas/shared/promotion/decision-docs/p-101-option-e-direction.md:52-54`).

Do not add sentinel obligations, placeholder records or an `isStarted` side
store to preserve them. A document that has uploaded successfully will not be
empty once `uploadId` and `filename` are obligations, but an untouched line,
unit or document entry with no answered leaf may still disappear.

Also accept that the original HTTP string form of a valid animal count is not
recoverable. The canonical evaluator value is numeric and the existing inverse
already returns that number. Controllers and validation must accept the
canonical number on GET and convert only when they genuinely require a string
(`bridge/fulfilments.js:73-85,212-217`;
`bridge/fulfilments.test.js:125-145`).

### Version-change detection

Persisted UUIDs make change visible, but detection must be explicit:

1. Build the current manifest UUID set at boot.
2. On load, compare persisted entry UUIDs with it before evaluation.
3. Record `unknownPersistedIds`, `missingCurrentIds` and duplicate-id contract
   errors separately. A missing current id normally means "not answered", not a
   migration error; an unknown persisted id is the version signal.
4. Feed the complete decoded map to the unchanged evaluator. Its existing
   tolerate-and-amend step drops unknown ids from the current evaluated view
   (`model/obligations/evaluator.js:67-72,285-295`).
5. Give notification projection registries access to the raw canonical entries
   as well as the current evaluated map. A mapper can then support a known
   historic UUID deliberately. Do not silently copy an unknown old value into a
   new UUID merely because the manifest names match; that would erase the
   version boundary Sam is preserving.
6. On the next successful user write, persist the evaluated current view plus
   any explicitly migrated historic values. Whether an unknown value is
   migrated, retained in an archival entry or rejected needs a version-specific
   rule, not a generic evaluator change.

There is no current version migration registry in the codebase. This plan
creates the detection seam and preserves data; individual old-to-new
adaptations should be separate, tested changes when a real obligation version
exists.

### Consumer migration table

| Current consumer | Current read | Option (e) read | Required change and evidence |
|---|---|---|---|
| `engine/journey.js` and the records port | Loads and memoises a journey whose durable payload is `answers`; saves with `saveAnswers` (`engine/journey.js:59-81`; `engine/persistence/records.js:8-31`). | Reads/writes the canonical fulfilment resource. | Rename the port operation to `saveFulfilment` or `replaceFulfilment`; make the stub store the same canonical shape as real mode; memoise the decoded fulfilment and derive request views once. Do not leave `answers` in the port DTO. |
| `engine/read.js` | Destructures `journey.answers` and calls `makeScope(answers)` (`engine/read.js:8-14`). | Reads evaluator state directly and returns a projected `answers` view for page compatibility. | Change the read facade to call the shared assemble/evaluate/project facade once. It should return `{ journey, fulfilment, evaluation, answers, scope }`, with only the fulfilment coming from persistence. |
| Scalar feature controllers | Read named fields from `answers` and commit named patches, for example import reason (`features/import-reason/controller.js:40-54`) and declaration (`features/declaration/controller.js:42-64`). | Read the fulfilment-to-answers projection. Writes go through feature-owned UUID bindings. | Keep controller and form vocabulary readable. During migration, the facade may project, patch and reassemble; the end state uses the feature binding to update the UUID entry. UUIDs must not leak into form field names. |
| Collection feature controllers | Read and mutate positional arrays. Commodities append nested units; documents append a record containing upload metadata (`features/commodities/animal-identification.controller.js:478-517`; `features/documents/controller.js:398-415`). | Read projected arrays; feature bindings assemble the relevant UUID records-maps. | Keep positional page paths and shared composite-id mechanism. Re-evaluate and replace the whole canonical snapshot after every mutation. |
| Generic templates | Receive form values and prepared page models from controllers. Check answers, for example, passes `sections`, not the raw store (`features/check-answers/controller.js:525-535`). | Unaffected: still receive page-shaped view models. | No UUID or fulfilment encoding in Nunjucks. Template E2E output is a regression observer of the new projection. |
| `features/check-answers/controller.js` | Reads virtually every nested named value, uses positional `collectionView` for lines, units and documents, and builds display cards (`features/check-answers/controller.js:119-182,184-283,433-523`). | Reads `fulfilmentsToAnswers(evaluatedFulfilment)`. | This is the broadest render-back acceptance test. Add a fixture asserting the same sections/cards before and after canonical round-trip, including multiple commodities, multiple units and upload metadata. |
| Hub | Uses named answers for task status and commodity totals (`features/hub/controller.js:91-127,129-144`). | Hybrid: evaluator state directly for scope/status; projected answers for display totals until totals get a UUID reader. | Do not re-evaluate per row. Pass one request-level evaluation through `rowStatus`/`sectionStatus`; keep totals on the page projection initially. |
| `bridge/scope.js` | Rebuilds fulfilments, evaluates, projects implications to page paths, then scans answers for `answered()` (`bridge/scope.js:35-63,92-118,166-174`). | Evaluates canonical fulfilment directly; projects implications with feature-owned descriptors. | Remove `answersToFulfilments` from this path. `answered()` should query the relevant UUID records-map, with projected answers retained only for the two flow-only concerns until their treatment is settled. |
| `bridge/status.js` | Rebuilds/evaluates fulfilments, but also reads nested answers to decide "started" and for flow-only fallback (`bridge/status.js:148-154,197-205,334-345`). | Reads the request evaluation directly; uses canonical presence for started/fulfilled. | Replace name lookups with binding descriptors/UUIDs. Optional upload leaves may make a document "started" but cannot make it incomplete because their status is optional. Handle `declaration` explicitly as described under open items. |
| `bridge/purge.js` | Converts answers to fulfilments, evaluates, diffs maps and converts wiped composite ids to answer paths (`bridge/purge.js:29-69`). | Takes the decoded canonical map, evaluates it and persists `state.fulfilments`. | The canonical purge is simply input map to evaluator output map. Keep path projection only to update the request-local answers view and error/view state; it no longer deletes from a durable answers tree. |
| `bridge/collection-complete.js` and `engine/evaluate/collection-view.js` | Reads positional entries, converts index to composite id, and independently rebuilds/evaluates the whole fulfilment (`bridge/collection-complete.js:128-151`; `engine/evaluate/collection-view.js:5-21`). | Reads projected entries plus the already computed request evaluation. | Change `entryComplete` to accept evaluation state and a binding/composite descriptor. Avoid one evaluation per entry. Optional upload leaves are ignored by mandatory completeness checks. |
| `flow/task-rows.js`, `flow/section-status.js`, readiness and gates | Pass nested answers and scope to status roll-ups (`flow/task-rows.js:61-67`; `flow/section-status.js:8-13`). | Pass request evaluation plus projected answers only where presentation needs them. | Keep the public five-way status and navigation behaviour. Update signatures in one facade rather than teaching flow modules about at-rest arrays. |
| `flow/obligation-source.js` | Validates names in the durable answers tree and special-cases `uploadId`/`filename` (`flow/obligation-source.js:44-87,113-155`). | Becomes binding/manifest coverage validation, not persistence-schema validation. | Delete `AUX_ENTRY_KEYS` after the upload obligations land. Add boot checks that every non-group manifest UUID is owned exactly once by a feature binding, as option (d) requires. |
| `engine/evaluate/cardinality.js`, `lib/path.js`, collection views | Read positional arrays by named paths (`engine/evaluate/cardinality.js:17-25`; `lib/path.js:18-30`). | Read the projected answers tree. | Unaffected initially. These are page-model mechanics, not persistence. Their tests become render-back regression tests. |
| Current notification mapper | Reads nested answers and reshapes them into backend fields (`services/persistence/records/notification-mapper.js:166-220`). | Reads canonical fulfilment through UUID/scalar/record helpers. | Rewrite the forward mapper. Delete both notification-to-answers functions from rehydration once no remaining caller needs them. Keep reverse functions temporarily only as mapper parity or migration test fixtures. |
| Dashboard/list/confirmation lifecycle | Uses journey id/status/timestamps; confirmation displays `journeyId` as the reference (`engine/journey.js:84-103`; `features/confirmation/controller.js:20-29`). | Unaffected by fulfilment encoding. | The list resource should not need to load/decode full fulfilments merely to show metadata. Existing submit/amend freeze semantics stay on the journey lifecycle. |
| Entry guard and import-type filter | Treats `importType` as service routing, explicitly not notification data, and notes it does not survive real-mode round-trip (`flow/entry-guard.js:23-40`; `features/import-type-filter/controller.js:47-69`). | Use opening-run/session state for entry routing; do not put `importType` in canonical notification fulfilment. | This is not an accepted data-loss expansion: the current code already defines it as non-notification state. Remove its accidental dependence on projected durable answers during the port change. |

### Making `fulfilmentsToAnswers` production-grade

The current inverse is generic and compact: it iterates the manifest, finds
each UUID, reverses composite ids into positional paths, and calls `setAt`
(`bridge/fulfilments.js:191-227`; `lib/path.js:24-30`). Before using it on every
GET:

- fail validation if a persisted composite id does not have the depth expected
  by the obligation's `within` chain;
- fail validation if a segment has no trailing numeric index; the current
  `Number(undefined)` path can otherwise produce `NaN`
  (`bridge/fulfilments.js:155-169`);
- reject duplicate array entries in the storage decoder;
- define sparse or out-of-order index behaviour. Recommend accepting
  out-of-order records but canonicalising by numeric index, and rejecting gaps
  that would create sparse page arrays;
- prove collision behaviour when different leaves create the same record
  object;
- include upload leaves and all object-valued obligations in round-trip tests;
- add controller/view golden tests, because a deep-equal answers object alone
  does not prove form widgets accept canonical number/object types.

The inverse should be renamed as a page projection, for example
`projectAnswers(fulfilment)`, once it is load-bearing. Its old name suggests an
equally authoritative second store. Keep the implementation pure.

## Upload returns as optional obligations

### What the upload path actually returns and stores

The prototype creates the user-entered document fields, derives document type
and attachment type, starts the upload, and appends:

```js
{
  accompanyingDocumentReference,
  accompanyingDocumentDateOfIssue,
  accompanyingDocumentType,
  accompanyingDocumentAttachmentType,
  uploadId,
  filename
}
```

The append is at `features/documents/controller.js:398-415`. The real upload
service's initiate response is destructured as `{ uploadId }`; after posting the
file it returns only that string
(`services/document-uploads/real.js:21-69`;
`services/document-uploads/real.test.js:23-50`).

The production skeleton agrees. `uploadDocument` returns the initiated
`uploadId`, and `buildSessionDocument` stores `uploadId`, the original
`filename`, document type, reference and date
(`src/server/accompanying-documents/controller/post/upload.js:38-54`;
`src/server/accompanying-documents/controller/post/payload.js:38-50`).

There is no backend-returned file path in either contract. The prototype
constructs a frontend download URL from `uploadId`; the real client streams from
`/document-uploads/{uploadId}/file`
(`features/documents/controller.js:171-177,330-336`;
`services/document-uploads/real.js:90-96`). A derived HTTP route is not durable
upload metadata.

### Manifest additions

Add two fresh-UUID declarations next to the four existing document leaves:

```js
export const documentUploadId = {
  id: '<new UUID>',
  name: 'uploadId',
  within: documentEntry,
  status: 'optional'
}

export const documentFilename = {
  id: '<new UUID>',
  name: 'filename',
  within: documentEntry,
  status: 'optional'
}
```

In the current file the document-entry group is exported as `documents`, so the
literal implementation is `within: documents` unless that local manifest
binding is first renamed or aliased to `documentEntry`. Do not change the stored
collection name: it remains `documents`
(`model/obligations/obligations.js:797-833`).

Add both leaves to the manifest array immediately after the four existing
document leaves. Mint fresh UUIDs; do not reuse an existing obligation id. The
manifest order does not affect evaluation, but keeping one feature's leaves
together makes encoding order, ownership and review clear
(`model/obligations/obligations.js:836-890`).

Then:

- remove `AUX_ENTRY_KEYS.documents` from `flow/obligation-source.js`;
- update the manifest/dispatch/feature-binding coverage tests so the documents
  feature owns both UUIDs through its existing `collects: ['documents']`
  declaration (`features/documents/controller.js:42`);
- update bridge golden cases so both values round-trip rather than confirming
  `filename` drops. The current test explicitly pins that drop
  (`bridge/fulfilments.test.js:235-287`);
- decide whether either notification projection includes the upload fields.
  The canonical fulfilment must include them. The current skeleton notification
  does not have document storage at all; the proposed Mapper B documents
  currently contain only type, attachment type, reference and date
  (`services/persistence/records/notification-mapper.js:400-420`;
  `services/persistence/records/notification-mapper.test.js:447-473`). Preserve
  those projection contracts unless the proposed notification schema is
  explicitly extended.

Do not add `path` in v1. If a later upload endpoint returns a stable storage
object key or URI and the journey genuinely needs to resume it, add a third
optional obligation with a precise name such as `uploadPath`; do not persist the
frontend download URL.

### Why `scanStatus` stays transient

`scanStatus` is fetched on each page load and merged only into the page's
collection-view item, not the stored `entry`
(`features/documents/controller.js:102-121`). The skeleton does the same
(`src/server/accompanying-documents/controller/page-model.js:19-32`). It can
move from `PENDING` to `COMPLETE` or `REJECTED` without any user answer changing,
and service failure is deliberately displayed as pending.

Therefore:

- do not add a `scanStatus` obligation;
- do not include it in canonical fulfilment;
- do not include it in current or proposed notification projections;
- continue to derive it after rehydrating `uploadId` and `filename`.

This makes resume correct: the durable upload handle survives, and the latest
scan state is read from its authority.

### Evaluator transparency

These optional leaves require no evaluator, helper or state-query algorithm
change:

- evaluator construction iterates every manifest obligation and builds
  hierarchy/category maps from `id` and `within`
  (`model/obligations/evaluator.js:51-64,194-278`);
- a leaf with `status` and no `applyTo` is classified as `field`
  (`model/obligations/evaluator.js:224-244`);
- a grouped field implication enumerates the parent document instances and
  stamps the leaf's declared status on each record
  (`model/obligations/evaluator.js:566-579`);
- purge retains an in-scope field records-map and removes it only when empty
  (`model/obligations/evaluator.js:436-457,466-493`);
- collection completeness blocks only mandatory leaves; optional records do not
  block either empty-entry or belonging-record checks
  (`bridge/collection-complete.js:82-96`);
- task status skips an in-scope leaf that is not mandatory
  (`bridge/status.js:261-269`);
- group max-entry completeness still counts inferred document records, and the
  cap remains 10 (`model/obligations/state-queries.js:40-68`;
  `model/obligations/obligations.js:797-805`).

An upload-only document will now be a visible evaluator group instance because
group instances are inferred from any descendant records-map. That is correct:
it is started, but the four mandatory document leaves keep it incomplete. A
completely empty document entry still has no descendant record and is lost, as
Sam accepted.

## The three frontend mappers

### Shared mapper boundary

Put the three forward mappers behind one frontend persistence module. Each
accepts a canonical context:

```js
{
  id,
  rawFulfilment,       // decoded map, including historic UUIDs
  evaluatedFulfilment // current evaluator's post-purge map
}
```

The canonical mapper uses the evaluated current map for new writes but must not
silently erase unknown historic entries merely by reading. The notification
mappers normally use the evaluated map; a version-specific mapper may
deliberately consult a known historic UUID in `rawFulfilment`.

Provide shared, read-only helpers:

```text
scalar(obligation) -> value | undefined
records(obligation) -> Map<fulfilmentId, value>
recordIds(group) -> ordered composite ids
recordsForPrefix(obligation, prefix) -> values below a line/unit
projectCollection(groupDescriptor) -> logical line/unit/document records
```

These helpers accept obligation objects imported by the owning feature/mapper,
not names looked up through a global `obligationByName`. That is where option
(d)'s feature-owned UUID bindings become the natural vocabulary.

### Mapper 1: canonical fulfilment

Responsibility:

```text
evaluated UUID map -> validate -> canonicalise order -> encode entry array
```

Output:

```json
{
  "id": "GBN-AG-26-ABC123",
  "fulfilment": [
    {
      "obligationId": "d34e5f6a-7b8c-4d9e-8f01-2a3b4c5d6e7f",
      "value": "internalMarket"
    }
  ]
}
```

It is identity at the semantic level: no value conversion, no grouping into a
notification, no name lookup and no loss. It only converts the evaluator's
dynamic object keys to ordinary entry fields. The reverse decoder supplies the
exact current map to the evaluator.

Validation must reject:

- missing or mismatched top-level `id`;
- non-array `fulfilment` for Encoding B;
- duplicate `obligationId`;
- both/neither `value` and `records`;
- duplicate `fulfilmentId` within one obligation;
- malformed composite-depth for a current manifest grouped leaf;
- a `records` form for a current scalar or `value` form for a current grouped
  leaf.

Unknown UUIDs are not malformed merely because the current manifest does not
recognise them. They are the version signal, and the evaluator already has a
tolerate-and-amend rule for them
(`model/obligations/evaluator.js:285-295`).

### Mapper 2: current notification

Today `answersToNotification` maps the nested name-keyed answers tree. It has
four different transform classes:

1. direct renames into top-level backend fields, including addresses,
   destination, consignment contact and CPH
   (`services/persistence/records/notification-mapper.js:166-177`);
2. grouping into `origin`, `additionalDetails` and `transport`, including date
   parts to ISO and the mutually exclusive transporter object
   (`services/persistence/records/notification-mapper.js:31-41,96-130,179-220`);
3. grouping line-per-species page records by commodity, summing complement
   totals while retaining raw per-species counts
   (`services/persistence/records/notification-mapper.js:47-66,136-164`);
4. intentionally lossy unit mapping: only the first unit's ear tag and passport
   are put on a species entry
   (`services/persistence/records/notification-mapper.js:68-93`).

Rewrite the public mapper to:

```text
fulfilment UUID map + journey id -> current notification
```

Use the envelope `id` as `referenceNumber`; do not depend on the legacy
`answers.referenceNumber` system key. The wrapper already treats
`journeyId`/reference number as record identity
(`services/persistence/records/real.js:47-55,85-100`).

For scalars, replace `answers.someName` with `scalar(importedObligation)`.
For collections:

- enumerate line ids from the union of commodity descendant record maps, using
  the same prefix rules as the evaluator;
- join `commoditySelection`, type, species, animal count and package count by
  exact line id;
- enumerate unit ids under each line prefix and join identifier leaves by exact
  unit id;
- then run the existing backend-specific group-by-commodity, type-label,
  species-label, date, sum and first-unit transforms.

Do not "improve" Mapper A while changing its input. Its known loss is part of
the current projection contract: later commodity identity, extra units,
tattoo/horse-name/free-text identifiers and documents have no home
(`services/persistence/records/notification-mapper.js:223-251`;
`services/persistence/records/notification-mapper.test.js:270-338`).

Quantitatively, this is more than replacing property access:

- roughly the direct scalar/origin/additional/transport fields can use a shared
  UUID scalar reader;
- the commodity path must replace one nested-array input with a multi-UUID join
  at depth 1 and depth 2;
- all of Mapper A's grouping, summing, label resolution and lossy field
  selection remains;
- reverse `notificationToAnswers` is no longer a production load path.

Parity gates:

- for every existing Mapper A fixture,
  `newFulfilmentToCurrent(answersToFulfilments(answers), id)` must deep-equal the
  old `answersToNotification({ ...answers, referenceNumber: id })`;
- retain the skeleton-equivalence test against the real skeleton payload
  (`services/persistence/records/skeleton-equivalence.test.js:206-242`);
- explicitly pin all known losses so a direct UUID mapper does not accidentally
  turn Mapper A into Mapper B.

### Mapper 3: full-fat proposed notification

The full-fat shape is not an external JSON file in this worktree. It is Mapper B
in `services/persistence/records/notification-mapper.js`,
`answersToTargetNotification`, with its executable shape pinned by
`notification-mapper.test.js`
(`services/persistence/records/notification-mapper.js:305-362,400-467`;
`services/persistence/records/notification-mapper.test.js:439-526`).

It is Mapper A plus:

- `responsiblePersonForLoad`, `purpose`, `declaration` and
  `origin.regionCode`;
- means, identification, document reference and transit countries under
  transport;
- a `commodityCode` and name per complement, preserving every commodity group;
- all unit identifier records and all seven identifier/permanent-address
  values;
- typed document entries
  (`services/persistence/records/notification-mapper.js:309-350,400-466`).

Rewrite it as:

```text
fulfilment UUID map + journey id -> full-fat proposed notification
```

Reuse the new current-notification builder for the common skeleton subset, then
layer the full-fat UUID reads onto it, as Mapper B does today
(`services/persistence/records/notification-mapper.js:441-466`). Reuse the same
logical line/unit join; do not independently decode composite ids twice.

Preserve these tests:

- full round-trip equivalence at the *logical projection fixture* boundary while
  the old reverse mapper remains available
  (`services/persistence/records/notification-mapper.test.js:439-445`);
- Mapper B contains every field Mapper A produces
  (`services/persistence/records/notification-mapper.test.js:514-526`);
- every commodity complement retains its code/name and every unit record
  (`services/persistence/records/notification-mapper.test.js:475-499`);
- document type, attachment type, reference and date keep their typed homes
  (`services/persistence/records/notification-mapper.test.js:447-473`).

The new upload obligations belong to canonical fulfilment but should not be
silently added to Mapper B's document shape. Mapper B currently promises typed
notification documents, not upload-session persistence. Extend it only after
the proposed backend notification contract has explicit fields.

### One source snapshot, three writes

On every durable mutation:

1. evaluate the candidate canonical map;
2. freeze the exact post-purge map as the source snapshot for this save;
3. map and PUT the canonical fulfilment;
4. map and PUT the current notification projection;
5. map and PUT the full-fat projection.

All three mapper calls must use the same in-memory snapshot. Never reload
between them.

The three HTTP writes cannot be atomic without backend orchestration, which
Sam's ruling does not ask the backend to own. Make each PUT idempotent, use the
same journey id, and retry failed projections. Canonical success is the
authoritative save; projection failure must be visible and repairable rather
than rolling the frontend back to an older canonical state. This leaves a
temporary cross-resource consistency window, called out under risks.

## Backend endpoint contracts

This work spans `trade-imports-animals-backend`, a Spring Boot/OpenAPI service
with MongoDB (`docs/backend.md:1-20`). Do not choose or merge a backend branch
until Sam confirms which candidate to build on
(`workareas/shared/promotion/decision-docs/p-101-option-e-direction.md:81-90`).

The workspace REST rule requires kebab-case, plural noun resources, verb-free
URLs and idempotent replacement with `PUT`
(`docs/best-practices/rest-api/rest-api.md:11-32,46-60`).

Treat "three endpoints" as three resource paths. Each path supports `PUT` for
full replacement and `GET` for inspection/rehydration; it is still one resource
endpoint per persisted shape.

### Canonical fulfilment resource

```http
PUT /fulfilments/{id}
Content-Type: application/json
If-Match: "<etag>"             # after the first write, if branch supports ETags

{
  "id": "GBN-AG-26-ABC123",
  "fulfilment": [
    {
      "obligationId": "d34e5f6a-7b8c-4d9e-8f01-2a3b4c5d6e7f",
      "value": "internalMarket"
    }
  ]
}
```

Contract:

- `{id}` and body `id` must be identical; mismatch is `400`.
- `PUT` creates or fully replaces that id. Repeating an identical request is
  idempotent and returns the same representation/ETag.
- Return `201` plus `Location` on first creation, `200` or `204` on replacement.
- `GET /fulfilments/{id}` returns the exact stored object and an ETag; `404` if
  absent.
- A stale `If-Match` returns `412` or the backend's standard optimistic-lock
  conflict. Do not merge array entries server-side.
- The backend validates transport schema and uniqueness constraints only. It
  does not translate UUIDs, know the current manifest, evaluate scope or build
  answers.

This is the only resource used for journey rehydration.

### Current notification resource

```http
PUT /notifications/{id}
Content-Type: application/json

{
  "referenceNumber": "GBN-AG-26-ABC123",
  "...": "the current Mapper A notification fields"
}
```

Contract:

- `{id}` and `referenceNumber` must agree.
- The body is exactly the current notification shape produced by the frontend
  mapper, including its known omissions and grouping
  (`services/persistence/records/notification-mapper.js:132-220`).
- `PUT` fully replaces the projection for that id and is idempotent.
- `GET /notifications/{id}` returns the stored projection for comparison and
  existing consumers, but frontend journey resume must not map it back to
  answers.
- Lifecycle operations such as submit/amend must remain separate from this data
  replacement contract. The current `/notifications/{id}/submit` and `/amend`
  paths are verb-style legacy paths at
  `services/persistence/records/real.js:141-156`; changing lifecycle API design
  is outside P-101.

If the selected backend branch cannot change the existing POST-upsert contract
immediately, add `PUT /notifications/{id}` as the new idempotent projection
operation and keep old POST only for compatibility during migration.

### Full-fat proposed notification resource

```http
PUT /proposed-notifications/{id}
Content-Type: application/json

{
  "referenceNumber": "GBN-AG-26-ABC123",
  "...": "the full-fat Mapper B fields"
}
```

Contract:

- `{id}` and `referenceNumber` must agree.
- The body is exactly the Mapper B superset currently defined in frontend code,
  including per-complement identity, full unit arrays and typed documents
  (`services/persistence/records/notification-mapper.js:305-467`).
- `PUT` fully replaces and is idempotent.
- `GET /proposed-notifications/{id}` returns it for side-by-side comparison.
- The backend stores what it receives. It must not prune unknown Mapper B fields
  as the current backend does; the present loss is documented in
  `services/persistence/records/notification-mapper.test.js:546-620`.

### Id minting and empty journeys

Keep the journey id/reference semantics: one `GBN-AG-YY-XXXXXX` value identifies
all three resources. The current real adapter obtains it by posting an empty
notification and then uses it as `journeyId`
(`services/persistence/records/real.js:85-100`).

Do not add special persistence for an empty canonical fulfilment. The frontend
may obtain an id to support navigation and upload initiation, but it should
write the three projection resources only once there is an answered fulfilment.
If a minted-but-empty journey is later absent from canonical storage, treat it
as not resumable; this is Sam's accepted loss. The selected backend branch must
settle whether id minting remains `POST /notifications` or becomes a separate
noun resource, but that does not change the three replacement contracts.

## Where option (d) lands

Persisting fulfilments removes option (d)'s main awkwardness. UUID bindings are
no longer a temporary evaluation translation from a name-keyed durable store;
they define how a feature reads and updates the durable state itself
(`workareas/shared/promotion/decision-docs/p-101-option-e-direction.md:74-79`).

### Feature-owned responsibilities

Each feature owns:

- the manifest obligation objects/UUIDs for fields it collects;
- the page-name to UUID association;
- its collection path and composite-id descriptor;
- any field-specific conversion, notably animal count string to number;
- how a page patch updates its UUID scalar or records-map;
- how evaluator implications/projected purge ids become its page paths.

For example, commodities owns
`commodityLines[*].animalIdentifiers[*].animalIdentifierEarTag` and the ear-tag
UUID; documents owns all six document leaves after the upload additions. The
current controllers already own those writes
(`features/commodities/animal-identification.controller.js:478-517,575-598`;
`features/documents/controller.js:398-449`).

### What remains central

Keep one shared assemble/evaluate/project facade responsible for:

- registering feature bindings;
- failing boot on missing or duplicate UUID ownership;
- merging feature contributions into one complete evaluator map;
- calling the evaluator once per consultation;
- retaining the request-level evaluation;
- diffing input/output fulfilment for purge;
- projecting evaluator state into scope, status and collection completeness;
- invoking the three persistence mappers from one frozen snapshot.

Cross-feature gates make this global call necessary. The evaluator is constructed
with the whole manifest and gate closures read the shared map
(`model/obligations/evaluator.js:51-67`;
`model/obligations/obligations.js:582-619`).

Keep one small shared composite-id utility for:

- formatting declared group tokens and indices;
- splitting a composite id;
- validating depth;
- converting declared group paths back to page positions.

This is mechanism, not field ownership. The current generic functions are at
`bridge/fulfilments.js:58-71,155-189`.

### What dissolves

Delete, after golden parity:

- the global manifest-inference walk that discovers every input binding from
  `obligation.name`, `id` and `within`
  (`bridge/fulfilments.js:48-71,125-148`);
- repeated `answersToFulfilments` calls in scope, status, purge and collection
  completeness
  (`bridge/scope.js:108-111`;
  `bridge/status.js:334-345`;
  `bridge/purge.js:64-69`;
  `bridge/collection-complete.js:42-43`);
- the idea that `fulfilmentsToAnswers` is an inverse persistence mapper. It
  survives, strengthened and renamed, only as the shared page projection;
- `AUX_ENTRY_KEYS`, because upload metadata becomes manifest-owned
  (`flow/obligation-source.js:60-65`);
- notification-to-answers as the normal load path
  (`services/persistence/records/real.js:47-56`).

The central facade does not dissolve. Neither does composite identity. Option
(d) changes ownership of bindings; option (e) gives those bindings a canonical
persistence home.

## Staged build plan

Every increment should be independently reviewable, with
`npm run test:live-animals` as the minimum gate. That script runs the complete
prototype Vitest tree (`package.json:45`; `docs/testing.md:10-17`). Run the
browser suite for increments that change request/runtime behaviour:

```sh
npm run test:prototype -- -g "live-animals"
```

The live-animals E2E spec covers the rendered journey, collections, documents,
check answers, declaration, confirmation and amend flow
(`docs/testing.md:97-107`).

### Increment 0: characterise current boundaries

Goal: create safety nets before changing production paths.

Work:

- Add a fixture corpus around `answersToFulfilments`, evaluator output,
  `fulfilmentsToAnswers`, Mapper A and Mapper B.
- Include at least: blank scalar; composite addresses; all conditional scalars;
  two commodities; two species on one commodity; two units on one line; all
  identifier leaves; two documents; current upload metadata; a partial record;
  an empty record; and a gate flip that purges a scalar and a nested leaf.
- Snapshot both semantic deep equality and stable `JSON.stringify` output for
  evaluator input/output.
- Record existing Mapper A and Mapper B output from the same corpus.

Verification:

- Existing `bridge/fulfilments.test.js`,
  `notification-mapper.test.js`,
  `skeleton-equivalence.test.js`, scope/status/completeness suites and
  `engine/commit-purge-authority.test.js` remain green.
- New golden tests pass without production changes.

Exit criterion: there is a fixed oracle for "the same evaluator map and the
same two notification projections".

### Increment 1: add upload-return obligations

Goal: make the current answers-to-fulfilment map complete before it becomes
durable.

Work:

- Add `documentUploadId`/`uploadId` and
  `documentFilename`/`filename` with fresh UUIDs, `within` the document-entry
  group and `status: 'optional'`.
- Add them to the manifest array and documents feature binding/coverage.
- Remove `AUX_ENTRY_KEYS.documents`.
- Update document bridge tests so `uploadId` and `filename` survive
  answers-to-fulfilments-to-answers.
- Add evaluator/status/completeness tests proving:
  - upload-only means a document instance exists;
  - the four mandatory leaves still make it incomplete;
  - upload id/filename themselves never block completion;
  - the 10-document cap still uses record instances.
- Keep `scanStatus` page-derived.

Verification:

- `npm run test:live-animals`.
- Documents E2E: upload, pending/complete/rejected display, view/remove and
  check-answers document card.
- Boot coverage proves no unrecognised auxiliary-key exception remains.

Exit criterion: every durable document entry field is a manifest fulfilment,
with no evaluator/helper/state-query code change.

### Increment 2: add the persisted encoding codec and golden equivalence

Goal: prove the recommended at-rest array is a lossless serialisation of the
unchanged evaluator map.

Work:

- Add a frontend-only canonical codec near the records adapter, not under
  `model/obligations/`.
- Implement strict encode/decode validation and deterministic ordering.
- Add property-style corpus tests for map -> array -> map and array -> map ->
  canonical array.
- Add malformed contract tests for duplicate UUIDs, duplicate composite ids,
  mixed `value`/`records`, wrong current-manifest scalar/grouped form and invalid
  composite depth.
- Preserve unknown UUID entries through decode/encode and prove the current
  evaluator drops them from its evaluated view.

Golden-equivalence gate:

For every corpus case, assert the decoded new map is byte-identical to today's
evaluator input:

```js
expect(
  JSON.stringify(decode(encode(answersToFulfilments(answers))))
).toBe(JSON.stringify(answersToFulfilments(answers)))
```

Also assert that evaluating old and decoded maps yields byte-identical
`fulfilments` and `obligations`. Do this before deleting or bypassing the old
name-keyed persistence path.

Verification:

- `npm run test:live-animals`.
- No runtime code path changes yet; E2E is optional but should remain green in
  CI.

Exit criterion: the codec is demonstrably storage-only and the evaluator cannot
tell which representation was at rest.

### Increment 3: make render-back projection production-grade

Goal: prove the complete live UI can be driven from a canonical evaluator map.

Work:

- Harden and rename `fulfilmentsToAnswers` as the page projection.
- Add invalid composite-id and sparse-index handling.
- Add a request-view assembler that takes a decoded fulfilment, evaluates once,
  and returns evaluation, projected answers and scope.
- In tests only, route `engine/read` through:

```text
answers fixture -> old answersToFulfilments
                -> encode/decode
                -> evaluator
                -> projectAnswers
                -> existing controllers
```

- Compare controller view contexts for all scalar pages, commodities, documents,
  hub and check answers.
- Fix controller assumptions about numeric animal counts at the controller/view
  boundary, not by reversing the canonical model value.

Verification:

- `npm run test:live-animals`.
- `npm run test:prototype -- -g "live-animals"`.
- Explicit no-JavaScript origin/commodity form tests and multi-unit/check-answers
  render parity.

Exit criterion: no page needs a persisted name-keyed tree to render correctly.

### Increment 4: move the records port to canonical fulfilment

Goal: establish fulfilment as the only durable frontend record payload.

Work:

- Change the records port from `saveAnswers` to whole-snapshot
  `replaceFulfilment`.
- Change stub records from `answers: {}` to canonical fulfilment storage so stub
  and real mode exercise the same contract.
- Change `currentJourney` load to decode/evaluate/project once per request.
- Change `engine/write` to start from the canonical map, apply feature updates,
  evaluate/purge, and save the post-purge map.
- During this increment only, the old central `answersToFulfilments` may remain
  behind a migration facade for controller patches. It must be guarded by the
  golden comparison against feature assembly and must never be persisted as
  answers.
- Do not create placeholder canonical entries for empty records.
- Update submit/freeze/amend tests so lifecycle semantics are unchanged.

Verification:

- Rewrite the port contract, write-through, one-load, resume-self-heal,
  submit-is-finalise and amend tests around fulfilment
  (`engine/write-through-per-commit.test.js:13-38`;
  `engine/resume-self-heal.test.js:10-45`;
  `services/persistence/records/records-port.test.js:41-89`).
- `npm run test:live-animals`.
- Full live-animals E2E, including resume and amend.

Exit criterion: removing the transient projected `answers` from a request and
rebuilding it produces the same page state; no persistence implementation stores
name-keyed answers.

### Increment 5: land option (d) feature-owned bindings

Goal: make UUID-native feature bindings authoritative for writes and
projections.

Work:

- Add side-effect-free binding modules per feature.
- Add boot-time exact coverage and duplicate UUID ownership checks.
- Move scalar and collection input bindings out of the central manifest walk.
- Keep the global assemble/evaluate/project facade and shared composite utility.
- Make scope, status, purge and collection completeness consume the request
  evaluation rather than reassembling/re-evaluating.
- Delete `answersToFulfilments` only after the new registry is exactly equivalent
  across the full corpus.

Verification:

- Golden comparison:

```text
old answersToFulfilments(projectedAnswers)
  byte-equals
new feature assembly(projectedAnswers or page patch)
```

- Existing evaluator tests remain unchanged.
- Add registry tests for missing, duplicate and wrongly pathed bindings.
- `npm run test:live-animals`.
- Full live-animals E2E because every controller write crosses the new binding
  seam.

Exit criterion: features own page field <-> UUID bindings; central input
inference is gone; evaluator input/output remains byte-identical.

### Increment 6: rewrite Mapper A from fulfilment

Goal: produce the current notification without a persisted or rehydrated
answers source.

Work:

- Build scalar and composite-record readers.
- Build one logical commodity line/unit join from UUID record maps.
- Port all existing Mapper A grouping, label, total, date, transporter and lossy
  transforms.
- Change the mapper public signature to canonical context plus id.
- Keep the old answers mapper in tests as an oracle only.

Verification:

- New output deep-equals old Mapper A for the full corpus.
- Skeleton equivalence remains exact.
- Known loss tests remain exact.
- `npm run test:live-animals`.

Exit criterion: current notification output has no production dependency on
name-keyed answers.

### Increment 7: rewrite Mapper B from fulfilment

Goal: produce the full-fat projection from the same canonical snapshot.

Work:

- Reuse Mapper A's base notification and logical line/unit join.
- Port all Mapper B extras by UUID.
- Keep upload id/filename out unless the proposed schema is explicitly extended.
- Resolve `declaration` according to Sam's open-item decision before declaring
  this mapper complete.

Verification:

- Mapper B remains a deep superset of Mapper A.
- Existing all-obligations fixture produces byte/deep-equivalent full-fat JSON.
- Multi-commodity/multi-unit/document tests.
- `npm run test:live-animals`.

Exit criterion: all three frontend mappers accept canonical fulfilment.

### Increment 8: define the backend OpenAPI and select a branch

Goal: agree cross-repo contracts before backend implementation.

Work:

- Sam selects one of the candidate backend branches.
- Add OpenAPI-first definitions for the three plural noun resources, array entry
  schema, replacement semantics, errors and ETags/idempotency.
- Confirm id minting and lifecycle interaction.
- Confirm the proposed notification collection stores unknown/additive fields
  rather than pruning them.

Verification in `trade-imports-animals-backend`:

- contract tests for PUT create/replace/retry and GET;
- Testcontainers Mongo integration for exact round-trip of scalar objects,
  record arrays and all Mapper B fields;
- concurrency test for stale ETag/document revision;
- OpenAPI validation and normal backend Maven test/coverage gates.

Exit criterion: frontend can implement against an agreed contract, not branch
guesswork.

### Increment 9: wire the real frontend adapter to all three endpoints

Goal: make real mode write and resume the option (e) architecture.

Work:

- Replace notification-based `marshal` rehydration with canonical
  `GET /fulfilments/{id}`.
- On every successful mutation, freeze one evaluated snapshot and PUT all three
  shapes.
- Add bounded retry/repair handling for projection write failures.
- Keep lifecycle status/list metadata working without remapping notification
  data into answers.
- Remove the runtime Mapper A/B selector as a choice of canonical persistence.
  Both projections are now always produced side by side
  (`services/persistence/records/mapper.js:1-20`).

Verification:

- frontend real-adapter request tests pin methods, noun paths, bodies and
  idempotent retry;
- gated frontend/backend integration test round-trips canonical fulfilment,
  compares both stored projections and resumes all page values;
- full real-mode live-animals E2E: start, partial save, browser/session restart,
  resume, upload download/status, check answers, submit, view, amend, re-submit;
- deliberate second/third endpoint failure test proves canonical data is safe
  and repair is observable.

Exit criterion: real mode never needs notification-to-answers for journey load,
and all three backend documents correspond to one source snapshot.

### Increment 10: remove migration scaffolding and document the model

Goal: leave one understandable architecture.

Work:

- Delete old production answers persistence, notification reverse load, mapper
  selector and golden oracle implementations that no longer protect a live
  migration.
- Retain canonical codec tests, projection tests, Mapper A skeleton parity,
  Mapper A vs Mapper B comparison, feature binding coverage, evaluator tests and
  E2E.
- Update persistence, architecture, add-a-field, add-a-collection and testing
  docs to describe canonical fulfilment and snapshot-local composite ids. The
  current persistence document still says the record stores `answers` and the
  real adapter resumes from notifications
  (`docs/persistence.md:57-76,102-128`).

Verification:

- `npm run test:live-animals`.
- live-animals E2E in stub and real mode.
- lint/format checks for touched frontend files.
- backend Maven/OpenAPI/integration suite.

Exit criterion: repository docs and public ports expose only the new
architecture; no dead dual-store vocabulary remains.

## Risks and costs

### Render-back is now a critical production dependency

This is the largest single frontend risk. The inverse has been test-only, and
its tests permit a type change for animal counts and accepted loss of empty
records (`bridge/fulfilments.test.js:40-93,167-172`). Under option (e), any
inverse bug can render the wrong value, attach one unit to the wrong line, break
a controller's form defaults or send a user to the wrong page.

Cost: broad controller, view-context and E2E coverage, strict persisted-input
validation, and a request-level projection cache.

### Rehydration completeness is bounded by what the fulfilment models

All manifest values can round-trip, including upload metadata after the two new
obligations. Empty records cannot. `importType` is explicitly non-notification
routing state and already does not survive real-mode notification round-trip
(`flow/entry-guard.js:23-31`). `declaration`, however, is currently flow-only
while Mapper B treats it as notification output
(`flow/obligation-source.js:51-53`;
`services/persistence/records/notification-mapper.js:441-466`). That mismatch
must be resolved before the old answers store is removed.

Cost: one explicit manifest/flow decision for declaration; no covert side
store.

### Mapper A is a real rewrite, not a property rename

Scalar reads are simple UUID lookups. Commodity mapping is not. The mapper must
reconstruct logical lines and nested units by joining independent record maps,
then preserve backend-specific group-by-commodity, totals, labels and the
intentional first-unit loss
(`services/persistence/records/notification-mapper.js:47-93,136-164`).

Cost: a shared composite reader, a substantial fixture matrix and keeping the
old mapper as a golden oracle until parity is proven.

### Positional ids are not longitudinal record identity

They are consistent within one snapshot but shift when array entries are
removed. Persisting them makes it easier for another service to mistake them for
stable ids.

Cost: whole-snapshot-only APIs, clear contract language, document-level
concurrency control and no per-record patch. Stable record identity remains a
future design if a concrete requirement appears.

### Three endpoints create a consistency window

The frontend cannot atomically commit three Mongo resources through three HTTP
requests. Canonical may succeed while one projection fails. Reversing the order
would be worse because a projection could advance while the source of truth
does not.

Cost: idempotent PUT, canonical-first sequencing, observable projection status,
retry/repair tests, and comparison tooling that knows the resources may be
temporarily out of sync. If strict atomicity becomes a requirement, Sam's
"backend just stores each shape" boundary must be revisited explicitly.

### Version detection does not provide automatic migration

UUID persistence reveals an old obligation version. It does not say whether the
value is compatible with the new obligation, how to transform it, or whether it
should still appear in either notification. The current evaluator only drops
unknown ids from the recognised view
(`model/obligations/evaluator.js:285-295`).

Cost: a small version-inspection result now and explicit per-version adapters
later. Do not infer compatibility from equal names.

### The test surface expands

The current bridge, scope, status, completeness, notification and records tests
are separate. Option (e) adds codec contracts, malformed persisted payloads,
feature binding coverage, page projection parity, three mapper parity suites,
three endpoint adapter tests and real cross-repo integration.

Cost: more tests before old tests can be retired. The evaluator suite should not
be rewritten because the evaluator contract and algorithm do not change.

### Cross-repo delivery is branch-dependent

The frontend can implement codecs, projections, binding ownership and mappers
before a backend branch is selected. Real adapter wiring cannot be completed
safely until the backend model and notification extensions on the chosen branch
are known
(`workareas/shared/promotion/decision-docs/p-101-option-e-direction.md:81-90`).

Cost: OpenAPI-first coordination, a gated integration suite and a period where
frontend work is complete but real-mode activation is feature-flagged or
unwired.

### Whole-document writes may become expensive

The fulfilment and two notifications are regenerated and replaced on every
commit. That is consistent with current write-through and whole-map replacement
semantics
(`engine/write.js:22-93`;
`docs/persistence.md:199-215`), but three payloads and requests increase latency
and write load.

Cost: measure payload size and write latency; cache one evaluation/projection per
request; do not optimise into unsafe partial updates without a new identity
design.

## Evaluator constraint and open items

The evaluator algorithm is unchanged. Do not edit
`model/obligations/evaluator.js`, `model/obligations/helpers.js` or
`model/obligations/state-queries.js` to deliver option (e). The evaluator still
accepts the same UUID-keyed map, the same scalar values, the same composite
records-maps and the same `line0/unit1` ids. The manifest may gain optional
`uploadId` and `filename` leaves; the evaluator already iterates and classifies
such leaves generically
(`model/obligations/evaluator.js:51-64,224-244,566-579`).

Open items requiring Sam:

1. **Backend branch.** Select which existing
   `trade-imports-animals-backend` branch is the base:
   `feature/EUDPA-274-gbn-ag-model-mapper`,
   `EUDPA-10-creating-and-saving-a-notification`,
   `feat/EUDPA-35` / `EUDPA-35-backend-accompanying-documents`, or
   `feature/EUDPA-171-amend-notification`
   (`workareas/shared/promotion/decision-docs/p-101-option-e-direction.md:83-90`).

2. **Final encoding sign-off.** Approve the recommended array-of-obligation
   entries at rest versus the evaluator map. This plan recommends the array and
   keeps the current map strictly at the evaluator boundary.

3. **Declaration.** Confirm that submit-time `declaration` becomes a manifest
   obligation so it can be canonical and feed the full-fat mapper, or confirm
   that it is deliberately transient lifecycle evidence and should be removed
   from Mapper B. It cannot remain a durable flow-only answer without violating
   the single-source ruling
   (`features/declaration/controller.js:50-66`;
   `services/persistence/records/notification-mapper.js:450-452`).

4. **Id minting resource.** Confirm whether the selected backend branch keeps
   existing `POST /notifications` solely to mint the shared reference or
   introduces a separate noun resource. The three PUT contracts assume a
   client-known shared id but do not require one minting implementation
   (`services/persistence/records/real.js:85-100`).

Resolved from code, so not open:

- persist `uploadId` and `filename` as optional obligations;
- do not persist an upload `path` in v1 because no upload contract returns one;
- keep `scanStatus` transient;
- accept loss of empty started records;
- keep positional composite ids and constrain them to atomic whole snapshots;
- keep all mapping in the frontend.

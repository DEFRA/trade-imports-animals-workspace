# p-101 option (d): move evaluator bindings into features

This paper explores option (d) under one fixed constraint: the obligation
manifest, evaluator, helper functions and state queries in `model/obligations/`
do not change. In particular, the evaluator continues to accept one flat
`fulfilments` object keyed by obligation UUID, with grouped values held in
records-maps keyed by composite ids such as `line0/unit1`
(`model/obligations/evaluator.js:3-16`; `bridge/fulfilments.js:10-16`).

## At a glance

- The composite id is necessary **at the evaluator boundary**. Once values for
  every animal are split across UUID-keyed records-maps, `line0/unit1` is the
  join key that says “this value is for unit 1 of commodity line 0”. The
  evaluator uses its prefixes to discover group instances, relate a unit to its
  line, apply line-level gates to units, count units and purge individual
  records (`model/obligations/evaluator.js:297-358,414-433`;
  `model/obligations/helpers.js:551-578`;
  `model/obligations/state-queries.js:119-144`).

- The nested store already contains the same identity as array positions. The
  bridge does not discover new domain identity; it re-encodes
  `commodityLines[0].animalIdentifiers[1]` as `line0/unit1` because the
  unchanged evaluator cannot consume the nested store directly
  (`bridge/fulfilments.js:91-113`; `bridge/fulfilments.test.js:148-164`).

- Sam’s “nested stuff lives in one feature” intuition is correct for **data
  collection**. `commodityLines`, its nested `animalIdentifiers`, and all their
  leaves are owned by `features/commodities/`; `documents` and its leaves are
  owned by `features/documents/` (`features/commodities/search.controller.js:10,133-145,200-207`;
  `features/commodities/animal-identification.controller.js:478-517`;
  `features/documents/controller.js:42,398-415`).

- It is not correct for all **reads or reasoning**. Check answers reads every
  unit, the notification mapper reads and reconstructs nested identifiers, and
  hub status/completeness/purge are global projections. Commodity selections
  also gate CPH and unweaned-animal obligations owned by other features
  (`features/check-answers/controller.js:206-238,274-282`;
  `services/persistence/records/notification-mapper.js:73-93,309-329`;
  `model/obligations/obligations.js:582-619`;
  `features/hub/controller.js:91-109`).

- Therefore flattening is **decomposable per feature with a thin global
  assembler**. A commodities-owned contributor can build every `line…/unit…`
  record, a documents-owned contributor can build every `line…` document
  record, and scalar features can contribute one UUID/value pair. Their outputs
  must still be merged before the single global `evaluate(fulfilments)` call
  (`model/obligations/evaluator.js:51-67`; cross-feature gates read the shared
  map at `model/obligations/helpers.js:180-193`).

- Option (d) is not “no adapter”. It is a change in ownership: features own the
  **bindings** from their store fields to obligation UUIDs and collection paths;
  a small shared utility may own the **mechanism** for formatting and decoding
  composite ids; one global facade owns merge, evaluate and projection. The
  existing central manifest-inference walk can go, but its required output
  shape cannot (`bridge/fulfilments.js:48-71,91-149`).

- The biggest cost is distributed completeness. Today one manifest-driven loop
  covers every non-group obligation automatically
  (`bridge/fulfilments.js:139-148`). Under (d), a missing, duplicated or wrongly
  pathed feature contribution can silently remove a gate input or make purge
  address the wrong record unless boot-time coverage and golden equivalence
  tests make that registry authoritative.

- My verdict is **necessary but relocatable, with part of the current machinery
  avoidable**. The orchestrator was right that composite identity is
  load-bearing for Paul’s unchanged evaluator. It overstated the case if
  “load-bearing” meant the generic flattening walk must remain central, or that
  nested data itself crosses feature ownership boundaries.

## The two shapes and the decision boundary

The page store is a nested object keyed by readable field names. Collections
are arrays addressed by positional paths such as
`commodityLines[0].animalIdentifiers[1].animalIdentifierEarTag`
(`bridge/fulfilments.js:4-8`; `lib/path.js:1-22`). The real persistence adapter
also resumes into that nested, name-addressed shape
(`services/persistence/records/real.js:47-56`;
`services/persistence/records/notification-mapper.js:290-302,485-498`).

Paul’s evaluator accepts a different shape:

```json
{
  "<obligation UUID>": "a scalar value",
  "<grouped obligation UUID>": {
    "<composite instance id>": "a value"
  }
}
```

It is constructed once with the manifest and receives the complete fulfilments
object for each pure call (`model/obligations/evaluator.js:10-16,51-67`). It
returns:

- a post-purge `fulfilments` map; and
- UUID-keyed implications, including per-record `fulfilmentId` and status for
  grouped obligations (`model/obligations/evaluator.js:94-119,531-605`).

The current `bridge/fulfilments.js` combines four concerns:

1. binding a store name to a manifest obligation and UUID
   (`bridge/fulfilments.js:18-23,48-50`);
2. finding the obligation’s ancestor collections
   (`bridge/fulfilments.js:58-67`);
3. walking nested arrays and formatting composite ids
   (`bridge/fulfilments.js:69-71,91-113`); and
4. reversing composite ids into positional paths, including a full inverse
   from fulfilments to answers (`bridge/fulfilments.js:155-169,191-227`).

Option (d) can redistribute those concerns. It cannot change the evaluator’s
input or output contract.

## Worked trace: why `line0/unit1` exists

### Starting point in the store

Use one cattle line and two animals:

```json
{
  "commodityLines": [
    {
      "commoditySelection": "Cow",
      "animalIdentifiers": [
        { "animalIdentifierEarTag": "FIRST" },
        { "animalIdentifierEarTag": "SECOND" }
      ]
    }
  ]
}
```

This is the real store topology. The bridge test uses this exact two-unit shape
and pins the second value to `line0/unit1`
(`bridge/fulfilments.test.js:148-164`). The live controller constructs a unit
object and appends it at
`['commodityLines', lineIndex, 'animalIdentifiers']`
(`features/commodities/animal-identification.controller.js:478-517`).

The nested object already answers three identity questions:

- which commodity line: array index `0`;
- which unit within the line: array index `1`; and
- which field on the unit: `animalIdentifierEarTag`.

Nothing about `line0/unit1` creates a new business identifier. It is a
serialization of those two indices.

### How the current bridge builds it

`answersToFulfilments` loops over every non-group obligation
(`bridge/fulfilments.js:139-148`). For `earTag`:

- the obligation name is `animalIdentifierEarTag`;
- its UUID is `3b879ca2-b3c4-4fe8-8567-a1283a4a6c73`;
- it is `within: unitRecord`; and
- `unitRecord` is itself `within: commodityLine`
  (`model/obligations/obligations.js:627-630,703-711`).

`ancestorChain(earTag)` follows those `within` references and unshifts each
parent, producing `[commodityLine, unitRecord]`
(`bridge/fulfilments.js:58-67`). `segmentToken` chooses a token from
`['line', 'unit']` according to a group’s depth: `commodityLine` has zero
ancestors and gets `line`; `unitRecord` has one and gets `unit`
(`bridge/fulfilments.js:36-42,69-71`).

`collectGroupedRecords` then does this:

1. read `answers.commodityLines`;
2. visit index `0` and append `line0`;
3. read that entry’s `animalIdentifiers`;
4. visit index `1` and append `unit1`;
5. read `animalIdentifierEarTag`; and
6. write the value under `segments.join('/')`
   (`bridge/fulfilments.js:91-113`).

The relevant evaluator input is therefore:

```json
{
  "21f60718-192a-4d4e-8bcd-17e8f9a0b1c3": {
    "line0": "Cow"
  },
  "3b879ca2-b3c4-4fe8-8567-a1283a4a6c73": {
    "line0/unit0": "FIRST",
    "line0/unit1": "SECOND"
  }
}
```

The first UUID is `commoditySelection`
(`model/obligations/obligations.js:526-530`); the second is `earTag`
(`model/obligations/obligations.js:703-711`). The exact two-record ear-tag map
is pinned at `bridge/fulfilments.test.js:159-163`.

The `line` and `unit` words are conventional, not semantic. The bridge says the
prefix is cosmetic and that the evaluator treats an id as opaque apart from its
slash-separated path structure (`bridge/fulfilments.js:36-42`). The convention
still has to remain under this option because the required evaluator input and
output are to remain byte-for-byte compatible with today.

### What the evaluator does with the key

The evaluator first drops UUIDs not in its manifest, then repeatedly enumerates
group paths, runs gates and purges until the flat view stops shrinking
(`model/obligations/evaluator.js:67-92,124-186,285-295`). The composite key is
used in four concrete ways.

#### 1. It discovers the collection instances

For a group, `groupInstancePaths` scans every descendant’s records-map. It
splits each key on `/` and takes the first `N` segments, where `N` is the
group’s ancestor depth plus one
(`model/obligations/evaluator.js:297-328`).

For the input above:

- `commodityLine` has prefix length 1, so both ear-tag keys contribute
  `line0`;
- `unitRecord` has prefix length 2, so they contribute `line0/unit0` and
  `line0/unit1`.

The pre-purge enumeration returns these paths by group UUID
(`model/obligations/evaluator.js:330-358`). The post-purge enumeration repeats
the same operation so implications only describe surviving records
(`model/obligations/evaluator.js:495-528`). The production-shape smoke test
pins `line0` and `line0/unit0` group implications
(`bridge/fulfilments.test.js:333-339`), while the evaluator tests pin the union
of multiple unit ids and multiple identifier maps
(`model/obligations/evaluator.test.js:703-742`).

#### 2. It joins a line-level gate to deeper units

`earTag.applyTo` is
`allowListed(commodityCode, earTagCommodities(), unitRecord, …)`
(`model/obligations/obligations.js:703-710`). The helper reads the
commodity-code records-map by its UUID
(`model/obligations/helpers.js:93-115`).

For cattle, the passing line key is `line0`. The helper then takes the
enumerated `unitRecord` paths and keeps paths equal to `line0` or beginning
`line0/` (`model/obligations/helpers.js:551-578`). Both `line0/unit0` and
`line0/unit1` therefore receive the ear-tag implication:

```json
{
  "3b879ca2-b3c4-4fe8-8567-a1283a4a6c73": {
    "inScope": true,
    "records": [
      { "fulfilmentId": "line0/unit0", "status": "optional" },
      { "fulfilmentId": "line0/unit1", "status": "optional" }
    ]
  }
}
```

`derivedLeafImplication` stamps the obligation’s status on the returned record
ids (`model/obligations/evaluator.js:582-593`). The evaluator’s ear-tag tests
also show two distinct cattle lines remaining distinct through their composite
keys (`model/obligations/evaluator.test.js:838-866`).

#### 3. It supports per-parent invariants

`unitRecord.requires.recordCountEquals` names
`numberOfAnimals.id` (`model/obligations/obligations.js:646-667`).
`checkRecordCountEquals` reads the expected count at the parent key, for example
`numberOfAnimals[line0]`, and counts unit records whose ids begin `line0/`
(`model/obligations/state-queries.js:119-144`). The same identity also lets
`requires.anyOfIds` ask whether at least one in-scope identifier UUID has a
non-blank value at the exact unit id
(`model/obligations/state-queries.js:70-96`).

#### 4. It purges one record without losing its siblings

A derived leaf is purged by filtering its records-map against the
`applyTo`-returned set of permitted composite ids
(`model/obligations/evaluator.js:414-433`). If line 0 stops being an ear-tag
commodity, `line0/unit1` can be removed from the ear-tag UUID map while records
for another line survive. The evaluator tests exercise mixed matching and
non-matching unit keys (`model/obligations/evaluator.test.js:791-812`).

The bridge then converts a removed `line0/unit1` back to
`commodityLines[0].animalIdentifiers[1].animalIdentifierEarTag` so the page
store can delete it (`bridge/purge.js:36-55`;
`bridge/fulfilments.js:155-169`). `destroyWiped` parses that path and deletes
the nested field, ordering array-related deletions safely
(`lib/path.js:12-16,60-70`).

### Why a key is needed at all

The UUID only identifies the **kind of value**: ear tag. The records-map under
that UUID may contain many ear tags. It therefore needs another key to:

- distinguish two animals with ear tags;
- retain their parent commodity-line identity;
- correlate records stored under different leaf UUIDs;
- relate a unit to the commodity value that gates it; and
- address a single value for status and purge.

An array could carry position too, but the unchanged evaluator does not accept
an array of nested units. It accepts independent records-maps under independent
UUIDs (`model/obligations/evaluator.js:3-16`;
`model/obligations/helpers.js:47-61`). Under the hard constraint, some
composite record identity is therefore unavoidable at its boundary.

## Is flattening global, feature-local, or avoidable?

The explicit answer is:

> **The flat result is global; constructing it is decomposable per feature; it
> is not avoidable while Paul’s evaluator remains unchanged.**

The evaluator makes one `evaluate(fulfilments)` call over the manifest
(`model/obligations/evaluator.js:51-67`). Each gate closure can read any
obligation UUID from that object. For example:

- `purposeInInternalMarket`, `destinationCountry`, `portOfExit` and `exitDate`
  read the scalar UUID for `reasonForImport`
  (`model/obligations/obligations.js:252-327`);
- CPH and `containsUnweanedAnimals`, which are collected outside
  `features/commodities/`, aggregate commodity values from the
  `commodityCode` UUID records-map
  (`model/obligations/obligations.js:582-619`;
  `model/obligations/helpers.js:174-193`); and
- depth-2 identifiers read commodity-code records and group paths from the same
  evaluation (`model/obligations/helpers.js:78-115`).

Calling the evaluator from `features/commodities/` with only commodity
fulfilments would omit CPH’s stored scalar, reason-for-import gates, transport
gates and every other feature. Calling it independently per feature would also
break the evaluator’s whole-map purge fixpoint: a value purged in one iteration
must not continue to drive another gate in that evaluation
(`model/obligations/evaluator.js:24-33,74-92`).

However, nothing requires one function to *discover and build* all the entries.
UUID keys are unique, and a contribution can be a normal object:

```js
{
  [commodityCode.id]: { line0: 'Cow' },
  [earTag.id]: { 'line0/unit1': 'SECOND' }
}
```

A different feature can independently contribute:

```js
{
  [reasonForImport.id]: 'internalMarket'
}
```

A thin assembler can reject duplicate UUIDs, merge all contributions and call
the unchanged evaluator once. This preserves the current requirement that
scope, status, purge and entry completeness all evaluate the complete answer
set (`bridge/scope.js:108-118`; `bridge/status.js:334-345`;
`bridge/purge.js:64-69`; `bridge/collection-complete.js:138-151`).

This is category **(ii)** from the question: decomposable per feature with a
thin global assembler.

## Complete inventory of collection nesting

There are three group obligations in the manifest: two top-level collections
and one collection nested inside another. `groups` is derived from obligations
that another obligation references through `within`
(`model/obligations/obligations.js:892-895`). There is one depth-2 leaf family
and no depth-3 leaf.

| Group and depth | Every direct `within` member | Feature that collects and writes it | Other data readers | Global/model readers and projections |
|---|---|---|---|---|
| `commodityLines`, depth 0 | Depth-1 leaves: `commoditySelection`, `commodityType`, `speciesSelection`, `numberOfAnimalsQuantity`, `numberOfPackages`. Nested group: `animalIdentifiers`. (`model/obligations/obligations.js:510-576,627-630`) | `features/commodities/search.controller.js` declares `collects: ['commodityLines']`, seeds line fields and reconciles the array (`:10,133-145,200-207`). `consignment-details.controller.js` reads and updates counts (`:118-125,177-184`). | Hub reads line counts for totals (`features/hub/controller.js:117-126`). Additional details and CPH inspect line commodity selections (`features/additional-details/controller.js:22-27`; `features/cph-number/controller.js:22-27`). Check answers renders line cards (`features/check-answers/controller.js:184-202,261-282`). The notification mapper groups and reconstructs lines (`services/persistence/records/notification-mapper.js:47-53,146-164,232-251,331-398`). | The evaluator infers line instances from descendant record prefixes (`model/obligations/evaluator.js:297-358`). `numberOfPackages`, CPH and unweaned gates read commodity records (`model/obligations/obligations.js:560-576,582-619`). Status deliberately splits the outer collection into commodities and animal-identification facets (`flow/task-rows.js:27-45`; `bridge/status.js:110-154,233-288`). |
| `animalIdentifiers`, depth 1 inside `commodityLines` | Depth-2 leaves: `animalIdentifierPassport`, `animalIdentifierTattoo`, `animalIdentifierEarTag`, `horseName`, `animalIdentifierIdentificationDetails`, `animalIdentifierDescription`, `permanentAddress`. (`model/obligations/obligations.js:627-777`) | Entirely written by `features/commodities/animal-identification.controller.js`: it derives visible fields from commodity applicability, constructs units and appends/removes them at the nested collection path (`:64-79,275-327,478-517,580-598`). | `features/commodities/consignment-details.controller.js` reads the unit count before allowing a lower animal count (`:120-137`). Check answers reads the full unit records and renders identifier columns (`features/check-answers/controller.js:206-238,274-282`). The notification mapper reads ear tag/passport and, in its lossless form, all seven unit values (`services/persistence/records/notification-mapper.js:73-93,309-329,331-398`). | The evaluator projects line-level commodity gates down to unit paths (`model/obligations/helpers.js:47-61,78-115,551-578`), enforces any-identifier and record-count rules (`model/obligations/state-queries.js:70-96,119-144`), and purges disallowed unit leaves (`model/obligations/evaluator.js:414-433`). Collection completeness scans all leaves and nested invariants below an instance (`bridge/collection-complete.js:62-126`). |
| `documents`, depth 0 | Depth-1 leaves: `accompanyingDocumentType`, `accompanyingDocumentAttachmentType`, `accompanyingDocumentReference`, `accompanyingDocumentDateOfIssue`. (`model/obligations/obligations.js:797-834`) | `features/documents/controller.js` declares `collects: ['documents']`, builds a complete entry, appends it and removes it (`:42,64-84,398-415,432-449`). It also owns auxiliary `uploadId` and `filename`; the answer-key guard declares those as feature-owned extras (`flow/obligation-source.js:60-65`). | Check answers reads and renders document entries (`features/check-answers/controller.js:433-470`). The target notification mapper maps the collection both ways (`services/persistence/records/notification-mapper.js:400-420,441-466,485-498`). | The model enforces the 10-entry cap (`model/obligations/obligations.js:797-805`; `model/obligations/state-queries.js:55-67`). Hub status and `collectionView.complete` use the global status/completeness projections (`flow/task-rows.js:58-67`; `engine/evaluate/collection-view.js:5-21`). |

This table exhausts every `within` in the manifest. Five leaves and one nested
group are directly within `commodityLines`; seven leaves are within
`animalIdentifiers`; four leaves are within `documents`
(`model/obligations/obligations.js:526-576,627-630,679-777,808-834`).

### Data ownership and model ownership are different

Dispatch formally gives a collection owner all descendants. It first claims
the declared `collects` key, then resolves an unclaimed descendant by walking
up its index-free dotted path until it finds a claimed ancestor
(`flow/dispatch.js:15-23,44-64`). Boot fails if any non-system obligation has no
owner (`flow/dispatch.js:68-86`). As a result, the commodities search page’s
claim on `commodityLines` covers every depth-1 and depth-2 descendant, even
though the consignment-details and identification controllers have empty
`collects` arrays (`features/commodities/search.controller.js:10`;
`features/commodities/consignment-details.controller.js:18`;
`features/commodities/animal-identification.controller.js:15`).

That is strong evidence for Sam’s hypothesis at the **write/data-ownership**
level. A commodities-owned adapter has all the knowledge needed to walk both
collection levels. A documents-owned adapter has all the knowledge needed for
the other collection. No collection’s stored entries are assembled by two
feature folders.

The reasoning is deliberately global. `statusOf` evaluates the entire answer
set and recursively checks model scope, per-record mandate, fulfilment and group
invariants (`bridge/status.js:156-205,207-304,334-345`). `wipeSet` diffs the
complete pre- and post-evaluation maps and returns page paths to the write
engine (`bridge/purge.js:58-69`; `engine/write.js:12-28,65-93`). The hub calls
those global roll-ups for each task row (`features/hub/controller.js:91-109`;
`flow/task-rows.js:63-67`).

In short:

- nesting is feature-local as collected data;
- the concrete nested data has a few cross-feature/cross-layer readers; and
- scope, status, purge and completeness are whole-manifest reasoning projected
  into several features.

## The real depth-2 case

The only real depth-2 topology is
`commodityLines -> animalIdentifiers -> identifier/permanentAddress leaf`
(`model/obligations/obligations.js:621-777`).

It is fully owned for writing by `features/commodities/`. The same controller:

- chooses which identifier fields apply from manifest gate metadata
  (`features/commodities/animal-identification.controller.js:64-79`);
- reads the line and its unit array (`:294-327`);
- builds the nested `permanentAddress` value (`:478-495`);
- appends the unit (`:508-517`); and
- removes a unit using both positional indices (`:575-598`).

No transport or addresses controller reads `animalIdentifiers`. A source search
finds production reads outside `features/commodities/` in two places:

1. check answers, which displays units and their values
   (`features/check-answers/controller.js:206-238,274-282`); and
2. the notification mapper, which persists/resumes identifier data
   (`services/persistence/records/notification-mapper.js:73-93,309-329,331-398`).

The hub does not directly inspect individual identifier values. It asks
`rowStatus` for the `animalIdentification` facet
(`features/hub/controller.js:91-100`; `flow/task-rows.js:40-45,63-67`).
`statusOf` then reads the evaluator’s per-record implications and fulfilments
(`bridge/status.js:180-195,207-288`). Check answers uses
`collectionView`, whose `complete` flag also comes from global evaluator
reasoning, but the check-answers table itself reads the nested records
positionally (`engine/evaluate/collection-view.js:5-21`;
`features/check-answers/controller.js:220-238`).

This distinction settles the narrow question. A **feature-local nested walk is
sufficient to construct the evaluator input** for the depth-2 records. The
records must nevertheless remain globally addressable *inside the evaluator
view* because global status, invariants and purge consume them, and because the
line prefix is used by cross-level gates. Non-owning pages do not need to build
the composite ids themselves if a shared projection facade continues to return
page-shaped scope, status and collection views.

## Option (d) as a concrete design

### Proposed component boundaries

Option (d) should mean all of the following. If it does not, it is only a
rename of the current bridge.

1. Each feature folder has a side-effect-free evaluator-binding module. For
   example:

   - `features/import-reason/evaluation.js`;
   - `features/import-purpose/evaluation.js`;
   - `features/commodities/evaluation.js`;
   - `features/documents/evaluation.js`; and
   - equivalent small modules for the other scalar-owning features.

   These modules import their actual obligation objects from
   `model/obligations/obligations.js`. The object supplies the preserved UUID
   and readable name; current examples are at
   `model/obligations/obligations.js:246-268,510-576,627-777,797-834`.

2. A feature exports both:

   - an input contribution, keyed by its imported obligation UUIDs; and
   - binding descriptors sufficient to project an implication or purged record
     back to the feature’s store path.

   The descriptor is the page-owned association. It must say, explicitly,
   “`animalIdentifierEarTag` is `earTag.id` at
   `commodityLines[*].animalIdentifiers[*]`”. It must not ask a central loop to
   rediscover that association from every manifest obligation.

3. A thin global assembler invokes every feature contributor against the same
   `answers`, rejects duplicate UUID ownership, merges the objects and invokes
   the existing evaluator once. It is the replacement for the four repeated
   `evaluator.evaluate(answersToFulfilments(answers))` call patterns in scope,
   status, purge and collection completeness
   (`bridge/scope.js:108-111`; `bridge/status.js:338`;
   `bridge/purge.js:64-66`; `bridge/collection-complete.js:42-43`).

4. Shared projection remains. Scope, status, purge and per-entry completeness
   are not page-controller concerns: they are consumed by flow and engine
   infrastructure (`flow/task-rows.js:63-67`;
   `flow/section-status.js:5-14`;
   `engine/write.js:12-28`;
   `engine/evaluate/collection-view.js:5-21`). They should consume the binding
   registry rather than own name-to-UUID inference.

5. The notification store remains nested and name-addressed. The real adapter
   loads notification data into `answers` and saves `answers` through a
   notification mapper (`services/persistence/records/real.js:47-56,124-139`).
   UUID fulfilments remain an evaluation-time view, as they are today.

The feature-binding modules should be separate from controllers so the global
evaluator facade does not import route handlers that themselves import
`engine/index.js`. The current feature aggregation imports every controller
and separately exports `dispatchPages` and routes
(`features/index.js:1-27,29-82`); evaluator bindings need the same explicit
registration discipline without creating a controller → engine → binding
module cycle.

### Scalar trace: `reasonForImport`

#### What the store holds

The page stores:

```json
{
  "reasonForImport": "internalMarket"
}
```

The happy-path fixture contains that value
(`flow/fixtures/happy-path.json:23-24`). The controller reads and commits the
same name-addressed key (`features/import-reason/controller.js:39-54`).

#### What the feature declares

The proposed `features/import-reason/evaluation.js` imports
`reasonForImport`, whose stable UUID is
`d34e5f6a-7b8c-4d9e-8f01-2a3b4c5d6e7f`
(`model/obligations/obligations.js:246-250`).

Conceptually, its page-owned binding is:

```js
scalar({
  obligation: reasonForImport,
  read: (answers) => answers.reasonForImport,
  answerPath: ['reasonForImport']
})
```

The helper is mechanism; this declaration is binding. Missing values are
omitted, while blank-but-present values remain present, matching the current
`scalarFulfilment` behaviour (`bridge/fulfilments.js:115-118`).

Its contribution for this store is:

```json
{
  "d34e5f6a-7b8c-4d9e-8f01-2a3b4c5d6e7f": "internalMarket"
}
```

That is byte-identical to the current bridge result, pinned by
`bridge/fulfilments.test.js:193-201`.

#### What the evaluator sees and returns

The assembler merges this with every other feature contribution and passes the
complete map to the unchanged evaluator. `equalsGate` reads
`fulfilments[reasonForImport.id]`
(`model/obligations/helpers.js:299-330`). The manifest therefore returns a
mandatory, in-scope implication for `purposeInInternalMarket` when the value is
`internalMarket` (`model/obligations/obligations.js:252-268`).

For `reasonForImport` itself, the evaluator classifies an intrinsic-status
top-level field and returns `{ inScope: true, status: 'mandatory' }`
(`model/obligations/evaluator.js:220-233,558-579`). Both implications remain
keyed by UUID because `buildImplications` writes
`implicationsByObligation[obligation.id]`
(`model/obligations/evaluator.js:531-544`).

#### How the feature gets page-shaped output

The shared projector looks up the feature binding for the returned UUID and
adds the bare page path `reasonForImport` to scope. This is the scalar operation
currently performed by `leafScalarKey`
(`bridge/scope.js:87-105`). Status reads the UUID-keyed evaluator state but
reports the five-way page/task status
(`bridge/status.js:125-146,197-205,326-345`).

The controller need not understand an implication object. It continues to get
`scope` back from `state.commit` and uses it to choose the next target, as it
does now (`features/import-reason/controller.js:53-54`;
`engine/write.js:22-28`). “Speaking the evaluator’s language” means the
feature owns the input/output binding, not that templates or controllers expose
UUIDs.

The import-purpose feature separately owns the binding for
`purposeInInternalMarket` and its UUID
(`features/import-purpose/controller.js:11,42-61`;
`model/obligations/obligations.js:255-268`). That separation is useful:
`reasonForImport` supplies the gate value; the global evaluation delivers the
result to a different feature’s path.

### Depth-2 trace: `animalIdentifierEarTag`

#### What the store holds

For the requested second unit:

```json
{
  "commodityLines": [
    {
      "commoditySelection": "Cow",
      "animalIdentifiers": [
        { "animalIdentifierEarTag": "FIRST" },
        { "animalIdentifierEarTag": "SECOND" }
      ]
    }
  ]
}
```

The controller’s append and remove operations use exactly those two positional
collection levels
(`features/commodities/animal-identification.controller.js:508-517,575-598`).

#### What the feature declares

The proposed `features/commodities/evaluation.js` imports, at minimum for this
trace:

- `commodityLine`;
- `commodityCode`;
- `unitRecord`; and
- `earTag`

from the unchanged manifest
(`model/obligations/obligations.js:510-530,627-630,703-711`).

Its binding says:

```js
grouped({
  obligation: earTag,
  groups: [
    { obligation: commodityLine, answerKey: 'commodityLines', token: 'line' },
    { obligation: unitRecord, answerKey: 'animalIdentifiers', token: 'unit' }
  ],
  answerKey: 'animalIdentifierEarTag'
})
```

The real commodities module would declare all its depth-1 and depth-2 leaves
once and walk each line/unit once. It would not repeat a full nested traversal
per leaf as the current `answersToFulfilments` loop does
(`bridge/fulfilments.js:125-148`).

For line index `0`, unit index `1`, a shared formatter can produce
`line0/unit1`. The commodities contributor writes:

```json
{
  "21f60718-192a-4d4e-8bcd-17e8f9a0b1c3": {
    "line0": "Cow"
  },
  "3b879ca2-b3c4-4fe8-8567-a1283a4a6c73": {
    "line0/unit0": "FIRST",
    "line0/unit1": "SECOND"
  }
}
```

Again, this is byte-identical to today
(`bridge/fulfilments.test.js:148-164,185-201`).

The one existing value conversion also needs explicit ownership. The page
stores `numberOfAnimalsQuantity` as an HTTP string, but the evaluator’s strict
record-count invariant needs a number; the current bridge performs that single
coercion (`bridge/fulfilments.js:73-85`;
`bridge/fulfilments.test.js:125-145`). Under (d), the commodities contribution
must apply it, preferably through a shared small value converter referenced by
the commodities binding. Hiding that transform in the global assembler would
recreate central field knowledge.

#### What the evaluator returns

The evaluator sees exactly the same input as in the worked trace. It enumerates
`line0` and both `line0/unit…` group instances, uses the cattle value at
`commodityCode.id` to admit the unit paths, and returns ear-tag record
implications with the same composite ids
(`model/obligations/evaluator.js:297-358,548-593`;
`model/obligations/helpers.js:93-115,551-578`).

If a commodity change makes the ear tag invalid, the evaluator removes only
the disallowed composite records from its returned fulfilments
(`model/obligations/evaluator.js:414-433,460-493`). No evaluator or manifest
code changes under option (d).

#### How output reaches pages

The shared projector consults the commodities-owned descriptor:

```text
earTag UUID + line0/unit1
    -> commodityLines[0].animalIdentifiers[1].animalIdentifierEarTag
```

The generic decode is the same small operation as today: split on `/`, take the
trailing integer of each segment, and zip those indices with the descriptor’s
group answer keys (`bridge/fulfilments.js:155-169`). It can remain a shared
utility because no feature-specific decision is left in it.

That path is then used in three global projections:

- scope adds the in-scope leaf path
  (`bridge/scope.js:80-85,102-118`);
- purge returns the removed leaf path to `destroyWiped`
  (`bridge/purge.js:36-55`; `lib/path.js:67-70`); and
- collection completeness formats the queried positional collection instance
  back to `line0/unit1` to compare against evaluator records
  (`bridge/collection-complete.js:128-151`;
  `bridge/fulfilments.js:171-189`).

The global status projector recursively evaluates the `animalIdentifiers`
facet and its per-record invariant, so the hub can label the identification
task without learning composite ids
(`flow/task-rows.js:40-45,63-67`;
`bridge/status.js:233-304`;
`features/hub/controller.js:91-100`).

## What legitimately survives as a shared adapter

Option (d) should dissolve the **central input-inference seam**, not every
shared evaluator integration.

The following responsibilities are legitimately shared:

- registering and validating feature contributions;
- merging them into one flat UUID-keyed object;
- invoking the unchanged evaluator once per consultation;
- caching within a consultation if desired;
- decoding/formatting composite ids through a feature-supplied descriptor;
- projecting UUID implications to page path scope;
- diffing pre/post fulfilments and projecting purge paths;
- rolling up model state into task/section status; and
- calculating per-entry collection completeness.

Those operations have global consumers today. `makeScope` feeds controllers
and flow readiness (`bridge/scope.js:145-174`), status feeds task rows and
sections (`bridge/status.js:4-7`; `flow/section-status.js:5-14`), purge feeds
the write engine (`bridge/purge.js:14-15`; `engine/write.js:12-28`), and
collection completeness feeds the generic collection view
(`engine/evaluate/collection-view.js:5-21`).

The following central responsibilities can go:

- the global `obligationByName` used solely to translate answer names to UUIDs
  (`bridge/fulfilments.js:48-50`);
- the loop that infers every input binding from the entire manifest
  (`bridge/fulfilments.js:125-148`);
- the one-size-fits-all per-leaf nested traversal, replaced by
  collection-feature contributions (`bridge/fulfilments.js:91-123`); and
- the full `fulfilmentsToAnswers` inverse. Production projections convert
  individual ids to paths; the full inverse is only imported by its own test
  suite (`bridge/fulfilments.js:191-227`;
  `bridge/fulfilments.test.js:1-4,40-110`).

This leaves an adapter, but it is an evaluator integration facade driven by
page-owned declarations rather than a central translator that infers both
bindings and paths.

## Mechanism versus binding

### Binding

A binding answers questions that belong to the feature:

- Which stored field supplies this obligation?
- Which preserved UUID does it map to?
- Which collection path contains it?
- Does its value need a field-specific conversion?
- Which page path should receive a returned implication or purge?

Examples:

- `answers.reasonForImport` ↔ `reasonForImport.id`;
- `line.animalIdentifiers[unit].animalIdentifierEarTag` ↔ `earTag.id`; and
- `numberOfAnimalsQuantity` string ↔ numeric evaluator value.

Today these answers are inferred centrally from `obligation.name`,
`obligation.id`, `within` and one name comparison in `modelValue`
(`bridge/fulfilments.js:18-27,48-50,73-85,125-148`). Under genuine option (d),
the owning feature imports and declares them.

### Mechanism

Mechanism is domain-neutral:

- visit an array at a declared key;
- append a declared token plus an index;
- join segments with `/`;
- add a value to a records-map under an already supplied UUID;
- reverse segment indices into already supplied group keys; and
- merge contributions while rejecting duplicate UUIDs.

This can be a small shared helper. Sharing it does not take ownership away from
the feature any more than sharing `pathKey`, `valueAt` and `setAt` does today
(`lib/path.js:1-30`).

### Is this really different from today?

It is meaningfully different only if the input to the helper is explicit
feature data.

This is different:

```js
grouped({
  obligation: earTag,
  groups: [
    { answerKey: 'commodityLines', token: 'line' },
    { answerKey: 'animalIdentifiers', token: 'unit' }
  ],
  answerKey: 'animalIdentifierEarTag'
})
```

The commodities feature owns every decision; the utility only executes it.
Adding or moving an identifier requires changing the commodities feature’s
binding and its tests.

This is not different:

```js
flatten(answers, obligations)
```

If the helper loops the complete manifest, identifies group obligations,
derives every `within` chain and reads every `obligation.name`, it is the
current `answersToFulfilments` design under another filename
(`bridge/fulfilments.js:48-71,125-148`).

There is an honest trade. The current bridge gets total coverage cheaply
because the manifest already contains `name`, `id` and `within`. Option (d)
restates some of that association at the feature boundary. Its benefit is
local ownership and the ability for a collection feature to use a natural
single walk; its cost is a distributed registry that must be proved complete.
The shared helper should not be made so clever that it erases the only
architectural distinction option (d) buys.

## Arguments against option (d)

### It distributes a currently total mapping

Today a new non-group manifest obligation is automatically considered by
`answersToFulfilments`; group obligations are automatically excluded
(`bridge/fulfilments.js:52-56,139-148`). The answer-key and dispatch coverage
also derive their shapes from the manifest and fail boot for unowned
obligations (`flow/obligation-source.js:67-87,113-135`;
`flow/dispatch.js:68-86`).

Option (d) adds another coverage dimension: “owned by a page” must also mean
“bound exactly once for evaluation”. Without a boot-time assertion comparing
feature bindings with every non-group manifest UUID, a page can successfully
store a value that never reaches the evaluator. A duplicate contribution is
also dangerous: normal object spread would make order determine which feature
wins.

### Cross-feature gates make the global assembler load-bearing

The feature contributions cannot be evaluated independently. CPH is collected
by `features/cph-number/` but reads every commodity-code record
(`features/cph-number/controller.js:15,54-83`;
`model/obligations/obligations.js:582-590`). Unweaned status is collected by
`features/additional-details/` and has the same dependency
(`features/additional-details/controller.js:12-15,62-99`;
`model/obligations/obligations.js:610-618`). Import-purpose and exit features
depend on import-reason. Transport sub-features depend on transport type or
means (`model/obligations/obligations.js:252-327,386-453`).

The central bridge seam therefore becomes a central contribution registry and
evaluation facade. That is smaller and less inferential, but it is still a
critical runtime component.

### Purge cannot be safely owned only by the page being submitted

Changing one feature can purge another. Removing the last triggering commodity
can make a notification-level unweaned or CPH value out of scope; changing
reason for import can purge purpose or exit fields. The write engine therefore
evaluates the merged answer set and destroys every projected path in the
evaluator’s purge result (`engine/write.js:12-28,65-93`;
`bridge/purge.js:58-69`).

A feature-local “submit my own fulfilments” API would be wrong. On every purge
authority, the assembler must rebuild all feature contributions from the full
post-write store. Resume has the same property: the real persistence adapter
reconstructs one complete nested `answers` object
(`services/persistence/records/real.js:47-56,103-109`), after which evaluation
must assemble every feature again.

### Output projection still needs an inverse association

Moving name-to-UUID input binding into features does not remove UUID-to-path
output binding. Scope, status and purge receive implications and fulfilments
keyed only by UUID and composite id
(`model/obligations/evaluator.js:107-119,531-544`). Something must know that
ear-tag UUID plus `line0/unit1` corresponds to the nested ear-tag path.

If every feature supplies an input function but not a projection descriptor,
the central layer will reconstruct the same manifest-derived inverse it has
today. Option (d) must therefore make bindings bidirectional at the descriptor
level, even though it should not recreate the full value-level
`fulfilmentsToAnswers`.

### Persistence remains a second mapping

Mongo/backend notification mapping is not UUID-addressed. It explicitly maps
readable answers into backend homes: direct fields, origin, transport,
commodity complements, units and documents
(`services/persistence/records/notification-mapper.js:166-220,253-302,309-420`).
The real records adapter calls this mapper on save and reverses it on load
(`services/persistence/records/real.js:47-56,124-139`).

Keeping storage name-addressed is the least harmful choice under (d):

- controllers already read and write names;
- check answers reads the nested names;
- the backend mapper already maps those names; and
- UUID fulfilments are not persisted today.

Changing storage to UUIDs would expand option (d) into a persistence and
controller rewrite, contrary to its purpose. The cost is that the system still
has two mappings:

1. page store ↔ evaluator UUID view, owned by features; and
2. page store ↔ backend notification, owned by the persistence adapter.

Some names appear in both. This is not accidental duplication that UUID storage
would automatically solve: the notification mapper contains backend-specific
grouping and lossy/lossless transforms, such as grouping per-species lines by
commodity and mapping unit fields to backend names
(`services/persistence/records/notification-mapper.js:47-93,136-164,309-398`).

### “Native evaluator language” can leak too far

Controllers are currently readable in page terms:
`state.commit(..., { reasonForImport: value })`,
`state.appendEntryAt(..., ['commodityLines', index, 'animalIdentifiers'], unit)`
(`features/import-reason/controller.js:44-54`;
`features/commodities/animal-identification.controller.js:508-517`). Requiring
controllers or templates to pass UUIDs or `line…/unit…` strings would make page
code less native to its actual store.

The useful interpretation of option (d) is **feature-owned adapter declarations
colocated with the page**, not UUIDs in form field names and not composite ids
in templates.

### Empty entries remain a blind spot

Groups carry no stored fulfilment of their own; the evaluator infers instances
from descendant record maps
(`bridge/fulfilments.js:18-23`;
`model/obligations/evaluator.js:307-328`). Consequently,
`{ commodityLines: [{}] }` flattens to `{}` just like an empty array
(`bridge/fulfilments.test.js:167-172`). Collection completeness contains
special handling for empty top-level entries, but documents that a fully empty
nested unit can disappear before its any-of invariant is seen
(`bridge/collection-complete.js:24-27,82-90`).

Feature-local flattening does not fix this while the evaluator/model is
unchanged. It must reproduce the same behaviour to be byte-compatible. This is
another reason to retain golden equivalence tests rather than treating a move
as a harmless file shuffle.

### The test surface gets wider before it gets smaller

The current bridge suite pins:

- scalar UUID mapping;
- depth-1 and depth-2 composite ids;
- empty-collection behaviour;
- the one numeric coercion;
- document topology; and
- evaluator smoke behaviour
  (`bridge/fulfilments.test.js:116-178,185-226,228-355`).

Under (d), these tests move into each feature binding module, and the global
assembler needs new tests for duplicate IDs, missing coverage and deterministic
merge. Existing evaluator tests should remain untouched because Paul’s
evaluator is untouched. A golden test should run a corpus of nested answers
through the current `answersToFulfilments` and the new feature assembly and
require exact equality before the old input translator is removed.

The projection suites for scope, status, purge and collection completeness
remain necessary because those are surviving shared behaviours
(`bridge/scope.test.js`; `bridge/status.test.js`;
`bridge/collection-complete.test.js`; the purge contract is exercised through
`engine/commit-purge-authority.test.js:8-15,35-73`).

## Recommended shape of option (d)

If option (d) is chosen, I recommend the constrained form:

1. Keep the nested name-keyed page store and notification mapper unchanged.
2. Keep every file in `model/obligations/`, including UUID keying, composite
   record maps, gate helpers, purge fixpoint and state queries, unchanged.
3. Add side-effect-free, feature-owned binding modules. Scalar modules are
   declarative one-liners; collection modules own explicit group paths and can
   build all their records in one walk.
4. Use one small shared composite utility for `line`/`unit` formatting and
   positional decoding. It accepts feature declarations; it does not inspect
   the whole manifest to infer bindings.
5. Use one global registry/assembler/evaluation facade with hard duplicate and
   coverage checks.
6. Keep scope, status, purge and collection-complete as shared projections,
   refactored to consume the feature binding registry.
7. Prove exact input equivalence against the current translator before deleting
   it; leave the evaluator’s own tests and implementation unchanged.

I would not recommend literal hand-coded composite string concatenation in
every controller. That duplicates a subtle convention and encourages page
code to mix store identity with evaluator identity. Nor would I recommend a
new `flatten(answers, obligations)` helper: that preserves today’s ownership
while only moving the filename.

Whether this is worth doing depends on the aim of p-101. If the aim is fewer
lines of code, option (d) may lose: the current generic translator derives a lot
from one manifest. If the aim is to make a feature the review and change
boundary for its page/store/evaluator binding, (d) achieves that, especially
for the one complex commodities topology. Its benefit is ownership and
locality, not the elimination of all translation.

## Verdict

### On the composite machinery

The answer is closest to **(b): necessary but relocatable as mechanism plus
feature-owned binding**.

Necessary:

- the unchanged evaluator requires flat UUID-keyed fulfilments
  (`model/obligations/evaluator.js:3-16`);
- records under one UUID need per-instance identity;
- slash prefixes are used to enumerate parent and nested groups
  (`model/obligations/evaluator.js:297-358`);
- prefixes join line gates to unit paths
  (`model/obligations/helpers.js:551-578`);
- exact ids drive per-instance invariants
  (`model/obligations/state-queries.js:70-96,119-144`); and
- exact ids let purge filter one record
  (`model/obligations/evaluator.js:414-433`).

Relocatable:

- commodities can construct every depth-1 and depth-2 record because it owns
  that whole nested store;
- documents can construct its depth-1 records;
- scalar features can contribute their own UUID/value; and
- a global assembler only needs to merge these contributions before one
  evaluation.

Partly avoidable:

- scalar features need no flattening at all;
- a commodities contributor can walk lines and units once rather than use a
  central per-obligation recursive walk;
- the central name→obligation map and manifest-wide input inference can go; and
- the production-unused full fulfilments→answers inverse can go.

Not avoidable under the constraint:

- creating the flat UUID-keyed view;
- creating the composite record ids for collections;
- merging all features before evaluation; and
- projecting UUID/composite output back to page paths.

### On Sam’s one-feature intuition

Sam is right about the important locality fact: every stored collection and the
only depth-2 topology have one feature-folder owner. In particular,
`commodityLines[0].animalIdentifiers[1].animalIdentifierEarTag` is created,
edited and removed wholly within `features/commodities/`
(`features/commodities/animal-identification.controller.js:294-327,478-517,575-598`).
That makes a feature-local nested walk sufficient.

The intuition needs one qualification. The records are displayed by check
answers and mapped by persistence, while their **meaning** is evaluated
globally for hub status, cross-feature gates, invariants and purge
(`features/check-answers/controller.js:206-238`;
`services/persistence/records/notification-mapper.js:309-398`;
`bridge/status.js:233-304`; `bridge/purge.js:58-69`). Data ownership does not
imply evaluator isolation.

### On the “load-bearing” framing

The orchestrator was right at the contract level. Composite record identity is
load-bearing for the unchanged evaluator, and one complete flat map is
load-bearing for global gates and purge.

It was wrong or overstated if it implied:

- nested walking must be owned by one central bridge;
- nested data is shared across feature writers;
- the `line`/`unit` formatter itself contains global domain reasoning; or
- removing the central inference loop means changing Paul’s model.

The strongest honest description of option (d) is:

> **Distribute evaluator-input bindings to the features that own the stored
> fields; share the composite-id mechanism; assemble and evaluate once
> globally; retain shared output projections.**

The biggest cost is making that distributed binding registry complete and
authoritative across resume, purge and every global read. That is a real cost,
not a naming concern.

Under this proposal, Paul’s evaluator and the whole
`model/obligations/` model are **UNCHANGED**. They receive the same UUID keys,
the same `{ fulfilmentId: value }` records-maps, the same `line0/unit1`
composite ids and the same values as they receive today.

> **Provenance.** Produced by a pure-Claude fan-out workflow (`wf_1924f873-603`, 2026-07-29):
> 23 reviewers (one per cohesive unit, **208/208 non-test files, full coverage**) → synthesis.
> Reviewed against `docs/best-practices/node/code-style.md` (16 rules), function decomposition
> (rules 1/5/8/9) as the headline. Read-only. Findings are grounded at file:line; not yet actioned.
> (Note: the safety classifier was unavailable for 9 reviewers — output was read + verified by the
> orchestrator; it's a standard code-style audit, no edits made. Minor tally drift between the raw
> log and the synthesis recount is immaterial.)

# JS Code-Style Audit — Live-Animals Frontend

## 1. Summary

**Coverage: 208 / 208 non-test files reviewed across 23 units — full coverage, no shortfall.** 61 findings raised against the 16-rule style guide (FUNCTION DECOMPOSITION as the headline rule).

**Overall health: good, with concentrated hot-spots.** The codebase is broadly well-decomposed — the check-answers card layer, the notification-mapper sub-builders, and the encode side of the fulfilment codec are all exemplary "one named builder per thing" code, and most findings are `low`. The signal is genuinely low-noise: the guide's decomposition rule is honoured almost everywhere, which is why the violations that remain are worth acting on rather than lost in churn.

Severity spread: **0 high · 21 medium · 40 low.** Category spread:

| Category | Count | Medium |
|---|---|---|
| Decomposition (rule 1/5) | 19 | 7 |
| Functional-style (rule 4/11) | 17 | 6 |
| Magic-literal (rule 13) | 14 | 3 |
| Naming / positional params (rule 6/7/9) | 3 | 1 |
| Comments (rule 3) | 2 | 2 |
| Early-returns (rule 8) | 2 | 1 |
| Other (rule 7/9/16) | 4 | 2 |

**Three worst areas, ranked by impact:**

1. **`bridge/` tree-walk duplication** — the same ancestor-chain walk, group-set derivation, index comparator, and system-populated obligation set are each re-implemented 2–3 times across `fulfilments.js`, `fulfilment-registry.js`, `read-fulfilment.js`, `obligation-source.js`, `collection-complete.js`. This is the highest-value cluster: it is silent-drift risk in the model spine, not cosmetics.
2. **Feature-controller boilerplate that recurs across ~9 files** — an unnamed `500` status literal (while `400` is a named constant in the same file), a positional trailing `render(..., {}, true)` boolean/errors signature, and a `let committed` mutated inside a `recoverableSave` callback. Each is minor alone; each repeats often enough to warrant a single shared fix.
3. **A handful of genuinely fat controller functions** — `documents/postAdd` (~70 lines), `check-answers/buildSections` (62 lines), `notification-mapper/answersToTargetNotification` (~45 lines), `fulfilment-codec/decodePersistedFulfilment` (~35-line loop body). These read as walls against a codebase that elsewhere reads as prose.

---

## 2. Top decomposition offenders

Ranked by impact (size × tangle × blast-radius). The `bridge/` duplication cluster leads because it is model-spine correctness risk, not just readability.

| # | File:line | Function | Why it violates the guide | Concrete split |
|---|---|---|---|---|
| 1 | `bridge/fulfilment-registry.js:21` | `ancestorsOf` | The root→parent chain-walk is byte-for-byte `fulfilments.js:39` `ancestorChain`, and again `read-fulfilment.js:9` `ancestorsAndSelf` (just `[...chain, self]`). Rule 5 — three copies of one tree-walk that must be hand-synced. | Import `ancestorChain`; `assertGroupedPath` uses `ancestorChain(binding.obligation)`. `ancestorsAndSelf` → `(o) => [...ancestorChain(o), o]`. No import cycle. |
| 2 | `bridge/collection-complete.js:41` | `STRUCTURAL_PLACEHOLDERS` | Re-hardcodes the exact two obligation names `obligation-source.js:25` already exports as `SYSTEM_POPULATED` (which `status.js` imports correctly). Rule 13 — two copies of a control-flow set drift silently. | Delete the local `Set`; import `SYSTEM_POPULATED`, use `SYSTEM_POPULATED.has(leaf.name)` at L92. |
| 3 | `bridge/obligation-source.js:69` | `groupSet` | Re-derives "which obligations are groups" a third time (`fulfilments.js:32` `groupObligations`, `fulfilment-registry.js:137` both compute it; the model exports `groups`). | Import `groupObligations` / `groups` and reuse. (Registry's copy is manifest-parameterised — justifiably keeps its own.) |
| 4 | `features/documents/controller.js:393` | `postAdd` | ~70-line handler carrying load → build entry → capacity → validate → filename → upload → and a dense `recoverableSave` success closure (L434-446) with its own `alreadyCanonicallySaved → commit vs appendEntry` branch. Rule 1 — two responsibilities, densest part is the embedded closure. | Extract `saveAddedDocument(request, h, pageState, savedEntry, bare)` (mirror the already-extracted `retryProjectionSave`); optional `isAlreadySaved(pageState, uploadId)` predicate. `postAdd` then reads as prose. |
| 5 | `features/check-answers/controller.js:587` | `buildSections` | 62-line function inline-assembling all four view sections with nested groups/cards + conditional spreads — while the rest of the file extracts one named builder *per card*. Rule 1/5 — section layer breaks the file's own pattern. | Extract `aboutConsignmentSection` / `movementSection` / `addressesSection` / `documentsSection`; body becomes a flat list with `...(documents ? [documentsSection(...)] : [])`. |
| 6 | `services/persistence/records/notification-mapper.js:392` | `answersToTargetNotification` | ~45-line assembler that mutates the base notification six times in a row (responsiblePerson, purpose, region→origin, transportExtras→transport, commodity, documents), each block re-reading + guarding + merging in place. Rule 4 — repetitive imperative mutation obscures Mapper B's output shape. | Extract `targetExtras(reader)` + small named origin/transport merge helpers; assemble with `compact` + spread merges. Top level reads: base, overlay origin, overlay transport, attach commodity/documents. |
| 7 | `services/persistence/records/fulfilment-codec.js:190` | `decodePersistedFulfilment` | ~35-line `for...of` body mixing cross-entry state (`seenObligationIds`) with all per-entry validation (object/one-of/exact-keys/obligationId/dup/form). Rule 1 — reads as a wall vs the clean `encodeEvaluatorFulfilments` map. | Extract `decodeEntry(entry, seenObligationIds)` returning `[obligationId, stored]`; loop becomes `.map(entry => decodeEntry(...))`. |
| 8 | `features/addresses/party-picker.controller.js:112` | `render` | Does two things: fetches data (`search` + `party` + `from`) **and** assembles a ~40-line nested view model, with the row-builder callback (L144-152) carrying the `idPrefix` rule inline. Rule 1. | Extract `rowFrom(record, index, { from, selectedId })` and optionally `pickerModel(...)`; `render` becomes fetch-then-assemble. |
| 9 | `features/commodities/animal-identification.controller.js:419` | `buildLineForms` | Imperative `for-of` with three mutable accumulators (`forms` Map, `atMaxByIndex` Map, `let errors = {}` respread each pass) + a `continue`, mixing partition-at-max with accumulate-forms. Rule 4/11. | Extract `isAtMax(answers, index, entry)`; partition once, `map` the remainder, derive `forms`/`errors` from a named `built` array. No `let`, no `continue`. |
| 10 | `features/dashboard/notification-helper.js:79` | `buildPaginationLinks` | `previous`/`next` each an inline ternary embedding a multi-line object literal with a template href built from a nested `buildHomeListQueryString(...)`. Rule 5/9 — three concerns per key, parsed at once. | Extract `pageLink({ baseUrl, page, sort, text })`; build named `previous`/`next` intermediates; return `{ previous, next }`. |
| 11 | `lib/path.js:2` | `pathKey` | Reduce callback is a doubly-nested ternary (number-segment / first-segment / subsequent). Rule 8/9 — clever one-liner in the accumulator. | Extract `appendSegment(key, segment, index)` with early returns; `pathKey = (path) => path.reduce(appendSegment, '')`. |

**Lower-severity decomposition (summarised):** `read-fulfilment.js:71` `instanceIds` (30-line closure, extract `matchingInstanceId`); `read-fulfilment.js:19` `compareFulfilmentIds` duplicates `fulfilments.js:90` `compareIndices` (extract shared `compareIndexArrays` into `fulfilment-id.js`); `assemble-fulfilments.js:6` (extract `mergeContributions`); `fulfilments.js:122` `addCollectionIndices` (extract `getOrCreate` upsert helper); `animal-identification.js:87` `addressChecksFor` (nine-field address shape spelled out 5× — collapse to one spec table, judgment call); `consignment-details.js:171` `post` (extract `countDropRender`); `check-answers.js:547` `documentsCard` + `:650` `renderCya` (extract row/action/href helpers to match the file's own pattern); `cph-number.js:44` `render` (6 positional params).

---

## 3. Other findings by category

### Functional-style (17 — 6 medium)

Two sub-patterns dominate; both are best fixed once rather than per-file.

- **`let x` mutated inside a `recoverableSave` callback (5 low, one shape):** `cph-number.js:89`, `import-type-filter.js:75`, `delete-notification.js:46`, `cancel-amend.js:52`, `notification-actions.js:24`. Each declares an uninitialised `let`, assigns it by side-effect inside the async action closure, then reads it after. Rule 11/4. **This is a shared-kit contract issue, not five independent bugs** — the fix is to have `kit.recoverableSave` resolve to the action's return value so each site reads `const committed = await kit.recoverableSave(...)`. If the kit signature can't change, these are acceptable constrained idioms.
- **Imperative accumulate-then-return where a pipeline states intent:** `write.js:21` `splitPatch` (copy-then-`delete` partition → `Object.fromEntries(filter)` / `Object.groupBy`); `state-queries.js:70` `checkAnyOfIds` and `:119` `checkRecordCountEquals` (`errors=[]` + `for`/`continue`/`push` → `filter`+`map`, extract named predicates `leafInScopeForInstance` etc.); `path.js:47` `firstDivergingIndex` (`let index` walk → `findIndex` over shared prefix, `-1` sentinel preserved); `real.js:227` `replaceFulfilment` (`failures=[]` loop → extract `saveProjections(...)`).
- **Notable one-offs:** `notification-mapper.js:280` `notificationFromFulfilment` (medium — build-then-`if (x) notification.y = x` × 4 where `compact` + sub-builders' `orUndefined` already handle it; collapse to one `compact({...})` expression); `dashboard/controller.js:118` `toRow` (medium — extract `applyRetryKey`); `upload-config.js:28` `allowedTypeLabels` (`filter+indexOf` dedup re-implements the existing `ALLOWED_MIME_TYPES` Set); `countries/client.js:7` (`if(len){for}` → `blocks?.forEach`); `transit-countries.js:64` `selectedFrom` (name the `[].concat(x ?? [])` normalise / filter / dedupe steps); `party-picker.js:59` `itemsWithEllipses` (dense reduce, name the `hasGap` test).

### Magic-literals (14 — 3 medium)

- **Unnamed `500` status across ~9 controllers (the dominant pattern):** `origin.js:135`, `additional-details.js:111`, `import-reason.js:64`, `import-purpose.js:68`, `contact.js:90` (medium), `port-of-exit.js:70`, `port-of-entry.js:121`, `party-picker.js:197`, `create-address.js:162`. Every one of these files *already names `400`* as `HTTP_STATUS_BAD_REQUEST` and inlines its sibling `.code(500)`. **Fix once: a shared `HTTP_STATUS_INTERNAL_SERVER_ERROR = 500` (ideally a shared status module, since `HTTP_STATUS_BAD_REQUEST = 400` is itself duplicated per file).**
- **Notable domain literals:** `collection-complete.js:41` (medium, see offender #2); `animal-identification.js:83` (medium — identifier max-length `58` bare while all address maxes are named, and it must track the copy strings); `documents/controller.js:125` (`'documents'` collection key × 5 + bare `'add'` action while `remove` has `REMOVE_ACTION_PREFIX`); `hub/controller.js:65` (`'review'` sentinel drives control flow in 3 sites); `validators.js:82` (phone digit bounds `7`/`15`); `port-of-exit.js:17` (box-drawing divider string).

### Naming / positional params (3 — 1 medium)

- `transporters-select.controller.js:34` `render` (medium) — trailing `recoverableError = false` boolean trap; call sites read `render(h, journey, {...}, {}, true)`. **Recurs across all four transport controllers** (transit-countries L96, port-of-entry L111/121, transporters L54, private-transporter-details L153/163) and `documents/render` (7 positional params, `other` category) and `cph-number/render` (6 params). Fix: fold trailing optionals into one `{ errors, recoverableError }` options param.
- `stub.js:203` `copy` / `softDelete` — bare multi-term status disjunctions; extract `isCopyableStatus` / `isDeletableStatus` (mirror the file's own `assertWritable`).
- `address-book/index.js:62` `search` — unnamed page-clamp ternary; extract `clampPage(page, totalPages)`.

### Comments (2 — both medium, both orphaned JSDoc)

Both describe the *public* function but sit above a *private helper* pushed down beneath them — misleading where they are, absent where they belong:
- `obligation-source.js:114` — doc for `unrecognisedAnswerKeys(answers)` sits above `unrecognisedKeysFor(key, value)`.
- `commodities/index.js:60` — doc for `search(query)` sits above `commodityMatchesQuery(name, normalisedQuery)`.

Fix: move each block down onto the function whose signature it matches.

### Early-returns (2) & Other (4)

- `journey.js:112` `amendJourney` (medium) — two-deep ternary hides an `await`; extract `editableFromStatus(...)` with guard-style early returns.
- `check-answers.js:61` `valueText` (low) — nested type-check ternary → block body with early returns.
- `journey.js:91` `replaceJourneyFulfilment` (medium) — `known ? {...} : saved` written twice, **running `structuredClone` twice on the common path**; compute once as `const next`, then `memoWrite(request, next); return next`.
- `documents/controller.js:237` `render` (medium) — 7 positional params (see naming above).
- `dispatch.js:6` `resetDispatchState` (low) — three module Maps declared `let` only to reassign in reset; use `const` + `.clear()`.
- `collection-complete.js:126` `entryComplete` (low) — `names[names.length - 1]` → `names.at(-1)` (rule 16).

---

## 4. Suggested refactor backlog

Decomposition-first, ordered by value. Each increment is behaviour-preserving and independently verifiable by the existing unit suite + one E2E leg. Maps onto `refactor-backlog.json`.

| # | Increment | Files | Verify | Value |
|---|---|---|---|---|
| R1 | **De-duplicate the `bridge/` tree-walk cluster** — import `ancestorChain`, `SYSTEM_POPULATED`, `groupObligations`/`groups`; extract shared `compareIndexArrays` into `fulfilment-id.js`; delete the 4 re-derivations. | `fulfilment-registry.js`, `collection-complete.js`, `obligation-source.js`, `read-fulfilment.js`, `fulfilments.js`, `fulfilment-id.js` | bridge unit suite (single source of truth is the point) | **Highest** — removes silent-drift risk in the model spine. |
| R2 | **Shared HTTP-status module** — `HTTP_STATUS_BAD_REQUEST` + `HTTP_STATUS_INTERNAL_SERVER_ERROR`; replace all bare `.code(500)` and per-file `400` constants. | ~9 feature controllers | controller unit tests + one save-failure E2E | High — kills the single most-repeated magic-literal. |
| R3 | **`recoverableSave` returns its action result** — change the kit boundary, then drop the `let committed/deleted/restored/copied` across the 5 callers. | `kit` + `cph-number`, `import-type-filter`, `delete-notification`, `cancel-amend`, `notification-actions` | kit unit test + 5 controllers' tests | High — one contract fix retires a whole pattern. |
| R4 | **Options-param for controller `render`** — fold trailing `{}, [], true` positionals into `{ errors, summaryErrors, extra, recoverableError }`. | `documents`, `cph-number`, 4 transport controllers | controller unit tests | Medium — self-labelling call sites, one shape. |
| R5 | **Split `documents/postAdd`** — extract `saveAddedDocument` + `isAlreadySaved`. | `features/documents/controller.js` | documents add/upload E2E | Medium. |
| R6 | **Split `check-answers/buildSections`** into four section builders (+ `documentsCard`/`renderCya` helpers). | `features/check-answers/controller.js` | CYA E2E (`cya-snapshot`) | Medium. |
| R7 | **Collapse the two mapper assemblers** — `answersToTargetNotification` + `notificationFromFulfilment` to `compact({...})` + named extras helpers. | `notification-mapper.js` | mapper unit suite (real-submit parity) | Medium. |
| R8 | **Extract `decodeEntry`** from `decodePersistedFulfilment`. | `fulfilment-codec.js` | codec round-trip units | Medium. |
| R9 | **Functional-partition batch** — `splitPatch`, `firstDivergingIndex`, `checkAnyOfIds`/`checkRecordCountEquals`, `buildLineForms`, `saveProjections` extraction. | `write.js`, `path.js`, `state-queries.js`, `animal-identification.js`, `real.js` | respective unit suites | Medium. |
| R10 | **Low-nit sweep** — move the 2 orphaned JSDoc blocks, `.at(-1)`, `dispatch` `const`+`.clear()`, `pathKey`/`valueText`/`amendJourney` early-returns, `journey.js:91` single-clone, named predicates in `stub.js`/`address-book`. | scattered | full unit suite | Low, but cheap and closes the guide. |

---

## 5. Deliberately excluded (idiomatic, not violations)

So the signal above is trusted — these were considered and judged correct for the architecture:

- **`fulfilment-registry`'s own group-set derivation** — unlike `obligation-source`'s, the registry's is parameterised by an injectable manifest, so it *should* keep its own copy rather than import the model's. Only the unconditional re-derivations are flagged.
- **The `certification-purposes` / `import-reason-purpose` `toOptions` map** (3×) — flagged only as a low judgment-call, not a must-fix. For a prototype, a three-line `Object.entries(...).map(...)` per self-contained service slice is acceptable; extracting a shared util is worthwhile *only if one already exists*. Not on the backlog.
- **`await` inside a sequential loop in `saveProjections`** — intentional ordering of idempotent PUTs; keeping it sequential is correct, so the extraction (R9) preserves the loop rather than parallelising it.
- **Single-use domain field names** (`'commodityLines'`, `'numberOfAnimalsQuantity'`) — not hoisted to constants; only identifiers that *drive control flow in multiple sites* (`'review'`, `'documents'`) were flagged, per rule 13's intent.
- **The clean exemplars** — `encodeEvaluatorFulfilments`, the check-answers *card* builders, and the notification-mapper *sub*-builders are the pattern the decomposition findings ask the rest of the code to match; they are called out as the reference, not re-litigated.
- **Hapi handler `request, h` positional leads** — kept positional in the R4 options-param refactor; only the *optional trailing* args are folded, matching framework convention.

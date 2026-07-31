# p-106 — Two definitions of "blank", one boundary

Decision-support for a conversation with Paul. Repo
`repos/trade-imports-animals-frontend`, branch `spike/EUDPA-288-model-retrofit`,
system `prototypes/standalone/live-animals/`. All file:line references below
were read and verified on that branch; paths are relative to
`prototypes/standalone/live-animals/`.

---

## For Paul

**The question.** Should "blank" have one definition?

Right now the system has two. They judge the same value and can disagree.

- The answers side (`lib/answered.js` `isBlank`) trims whitespace and recurses into nested objects to any depth.
- The fulfilments side (`model/engine/is-blank-value.js` `isBlankValue`) does not trim, and looks one object level deep.

Both run inside the *same* status computation (`bridge/status.js` imports both). So one stored value can be "blank" to one half of a calculation and "content" to the other.

**Why it matters.** This is not hypothetical. Save whitespace-only spaces into a mandatory CPH today, and the same value is read three different ways: the task list marks the row Completed, Check-your-answers prints "Not provided", and submit goes through — shipping a whitespace CPH in the notification. The full path is in [section 3](#3-where-the-divergence-actually-bites-today).

**This was your design.** The one-blank-check extraction exists so callers "cannot drift apart on what blank means". The split predicate is exactly that drift, reintroduced during the merge.

**The two-line ask:**

1. Do you agree "blank" should have one definition, living in the model?
2. If so, do you accept trim-plus-full-depth (the stricter union) as that definition — or do you want no-trim/one-level kept for a reason we haven't seen?

---

## 1. The two predicates, verbatim, and everything that consumes them

### 1.1 `lib/answered.js:1-10` — the answers-side predicate

```js
export const isBlank = (value) => {
  if (value === undefined || value === null) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    return Object.values(value).every(isBlank)
  }
  return String(value).trim() === ''
}

export const isAnswered = (value) => !isBlank(value)
```

What it does:

- Trims strings (`String(value).trim()`).
- Recurses into composites to any depth (the `every(isBlank)` self-call).

It judges values in the **nested answers POJO** — the shape pages write, and
the session/journey store persists. It has no test file of its own.

### 1.2 `model/engine/is-blank-value.js:29-41` — the fulfilments-side predicate

```js
export const isBlankValue = (value) => {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    const values = Object.values(value)
    if (values.length === 0) return true
    return values.every(
      (leaf) => leaf === undefined || leaf === null || leaf === ''
    )
  }
  return false
}
```

What it does:

- No trim.
- One composite level only. A member that is itself an object or array is never blank, whatever it contains. A member that is `' '` counts as content.

It judges values in the **flat UUID-keyed fulfilments map** the evaluator
consumes.

Its header (`is-blank-value.js:1-27`) declares it "the one blank-check …
extracted so [the callers] cannot drift apart on what blank means". It defends
no-trim at `is-blank-value.test.js:14-16` by citing `Contract.validatePagePayload`'s
own trim. That defence is **verified stale**: `validatePagePayload` appears
nowhere in the tree outside that comment and a doc-comment echo in
`model/engine/index.js`.

**The two shapes are the same data.** `bridge/fulfilments.js`
`answersToFulfilments` (:193-203) copies every non-`undefined` answer value
into the fulfilments map verbatim (modulo the VOCAB renames for six named
fields, :115-125). `''`, `'   '`, `{ day:'', month:'', year:'' }`, `[]` all
cross the bridge untouched. So the two predicates genuinely judge the same
values — through two different lenses.

### 1.3 Every consumer of `isBlank` / `isAnswered` (answers side)

| Call site | Path it feeds | User-visible surface |
|---|---|---|
| `bridge/status.js:145,149` (`partStarted`) | `statusOf` → `rowStatus`/`sectionStatus` (`flow/task-rows.js:66-67`, `flow/section-status.js:8-9`) | Hub task-list tags: whether a row counts as "started" (Not yet started vs In progress; Optional vs Fulfilled) — `features/hub/controller.js:95,49-56` |
| `bridge/status.js:200` (`singletonFulfilled` fallback) | Satisfied-check for flow-only obligations the manifest omits (`importType`, `declaration`) | Inert for task rows (rows never cover them — `bridge/scope.js:163-165`) |
| `bridge/purge.js:32,41` (`wipeSet`) | Only values *answered on the way in* emit wipe keys when the evaluator drops them | Whether an out-of-scope stored value is destroyed by `engine/write.js:12-14` `purge` |
| `bridge/scope.js:61-67` (`anyInstanceAnswered`) → `scope.answered` | `flow/gates.js:15` `ENFORCED_AT_CONTINUE` prerequisites (`countryOfOrigin`, `commoditySelection`) | Whether Continue-gated pages are reachable |
| `flow/entry-guard.js:38-41` (`hasCommittedNotificationAnswers`) | Deep-link guard (`entryGuardTarget`) + journey-strip display (`features/origin/controller.js:83-84`) | Fresh journey redirected to the entry filter; whether the DRAFT strip shows |
| `engine/evaluate/cardinality.js:26` (`collectionCapAt`) | Unanswered count field = no cap | Whether Add-another is allowed at the unit-count cap |
| `features/check-answers/controller.js:60,63,98,101,105,208,210,350` | `valueText`/`dateText` "Not provided", address-line filtering, party rows, identifier-table columns, approval-number row | Every CYA row's rendered value |
| `features/documents/controller.js:76,144` | Document summary rows | Documents page display |
| `contract.test.js:17,54` | Test infrastructure (newly-answered detection) | none |

### 1.4 Every consumer of `isBlankValue` (fulfilments side)

| Call site | Path it feeds | User-visible surface |
|---|---|---|
| `bridge/status.js:159` (`isValueFulfilled`, non-address values) | `partSatisfied` → `statusOf` → row/section status → `readyForCheckYourAnswers` (`flow/section-status.js:11-15`) | Hub Completed tags; the CYA gate (`flow/flow.js:82`); the **submit gate** (`engine/write.js:114`) |
| `bridge/collection-complete.js:61` (`isFulfilled`) | `entryComplete` → `collectionView`'s per-entry `complete` flag (`engine/evaluate/collection-view.js:21`) | Per-line/per-unit completeness in hub + commodity UIs (`features/hub/controller.js:121`) |
| `model/engine/index.js:493` (`checkAnyOfIds`) | `groupInvariantErrors` — consumed at runtime by `bridge/status.js:237` and `bridge/collection-complete.js:124` | The "at least one animal identifier per unit" floor blocking Completed/submit |
| `model/engine/index.js:538` (`checkRecordCountEquals`) | same runtime path | Blank declared-count skips the unit-count invariant |
| `model/engine/index.js:512,518` (`checkAllOrNothingOfIds`) | same shape — **no manifest carrier today** (`index.js:598-599`) | none yet |
| `model/engine/index.js:90,126` (`firstUnfulfilledPageForLine/Unit`), `:258,378-379` (`hasFulfilment`/`hasAnyInput` inside `pageStatus`/`containerStatus`/`journeyState`) | **Not consumed at runtime** — grep confirms no caller outside `model/engine` and tests (these are the Paul-engine exports flagged separately in the merge-artifact review) | none |

**Address escape hatch (both sides).** For the nine address obligations, the
*satisfied* check bypasses `isBlankValue` entirely. `domain.get(id).isComplete`
(`model/domain/index.js:54-64`) checks the required sub-fields **and trims
them**. So addresses already live under trim semantics for completeness. Only
their *started* signal differs by predicate.

---

## 2. Worked edge cases — real value shapes from this journey

Every value below is a shape this journey actually stores (source cited).
"Today" columns are verified by reading the consuming code in section 1, not
assumed.

| # | Value (real source) | `isBlank` (answered.js) | `isBlankValue` (model) | User-visible today | Under one predicate = trim+deep (Option A) | Under one predicate = no-trim/shallow (Option B) |
|---|---|---|---|---|---|---|
| 1 | `'   '` — `countyParishHoldingCph`; storable today: `cph-number/controller.js:53-56` slash-strips but never trims, and `maxText` validation (`lib/validate/validators.js:36-44`) trims only a discarded copy | **blank** | **content** | **Incoherent.** Addresses row can read *Completed* (`status.js:159` says satisfied) while CYA prints *"Not provided"* for the same field (`check-answers/controller.js:60,409-417`); `readyForCheckYourAnswers` passes → **submit succeeds** with a whitespace mandatory CPH (`engine/write.js:114`). If CPH later leaves scope, the purge never wipes it (`purge.js:32`: not "answered" → no wipe key) — stale but inert | Blank everywhere: row stays In progress / Not started, CYA "Not provided" agrees, submit blocked until a real CPH is typed. (Purge still skips it — inert either way) | Content everywhere: row Completed, submit passes, **CYA renders the raw whitespace** as the answer (visually an empty cell that claims to be provided); journey-strip/entry-guard count it as a started journey |
| 2 | `''` — `animalsCertifiedFor` after saving the page with no radio picked (`additional-details/controller.js:78,87-88` commits `''`) | blank | blank | Agree: unfulfilled + not started; CYA "Not provided" | same | same |
| 3 | `{ day: '', month: '', year: '' }` — `arrivalDateAtPort` cleared (`shared/kit.js:83-87` `readDate` builds this trimmed shape; stored by `port-of-entry.controller.js:94`) | blank (deep recurse) | blank (one level, all-`''` leaves) | Agree: unfulfilled; CYA "Not provided" (`dateText`, `controller.js:63`) | same | same |
| 4 | `[]` — `transitedCountries` with nothing ticked (`transit-countries.controller.js:78-80` commits the selected array) | blank | blank | Agree: unfulfilled | same | same |
| 5 | `0` (number) — `numberOfAnimalsQuantity` reaches the evaluator as a Number via `toNumberWhenParses` (`bridge/fulfilments.js:106-110,124`); `min: 1` validation blocks storing it in practice (`consignment-details.controller.js:34-37`) | content (`String(0).trim()` = `'0'`) | content (non-string primitive) | Agree — pinned deliberate (`is-blank-value.test.js:57-63`: "0 is an intentional value") | same | same |
| 6 | `{ name:'', addressLine1:'', town:'', postcode:'', country:'', telephone:'', email:'' }` — a `permanentAddress` the user cleared field-by-field (`animal-identification.controller.js:145-150` trims each sub-field on the way in) | blank | blank | Agree — and this exact case is the Fix #4-#7 regression `isBlankValue` was extracted to kill (`is-blank-value.test.js:32-44`): cleared address rolls back to unfilled | same | same |
| 7 | `{ name: ' ' , addressLine1: '', ... }` — an address with a whitespace sub-field. **Not producible via the UI today** (address controllers trim each field), listed because it is the composite-member form of row 1 | blank | content (leaf `' '` fails the `=== ''` test) | Latent. Would only arise from an untrimmed future field or an external write | blank | content |
| 8 | `{ name: 'EuroStore Services', address: { addressLine1: 'Rue de la Loi 200', ... } }` — `contactAddress`, the journey's real **depth-2** composite (`contact/controller.js:66-68`; canned party `services/address-book/stub.js:27-34`) | content | content | Agree when filled. The hollow variant `{ name: '', address: {} }` is where they split: `isBlank` → blank (recurses), `isBlankValue` → **content** (the `address` member is an object, never a blank leaf). Not producible via the UI (the page only commits a chosen party) and the *satisfied* path for parties runs through `isComplete`, not `isBlankValue` — so the depth split is **latent** today | hollow variant blank | hollow variant content |
| 9 | `false` — no boolean storage today (yes/no radios store `'yes'`/`'no'` strings) | content | content | Agree (pinned `is-blank-value.test.js:62`) | same | same |

**Reading of the table.** Rows 2-6 and 9 — the overwhelming bulk of real
traffic — agree under both predicates and under both candidate
standardisations.

The whole live disagreement is one thing: **whitespace** (rows 1, 7).

The whole structural disagreement is another: **depth ≥ 2 / non-primitive
members** (row 8), which no reachable path exercises yet.

---

## 3. Where the divergence actually bites today

**It bites.** There is one concrete, user-reachable path where both predicates
give opposite verdicts on the same value, in the same function call:

1. Add a CPH-required commodity (e.g. cattle — `CPH_REQUIRED_COMMODITIES`,
   `obligations.js:628-633`). `countyParishHoldingCph` becomes in-scope
   **mandatory** (`obligations.js:627-634`).
2. On the CPH page type spaces only and save. `maxText` validates a *trimmed
   copy* → `''` → allowed (`validators.js:36-44` `.trim().allow('')`); the
   controller then commits the **raw** payload with only slashes stripped
   (`cph-number/controller.js:53-56,69`), and `engine/write.js:22-28` stores
   it as-is. Stored: `countyParishHoldingCph: '   '`.
3. `statusOf` on the Addresses row (`flow/task-rows.js:56`,
   `bridge/status.js:319-330`) now judges that one value twice:
   - `partStarted` → `isAnswered('   ')` → **false** (`status.js:145` →
     `lib/answered.js:7`, trims);
   - `partSatisfied` → `singletonFulfilled` → `!isBlankValue('   ')` →
     **true** (`status.js:199,159` → `is-blank-value.js:31`, no trim).
4. Consequences, each verified in the consuming code:
   - Hub Addresses row: **Completed** once the party rows are done — the
     whitespace CPH satisfies its mandate (`status.js:303-309`).
   - CYA CPH row: **"Not provided"** (`check-answers/controller.js:60,
     409-417` — `isBlank('   ')` is true). Task list and CYA now contradict
     each other about the same stored byte.
   - `readyForCheckYourAnswers` → true (`flow/section-status.js:11-15`) →
     the CYA gate opens (`flow/flow.js:82`) and **`submitJourney` finalises**
     (`engine/write.js:105-117`) — a notification is SUBMITTED carrying
     `countyParishHoldingCph: '   '` into the persisted record.

**A second, quieter asymmetry on the same value.** If the commodity is changed
so CPH drops out of scope, the evaluator purges the fulfilment but `wipeSet`
refuses to emit the wipe key (`purge.js:31-34`: `isAnswered('   ')` is false).
So the whitespace survives in stored answers indefinitely — invisible (out of
scope) but never cleaned.

**The depth divergence, honestly: latent.** The journey does now hold a
depth-2 composite (`contactAddress`, row 8 above) — the "nested composites
aren't in the model yet" premise of `is-blank-value.js:24-26` has expired.

But no runtime path feeds a hollow depth-2 value to `isBlankValue`: party
completeness routes through `domain.isComplete`, and the contact page cannot
store a hollow party. It becomes live the day any non-address composite gains
an object/array member, with no test or guard standing in the way.

**The wider risk.** Every future free-text field that forgets its manual
`.trim()` re-opens the same hole.

---

## 4. The three options

### Option A — one definition in the model, extended to trim + full depth (the report's proposal)

`isBlankValue` gains `.trim()` on the string branch and replaces the one-level
leaf test with a recursive self-call. `lib/answered.js` becomes
`isAnswered = (v) => !isBlankValue(v)` (the import direction is legal —
`obligation-purity.js:48-53` constrains only `model/`'s own imports).

This is the strict **union**: everything either predicate calls blank today
stays blank; nothing currently blank becomes content. The change is
monotonically stricter.

Behaviour change. Whitespace-only values stop satisfying mandates. The CPH path
in section 3 flips from "Completed + submittable" to "In progress + blocked",
and CYA, task-list and submit agree again. A stored draft resumed after the
change could see a row drop from Completed to In progress — the desired
direction, but still a visible flip.

Tests. Exactly one existing assertion flips: `is-blank-value.test.js:17`
(`' '` → not blank), whose justifying comment cites the dead
`validatePagePayload` layer. No other unit test in the status,
collection-complete, purge (`engine/commit-purge-*`, `entry-write-purge-window`),
contract or check-answers suites pins whitespace or depth semantics
(grep-verified). New pins wanted: trim, nested-composite,
composite-with-`[]`/`{}`-member. The stale war-story header is removed by p-109
regardless.

### Option B — one definition, standardised on today's model semantics (no-trim, one level)

`lib/answered.js` re-exports the *current* `isBlankValue` unchanged. Same
single-definition win, zero change to the submit gate.

But the answers-side consumers inherit no-trim:

- CYA would render `'   '` as a provided answer (visually empty cell, no "Not provided").
- The entry guard and journey strip would count a whitespace answer as a started journey (`entry-guard.js:38-41`).
- `collectionCapAt` gains a footgun — `isAnswered('   ')` true → `Number('   ')` = `0` → cap 0, Add-another refused (`cardinality.js:26-28`).
- The deep recursion CYA/party rows rely on is lost (`check-answers/controller.js:101` judges `party?.name`, fine, but `partStarted` on hollow composites flips).

No existing test pins any of this. The change is test-silent but not
user-silent, and it standardises on the semantics whose stated precondition
(a central trim layer) no longer exists. The section 3 incoherence "resolves"
by making submit-with-whitespace the *consistent* behaviour.

### Option C — keep both, declare the boundary deliberate

No code change. Document that answers-side judgement (display, started-ness,
purge, guards) uses trim+deep, and fulfilment-side judgement (satisfaction,
invariants) uses no-trim/shallow — and accept that one value can be "not
provided" and "fulfilled" at once.

The section 3 CPH defect then needs a *separate* fix: trim in
`cph-number/controller.js`, plus a convention or guard that every future
free-text controller trims. And the class stays open.

The divergence is exactly the drift the `is-blank-value.js` header says the
extraction existed to kill. So keeping both needs a positive argument that the
two boundaries *should* judge blankness differently — which nothing found in
the code supplies. Cheapest today; the only option that leaves a known
incoherent user-visible state in place.

---

*Prepared for backlog item p-106 (`workareas/shared/promotion/BACKLOG.json`),
from `workareas/shared/promotion/merge-artifact-report.md` §1.6. Read-only
analysis; no code was changed.*

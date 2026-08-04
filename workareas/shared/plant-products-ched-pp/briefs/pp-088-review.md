# pp-088 review brief — the recoverable-save path across the plant records adapter

This brief OVERRIDES the generic `review.md`. The work is **staged, not committed**. Three files:
`sets/plant-products/services/records/real.js`, its `real.test.js`, and
`sets/plant-products/journeys/linear/features/dashboard/controller.test.js`.

## What the increment did

Every backend-response failure and every fetch rejection in the plant records adapter is now marked
recoverable, so `kit.recoverableSave` (`shared/kit.js:114-123`) can reach its recovery branch on a
normal page save. Before this, only `finalise` marked anything — so at least ten plant controllers
called `recoverableSave` into a branch production could never reach. The unmarked status-check variant
was **deleted** rather than left beside the marked one; `expectStatus` is now the marking one and
`expectRecoverableStatus` is gone.

## ⚠ WHAT I HAVE ALREADY CHECKED MYSELF — do not spend your budget re-treading this

- **Only one `fetch(` remains in `real.js`**, at `:36` inside `recoverableFetch`. I grepped. Every
  operation routes through it.
- **`new Request(...)` stays OUTSIDE the `.catch`** (`:35`), so a malformed-URL / invalid-header
  config error is still non-recoverable. That structural boundary is pp-081's and it survived.
- **The four plain `Error`s survive and are each now pinned non-recoverable**: unknown journey
  (`:143`), writes blocked (`:149`), blank Idempotency-Key (`:250`), clear unsupported (`:269`).
- **Three pre-existing assertions were converted from `.rejects.toThrow(<substring>)` to
  `toEqual(new Error(<exact>))` plus a non-recoverable assertion.** I read all three: they are
  **strengthenings**, not weakenings — substring became exact equality and a new negative assertion
  was added. Note `toEqual` on an `Error` compares message and name but **not** the recoverable
  symbol, which is exactly why the separate `isRecoverableBackendError` assertion is load-bearing.
- **The operation-set pin works the way I want**: making `Object.keys(records)` fail forces a new
  operation into `backendOperations`, which is the `it.each` source, so it inherits the recoverable
  assertion automatically. This is the pp-087 shape.
- **pp-081's three finalise pins** (`real.test.js` ~`:560` rejected-finalise `describe.each`, JSON
  parse NOT recoverable, request-construction NOT recoverable) are still present.

## ⚠ THE THING I MOST WANT YOU TO ATTACK — I suspect a gap and I want it checked independently

The change has **two axes**: (a) marking bad **statuses**, (b) wrapping **fetch rejections**.

The new `it.each` mocks a **500 response**, so it pins axis (a) for all ten operations. Axis (b) is
pinned by exactly **one** new test, for `replaceFulfilment`, plus pp-081's three finalise cases.

**So my suspicion: if someone reverted `recoverableFetch(` back to `fetch(` on `create`, `list`,
`has`, `load`, `amend`, `cancelAmend`, `copy`, or the three document helpers, would ANYTHING go red?**
If not, eight of the ten operations have their fetch-wrapping unpinned — **the pp-082 shape, where
the increment's own change has no pin and a later "simplification" silently reinstates the defect**.

**Verify this by actually doing it, per operation — do not reason about it.** Report which operations
are unpinned on axis (b), and say plainly whether you think that matters or whether one representative
pin plus the structural seam is sufficient. **I want your judgement, not agreement with mine.**

## ⚠ ASK WHAT EVERY FIXTURE IS A COPY OF — this is the dominant failure mode on this branch

Eight instances so far of a hand-authored fixture standing in for what the system produces.

1. **`backendOperations.replaceFulfilment` passes `known: { journeyId, status: 'draft' }`.** Is
   `'draft'` lowercase what the system actually holds? `assertWritable` compares against the `DRAFT`
   constant from `engine/persistence/records.js`, and `mapStatus` in `./status.js` is what produces a
   real `known.status`. **Check the constant and the mapper.** If `'draft'` is an invention that
   happens to match, say so; if it is what `mapStatus` emits, say that too. pp-079's exact class was
   `'manual'` vs `'MANUAL'` in this same position.
2. **`copy(SOURCE_REFERENCE, 'same-copy-key')`** — is that key shape meaningful or arbitrary? Low
   stakes, but check it is not asserting something about itself.

## ⚠ IS THE 500 `it.each` INERT FOR ANY OPERATION? Walk all ten, step by step

`fetchMocker.mockResponse('Unavailable', { status: 500 })` applies to **every** fetch. For each of the
ten operations, confirm it genuinely **reaches a backend call and fails there** — rather than passing
for an unrelated reason, or failing before any request is made. An operation that throws a recoverable
error for the wrong reason is a green test proving nothing.

Pay particular attention to `load` and `has`, which have a **404 → `undefined` / `false`** branch
*above* the status check. **A 404 must NOT be recoverable — it is a successful answer of "no".**
Confirm that contract is still intact and still tested, and that the 500 case is distinct from it.

## ⚠ THE DASHBOARD TEST — check the blast radius of a setup change, not just the test itself

`dashboard/controller.test.js` swapped a hand-marked error for `recordsReal.create` driven by a
`vi.spyOn(globalThis, 'fetch')` returning a 500. That is the right direction — the error now comes
from the adapter.

**But it also added `vi.restoreAllMocks()` to the file's `beforeEach` (`~:73`).** That is a change to
setup shared by every test in the file. **Check whether any other test in that file — or anything in a
`beforeAll` — depends on a mock that this now tears down between tests.** The suite is green, so if
this is safe, say why it is safe rather than citing the green run. A green suite has hidden every
defect found on this build.

## ⚠ PROVENANCE — check the divergence in BOTH directions

The plant adapter is a transposition of `services/persistence/records/real/`. pp-088 exists because
the copy **dropped** a property the original had. **Transposition defects run both ways**, so:

- Confirm live-animals really does mark reads (I read `real/http/get-fulfilment.js:11` and
  `real/lifecycle/read.js:31` → `failed()` → `BackendRequestError`, symbol set in the constructor at
  `records/errors.js:9`). Check my reading.
- **Is there now any operation where plant marks and live-animals does NOT?** I ruled in one
  deliberate divergence — plant wraps **fetch rejections** and live-animals does not (I grepped; its
  only `catch`es are projection-failure collection at `mutate.js:23` and `put-projection.js:11`).
  That one is intended. **Flag any OTHER divergence you find**, in either direction.

## Things you do NOT need to raise

- **Welsh.** Machine-draft with a banner; a Welsh-speaking tech lead reviews it once complete. At most
  one mention.
- **The stub adapter.** I checked it: it throws eight plain `Error`s, all state or programming errors,
  and it has no backend so it cannot produce a recoverable failure. Not a divergence. It does mean
  **stub/real parity proves nothing about recoverability** (the pp-039 lesson) — so if you think a pin
  belongs on the parity leg rather than the real leg, say why.
- **Production code outside `sets/plant-products/`.** Off limits. If you believe a fix requires one,
  report it as a finding with evidence rather than proposing the edit.

## Report

Findings as JSON per the schema. For each: the file and line, what is wrong, **how you verified it**
(a mutation you ran, a file you read — not an inference), and severity. **Zero findings is an
acceptable and useful answer** — two increments on this build have earned one. Do not manufacture
findings to look thorough. If you disagree with a ruling of mine, say so with evidence; my briefs have
been wrong seven times on this build and the implementor or reviewer was right every time.

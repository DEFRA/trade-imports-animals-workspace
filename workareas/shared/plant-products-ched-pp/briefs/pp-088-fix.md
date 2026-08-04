# pp-088 fix brief — two findings on STAGED, UNLANDED work

**⚠ RUN `git status` FIRST. The pp-088 work is STAGED and must be PRESERVED.** Three files are
already modified in the index:
`sets/plant-products/services/records/real.js`, its `real.test.js`, and
`sets/plant-products/journeys/linear/features/dashboard/controller.test.js`.

**DO NOT start over, do not revert, do not re-implement pp-088.** You are adding to work that is
already correct. **Both findings are TEST-side. `real.js` needs NO production change** — if you think
it does, stop and report `ok:false` with evidence.

Do not commit. The orchestrator lands it.

---

## FINDING 1 (reviewer, MAJOR — I verified the sharpest instance myself)

**The fetch-rejection axis is pinned for exactly ONE of the adapter's fetch sites.**

`real.js` now routes every call through `recoverableFetch` (`:34`), which marks a **network rejection**
recoverable. That is half the increment. But the new `it.each` table at `real.test.js:105` only mocks a
**500 response**, which exercises `expectStatus` — the *other* half. So the wrapper itself is almost
entirely unpinned.

**Twelve fetch sites are unpinned on the rejection axis** — the reviewer replaced `recoverableFetch`
with bare `fetch` at each in turn and the suite stayed **711/711 green**:
`create`, `load`, `list`, `has`, `amend`, `cancelAmend`, `copy`, `softDelete`, and the four internal
stages `listDocuments`, `deleteDocument`, `createDocument`, `reloadNotification`.

**I re-ran the sharpest one myself rather than relaying it: unwrapping `reloadNotification` (`:83`)
leaves the plant suite 711/711 GREEN.** That is the **final leg of every page save** — so a network
rejection there still produces a bare 500, which is *the exact defect this increment exists to fix,
still live inside the very function named in its first acceptance criterion.*

### What to do

**Extend the existing table rather than writing twelve bespoke tests.** The ten exported operations
already have an invocation map (`backendOperations`, `:79`). Drive it a **second** time with
`fetchMocker.mockRejectOnce(new TypeError('fetch failed'))` instead of a 500, asserting the surfaced
error is recoverable. That covers ten sites for a few lines and keeps the two axes visibly parallel.

**Then pin the four internal stages of `replaceFulfilment` separately** — they need earlier successful
responses queued to reach them:
- `listDocuments` — reject the **2nd** fetch (after the PUT succeeds)
- `deleteDocument` — needs an existing document in the list response, then reject the DELETE
- `createDocument` — needs a document in the answers being saved, then reject the POST
- `reloadNotification` — reject the **final** fetch after all earlier stages succeed

**Each of these must fail when its own wrapper is removed.** Prove it per stage and report the failing
test name; a test that passes for an unrelated reason is worth nothing here.

**⚠ Watch for the inert-mutation trap, which has bitten this build five times.** If a rejection test
goes green without the wrapper, your mock is probably not reaching the fetch site you think it is —
check the request count and the request URL, not just the outcome. **Say what changed before believing
any result.**

---

## FINDING 2 (orchestrator's own mutation — the pin has a one-line bypass)

`real.test.js:99-103`:

```js
expect(Object.keys(records).sort()).toEqual(
  [...Object.keys(backendOperations), 'clear'].sort()
)
```

I added an eleventh operation `auditTrail` to `real.js` using bare `fetch` and the unmarked `failed()`.

- **With the pin untouched:** exactly one test fails, by name — *'pins every real records operation to
  an explicit backend-error policy'*. **Good: the class is gated.**
- **But adding `'auditTrail'` to the literal list beside `'clear'`: 711/711 GREEN**, shipping an
  unmarked backend operation.

So the pin's actual property is *"you cannot add an operation without touching this test"*, **not**
*"you cannot add an operation without proving it recoverable."* The bare `'clear'` literal sitting in
the expectation is precisely the invitation to take the one-line escape.

### What to do

**Make the exemption carry its own obligation.** Name the non-backend operations explicitly and assert
that each exempt one issues **zero fetch requests** — the property that actually justifies exempting
it. `clear` satisfies this (it throws immediately; an existing test already asserts
`expect(fetchMocker.requests()).toEqual([])` for it — fold that in rather than duplicating it).

Then adding a **real** backend operation to the exempt side **fails**, because it does issue a request.
That converts the invariant into the true one: *every operation either marks its failures recoverable
or never contacts the backend.*

**Prove it with the same mutation I ran:** add an unmarked `auditTrail` that fetches, put it on the
exempt side, and show the suite goes red **by name**. Report that test name. Then remove `auditTrail`
completely — it is a mutation probe, **not** something to ship.

---

## Constraints

- **Production code outside `sets/plant-products/` is off limits.** So is changing `real.js` at all
  for these two findings — both are test-side.
- **Never invent a fixture value.** Ask what each is a copy of. The `'draft'` in `backendOperations`
  is already verified as what `mapStatus('DRAFT')` emits — leave it alone. If a new fixture needs a
  document shape, source it from the existing document tests in this same file, not from imagination.
- **No test may be deleted, renamed or weakened.** Report the count before and after and explain the
  delta:
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- **Baselines to hold:** `test:live-animals` **559** (any change is a REGRESSION), `npm test` files
  **217**, `lint:arch` **0/0** with **671** modules / **2,126** dependencies and shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`. Test-only changes should move none of these — new
  `.test.js` content adds no module (`.dependency-cruiser.cjs:181` excludes `\.test\.js$`).
  **Derive this yourself; correct me with evidence if I am wrong rather than making the code match.**
- Run `npm run format` before finishing.

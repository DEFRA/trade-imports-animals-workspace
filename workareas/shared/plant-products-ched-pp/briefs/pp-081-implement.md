# pp-081 — submit-path hardening: recoverable network failures, remove the stub test hook, no in-place mutation

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. Three findings from the pp-039 review sweep. **I re-verified all three at the source before
briefing** — they are all real and all still present.

---

## 1. The real defect: a refused connection escapes to a bare 500

`real.js:32-36`:

```js
const expectRecoverableStatus = (operation, response, expected) => {
  if (!expected.includes(response.status)) {
    throw markRecoverableBackendError(failed(operation, response))
  }
}
```

It inspects a **response**. `finalise` calls it at `:194`, `:209` and `:219`. But a native `fetch`
**rejection** — connection refused, connection reset, DNS failure — never produces a response at all:
it throws a `TypeError` before those lines run, so nothing marks it recoverable and it escapes to the
global 500 handler. **The declaration page has a recoverable re-render and the one failure mode most
likely to happen in production cannot reach it.**

Route the three `finalise` requests through a helper that catches **network-level rejections** and marks
them recoverable.

**⚠ THE DISTINCTION IS THE WHOLE POINT, AND IT IS EASY TO GET WRONG.** A blanket `try`/`catch` around
each call that marks *everything* recoverable would make the tests green and would **swallow genuine
programming errors** — a `TypeError` from our own bad code, a JSON parse failure — presenting them to
the user as "try again" forever. That is the pp-076 lesson exactly: turning a visible failure into an
invisible one. **AC 2 requires a test for EACH SIDE**: a network rejection IS marked, a
JSON/programming error is NOT. Prove both.

## 2. `declarationFor` widened production surface for a test — remove it

`stub.js:132`:

```js
export const declarationFor = (journeyId) => clone(read(journeyId).declaration)
```

**I grepped all of `src/`: the only references are `records-port.test.js` and the definition itself.**
No application caller. `declaration` is not part of the records port, and `stub.js` was outside pp-039's
scope fence — so production surface was widened purely to let a test read private stub storage.

Remove it. Then in `records-port.test.js`, stop asserting private stub storage: **keep the shared port
test on PUBLIC outputs** (`status`, `submittedAt`) and assert the declaration **PUT body** in
`real.test.js`, at the **network boundary**, where it fails if the contract moves rather than if the
implementation is refactored.

**⚠ Note what `records-port.test.js` currently does around `:168-198`** — it defines its own
`declarationFor` on a network backend double as well. Removing the stub export means reworking that
shared-case plumbing. **Do not delete a test case to make the plumbing simpler**; if a case can no
longer be expressed against public outputs, say so and stop rather than dropping it.

## 3. `real.js:199` mutates its body in place

```js
const body = buildNotificationBody(...)
body.declaration = { ... }
```

`node/code-style.md` rule 4 requires object spread. Build it in one expression. `buildNotificationBody`
is **shared with `replaceFulfilment`** — pp-039 introduced it precisely so both call sites emit
`referenceNumber` — so **do not change its signature or its output for the other caller.** Check the
other call site at `:162` still gets exactly what it got before.

## 4. ⚠ The test that currently ASSERTS THE BUG

`declaration/controller.test.js` presently **expects a rejected fetch to escape to the global 500
handler**. That is pp-039 encoding the defect as intended behaviour. **Update it to expect the
recoverable re-render** — and **report the change explicitly with before/after**, because editing a test
to match new production behaviour is exactly the move that needs to be visible in review. It is
legitimate here; silently doing it would not be.

## 5. ⚠ A defect class this increment sits right on top of

pp-039's original defect was invisible because **the unit tests mock `fetch` and the stub does no PUT at
all**, so stub/real "parity" was green while only one of them would survive the real backend. pp-082
exists because **the port test double MERGES where the real backend WHOLE-REPLACES**.

So when you assert the declaration PUT body, **assert it at the network boundary against what the real
Java endpoint requires**, not against what the double happens to store. **A parity pin is only as strong
as the fidelity of the double.** If you find the double diverging further, report it — pp-082 owns
fixing the merge/replace half, so do not fix that here.

## 6. Mutations I expect

**Two, reported by failing test name:**

1. Un-mark the network rejection (revert the new helper for one call) → a named test fails.
2. Make the helper mark **everything**, including a JSON/programming error → the negative-control test
   fails. **Without this second one, §1's distinction is unpinned.**

⚠ **A green mutation run is only evidence if the mutation actually changes behaviour** — wrong three
times in this build. Restore byte-identically and confirm `git diff --stat` is empty against the index.

## 7. Baselines — verified by ME at HEAD (`69d0558a`)

| Leg | Baseline |
|---|---|
| plant unit | **682** (58 files) |
| `npm test` | **2,320 / 8 skipped** (217 files) |
| `test:live-animals` | **559** — a change is a REGRESSION |
| `lint:arch` | **0 / 0**, 671 modules, 2,128 dependencies |
| plant Playwright | **256 passed, zero flaky** |

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`. **Removing an export can create a `lint:arch` orphan
warning — if one appears, report it; never "fix" it by force-importing or deleting a file.**

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

**Playwright needs `PORT=3201`.** Sandboxed Chromium routinely fails first on macOS Mach-port
permissions; the permitted rerun passes.

## 8. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with its replacement named. Run
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`. **Any count that moves must be
  explained, especially downward.**
- **Do not mock a function and assert the mock's own return value.** Mock at the **network** boundary.
- **Production code outside `sets/plant-products/` stays off limits** — a forced change is `ok:false`
  with evidence.
- **Do not weaken anything pp-079, pp-080 or pp-087 landed.**
- **REPORT UNDER-DELIVERY PLAINLY.**
- **If my brief is wrong, return `ok:false` and say so.** My briefs have been wrong five times and
  every time the implementor was right — twice today.
- Run `npm run format`. **Leave everything staged. Do NOT commit.**

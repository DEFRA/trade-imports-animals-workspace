# pp-081 — fix brief (post-review)

## ⚠ FIRST: run `git status`. YOUR WORK IS STAGED AND LARGELY RIGHT. DO NOT START OVER.

Five files staged. The review confirmed: declaration coverage survived the `declarationFor` rework,
public port outputs are still asserted, `real.test.js` now pins a **stronger exact PUT body including
`referenceNumber`**, and the renamed controller test correctly represents the previously-escaping
rejection. **Keep all of it.** One finding to fix.

---

## 1. The recoverable boundary starts one step too early (major)

`recoverableFetch` is structurally right — it wraps only the fetch promise, so JSON parsing, mapping and
body construction stay outside and unmarked. That was the correct instinct and it is **not** what is
wrong.

The problem is what happens **inside** `fetch` before any network I/O. Node rejects the fetch promise
with a `TypeError` for **request-construction** failures too:

- a malformed URL,
- an invalid header name or value.

**Both the URL and the headers here come from environment-backed configuration** (`notificationsUrl`,
`headers()`). So a permanent configuration or programming fault is currently classified as
**recoverable** and presented to the user as "try again" — forever. That is exactly the failure mode
this increment exists to prevent: **a visible failure turned into an invisible one**, the pp-076 lesson.

**The fix:** construct and validate the request **outside** the catch, then catch only the transport
call:

```js
const request = new Request(url, options)   // throws on bad URL / bad header, OUTSIDE the catch
... fetch(request).catch(...)               // catches transport failures only
```

**Verify the premise before you build on it** — confirm that `new Request(...)` really does reject the
malformed-URL and invalid-header cases at construction in this Node version. **If it does not, say so
and return `ok:false`** rather than shipping a boundary that only looks tighter. My briefs have been
wrong five times and every time the implementor was right.

**Keep any future abort handling outside the recoverable classification.** These three calls pass no
abort signal today, so an `AbortError` is not currently reachable — do not add speculative handling for
it, just do not let the structure invite it.

**Add the negative test the boundary now needs:** a request-construction / programming failure must
**NOT** be marked recoverable, alongside the existing pair (network rejection IS marked, JSON parse
failure is NOT). Three cases, each pinned.

## 2. ⚠ DO NOT FIX THE MERGE/REPLACE FIDELITY GAP — IT IS pp-082

The review's second finding is real: the network backend double in `records-port.test.js` **merges** a
notification PUT into existing state while the real Java endpoint **replaces** client-owned content, so
a field omitted from a replacement survives in the double. **That is the known gap and it is increment
pp-082's entire job.** The review itself says leave pp-081 unchanged. **Do not touch it here.**

## 3. Mutations

Re-run both existing mutations plus one new one, and report each by failing test name:

1. Un-mark the network rejection → a named test fails.
2. Mark everything, including a JSON parse failure → the negative control fails.
3. **New:** make the request-construction failure fall inside the catch again → the new negative
   control fails. **If nothing fails, §1 is not actually fixed.**

⚠ **A green mutation run is only evidence if the mutation actually changes behaviour.** Restore each
byte-identically and confirm `git diff --stat` is empty against the index.

## 4. Verification

| Leg | Baseline at HEAD `69d0558a`, with your staged work |
|---|---|
| plant unit | **686** (was 682 at HEAD) |
| `npm test` | **2,324 / 8 skipped** |
| `test:live-animals` | **559** — a change is a REGRESSION |
| `lint:arch` | **0 / 0**, 671 modules, 2,128 dependencies, no orphan warning |
| plant Playwright | **256 passed, zero flaky** |

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

**Playwright needs `PORT=3201`.** The sandboxed Chromium Mach-port failure on first attempt is expected;
the permitted rerun passes.

## 5. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** Your staged diff currently shows **1** removed
  test line, correctly explained as the reported controller-test replacement. Keep it explainable.
- **Do not weaken anything pp-079, pp-080 or pp-087 landed.**
- **Production code outside `sets/plant-products/` stays off limits.**
- Run `npm run format`. **Leave everything staged. Do NOT commit.**

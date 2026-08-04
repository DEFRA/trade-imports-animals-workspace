# pp-087 — `usingGvms` converter is not idempotent: a later save silently flips Yes to No

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree.

**This is a LIVE defect in landed pp-031 code**, found when the pp-080 implementor stopped with
`ok:false` rather than touch production — the right call. **I verified the mechanism against the source
myself rather than relaying it**, because the last two reported shipped defects split one real and one
not. **This one is real, and I traced it end to end.**

---

## 1. The defect, with the call chain

`goods-movement/evaluation.js:23`:

```js
convert: (value) => value === 'yes'
```

The engine re-runs **every** feature's bindings over the **whole merged answer set** on **every**
commit:

- `engine/write/commit.js:9` → `currentViewAfterCanonicalPatch`
- `engine/write/pipeline/canonical.js:50` — `{ ...current.answers, ...canonical }`, the **entire**
  answers object, not just the page's patch
- `bridge/assemble-fulfilments.js:11` — loops **every** feature in the registry
- `bridge/fulfilment-bindings.js:31` — `contribution[...] = binding.convert(value)` for every field
  that is present

So:

- **first** commit, from goods-movement: `'yes'` → `true` ✓
- **any later** commit, from **any** page: `true === 'yes'` → **`false`** ✗

The user answers Yes, saves one more page, and the answer is now No. The review page renders `"No"`
via `yesNoText(false)` — which is exactly the symptom the pp-080 run hit.

## 2. ⚠ THE FIX HAS A HOUSE PRECEDENT ONE FEATURE OVER. USE IT.

`transport/evaluation.js:21-31` — `toIsoDate` and `toTime` **both** open with:

```js
if (typeof value === 'string') return value
```

That guard exists for **precisely this reason**: the converter must survive being re-applied to its own
output. `usingGvms` is the **only** converter in the plant set without one — I grepped all three.

So the change is small and its shape is already decided by precedent: **guard the already-converted
shape.** Do not restructure the engine, do not change when `convert` runs, do not touch
`transport/evaluation.js` — it is already correct.

**Production code outside `sets/plant-products/` stays off limits.** If you conclude the real fix
belongs in `bridge/` or `engine/`, return `ok:false` with the evidence rather than editing there.

## 3. Why nothing caught it — and the fixture class this makes FIVE of

- `goods-movement/controller.test.js` asserts `result.after` after **ONE** commit. That is correct at
  that point and **structurally cannot see** a flip that needs a second commit.
- `goods-movement.e2e.spec.js` exercises the page in isolation.
- `check-answers.test.js:85` hand-authors `usingGvms: true` — **a value the system does not actually
  hold at review time.**

That last one is the **fifth** instance of the pp-038 class in this build: hand-authored fixtures and
mocks standing in for what the system actually produces. pp-079 found the fourth (`'manual'` for a
controller that writes `'MANUAL'`) in the very same file. **Ask what every fixture is a copy of.**

## 4. What the tests must prove — and the mutation

**A converter unit test is NOT sufficient.** Asserting `convert(true) === true` proves the guard
compiles; it does not prove the user's answer survives. The bar is **behavioural**:

1. **Commit goods-movement with GVMS Yes, then commit a DIFFERENT page, then assert `usingGvms` is
   still `true`.** That is the test that would have caught this. Put it where it can drive two real
   commits — `goods-movement/controller.test.js` if its `drive` helper supports a second commit, or
   wherever the plant set already drives multi-page commits. **Say which you chose and why.**
2. **The structural pin, which is the point of the increment.** `features/evaluation.test.js` does
   **not exist** — I checked, and so does the `bridge/assemble-fulfilments.test.js` an earlier draft of
   my own plan named. `features/evaluation.js` already aggregates `featureEvaluationBindings` for the
   whole set, so a new test beside it can walk **every** binding and assert each `convert` is
   idempotent — `convert(convert(x))` deep-equals `convert(x)` — **for the real shapes each field
   actually holds**. Take those shapes from what the controllers write, not from invention. **This is
   what stops a future converter reintroducing the bug.**

**The mutation:** remove the idempotency guard and confirm a test fails **by a name that describes the
behaviour**, not just the converter. ⚠ **A green mutation run is only evidence if the mutation actually
changes behaviour** — wrong three times in this build (pp-025, pp-036, pp-040). Restore byte-identically
and confirm `git diff --stat` is empty against the index.

## 5. ⚠ Sequencing you need to know about

**pp-080 is parked in a `git stash`** — it strengthens the review page's read-back assertions and its
GVMS assertion fails until this increment lands. **The working tree is clean; do not go looking for
that work and do not pop the stash.** I will restore it after pp-087 commits.

## 6. Baselines — verified by ME at HEAD (`4200b1ae`)

| Leg | Baseline |
|---|---|
| plant unit `test:plant-products` | **677** (57 files) |
| `npm test` | **2,315 passed / 8 skipped** (216 files) |
| `test:live-animals` | **559** — a change is a REGRESSION |
| `lint:arch` | **0 errors / 0 warnings**, 671 modules, 2,128 dependencies |
| plant Playwright | **256 passed, zero flaky** |

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`. A new `lint:arch` warning means an orphan — **never "fix"
one by deleting or force-importing.** The new test file adds a module; **expect 671 → 672** and say so.

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

**Playwright needs `PORT=3201`** — Docker holds 3000 and 3100. Sandboxed Chromium routinely fails first
on macOS Mach-port permissions; the permitted rerun passes. `net::ERR_NETWORK_IO_SUSPENDED` across
unrelated specs is the machine, not your code — report it and re-run.

**⚠ The Playwright count may MOVE UPWARD here, and that would be a real finding.** Some existing specs
may be asserting the flipped value as if it were correct. **If a test now fails because it encoded the
bug, that is a defect in the test — report it, name it, and fix it to assert the true behaviour. Do NOT
edit the production fix to keep an old assertion green.**

## 7. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with its replacement named. Run
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- **L1 shape assertions are in scope to UPDATE, never to WEAKEN** — keep exact equalities exact and
  report before/after for any expected value you change.
- **REPORT UNDER-DELIVERY PLAINLY.**
- **NEVER INVENT DATA.** Eight increments have stopped rather than fabricate; every one was right.
- **If my brief is wrong, return `ok:false` and say so.** Four of my briefs have been wrong and every
  time the implementor was right — and the pp-080 stop that produced this increment is the fifth time
  an implementor was right to push back.
- Run `npm run format`. **Leave everything staged. Do NOT commit.**

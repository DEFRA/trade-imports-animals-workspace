# pp-080 — continuation brief (resume after the pp-087 blocker was cleared)

## ⚠ FIRST: run `git status`. YOUR WORK IS STAGED AND CORRECT. DO NOT START OVER.

`review-notification.e2e.spec.js` carries **+478 / −228** of strengthened assertions. I checked it:
**zero test declarations added or removed** — it is all assertion strengthening inside existing tests,
which is exactly what this increment is. **It must be preserved.**

## 1. What happened, and why you were right to stop

You returned `ok:false` because the strengthened GVMS assertion went red: the journey submits *Yes* and
the review page rendered *No*. **You were right, it was a real production defect, and stopping rather
than editing production code was correct.**

I traced it: `goods-movement/evaluation.js` converted with `(value) => value === 'yes'`, and the engine
re-applies every converter to the **whole merged answer set on every commit** (`commit.js:9` →
`canonical.js:50` → `assemble-fulfilments.js:11` → `fulfilment-bindings.js:31`). So the converter ran on
its own output: `'yes'` → `true`, then `true === 'yes'` → **`false`**. A user's Yes became No on the
next save of any page.

**That is now fixed and landed as pp-087 (`2ee0999d`)**, with the same already-converted guard
`transport/evaluation.js` already carried. **I have re-run your staged spec against it: 256 passed.**
Your assertion went red on the bug and green on the fix without itself changing — which is the
strongest evidence it is a real pin rather than a miswritten expectation.

## 2. What is left — this is the whole remaining job

The brief's verification was never completed. **Do not add more assertions unless a mutation shows a
gap.** Finish these:

**2.1 — The three blanking mutations, which are AC 3 and the point of the increment.** Blank a single
captured value in the journey and confirm a test fails **naming that value**. Run at least three,
spread across different shapes:

- one **summary row** value,
- one table cell in a **MIDDLE** row,
- one table cell in a **FIRST or LAST** row.

The first/last case is not optional: pp-026's *'exposes renumbered indices'* could not detect a removal
that always hit index 0 and passed 360 unit tests while the bug was live. **Report each by the name of
the test that fails.**

⚠ **A GREEN MUTATION RUN IS ONLY EVIDENCE IF THE MUTATION ACTUALLY CHANGES BEHAVIOUR.** Wrong three
times in this build. Before believing one, say what the page now renders differently. Restore each
byte-identically and confirm `git diff --stat` is empty against the index.

**2.2 — The full ladder**, which never ran past `test:live-animals`.

## 3. Baselines — CHANGED since your first pass, because pp-087 landed underneath you

| Leg | Baseline at HEAD `2ee0999d` |
|---|---|
| plant unit `test:plant-products` | **682** (58 files) |
| `npm test` | **2,320 passed / 8 skipped** (217 files) |
| `test:live-animals` | **559** — a change is a REGRESSION |
| `lint:arch` | **0 / 0**, **671 modules**, 2,128 dependencies |
| plant Playwright | **256 passed, zero flaky** — verified by me with your staged spec applied |

**⚠ `lint:arch` stays at 671 modules for a new `.test.js` file** — `.dependency-cruiser.cjs:181`
excludes `\.test\.js$`. My pp-087 brief predicted 672 and was wrong; the implementor refuted it with
the config rather than making the number match. **Do not "fix" a module count.**

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

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
permissions; the permitted rerun passes. `net::ERR_NETWORK_IO_SUSPENDED` across unrelated specs is the
machine, not your code — report and re-run.

## 4. If a mutation exposes ANOTHER production defect

**Stop again and report it.** You were right the first time and the increment is better for it. A
second one would be a finding, not a failure — and it becomes its own increment, exactly as pp-087 did.
**Do not fix production code to make this test green.**

## 5. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with its replacement named. Run
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("` — it is **0** right now, keep it
  explainable.
- **Do not touch `summary-row.js`** — its hardcoded English `" for "` is real and already owned by
  pp-083.
- **Do not weaken anything pp-079 or pp-087 landed**: `withChange` inside `changeHref`, the set-aware
  `journeyCyaSlug`, the three `destinationSameAsConsignee` states, the no-bare-`Change` guard, the
  idempotency pin in `features/evaluation.test.js`.
- **REPORT UNDER-DELIVERY PLAINLY** — if some value genuinely cannot be asserted by key, say which and
  why.
- Run `npm run format`. **Leave everything staged. Do NOT commit.**

# pp-076 — harden the plant axe helper against the mid-analyse teardown race

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fifteen times, three destructively.

This is a **test-infrastructure** increment. No production code changes. No obligations, no flow, no
copy, no mapper. If you find yourself editing anything under `sets/plant-products/` that is not a
`*.e2e.spec.js` file or a new test helper, stop and report.

---

## 1. ⚠ THE BUILD-BREAKER: do NOT make the flake invisible

The defect is that axe-core intermittently throws `Cannot read properties of null (reading
'documentElement')` inside `analyze()` — the page document is torn down while the scan is running.
It appeared in roughly 3 of 12 observed runs, in a **different unchanged** commodity axe test each
time, with **no accessibility violation reported**.

**There is exactly one wrong way to close this, and it is the obvious one.** Wrapping `analyze()` in
a `try`/`catch`, a retry loop, `test.retry`, or any construct that swallows or re-attempts on error
would make the suite green — and would also swallow a **real** axe failure the day one arrives.
**That converts an intermittent visible failure into a permanent invisible one**, which is precisely
the condition this increment exists to remove: an intermittently red ladder is how a real failure
gets rationalised as "the known flake", and this programme has already landed one increment
(pp-057) while its features suite was red.

**So: remove the race, do not tolerate its symptom.** The fix is to guarantee the document is
settled and no navigation is in flight before `analyze()` runs — e.g. awaiting a stable DOM anchor
on the page under test (the `h1`, or `page.waitForLoadState('domcontentloaded')`) inside the shared
helper, so every call site inherits it. **Name the mechanism you chose and explain why it closes the
race**, in the report and in your summary. "It passed five times" is not an explanation.

If after investigation you conclude the race cannot be closed without a retry, **stop and report
`ok:false` with the evidence** rather than shipping a retry. That is a legitimate outcome.

## 2. ⚠ FIVE CLEAN RUNS IS A WEAK BAR AND I AM TELLING YOU SO

`backlog.json`'s acceptance criterion asks for five consecutive clean runs. Run them and report the
number — but understand what they are worth. The flake occurs in roughly 1 run in 4, so **five clean
runs is entirely consistent with the bug still being present**. It is a smoke signal, not proof.

**The decisive evidence for this increment is §3 and §4, not the run count.** This build has twice
believed a green run that proved nothing (pp-025, pp-036). Do not make it three.

## 3. The mutation that actually proves something — DETECTION SURVIVED EXTRACTION

The one thing an extraction can silently destroy is the helper's ability to fail. Prove it did not:

1. Break accessibility on **one** page — empty a fieldset legend, or remove a form control's label.
   (pp-017 proved emptying a fieldset legend leaves axe green, so pick a mutation axe genuinely
   detects: **an unlabelled input** is the reliable one and is the negative control pp-031 used.)
2. Run that spec. The axe test must fail **by name**, and the failure message must still print the
   **full unfiltered violation list** — that diagnostic is the thing most likely to be lost in an
   extraction, and losing it makes every future axe failure unactionable.
3. Restore **byte-identically** and state the SHA. Confirm `git diff --stat` against the index shows
   the file unchanged.

**Before you believe the failure, ask what the code now does differently.** A mutation that does not
change behaviour proves nothing (V4's standing lesson).

## 4. ⚠ THERE ARE THREE CARVE-OUTS, NOT TWO — and they must be parameterised, never widened

`backlog.json`'s `openQuestions` names two specs carrying the GOV.UK conditional-radio
`aria-allowed-attr` carve-out. **That is stale — there are three:**

| Spec | `aria-controls` target it pins |
|---|---|
| `features/transport/transport-before-bip.e2e.spec.js:138` | `conditional-usesContainers` / `#usesContainers` |
| `features/goods-movement/goods-movement.e2e.spec.js:105` | (read it — do not assume) |
| `features/traders/e2e/traders-addresses.e2e.spec.js:115` | `conditional-destinationSameAsConsignee-2` / `#destinationSameAsConsignee-2` |

**Each pins a DIFFERENT element by exact id.** A merged helper must take the permitted target as a
**per-call parameter**. A helper that matches "any `govuk-radios__input` with any `aria-controls`"
would widen the suppression surface across all 25 scans — a real regression dressed as a refactor.

Every part of the established discipline survives the merge, or this increment fails:

- rule id **exactly** `aria-allowed-attr`;
- **EVERY** node is the one `govuk-radios__input` carrying **that exact** `aria-controls` value;
- `target.length === 1` and `target[0]` is that exact selector;
- **any other node, or any other rule, stays fatal**;
- the **unfiltered** violation list is still returned/printed.

**Demand a negative control on the merged helper**: with the carve-out active on one of those three
pages, an injected unlabelled input must **still fail**, and the reported output must **still show**
the unfiltered `aria-allowed-attr` entry alongside it. That is what makes a carve-out acceptable at
all (pp-031's standard). Restore byte-identically.

**Fix the stale comment while you are there.** All three carve-out comments say the script adds
`aria-expanded`; the code matches `aria-controls`. A reader checking which attribute axe objects to
would look for the wrong one.

## 5. Two divergent helper shapes exist — unify them without weakening either

The call sites are not uniform. At least two shapes are in the tree:

- **`seriousOrCriticalViolations(page)`** returning `{ all, seriousOrCritical }` — the caller
  asserts (e.g. `purpose.e2e.spec.js:30`).
- **`expectAxeClean(page, state)`** which filters and asserts internally
  (`traders/e2e/traders-addresses.e2e.spec.js:108`).

Pick one shape and convert the rest. **Whichever you pick must keep the full unfiltered list in the
failure output** — the `{ all, seriousOrCritical }` return exists so the assertion message can name
every violation, not just the fatal ones. If you move to an assert-inside helper, the unfiltered
list must appear in the failure message explicitly.

## 6. Location — RULED, do not stop to ask

**The helper lives under `sets/plant-products/`.** Put it somewhere the specs can all reach — e.g.
`sets/plant-products/journeys/linear/features/axe.e2e-helper.js` or equivalent; match whatever
naming convention keeps it out of the Vitest unit glob (`npm test` must not try to run it as a spec
— check the vitest config's include/exclude before choosing the filename, and confirm the `npm test`
file count is unchanged).

**Do NOT touch `sets/live-animals/` specs.** They use the same `AxeBuilder` idiom (60 references)
and `backlog.json`'s open question asks whether the helper should be shared. **The answer for this
increment is no** — live-animals has never exhibited the race, it runs in a separate Playwright
project, and widening the blast radius of a test refactor across the set boundary is not worth it.
Report whether the same race is plausible there; leave the code alone. The shared-location question
stays open.

## 7. Count pins — report these before and after

Verified by me at HEAD, not quoted from a report:

| Pin | Value |
|---|---|
| `*.e2e.spec.js` files under `sets/plant-products/` importing `AxeBuilder` | **21** |
| axe helper **call sites** across those specs | **25** |
| conditional-radio carve-outs | **3** |

**All three must be identical after the change.** No page may lose its scan. If the call-site count
moves in either direction, that is a finding — say so and explain it, do not adjust to match.

## 8. Baselines

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-037, `87e258c0`) — `npm test` and `lint:arch` verified by me in this session:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **628** |
| `npm test` | **2,256 passed / 8 skipped** (verified) |
| `test:live-animals` | **559** (unchanged all build — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **241** |
| `lint:arch` | **0 errors / 0 warnings** (verified) |

**Every one of these must be unchanged when you finish.** This increment adds no test and removes
none; it moves where a helper is defined. `npm test`, `test:plant-products` and
`test:live-animals` counts moving at all is a finding.

Full ladder:

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

**Playwright needs `PORT=3201`** — Docker holds 3000 and 3100.

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

## 9. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` before finishing; the count must
  match the renames you report. On this increment the expected answer is **zero of each** — you are
  moving a helper, not changing coverage.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** Ask what the helper would do if the
  behaviour were broken. That is the whole of §3.
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation in this build (pp-017, pp-024).
  Do not let the extraction imply otherwise; the direct accessible-name assertions in these specs
  are untouched and stay untouched.
- **REPORT UNDER-DELIVERY PLAINLY** — if a spec needs no change, say so with evidence.
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence, not a silent edit.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.

## 10. What "done" reads like

A report that says: the race is closed by *this named mechanism* for *this reason*; detection still
works because *this mutation* failed *this named test* and printed the unfiltered list; the carve-out
is still narrow because *this negative control* still failed; 21 files / 25 call sites / 3 carve-outs
before and after; five runs performed with *this* result, stated as a weak signal rather than as
proof.

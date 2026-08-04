# pp-085 — consolidate the two plant e2e journey drivers into one

This brief OVERRIDES the generic `implement.md`. **Test-infrastructure only.** No production code.

## The problem, verified

- `e2e/plant-products-journey.js` — **280 lines**, imported by `declaration.e2e.spec.js` and
  `confirmation.e2e.spec.js` through **nine levels of `../`**.
- `check-answers/review-notification.e2e.spec.js` — **1,099 lines**, carrying its **own** full
  journey driver covering the same ground: origin, purpose, commodities, additional details,
  transport, goods movement, contact, documents, traders.

A field, label, route or mandatory-step change needs synchronised edits in two independent drivers.
Extract the common primitives with configurable **minimal / full** profiles.

## ⚠ HAZARD 1 — THE ONE THAT MATTERS. No assertion may weaken, in either spec

This is a consolidation, which is the exact shape where a real gain hides a silent loss. **pp-080 is
the precedent on this build:** a rewrite moved substring → exact matching (a genuine improvement) and
**simultaneously dropped section scoping**, so a row under the wrong card would have passed. Invisible
in the diff stat and invisible to a green ladder.

**The two drivers will not be identical.** One will fill a field the other skips, assert a step the
other doesn't, or use a different selector. **Diff them step by step BEFORE writing the merged
version**, and for every difference state explicitly: which driver had it, whether the merged driver
keeps it, and why.

**A step present in only one driver must survive in that spec's profile.** Silently dropping it
because "the other driver didn't need it" is the failure mode. If a step genuinely cannot be
preserved, that is an `ok:false` with evidence, not a quiet deletion.

**Report every assertion that changes, before and after.** Review-specific assertions stay in the
review spec — the driver drives, the spec asserts.

## ⚠ HAZARD 2 — WHERE THE DRIVER LIVES. I have ruled this; do not re-open it

The plan leaves placement open. **Decision: move it beside the existing shared plant e2e helper**, at
`src/server/app/sets/plant-products/journeys/linear/features/journey.e2e-helper.js`, next to
`axe.e2e-helper.js`. A plant-only helper does not belong at repo root behind nine `../`.

**⚠ AND THIS HAS A CONSEQUENCE YOU MUST HANDLE IN THE SAME INCREMENT.** `vitest.config.js:23` sets
`include: ['src/**/*.js']` for coverage. `e2e/plant-products-journey.js` is currently **outside**
`src/`, so it is not in the coverage glob. **Moving it into `src/` puts it there — and it can never be
executed by Vitest, so it would report 0% forever**, exactly like `axe.e2e-helper.js` does today.

**So add `'**/*.e2e-helper.js'` to the coverage `exclude` array at `vitest.config.js:24-33`.** One
line. It prevents this increment making things worse **and** closes a standing item that has had no
owner since pp-076. There is **no coverage threshold gate** in that config — only reporters — so this
cannot break a build. **Report overall coverage before and after** so the effect is on record.

If you disagree with the placement, say so with reasons and **stop** — do not silently choose
somewhere else.

## ⚠ HAZARD 3 — three specs consume this, not two

`declaration.e2e.spec.js` and `confirmation.e2e.spec.js` already import the shared driver; the review
spec is the third consumer. **All three must keep working**, and the import paths in the first two
change when the file moves. **The plant Playwright count must not fall.**

## Baselines — I ran these myself at `27fcd4c6`. Re-run them

- plant Playwright `test:features:plant-products` — **257** (use **`PORT=3201`**)
- plant unit — **698 (58 files)**
- `npm test` — **2,336 passed / 8 skipped (217 files)**
- `test:live-animals` — **559**. Movement is a REGRESSION.
- `lint:arch` — **0/0, 671 modules, 2,131 dependencies**; shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a` unchanged

⚠ **`lint:arch` WILL move here and that is expected** — you are deleting a module at repo root and
adding one under `src/`, and changing import edges. **Derive the new numbers from the config and
explain them**; do not match a number I have not given you. Note `.dependency-cruiser.cjs:181`
excludes `\.test\.js$` — an `.e2e-helper.js` is **not** excluded, and nor is an `.e2e.spec.js`.

**If anything here contradicts the source, the source wins — say so with file and line.** Five
orchestrator briefs on this build have been wrong and the implementor was right every time.

## Decisive mutation to run and report

**Break one step in the shared driver** — e.g. stop it filling a mandatory field — and confirm it
fails in **all three** consuming specs, naming them. That proves the single driver is genuinely
load-bearing for every consumer rather than one spec quietly having its own path.

**Say what the code now does differently before believing the result.** Restore byte-identically and
confirm an empty diff against the index.

## Verification

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint:arch
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Plus the plant Playwright suite with **`PORT=3201`**.

Leave the work **staged, not committed.** Report: the step-by-step diff of the two drivers and how
each difference resolved, every assertion changed with before/after, the mutation result naming all
three specs, coverage before/after, every count, and **anything you could not verify yourself.**

# pp-041 — whole-journey e2e lane + the ONE canonical committed-answer fixture

This brief OVERRIDES the generic `implement.md`. **FRONTEND repo**, branch
`spike/trace-to-requirements`. **Playwright here needs `PORT=3201`** — Docker occupies 3000, 3001 and
3100.

**I re-planned this increment tonight.** Its old plan was stale in a build-breaking way and ambiguous in
another; both are ruled in `backlog.json`'s notes. Read them. The four things below are what will
actually go wrong.

---

## ⚠ HAZARD 1 — DO NOT CREATE `e2e/plant-products-journey.js`. THE DRIVER ALREADY EXISTS

The old plan said to create it. **pp-085 deliberately deleted that file**, consolidating both plant
drivers into `src/server/app/sets/plant-products/journeys/linear/features/journey.e2e-helper.js`, and
**pp-091 then pinned the `full` profile's shape** so it cannot be silently thinned.

Verified by me at frontend `81353805`: `e2e/` holds only `check-workspace-stack.js`,
`journey-smoke.spec.js` and `live-animals-journey.js`. The helper is ~24 KB and already exports
`BASE = '/plant-products'`, `journeyProfiles` (`minimal`/`full`), `journeyIdFromPage`, `journeyUrl`,
`startNotification`, `completeAnswerSections`, `completeJourney` and `submitDeclaration`.

**A diff containing `e2e/plant-products-journey.js` is a failed increment.** Import the helper.

## ⚠ HAZARD 2 — THE COMPOSITION TRAP. `completeJourney` + `submitDeclaration` DOES NOT WORK

I read the helper. `completeJourney` **ends on the review page** (`:734` opens the *Review and submit*
hub row). `submitDeclaration` **starts from the hub** (`:740` calls `openHubRow`). Chaining them puts
`openHubRow` on the review page and it will not resolve.

The correct composition is the one `confirmation/confirmation.e2e.spec.js:16-19` already uses:

```
startNotification(page, { profile })
completeAnswerSections(page, { profile, ... })
submitDeclaration(page)          // hub -> review -> continue -> declaration -> submit
// now on /plant-products/notifications/<id>/confirmation
```

`completeAnswerSections` takes `allowCommoditySummaryBypass` and `includeNominatedContacts` — read
`:696-703` and pass what you actually need rather than copying a call site blindly. **Nominated contacts
are opt-in for a reason** (pp-085: making them universal coupled two specs to a page they do not test).

## ⚠⚠ HAZARD 3 — YOUR TEST 1 RISKS BEING A COPY OF A SPEC THAT ALREADY EXISTS

`confirmation/confirmation.e2e.spec.js` **already** drives start → complete every section → submit →
assert confirmation. If your smoke test does only that, it adds a slower duplicate and nothing else.

**Say in your notes what test 1 adds that the feature specs do not.** The defensible answers are:
it runs the **`full` profile** end to end in one pass (the feature specs mostly use `minimal`); it
asserts the **confirmation panel carries the GBN-PP reference minted at journey start**; and it carries
the **co-residency/mount proof** — at least one asserted string that is plant-set content which
**cannot** render under live-animals, which is what proves `/plant-products/…` is served by the plant
gateway rather than an env var being read.

**If, having looked, you conclude test 1 is genuinely redundant, say so with `ok:false` rather than
shipping a duplicate to satisfy the plan.** That is a legitimate and valuable outcome.

## ⚠ HAZARD 4 — THE RE-BASE IS THE RISKIEST EDIT, NOT THE FIXTURE

`flow/task-rows.test.js` **already contains six hand-authored complete-answer objects**. Adding
`happy-path.json` beside them makes a seventh definition of "a complete plant journey" in one file. So
this increment makes the fixture canonical and **re-bases those six onto it**.

Each of the six exists to vary **one** thing (a missing consignor, a delivery address, and so on). After
re-basing, each must read as *the fixture plus its own deliberate variation*, and that variation must be
visible in the diff.

**A rewrite can strengthen one axis while silently weakening another.** For **each** of the six: name the
property it pins, and **prove it still fails when that property is broken**. Report the six names and
their proofs. **If re-basing any one would change what it discriminates, do not re-base that one** —
leave it inline and say which and why. A stated exception is worth more than a silent weakening.

---

## The fixture itself

`flow/fixtures/happy-path.json`, shape `{ "schema_version": 1, "values": { … } }`, mirroring
`sets/live-animals/journeys/linear/flow/fixtures/happy-path.json`. `flow/fixtures/` is correct — the
live exemplar and the plan tree agree.

**Every value must resolve against the set's own fixture services.** pp-093 landed an hour ago removing
the last known invented codes (`'BX'`/`'PCS'` → `'BOX'`/`'PIECES'`, and three fabricated `'NONE'`
variety ids). **Do not reintroduce that class.**

Two specifics I checked myself and that will bite:

- **Classes are keyed by COMMODITY, not by species.** `services/commodities/fixture.js:242-244` —
  `CLASSES_BY_COMMODITY` contains **only `'0808108090'`**. If your line needs a `varietyClass`, it must
  be that commodity. A commodity with varieties and **no** class is a legitimate pp-078 state where
  `varietyClass` is simply **absent**, not null-padded.
- **`importType`** must be whatever `features/import-type/controller.js` actually commits. Read it; do
  not infer it from the helper's display label.

**pp-041's acceptance criteria now also require the fixture's `packageType`/`quantityType` values to be
pinned against `services/reference/package-types.js` and `quantity-types.js`** — the structural pin
originally planned for pp-093, moved here because this is where the shared fixture is born. **State
explicitly what that pin does NOT cover**: it cannot stop a new invented literal being typed inline in
some other test.

## Config and scripts

- `playwright.config.js`: add a `journeys-plant-products` project, `testMatch
  '**/plant-products-journey-smoke.spec.js'`, `use` shaped exactly like the existing `journeys` project
  (`:22-41` — Desktop Chrome, `baseURL http://localhost:${port}`, DEMO_SLOWMO slowMo, `video: 'on'`,
  `trace: 'on'`). **The baseURL is HOST-ONLY for both projects** — a set-prefixed baseURL breaks
  `/health`, `/signout` and `/public/*` and hides the other set. The prefix lives in the helper's `BASE`
  and nowhere else. I verified the existing `journeys` project's `testMatch '**/journey-smoke.spec.js'`
  **cannot** pick up `plant-products-journey-smoke.spec.js`, so it needs no change.
- `package.json`: add `test:e2e:plant-products` mirroring `test:features:plant-products` (`:22`), and
  `test:e2e:all` running both journeys projects, mirroring `test:features:all` (`:23`). **`test:e2e:all`
  is ruled IN** — a co-residency claim never exercised across both journey lanes is not a claim.
- **`webServer` is untouched.** pp-011 already set `PLANT_PRODUCTS_MODE: 'stub'` beside
  `LIVE_ANIMALS_MODE: 'stub'`, so one server serves both sets. There is no served-set env var.

## Baselines I ran myself tonight — do not quote them forward, but do not contradict them either

plant unit **728** (58 files) · `npm test` **2,366 passed / 8 skipped** (217 files) ·
`test:live-animals` **559** · `lint:arch` **0/0** (671 modules, 2,127 dependencies), known-violations
shasum `0762285e…` · plant Playwright `PORT=3201 test:features:plant-products` **259 passed, zero
flaky**. **Re-establish them yourself before you edit** and report yours.

## Constraints

- **No live-animals spec is edited.** Production code outside `sets/plant-products/` stays off limits;
  a forced change is `ok:false` with evidence. `playwright.config.js` and `package.json` are shared
  ROOT config and are in scope **only** for the two additions above.
- **`test:live-animals` 559 unchanged is necessary but NOT sufficient — say so.**
- No test-count drop in any existing suite. Explain any movement:
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- Because this edits shared root config, the **co-residency check is mandatory in its two-sided form**:
  `co-residency.test.js` green **and** `PORT=3201 npm run test:features:all` green.
- `npm run format` before you report; the hook runs `format:check && lint && test`.
- **Stage, do not commit.** Never run `sonar`. At most 3 self-repair attempts, then `ok:false`.

## The mutations I expect, each reported by failing test NAME

1. **Break the mount proof** — point one plant-only assertion at a string live-animals also renders. It
   must stop discriminating; say what you changed and what happened.
2. **Remove one mandatory answer from the fixture** — the new `task-rows.test.js` completeness case must
   fail by name, proving the fixture genuinely closes the journey rather than being asserted to.
3. **For the gating test**, complete every mandatory row *including* documents and confirm review
   unlocks; then remove the document and confirm it locks again. **Both directions** — a lock test that
   only ever sees the locked state proves nothing about unlocking.

**Say what the code now does differently before believing any result.** On this build an inert mutation
has falsely confirmed a finding, an inert one has falsely refuted a correct fix, and an
internally-consistent half-edit has falsely refuted. **AN `ok:false` IS OFTEN THE MOST VALUABLE
OUTCOME** — my briefs have been wrong nine times and every time the implementor or reviewer was right.

# pp-022 — commodity-input-method (manual vs CSV routing)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`'s `filesToTouch`
wherever they disagree**. I verified every claim below against the real working tree at HEAD before
writing it. `filesToTouch` is a HYPOTHESIS — this is the thirteenth increment where it was wrong.

---

## 0. READ THIS FIRST — the plan tells you to CREATE a file that already exists, and following it destroys gate-approved work

`src/server/app/sets/plant-products/journeys/linear/features/commodities/evaluation.js`
**ALREADY EXISTS.** pp-021 shipped it (frontend `139482ed`) and **Sam reviewed and approved it at a
HALT-FOR-REVIEW gate.** It is 77 lines: `lineGroup` / `speciesGroup` / `varietyGroup`, the
`lineLeaf` / `speciesLeaf` / `varietyLeaf` helpers, and a `feature('commodities', [...])` bundle of
**15 grouped leaves** (`commoditySelection`, `numberOfPackages`, `packageType`, `quantity`,
`quantityType`, `netWeight`, `controlledAtmosphereContainer`, `finishedOrPropagated`,
`intendedForFinalUsers`, `testAndTrial`, `eppoCode`, `genusAndSpecies`, `speciesId`, `variety`,
`varietyClass`).

`backlog.json` says `action: "create"` for it. **That is wrong. The action is EDIT.** Writing this
file fresh would silently delete the depth-3 commodity model Sam approved. This is the same class of
error as pp-020, where a `create` action pointed at a file that had already shipped with verified
provenance.

**Read the file before you touch it. Every one of those 15 leaves must survive this increment
byte-identically.** If your diff of that file shows anything other than a *net addition*, stop.

Also note `features/commodities/` is therefore **not a new directory** — it exists with one file in it.

## 1. THE LIVE RISK — you are inheriting pp-023's wiring handshake early, and nothing can catch a mistake

pp-021 deliberately left the commodity model **UNWIRED**. Two facts I verified at HEAD:

- `obligations/index.js` (this set's manifest) imports from `sections/origin.js`, `sections/purpose.js`
  and `sections/transport.js` **only**. The 18 objects in `sections/commodities/{lines,species,varieties}.js`
  are **absent from the manifest** — no import, no re-export, not in the `obligations` array.
- `features/evaluation.js` freezes exactly `[origin, purpose, transport]`. **The commodities bundle is
  NOT registered.**

The reason is a real boot failure, proved by mutation in pp-021: dispatch's `assertFullCoverage`
throws `Obligations collected by no page` for any manifest obligation with no owning page. pp-021
had no pages, so wiring it would have made the set unbootable.

**pp-022 adds the first commodities obligation that DOES have an owning page** (`commodityInputMethod`),
so some of that wiring must land now. **This is the handshake the orchestrator prompt warns about,
arriving one increment earlier than expected.** Here is the hard part:

> Registering pp-021's existing `evaluationBindings` export wholesale would register 15 grouped
> bindings for obligations that are **still not in the manifest and still have no owning page.**
> Whether that boots is **UNKNOWN and must be determined by RUNNING IT, not by reasoning about it.**

**Do this, in this order, and report what actually happened:**

1. Add `commodityInputMethod` to `obligations/index.js` (import from the new
   `sections/commodities/input-method.js`, re-export, append to the `obligations` array).
   **Do NOT add `commodityLines`, `species`, `varieties` or any of pp-021's 18 objects to the manifest.**
   They have no owning page; adding them is the exact boot failure above. That stays pp-023's job.
2. Add a `scalar({ field: 'commodityInputMethod', obligation: commodityInputMethod })` binding for the
   new page, and register a commodities entry in `features/evaluation.js`.
3. **Run the suite.** Then choose based on the OBSERVED result, and state which branch you took and
   the exact error text if any:
   - **If registering the existing 16-entry `evaluationBindings`** (pp-021's 15 grouped leaves + your
     new scalar, appended to the same array) **boots and the suite is green** — that is the preferred
     shape. Take it. One export, one registration, pp-023 then only has to add manifest exports.
   - **If it does NOT boot** — do not fight it and do not weaken anything. Leave pp-021's
     `evaluationBindings` export **exactly as it is, unregistered**, add a SEPARATE named export
     (e.g. `export const inputMethodBindings = feature('commodities', [scalar({...})])`) and register
     only that in `features/evaluation.js`. Report the error verbatim.
4. **Either way, state in your report — explicitly, as its own field — what pp-023 still has to do:**
   which manifest exports are still missing, and whether the depth-3 bundle is now registered or
   still waiting. The next increment's brief is written from your answer, so a vague answer here
   causes a real failure two increments downstream.

**Prove the coverage assertion is live rather than assuming it.** Once the page and obligation are
wired, temporarily remove `commodityInputMethod` from the new page's `meta.collects` and confirm the
suite fails with the `Obligations collected by no page` message naming it. Restore byte-identically
and confirm the working tree matches. That single mutation is what proves your wiring is real rather
than merely green.

## 2. Two more places the plan is stale — I checked all of them

**(a) Section and task-row POSITION. The plan says "insert directly before 'review'". That is now WRONG.**
pp-030 landed the `transport` section, which is what currently sits before `review`. At HEAD,
`flow/flow.js` sections are: `start`, `origin`, `purpose`, `transport`, `review`.

Commodities is **spoke 3**; transport is **spoke 5** (pp-030's own backlog entry says so, and the hub
copy confirms it — see (b)). So:

- `flow/flow.js` — insert `{ id: 'commodities', pages: [commodityInputMethodPage] }` **after `purpose`
  and BEFORE `transport`.** Not before `review`.
- `flow/task-rows.js` — same position: the array is currently `origin`, `purpose`, `transport`;
  commodities goes between `purpose` and `transport`.
- `features/hub/controller.js` — `GROUPS` is currently
  `[{ id: 'origin', rows: ['origin'] }, { id: 'purpose', rows: ['purpose'] }, { id: 'transport', rows: ['transport'] }]`.
  Insert `{ id: 'commodities', rows: ['commodities'] }` between `purpose` and `transport`.

Add a flow test asserting the **relative order** of `purpose` → `commodities` → `transport`, so a
future append cannot silently reorder the journey.

**(b) The hub group caption is NUMBERED, and the plan omits the number.** `features/hub/copy/copy.en.js`
currently has `groups: { origin: '1. Origin of the import', purpose: '2. Purpose', transport: '5. Transport to the BCP' }`.
So the new caption is **`'3. Commodity'`**, not `'Commodity'`. Match the existing convention exactly,
and mirror it in `copy.cy.js`.

**(c) The plan's `hub.e2e.spec.js` path does not exist.** The hub's e2e spec is not at that path — find
the real one before editing (the set's specs are co-located; `features/purpose/purpose.e2e.spec.js` and
`features/transport/transport-before-bip.e2e.spec.js` show the naming). If no hub e2e spec exists,
assert the new row from the increment's own spec instead and **say so** — do not create a second hub
spec file.

**(d) The mappers are genuinely new.** I grepped `services/records/mapper/` for `inputMethod` — no hits.
So `to-dto.js` / `from-dto.js` / `mapper.test.js` really are edits that add new mapping. The plan is
right here.

## 3. Exemplars — use in-set code, not live-animals

The plan points at live-animals `features/import-reason/`. There is a **better, in-set** exemplar that
already applies every ruling this set has taken:

- **Page content + controller pattern:** `sets/plant-products/journeys/linear/features/purpose/`
  (pp-020, frontend `2a9a83b5`). Single radio group, normalised uppercase enum, `oneOf` validation,
  400-with-raw-values re-render, single Joi-voice error string, `kit.recoverableSave`,
  `kit.nextTarget`. Its `evaluation.js` is the 9-line `feature('purpose', [scalar({...})])` shape you
  want for your scalar binding.
- **Multi-page GROUP folder shape:** `features/origin/` — `page.js` (import-free, exports multiple page
  identities), then `origin/<page-name>/<page-name>.controller.js`. **Not** `features/transport/`,
  which is a flat single-page feature with `controller.js` at its root. Commodities is a group
  (pp-023..pp-027 append into it), so follow `origin/`.

The plan's proposed paths already match the `origin/` shape — keep them.

## 4. Verification ladder and the numbers you must hit

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-030, `c1134886`) — these are the numbers to move from:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **255** |
| `npm test` | **1,849 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION, not a win) |
| plant Playwright (`test:features:plant-products`) | **60** |
| `lint:arch` | **0 errors / 4 warnings** |

Then, after the change:

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3050 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

**`lint:arch` must stay 0 errors / 4 warnings.** The 4 advisory `no-orphans` warnings are
`document-types`, `gross-volume-units`, `package-types`, `quantity-types` — reference fixtures with no
consuming page yet. **This increment consumes none of them, so the count must not move in either
direction.** A drop means you consumed a fixture you should not have; a rise means you created a new
orphan. **NEVER "fix" these warnings.**
`shasum .dependency-cruiser-known-violations.json` must stay `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**Report every count as a number, and explain every movement, especially downward.** A count you
cannot explain is a finding, not a rounding error. Expect `copy-convention.test.js` to gain cases from
its filesystem-discovered `it.each` blocks — `features/commodities/` already exists but has no copy
bundle or template today, so adding `copy/` (and no template) will move some of those parameterisations.
Work out which, and say so; do not hand-wave the delta.

## 5. Standing rules that have each caught a real defect

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** pp-017 silently deleted three browser specs and
  reported `ok:true`; the only tell was the Playwright count falling 13 → 11. A test that cannot pass
  is a **stop-and-report**, never a deletion. If you rename, give the named replacement for each.
  Before you finish, run `git diff --staged -U0` and
  `grep -cE "^- *(it|test|describe)\("` over it — use `--staged`, an unstaged diff of staged work is
  empty and looks like a clean pass.
- **AXE IS NECESSARY, NOT SUFFICIENT.** pp-017 proved it: emptying a fieldset legend — the exact defect
  ruling c-014 exists to fix — left **both axe scans green at serious/critical**. Your e2e spec must
  assert the **computed accessible name** of the radio group directly, in addition to the axe scan.
  The legend-as-page-heading is the accessible name here, so this is the load-bearing assertion of the
  whole increment.
- **REPORT UNDER-DELIVERY PLAINLY.** If a planned file needs no change because the behaviour already
  exists, say so and name the evidence. pp-009 delivered five fewer files than planned and reported
  `ok:true`; silent under-delivery is as dangerous as scope creep.
- **NEVER INVENT DATA.** Stopping twice carries no penalty; inventing one row does.
- **L1 shape assertions are IN SCOPE.** `indexed.plant-products.test.js`, `routes-plant-products.test.js`,
  `co-residency.test.js` and `contract.plant-products.test.js` encode the set's shape; this increment
  deliberately changes it, so update the expected values. But: **never weaken a pin, never truncate a
  journey to dodge a moved assertion, prefer the strictly stronger form, and report before/after.**
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence, not a silent edit. (`contract.plant-products.test.js` at the app root is the named
  exception — it is this set's cloned contract table and the T-5 standing rule requires its valid-POST
  case.)
- Run `npm run format` before you finish — the pre-commit hook runs `format:check && lint && test`.
- **Do not commit.** Leave the work staged/unstaged in the tree and report; the orchestrator verifies
  and lands it.

## 6. The increment itself

Everything else — the obligation shape, the two radio values `MANUAL` / `CSV`, the canonical question
*'How do you want to add your commodity details?'* (c-013: the divergent hidden legend
*'How would you like to enter your information?'* is DROPPED), the caption *'Description of the goods'*,
the two option labels and hints, the single error string *'Select how you want to add your commodity
details'*, GDS *'There is a problem'* summary with the `Error:` prefix (**not** the legacy
*'Please fix the following errors'*), persisted-not-flow-only (FD-8), no CSV branch and no
destructive-switch warning (both are pp-042's), and the copy key list — is as specified in
`backlog.json`'s `pp-022` entry. Follow it there, subject to the corrections above.

Take the plan's three headless decisions as already made: uppercase enum values submitted directly,
both options render but routing does not branch, and no check-answers work (pp-038 owns that).

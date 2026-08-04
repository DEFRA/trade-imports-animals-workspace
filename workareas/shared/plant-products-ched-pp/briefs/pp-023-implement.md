# pp-023 — commodity-search (code tree browse + EPPO species search)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — it has been wrong thirteen times, most recently in pp-022
where it told the implementor to `create` a file that already held gate-approved work.

This is an **L** increment. Take it in the order below.

---

## 1. THE WIRING HANDSHAKE — steps 1 and 2, and the obvious way to do it is WRONG

pp-021 shipped the depth-3 commodity model **deliberately unwired**. pp-022 wired the first scalar.
You complete the handshake. **Every fact below was established by mutation at HEAD after pp-022
(`7506ec1b`) — do not re-derive it, and do not trust any earlier phrasing about "registering the
waiting bundle", which is wrong.**

**There are TWO independent guards, not one.** This matters because satisfying one still leaves the
other:

- `flow/dispatch.js` `assertFullCoverage` rejects any obligation in the manifest that **no page
  collects** → `Obligations collected by no page: <names>`.
- `bridge/fulfilment-registry.js:31` rejects any binding whose obligation is **not the manifest's own
  object by identity** → `binding for "commoditySelection" must import its obligation object from the
  manifest`.

Together they force a hard order: **manifest exports FIRST, binding registration SECOND.**

**⚠ THE TRAP.** pp-022 registered the input-method scalar as a **separate** export,
`inputMethodBindings`, in `features/commodities/evaluation.js`, because pp-021's depth-3
`evaluationBindings` could not be registered yet. It would be natural to now simply add
`evaluationBindings` alongside it. **That fails.** Both call `feature('commodities', ...)`, and
registering two bundles under one feature name throws:

```
Invalid fulfilment binding registry: feature name "commodities" is registered twice
```

I proved this myself by running it. **So you must MERGE:** fold the
`scalar({ field: 'commodityInputMethod', obligation: commodityInputMethod })` leaf into the single
`evaluationBindings` array, **delete the `inputMethodBindings` export**, and update
`features/evaluation.js` to import and register exactly **one** commodities bundle. pp-022's 15
grouped leaves and its scalar must all survive into that one bundle — verify by count.

**⚠ THE SECOND TRAP, and this one will break your build if you follow the plan literally.**
pp-022's own handover note says to add **all 18** of pp-021's objects to `obligations/index.js`. **Do
not.** Adding an obligation to the manifest **without a page that collects it** is exactly the first
guard's failure mode. Several of those 18 belong to pages that do not exist yet:
`numberOfPackages`, `packageType`, `quantity`, `quantityType`, `netWeight`,
`controlledAtmosphereContainer`, `finishedOrPropagated`, `intendedForFinalUsers` and `testAndTrial`
are **pp-024..pp-028's**, not yours.

**The rule: add to the manifest exactly the obligations your own pages collect, and not one more.**
Work out that set from your pages' `meta.collects`, add those, and **report which of the 18 remain
unmanifested and which increment you believe owns each.** Note that pp-021's mutation reported
**structural parents too** (`commodityLines` as well as `commodityLines.commoditySelection`), so a
group obligation needs collecting just as its leaves do — check whether your pages own the parents
(`commodityLines`, `species`, `varieties`) and include them only if so.

**Prove it before you move on.** Once wired, temporarily add one obligation you do NOT own (say
`netWeight`) to the manifest and confirm the suite fails with `Obligations collected by no page:
netWeight`. Restore byte-identically and confirm the working tree matches the index. That mutation is
what proves your manifest boundary is real rather than coincidentally green.

## 2. `enforcedAtContinue` changes, and it has a user-visible side effect

Decision (7) in the plan notes, assigned to this increment: **`commoditySelection` JOINS
`policy.enforcedAtContinue`**, mirroring live-animals.

Two consequences, both in scope and both to be handled rather than discovered:

- **An L1 pin encodes the current value.** `src/server/app/co-residency.test.js` asserts
  `plantProducts.enforcedAtContinue` equals `['countryOfOrigin']`. That becomes
  `['countryOfOrigin', 'commoditySelection']`. Update the **expected value** — do not weaken or delete
  the assertion. (Live-animals' own pin in the same test is already
  `['countryOfOrigin', 'commoditySelection']`; leave it alone.)
- **⚠ It changes hub row states.** pp-018 put `countryOfOrigin` in `enforcedAtContinue` and that made
  the Purpose row read *'Cannot start yet'* on a fresh notification — an ordering constraint nobody
  designed, which Sam has already been flagged about. Adding `commoditySelection` may do the same to
  downstream rows. **Check what the hub renders before and after, and report the difference
  explicitly** even if you judge it correct. Do not silently accept a changed row state.

## 3. Verify these plan claims before relying on them

- **`from-dto.js` is missing from `filesToTouch` and probably should not be.** The list has
  `to-dto.js` and `mapper.test.js` but no `from-dto.js`. Draft resume needs the inverse mapping for
  commodity lines. Check whether resume works without it; if it does not, add it and **report the
  addition** as a plan gap rather than delivering silently.
- **`features/commodities/page.js` is `edit`, not create** — pp-022 created it, exporting
  `commodityInputMethodPage`. Append your page identity; the file imports NOTHING (recipe hard rule).
- **`copy.en.js` / `copy.cy.js` / `copy.test.js` under `features/commodities/copy/` are edits** —
  pp-022 created all three. Namespace your keys by page alongside the existing `inputMethod.*` block.
- **Section and row already exist.** pp-022 opened the `commodities` flow section (positioned after
  `purpose`, before `transport`) and the `commodities` task row. **Append your page into both** — do
  not create a second section or row, and do not move the section.
- **The `pp-014` commodities service exists** at `sets/plant-products/services/commodities/`
  (`index.js`, `fixture.js`, `commodities.test.js`). Consume it as shipped. **Do not add, pad or
  invent a single commodity code, EPPO code or species row.** pp-014 stopped rather than invent an
  EPPO association and was right — the plan had named a CHED-D commodity. Stopping twice carries no
  penalty; inventing one row does.

## 4. Baselines and the numbers you must hit

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-022, `7506ec1b`) — verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **270** |
| `npm test` | **1,868 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **66** |
| `lint:arch` | **0 errors / 4 warnings** |

Full ladder after the change:

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3050 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

The 4 advisory `no-orphans` warnings are `document-types`, `gross-volume-units`, `package-types` and
`quantity-types` — none of which this increment consumes, so **expect 0 errors / 4 warnings,
unchanged**. If the count moves in either direction, explain exactly why. **NEVER "fix" these
warnings.** `shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**Every count that moves must be explained, especially downward.**

## 5. Standing rules that have each caught a real defect

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** pp-017 silently deleted three browser specs and
  reported `ok:true`; the only tell was the Playwright count falling 13 → 11. A test that cannot pass
  is a **stop-and-report**, never a deletion. Before finishing, run `git diff --staged -U0` and
  `grep -cE "^- *(it|test|describe)\("` over it — use `--staged`.
- **AXE IS NECESSARY, NOT SUFFICIENT.** pp-017 proved axe stays green at serious/critical while a
  fieldset legend is empty — the exact defect c-014 exists to fix. **Assert computed accessible names
  directly.** This increment is unusually exposed: it rebuilds the legacy tabs as proper `govuk-tabs`
  and replaces 22 buttons-as-links plus nested identically-named nav landmarks. Assert the tab panels'
  accessible names, the search inputs' `aria-describedby` hint wiring (decision 4 — a legacy WCAG
  defect deliberately not ported), and that no two landmarks share a name.
- **REPORT UNDER-DELIVERY PLAINLY.** If a planned file needs no change, say so and name the evidence.
- **L1 shape assertions are IN SCOPE** (`indexed.plant-products.test.js`, `routes-plant-products.test.js`,
  `co-residency.test.js`, `contract.plant-products.test.js`): update expected values, **never weaken a
  pin, never truncate a journey to dodge a moved assertion, prefer the strictly stronger form, report
  before/after.**
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence, not a silent edit. `contract.plant-products.test.js` at the app root is the named
  exception (this set's cloned contract table).
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report; the
  orchestrator verifies and lands it.

## 6. The increment itself

The nine headless design decisions, the verbatim legacy-sourced validation copy (c-018: one canonical
string per rule), `eppoCode` as THE join key, the append-one-line-per-visit interaction (rather than
live-animals' checkbox reconcile), the write guards from `add-a-collection.md` §4.7, and the note that
`kit.nextTarget` resolves to the hub until pp-024 lands — are all as specified in `backlog.json`'s
`pp-023` entry. Follow it there, subject to the corrections above.

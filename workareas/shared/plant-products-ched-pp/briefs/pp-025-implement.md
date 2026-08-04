# pp-025 — variety-of-genus-and-species (variety + class, DEPTH 3)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fourteen times so far, twice destructively.

**This is the riskiest page in m3**: the first real, non-fixture exercise of depth-3 nested collections
on the platform. The live-animals exemplar `animalIdentifiers` is only depth 2.

---

## 1. Declare NO obligations and NO bindings — and your `collects` stays empty

The commodity model and its bindings are pp-021's, and the wiring handshake completed in pp-023
(`11682527`). Verified by me at HEAD:

- All 18 commodity obligations are in `obligations/index.js`, including `varieties`, `variety` and
  `varietyClass`.
- `features/commodities/evaluation.js` exports ONE merged 16-binding bundle including the
  `varietyLeaf` entries bound at `groups: [lineGroup, speciesGroup, varietyGroup]`.
- `features/evaluation.js` registers that single bundle.

**So do not touch `obligations/index.js` or either `evaluation.js`.** The plan's `filesToTouch`
correctly omits them; if you find yourself editing them, stop and re-read this.

**Keep `collects: []`.** `commodity-search` collects `['commodityLines']`, and `ownerOfObligation`
(`flow/dispatch.js:33`) walks **up** the ancestor chain, so every variety-level obligation already
resolves to an owning page. I proved this by mutation in pp-023: emptying commodity-search's `collects`
fails naming all eighteen paths, `commodityLines` through
`commodityLines.species.varieties.varietyClass`. Declaring any of them here would throw
`Obligation "..." is collected by two pages`. pp-024 did exactly this and it was correct.

**A red baseline means STOP.** Run `test:plant-products` before editing. The plan warns that a red
baseline could mean pp-021 landed without the 3-chain grouped bindings — it did not, they are there and
registered, so a red baseline now means something else and is worth reporting rather than working
around.

## 2. What exists now — verify before trusting the plan

- **`features/commodities/page.js` is an edit** exporting three identities already:
  `commodityInputMethodPage`, `commoditySearchPage`, `commodityBasicDescriptionPage`. Append yours.
  The file imports NOTHING (recipe hard rule).
- **The three copy files under `features/commodities/copy/` are edits**, already carrying
  `inputMethod.*`, `commoditySearch.*` and basic-description blocks. Namespace yours alongside.
- **The `commodities` flow section and task row already exist**, positioned after `purpose` and before
  `transport`, currently holding `commodity-input-method` → `commodity-search` →
  `commodity-basic-description`. **Append into both. Do not create a second section or row, and do not
  move the section.**
- **The mapper needed no edit in pp-023 or pp-024** — depth-three mapping and inverse resume are
  already covered. The plan does not list mapper files here either. **Verify that holds for `variety`
  and `varietyClass` rather than assuming; if an edit IS forced, report it as a plan gap rather than
  delivering silently.**
- **Redirect targets shift when you append a page.** pp-024's landing moved commodity-search's
  redirect from the hub to `/commodity-basic-description`, and three existing assertions in
  `commodity-search.e2e.spec.js` were correctly narrowed to the new exact path. Expect the same class
  of change here — update such assertions to the **more specific** value; never loosen one to a
  pattern that would pass either way.

## 3. Depth 3 is where the engine has actually been broken before

pp-012's characterisation found **real engine defects** at nested depth, and pp-070 fixed them. The one
that matters: an out-of-range or non-integer parent index corrupted persistence. Your
`appendEntryAt` / `updateEntryAt` / `removeEntryAt` calls address
`['commodityLines', i, 'species', j, 'varieties']`, so there are now **two ancestor indices to guard,
not one**.

**Refuse out-of-range AND non-integer indices at BOTH ancestor levels, and prove no persistence
corruption results.** A phantom parent renders perfectly and only surfaces as junk in the payload —
this is precisely the failure mode that stays green.

Also prove **scope and wipe preserve siblings**: removing one variety must not disturb another
variety, another species, or another commodity line.

## 4. ⚠ Repeated controls: assert distinct accessible names — twice proven now

pp-017 showed axe stays green while a fieldset legend is empty. **I re-proved the same class on pp-024
last increment**: collapsing every per-row Remove control's `aria-label` to the bare "Remove" left the
axe scan reporting **no violation at all**, while the explicit accessible-name assertion caught it
immediately (34 buttons resolving to one identical name).

This page repeats controls per variety, nested inside per-species and per-line groupings — the worst
case yet for name collisions. **Every repeated control's accessible name must identify which
line/species/variety it acts on.** Follow pp-024's assertion shape, which is the standard now: pin each
control's exact accessible name AND assert the set of names is distinct, so two identical labels cannot
pass by accident. Axe scans are still required, but they are necessary and not sufficient.

## 5. Baselines and the numbers you must hit

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-024, `476561e3`) — every figure verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **309** |
| `npm test` | **1,909 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **87** |
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
`quantity-types`. This increment consumes none, so **expect 0 errors / 4 warnings, unchanged**; explain
any movement either way. **NEVER "fix" these warnings.** `shasum
.dependency-cruiser-known-violations.json` must stay `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**Every count that moves must be explained, especially downward.**

## 6. Hub and readiness

The last three increments each risked shifting hub row states, and two of them did — `countryOfOrigin`
(pp-018) made the Purpose row 'Cannot start yet', and `commoditySelection` (pp-023) did the same to
Transport. pp-024 checked and reported that nothing shifted. **Do the same: state explicitly what the
hub renders before and after, even if unchanged.** Do not let a changed row state arrive silently.

## 7. Standing rules that have each caught a real defect

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** pp-017 silently deleted three browser specs and
  reported `ok:true`; the tell was the Playwright count falling 13 → 11. A test that cannot pass is a
  **stop-and-report**, never a deletion. Name the replacement for every rename. Before finishing, run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` over it; use `--staged`.
- **NEVER INVENT DATA.** Every commodity code, EPPO code, species and variety comes from pp-014's
  fixture as shipped. pp-014 stopped rather than invent an EPPO association and was right — the plan
  had named a CHED-D commodity. Stopping twice carries no penalty; inventing one row does.
- **REPORT UNDER-DELIVERY PLAINLY.** If a planned file needs no change, say so and name the evidence.
  pp-023 and pp-024 both did this correctly for the mapper.
- **L1 shape assertions are IN SCOPE** (`indexed.plant-products.test.js`, `routes-plant-products.test.js`,
  `co-residency.test.js`, `contract.plant-products.test.js`): update expected values, **never weaken a
  pin, never truncate a journey to dodge a moved assertion, prefer the strictly stronger form, report
  before/after.**
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence, not a silent edit — pp-023's `createAll(Tabs)` is the bar: forced, evidenced, blast
  radius checked. `contract.plant-products.test.js` is the named exception.
- **Stay inside the govuk-frontend toolbox** — govuk-* components and utilities, no bespoke CSS. Note
  decision (1): the 'Other' input is **always visible** with a real label and hint, because CHED-PP
  m0–m4 ships zero client JS and the legacy jQuery reveal is unusable without it.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report; the
  orchestrator verifies and lands it.

## 8. The increment itself

The nine headless decisions — always-visible 'Other' input, Other free text committing into the
`variety` member, the rewritten duplicate message, the relaxed 32-char Other rule (recorded as a
deliberate deviation from the legacy lowercase-only rule, which rejects conventionally-capitalised
cultivar names), EPPO-keyed dynamic field names NOT ported (the spec's sharpest finding: client and
server derive the code by different string surgery and break on hyphenated codes), hidden
etag/commodityDetailsPage dropped, controller-side skip-when-no-reference-data, no commodity-line cap,
and 'Add another Genus (and species)' as a link rather than a submit — are as specified in
`backlog.json`'s `pp-025` entry. Follow it there, subject to the corrections above. Transpose
`features/commodities/animal-identification/` one level deeper rather than inventing a shape, and use
`features/documents/` for the single-page add-another loop table.

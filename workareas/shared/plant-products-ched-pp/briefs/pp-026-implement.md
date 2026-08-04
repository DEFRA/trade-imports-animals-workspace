# pp-026 — commodity-summary (commodity table + remove)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fourteen times so far, twice destructively.

This is a **read-only echo** of the `commodityLines` collection plus a Remove branch. **No new data is
captured.**

---

## 1. Declare NO obligations and NO bindings — `collects` stays empty

The commodity model and its bindings are pp-021's, wired by pp-023 (`11682527`). Verified at HEAD:
all 18 commodity obligations are in `obligations/index.js`; `features/commodities/evaluation.js`
exports ONE merged 16-binding bundle; `features/evaluation.js` registers exactly that bundle.

**Do not touch `obligations/index.js` or either `evaluation.js`** — the plan's `filesToTouch` correctly
omits them. **Keep `collects: []`**: `commodity-search` collects `['commodityLines']` and
`ownerOfObligation` (`flow/dispatch.js:33`) walks **up** the ancestor chain, so every commodity
obligation already has an owner. Declaring one here would throw
`Obligation "..." is collected by two pages`. pp-024 and pp-025 both did this correctly.

## 2. What exists now — verify before trusting the plan

- **`features/commodities/page.js` is an edit** already exporting four identities:
  `commodityInputMethodPage`, `commoditySearchPage`, `commodityBasicDescriptionPage`,
  `varietyOfGenusAndSpeciesPage`. Append yours. The file imports NOTHING (recipe hard rule).
- **The three copy files under `features/commodities/copy/` are edits** carrying four page blocks
  already. Namespace yours alongside.
- **The `commodities` flow section and task row exist**, after `purpose` and before `transport`,
  currently holding input-method → search → basic-description → variety-of-genus-and-species.
  **Append into both. Do not create a second section or row, and do not move the section.**
- **No mapper change is expected** (decision 7 — removal rides the existing whole-document PUT).
  pp-023, pp-024 and pp-025 each confirmed the mapper needed nothing. **Verify rather than assume; if
  an edit IS forced, report it as a plan gap rather than delivering silently.**
- **Appending a page shifts redirect targets.** pp-024's landing moved commodity-search's redirect
  from the hub to `/commodity-basic-description`, and existing assertions were correctly narrowed to
  the new exact path. Expect the same class of change. Update such assertions to the **more specific**
  value; never loosen one to a pattern that would pass either way.

## 3. Removal is the risk on this page — three specific hazards

**(a) Two ancestor indices, guarded before any write.** Remove operates at the species-row level:
`removeEntryAt(['commodityLines', i, 'species'], j)`. pp-012 found real engine defects here and pp-070
fixed them. **Refuse out-of-range AND non-integer indices at BOTH levels.** pp-025's
`validSpeciesTarget` is the in-set exemplar and its guard is proven load-bearing — I removed only its
`Number.isInteger(speciesIndex)` clause last increment and two tests failed by name with
`Cannot read properties of undefined`. Follow that shape.

**(b) Removal must not disturb siblings.** Removing one species must leave other species on the same
line, other commodity lines, and every variety under untouched species exactly as they were. Prove it,
because orphaned or shifted rows render perfectly and only surface as junk in the payload.

**(c) Positional renumbering.** Removing index `j` renumbers everything after it. Any Remove control
rendered from a stale index would then act on the wrong row. Assert the post-removal indices, not just
the post-removal count.

## 4. ⚠ Repeated controls: distinct accessible names — proven necessary twice

pp-017 showed axe stays green while a fieldset legend is empty. I re-proved the class on **pp-024**:
collapsing every per-row Remove control's `aria-label` to the bare "Remove" left the axe scan
reporting **no violation at all**, while the explicit assertion caught it (34 buttons, one name).

This page is a table of Remove buttons — the same hazard again. **Every Remove control's accessible
name must identify which commodity line and species it acts on.** Use pp-024/pp-025's assertion shape,
now the standard: pin each control's exact accessible name AND assert the set of names is distinct.
Axe scans are still required and still not sufficient.

Note decision (3) exists partly for this reason: one row per species with varieties stacked inside the
cells, so there is exactly one removable entity per row rather than several Remove buttons with
identical effect.

## 5. Baselines and the numbers you must hit

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-025, `15684f7f`) — every figure verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **343** |
| `npm test` | **1,944 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **102** |
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

Two increments changed hub row states as an unplanned consequence (`countryOfOrigin` in pp-018 made
Purpose 'Cannot start yet'; `commoditySelection` in pp-023 did the same to Transport). pp-024 and
pp-025 both checked and reported no shift. **Do the same: state what the hub renders before and after,
even if unchanged.**

## 7. Standing rules that have each caught a real defect

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** pp-017 silently deleted three browser specs and
  reported `ok:true`; the tell was the Playwright count falling 13 → 11. A test that cannot pass is a
  **stop-and-report**, never a deletion. Name the replacement for every rename. Before finishing, run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` over it; use `--staged`.
- **NEVER INVENT DATA.** Every commodity code, EPPO code, species and variety comes from pp-014's
  fixture as shipped. pp-025 correctly reported that a two-qualifying-species browser scenario is
  impossible because only CIDAC carries both varieties and classes — it did not fabricate one, and I
  verified that against the fixture. Stopping twice carries no penalty; inventing one row does.
- **REPORT UNDER-DELIVERY PLAINLY.** If a planned file needs no change, say so and name the evidence.
- **L1 shape assertions are IN SCOPE** (`indexed.plant-products.test.js`, `routes-plant-products.test.js`,
  `co-residency.test.js`, `contract.plant-products.test.js`): update expected values, **never weaken a
  pin, never truncate a journey to dodge a moved assertion, prefer the strictly stronger form, report
  before/after.**
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence, not a silent edit. `contract.plant-products.test.js` is the named exception.
- **Stay inside the govuk-frontend toolbox** — this increment is explicitly a toolbox cleanup of the
  legacy markup (decision 4): `govukTable` macro, no link-button class in either direction,
  `govuk-!-text-align-right` over bespoke CSS, visually-hidden actions header named 'Actions'. No
  bespoke CSS, no client JS, no webpack entry.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report; the
  orchestrator verifies and lands it.

## 8. The increment itself

The eight headless decisions — species-row-level Remove, cannot-remove-last parity, one row per species
with varieties stacked, the GOV.UK toolbox rulings, blank Variety/Class cells rather than the legacy
'None' literal, no max-lines notice, no check-answers or mapper work, and 'Save and continue' verbatim
with the legacy three-way save routing NOT ported — are as specified in `backlog.json`'s `pp-026`
entry. Follow it there, subject to the corrections above. The file-for-file exemplar is the live-animals
consignment-details page (`collects: []`, per-row Remove submit inside the same POST,
`remove/post-remove.js` action parsing), with its contract case at `contract.test.js:213-222` as the
shape for this increment's own.

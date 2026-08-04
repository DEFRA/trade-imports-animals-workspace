# pp-086 review brief — the commodities fixture correction

This brief OVERRIDES the generic `review.md`. Work is **staged, not committed**, across **17 files** in
`repos/trade-imports-animals-frontend` — against a plan that named four. The extra files are a
consequence of a reshape I ruled in; **your job includes checking whether that blast radius is
justified or whether something got swept along.**

## What the increment did

The fixture modelled class by **EPPO species** and variety by **EPPO species**. The IPAFFS source
(`~/git/defra/ipaffs/ipaffs-commoditycode-microservice` at `c445e7c`) keys class by
**commodity only** (`commodity_class.csv` has no `eppo_code` column) and variety by **commodity +
eppo**. Both maps are now commodity-keyed, `0808108090` was added, and `0808108010` lost its varieties.

## ⚠ WHAT I HAVE ALREADY VERIFIED MYSELF — do not re-tread it

I derived all of this from the CSVs before briefing, and re-checked the diff against it:

- `grep -cE "^(06011010|0603197090|06042090|0713500010|08059000|0808108010|09103000)," commodity_class.csv`
  → **0**. No previously-shipped commodity has any class row.
- `grep -c "^0808108010," commodity_eppo_variety.csv` → **0**. Cider apples has no varieties.
- `0808108090` has exactly **3** class rows (Class I / Class II / Extra Class) and **66** MABSD variety
  rows. The three shipped UUIDs (`03107EFA…` McIntosh Red, `035ECF9F…` Spartan, `0C245190…` Royal Gala)
  all match CSV rows.
- **CIDAC's variety id was invented** (`'NONE'`); the real id is `C5E27C5A-D13B-E9F5-B4B0-7234A7941208`.
  Corrected. I found this defect; it is not in the plan.
- **Eight EPPO codes span multiple commodities** (`MABSD`, `CIDSI` under six, …), and the same variety
  name **"Fuji" has different UUIDs** under `0808108090` (`35ED54BA…`) and `0808108020` (`9B0C4724…`).
  That is why EPPO-only keying is wrong, and why the reshape was forced rather than optional.
- `CLASS_LABELS` already matched the source's display strings; only the keying was wrong.
- **`allowListed` supports a grandparent gate by design** — its docstring specifies depth-N gates match
  on **ancestor prefix** with the gated obligation's parent group as `projectionGroup`. `varieties` is
  still that group, so moving the gate from `eppoCode` to `commoditySelection` is a supported use.
- **The `lint:arch` dependency count moved 2,126 → 2,127**, exactly accounted for by the new
  `import { commoditySelection } from './lines.js'` in `varieties.js`.
- **My own mutation: I moved `CLASSES_BY_COMMODITY` onto the wrong commodity (`08059000`) and TEN-PLUS
  tests failed**, including *'appends exactly variety and class at depth three'* and *'returns the
  canonical class required error and preserves raw state'*. So the **survival** side of the gate is
  well pinned, not just the wipe side.

## ⚠ WHAT I MOST WANT FROM YOU — the axes I have NOT covered

**1. The blast radius. Seventeen files against a plan of four.** For each file NOT in the plan
(`contract.plant-products.test.js`, `check-answers.test.js`, `check-answers/view-model/cards/
commodities.js`, `view-model/rows/value-text.js`, `commodity-summary.controller.test.js`,
`commodity-summary/view-model/summary-groups.js`, `commodity-summary.e2e.spec.js`,
`variety-of-genus-and-species.*`, `journey.e2e-helper.js`, `commodities-model.test.js`,
`varieties.js`), state whether the change was **forced by the re-keying** or is **scope creep**. Name
any that could have been left alone.

**2. `contract.plant-products.test.js` is an L1 shape assertion file.** L1 assertions are in scope to
**UPDATE, never to WEAKEN**. Confirm exact equalities stayed exact and report before/after. This is the
file most likely to have been quietly loosened to make a number match.

**3. `journey.e2e-helper.js` is the SHARED driver from pp-085**, consumed by the review, declaration
and confirmation specs. A change there reaches specs this increment is not about. **Check that no
assertion in those three specs weakened as a side effect**, and that the driver still serves all three
profiles.

**4. Ask what every changed expected value is a copy of.** The implementor reports a long list of moved
expectations (CIDAC classes → none; the class-bearing UI case CIDAC/08059000 → MABSD/0808108090; the
no-class case → CIDAC/08059000; the no-variety browser case LENCU/06042090 → MABSD/0808108010;
check-answers CIDAC Class I → blank and MABSD blank → Class I/Class II). **Verify a sample against the
CSVs directly**, and flag any value adjusted merely to make a test pass rather than because the source
says so. This is a provenance-backed fixture: over-claiming is the cardinal sin.

**5. `0808108090`'s tree description is `'Other'` and its species entry is MABSD / `1391442`.** The
CSVs I cited carry **no description column** — so where did `'Other'` come from, and is MABSD's
presence under `0808108090` sourced from anything beyond the variety rows implying it? Check
`commodity_nomenclature.csv` and `species.csv`. **If either value cannot be traced, that is a finding.**

**6. `docs/README.md` must CORRECT the record, not append to it.** It must name **pp-014** and
**pp-077** as the affected entries, say plainly that pp-014's provenance claim does not hold for the
class data or CIDAC's variety id, state that three varieties are a **curated subset of 66** with the
selection rule, and carry the **integration-test-dataset, not production reference data** caveat.
Under-claiming is fine; over-claiming is not.

**7. The model test's name may now be a lie.** *'scopes and wipes varietyClass per species instance
without touching a sibling'* now gates on **commodity**, and its fixture uses two lines with different
commodities. Is the name still accurate? A test name is not evidence of what it discriminates.

**8. Does `varietyLabelFor(commodityCode, eppoCode, varietyId)` have every caller updated?** It gained
a parameter. A missed call site would silently pass `eppoCode` as `commodityCode` and return
`undefined`, rendering a raw UUID to the user instead of a label. **Grep every caller and check the
argument order at each**, including any in check-answers and commodity-summary.

## Things you do NOT need to raise

- **Welsh** — machine-draft, covered by a Welsh-speaking tech lead. One mention at most.
- **The integration-test-dataset caveat itself** — already ruled and carried; just confirm the docs say
  it.
- **Production code outside `sets/plant-products/`** — off limits. If you believe a change requires
  one, report it as a finding with evidence rather than proposing the edit.

## Baselines at `10dda2a9`, which I ran myself

plant unit **727** → implementor reports **728**; npm test **2,365** / 8 skipped (217 files) → reports
**2,366**; `test:live-animals` **559** (a change is a REGRESSION); plant Playwright **258**;
`lint:arch` **0/0**, **671** modules, **2,126** → **2,127** dependencies; shasum
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`. Declarations reported **+4/−3, net +1** — **verify that the
three removals are renames paired with replacements** and not silent deletions.

## Report

Findings as JSON per the schema. For each: file and line, what is wrong, **how you verified it** — a
mutation you ran or a file you read, not an inference — and severity. **Restore anything you mutate;
the staged diff must be unchanged when you finish.** Review only; do not fix.

**Zero findings is an acceptable and useful answer.** Do not manufacture findings. **And note that on
this build the last review's single finding was a FALSE POSITIVE that I confirmed with an inert
mutation before an implementor refused it** — so if you claim a pin is missing, prove the mutation you
used actually changed observable behaviour, and say what else could be enforcing the guarantee.

# pp-086 — correct the commodities fixture against the IPAFFS source

This brief OVERRIDES the generic `implement.md`. **A provenance-backed fixture correction.** pp-014's
whole claim to trust is that every value came from a real source. **Under-claiming is fine;
over-claiming is not.** If you cannot trace a value, **STOP and report `ok:false`** — nine increments
have refused to fabricate and every one was right.

## The source

`~/git/defra/ipaffs/ipaffs-commoditycode-microservice` at **`c445e7c`**, files under
`service/src/test/resources/integration/data/`. The two that matter:
`commodity_class.csv` and `commodity_eppo_variety.csv`.

**⚠ PROVENANCE CAVEAT TO CARRY INTO THE DOCS:** this is the owning service's **integration-test
dataset**, not production reference data. Strong evidence, **not proof**. Say so.

**⚠ I derived every fact below myself with the greps shown. RE-DERIVE THEM. My briefs have been wrong
seven times on this build and the implementor or reviewer was right every time — correct me with
evidence rather than making the fixture match my numbers.**

## The shape, confirmed

```
commodity_class.csv        header: traces_commodity_code,class,effective_from,...   ← NO eppo_code column
commodity_eppo_variety.csv header: traces_commodity_code,eppo_code,variety,...      ← commodity AND eppo
```

Class is a property of the **COMMODITY**. Variety is a property of **COMMODITY + SPECIES**.

## FOUR defects — the plan lists three; the fourth is mine

1. **Wrong shape.** `CLASSES_BY_EPPO` is keyed by EPPO species. The source has no `eppo_code` column
   for class at all.
2. **Unsupported class data.** `CLASSES_BY_EPPO`'s sole entry is `CIDAC`. I ran
   `grep -cE "^(06011010|0603197090|06042090|0713500010|08059000|0808108010|09103000)," commodity_class.csv`
   → **`0`**. **None of our seven commodity codes has a single class row.**
3. **Varieties on the wrong commodity.** `grep -c "^0808108010," commodity_eppo_variety.csv` → **`0`**.
   Cider apples has **no varieties in the source**. Both UUIDs we ship under it —
   `03107EFA-9BCD-1089-565E-B28F73994DEC` (McIntosh Red) and
   `035ECF9F-7B6C-078D-60D5-D2947C23A366` (Spartan) — are real, but belong to **`0808108090`**.
4. **⚠ NEW, FOUND BY ME: `CIDAC`'s variety id is INVENTED.** `fixture.js:208` ships
   `{ id: 'NONE', label: 'None' }`. The source row is
   `08059000,CIDAC,None,...,C5E27C5A-D13B-E9F5-B4B0-7234A7941208,...` — **the label 'None' is real; the
   id `'NONE'` is fabricated.** Every other variety id we ship is a source UUID. Fix it to the real id
   and say so in the docs; this is another value pp-014's provenance claim does not cover.

## ⚠ RULING 1 — ADD `0808108090`. This answers the increment's first open question: KEEP class data

The open question asks whether to add a commodity that genuinely has classes, or accept an empty class
map. **Add one — and `0808108090` is the obvious choice because it resolves defect 3 at the same time.**

```
grep "^0808108090," commodity_class.csv
  → Class I, Class II, Extra Class   (3 rows)
grep -c "^0808108090,MABSD," commodity_eppo_variety.csv
  → 66
```

It is **the commodity the source assigns our two MABSD variety UUIDs to**, and it has all three
classes. One addition fixes the wrong-commodity defect *and* keeps the class path exercisable.

**An empty class map is not acceptable**, because it would make the entire class feature dead code —
including the conditional pp-078 landed one commit ago.

**`CLASS_LABELS` is already correct and sourced** (`CLASS_I: 'Class I'` etc. match the source's display
strings exactly). Only the **keying** is wrong. State the code↔label transcription rather than
silently re-deriving it.

## ⚠ RULING 2 — `0808108010` KEEPS ITS THREE SPECIES BUT LOSES ITS VARIETIES

The source gives Cider apples **zero** varieties. pp-077 verified MABAN / MABSD / MABZU as species of
`0808108010` against the source directly and pp-084 pinned them; **that species data stays**. Only the
varieties move. A species with no varieties simply does not reach the variety page — which is exactly
the behaviour pp-078 preserved and pinned.

## ⚠⚠ RULING 3 — RESHAPE **BOTH** MAPS TO COMMODITY-KEYED. THIS IS FORCED, NOT OPTIONAL

The increment's second open question asks whether the shape error affects anything else. **It does, and
I proved it rather than assuming it.**

`VARIETIES_BY_EPPO` is keyed by EPPO alone. But **eight EPPO codes appear under more than one
commodity** — `LACSP, CIDCL, CIDRE, VITVI, LACSC, CIDSI (six commodities!), LYPES, MABSD`.

**MABSD is one of them**, and the two sets are not merely different sizes — they disagree on identity:

```
0808108090,MABSD,Fuji,...,35ED54BA-894D-5D2B-A4E0-9F61A2838A58
0808108020,MABSD,Fuji,...,9B0C4724-5355-CE8B-71A8-2209BC73E38B
```

**The same variety name for the same species has a DIFFERENT UUID under each commodity.** A map keyed
by EPPO alone cannot represent that — it must pick one, and the id it stores is then wrong for the
other commodity.

**And this increment activates the latent defect.** Once `0808108090` is added, **MABSD exists under
two commodities in our own fixture** (`0808108010` as a species, `0808108090` with varieties). Under
EPPO-only keying, MABSD's varieties would leak onto Cider apples — which the source says has none.
**So reshaping varieties is required for correctness here, not a nice-to-have.**

## ⚠⚠ HAZARD — THE OBLIGATION MODEL IS THE RISKIEST EDIT IN THIS INCREMENT

`obligations/sections/commodities/varieties.js:29`:
```js
applyTo: allowListed(eppoCode, classApplicableSpecies, varieties, [varietyClassReason])
```

It keys on **`eppoCode`** and on `classApplicableSpecies()` (= `Object.keys(CLASSES_BY_EPPO)`). When
classes become commodity-keyed, **both the field it keys on and the helper must change**, and the
helper name `classApplicableSpecies` becomes a lie.

**pp-078 proved this is where the real guarantee lives** — I removed `applyTo` and two tests failed by
name, including *'scopes and wipes varietyClass per species instance without touching a sibling'*.
**This is the engine's purge deciding whether a stored `varietyClass` survives.** Get it wrong and
either a legitimate class is wiped, or a class survives on a commodity that has none.

**Re-run that test deliberately and report it.** If re-keying the obligation cannot be done without
touching the shared `allowListed` helper or anything outside `sets/plant-products/`, **stop and report
`ok:false` with evidence** rather than reaching outside the set.

## ⚠ pp-078 LANDED ONE COMMIT AGO AND ITS TESTS USE CIDAC AS THE HAS-CLASS CASE

`10dda2a9`. Its controller tests use **CIDAC** as the species that *does* have classes and **MABSD** as
the one that does not. **This increment removes CIDAC's classes**, so that distinction inverts: the
has-class case becomes MABSD under `0808108090`.

**Those tests must be updated, and that is expected — not a regression.** Report every moved expected
value **before/after with the reason**. **No assertion may be adjusted merely to make a number match.**
`commodities.test.js` also still asserts `hasVarieties('CIDAC') === true` and
`hasVarieties('MABSD') === true` — check both still hold under the corrected data and say so.

## How many varieties to ship

`0808108090` has **66**. The fixture is a **curated sample**, not a mirror — that is fine, but it must
be **stated, not implied**.

**Ship at least three**, keeping McIntosh Red and Spartan (already present, already correct UUIDs) plus
at least one more copied verbatim from the CSV. Three matters: pp-077 grew a commodity to three species
precisely so that removing the **middle** entry is detectable, and pp-091 recorded that a thinned
profile is exactly what the assertions cannot see. **Say in the docs that it is a subset of 66 and what
the selection rule was.** Do not imply completeness.

## docs/README.md — CORRECT the record, do not append to it

Name **pp-014** and **pp-077** as the entries affected. State plainly: pp-014's claim that every value
has stated provenance **does not hold** for the class data or for CIDAC's variety id; pp-077's species
note is correct but sat beside variety data now known to belong elsewhere. Carry the integration-test
caveat.

## Baselines — I ran all of these myself at `10dda2a9` (pp-078)

- `test:plant-products` — **727** (58 files)
- `npm test` — **2,365** / 8 skipped (217 files)
- `test:live-animals` — **559** (65 files) — **a change is a REGRESSION**
- `test:features:plant-products` (**`PORT=3201`**) — **258**
- `lint:arch` — **0/0**, **671** modules, **2,126** dependencies; shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`

Test counts will move here — that is expected. **Every move must be explained**, especially downward:
`git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.

## Rules

- **Keep pp-084's deep-equality discipline** in `commodities.test.js`: every `eppoCode`,
  `genusAndSpecies` and `speciesId` asserted **by value and position**, alongside the
  reference-identity (`toBe`) assertion. pp-084 proved both earn their place — a `toEqual` beside a
  `toBe` is how an identity guard gets quietly made redundant.
- **Never invent a value.** If the fixture needs something the CSV does not have, **stop and report**.
- Shared axe helper only (`features/axe.e2e-helper.js`); never a new inline `AxeBuilder` block.
- **State what the code now does differently before believing any green mutation run.** An inert
  mutation has falsely *confirmed* a finding on this build as recently as pp-078.
- `npm run format` before finishing. **Do not commit** — the orchestrator lands it.

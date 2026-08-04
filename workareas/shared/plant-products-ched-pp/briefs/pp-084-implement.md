# pp-084 — pin the commodities fixture's provenance-bearing fields, not just EPPO order

This brief OVERRIDES the generic `implement.md`. **One file:**
`src/server/app/sets/plant-products/services/commodities/commodities.test.js`

**Test-only.** No fixture data changes, no production changes. You are strengthening a pin, not
adding data.

## The gap, verified

`commodities.test.js:92-97` asserts `speciesFor('0808108010')` by **reference identity**
(`toBe(SPECIES_BY_CODE['0808108010'])`), **length 3**, **distinct EPPO codes**, and **exact EPPO
order**. It never asserts `genusAndSpecies` or `speciesId` for any of the three.

Those values appear **only** in `fixture.js` and a prose note in `docs/README.md`. So a typo in a
`speciesId`, or MABSD's values duplicated into MABAN, **ships green**. On a data fixture whose entire
claim to trust is that every value came from a real source, the provenance-bearing fields are exactly
the ones left unpinned.

**Fix:** assert `speciesFor('0808108010')` deep-equals the complete ordered array of all three
objects, **every field included**.

## ⚠ Hazard 1 — KEEP the identity assertion. Do not replace it

`expect(species).toBe(SPECIES_BY_CODE['0808108010'])` is **load-bearing**: it proves `speciesFor`
returns **the real exported fixture** rather than a copy or a re-declaration. A `toEqual` against a
literal array would pass even if `speciesFor` built a fresh object — **the exact failure mode that
let pp-038 ship three defects green.**

**Add the deep equality ALONGSIDE it. Both assertions stay.**

## ⚠ Hazard 2 — do NOT extend literal pins to the class map or MABSD's varieties

The plan's fourth acceptance criterion invites extending the same treatment to other commodities
minted in pp-014 "with stated provenance". **Read this before acting on it.**

**pp-086 has VERIFIED that part of pp-014's stated-provenance claim does not hold.** Three data
defects are already raised and will change that data:

1. `CLASSES_BY_EPPO` is keyed by **species**; the source keys class by **commodity**.
2. The only class entry (CIDAC) is **unsupported** — no commodity code we ship has any class rows.
3. **MABSD's varieties belong to commodity `0808108090`, not the `0808108010` we attached them to.**

**So pinning the class map or MABSD's varieties literally would pin data that is known-wrong and is
about to change**, and would put a test in pp-086's way. **Leave both alone.**

**In scope:** the three species under `0808108010` — `MABAN`, `MABSD`, `MABZU`. pp-077 verified
these against the IPAFFS source directly (`species.csv` lines 1002/1006/1007 and
`certification_nomenclature.csv` lines 533/542/546, all three sharing one nomenclature id), so they
are the part of the fixture whose provenance genuinely holds. **Note pp-086 moves *varieties*, not
species — these three stay on `0808108010`, so there is no conflict.**

Extending full-field pins to **other commodities' species** is fine **only** where you can state the
provenance. If you cannot, **say which you left and why** — do not pin data you cannot vouch for, and
do not "consider" your way into pinning the whole fixture.

## ⚠ Hazard 3 — this is a pin, not new data

Every expected value must be **copied from the fixture as it stands**. **NEVER INVENT DATA** — eight
increments on this build have stopped rather than fabricate and every one was right. If a value looks
wrong to you, **report it; do not correct it here.** A correction is a data increment with provenance,
not a test edit.

## Decisive mutations to run and report, by test name

1. Change one digit of a `speciesId` → must fail **by name**.
2. **Swap `genusAndSpecies` between two of the three species**, leaving both values present and the
   EPPO order untouched → must fail. This is the sharper mutation: every value is still present and
   only the **pairing** is wrong, which the existing order-and-set assertions cannot see. It is the
   same shape that caught pp-080's card/row transposition.

**Say what the code now does differently before believing either result.** A green-then-red run is
only evidence if the mutation actually changed behaviour — got wrong three times on this build.
Restore byte-identically and confirm an empty diff against the index.

## Baselines — I ran these myself at `bcaf20a8`. Re-run them

- plant unit `test:plant-products` — **698 (58 files)**
- `npm test` — **2,336 passed / 8 skipped (217 files)**
- `test:live-animals` — **559**. Movement is a REGRESSION.
- `lint:arch` — **0/0, 671 modules, 2,131 dependencies**; shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a` unchanged
- plant Playwright — **257** (`PORT=3201`)

**Do not predict a `lint:arch` module count for a `.test.js` edit** — `.dependency-cruiser.cjs:181`
excludes `\.test\.js$`. **If anything here contradicts the source, the source wins — say so with file
and line rather than making the code match my number.** Five orchestrator briefs on this build have
been wrong and the implementor was right every time.

## Verification

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint:arch
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Leave the work **staged, not committed.** Report both mutation results by test name, every count,
which commodities you pinned and which you deliberately left with the reason, and **anything you
could not verify yourself.**

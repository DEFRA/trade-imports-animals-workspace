# pp-093 — fix pass. ONE change to `mapper.test.js`.

**FRONTEND repo.** **Your work is already staged across three files and it is correct — `git status`
first and preserve all of it.** The 16 `BX`/`PCS` substitutions and the three `'NONE'` → real-UUID
replacements all stay. **Your wider audit was the most valuable part of the increment** — it found a
third surviving copy of an invention that pp-086 and pp-092 had already corrected in two other places,
and nothing could have gone red to reveal it.

## The one thing left

The test is called **'round-trips every modelled commodity leaf through three collection levels'**
(`mapper.test.js:188`). **It claims to be representative** — and its fixture is now
`commoditySelection: '08059000'` with a CIDAC variety carrying `varietyClass: 'CLASS_I'`.

That combination cannot exist. I checked `services/commodities/fixture.js:242-244`:
`CLASSES_BY_COMMODITY` contains **only `'0808108090'`**, and pp-086 moved `varietyClass.applyTo` to be
gated on `commoditySelection`, so the engine's purge strips a class from `08059000` before the mapper
ever sees it.

You made the variety **id** real and left an **impossible class** beside it. That reads as complete and
is not — the same class the rest of this increment exists to reduce.

## The change, with every value already traced to the fixture by me

Move that one commodity line to the class-bearing commodity. **Keep one `CLASS_I` entry and one `null`
entry** — the null/non-null pair is the point of the test and must survive.

| Field | Value | Source |
|---|---|---|
| `commoditySelection` | `'0808108090'` | `fixture.js:57` |
| `eppoCode` | `'MABSD'` | `fixture.js:173` |
| `genusAndSpecies` | `'Malus domestica'` | `fixture.js:174` |
| `speciesId` | `'1391442'` | `fixture.js:175` |
| `variety` | `'03107EFA-9BCD-1089-565E-B28F73994DEC'` (McIntosh Red) | `fixture.js:227` |
| `varietyClass` | `'CLASS_I'` is applicable here | `fixture.js:243` |

**Read those lines yourself and confirm before typing them.** If any disagrees with what I have written,
**stop and report it** — my briefs have been wrong nine times tonight and every time the implementor was
right.

## ⚠ WHAT TO LEAVE ALONE, AND WHY

**`commodities-model.test.js` also pairs `08059000` with a class. Do NOT change it.** The review checked
and that one is **deliberate stale input** — the test exists to prove the class is **purged**. Changing
it would delete a real negative case. This is the difference between a fixture that misrepresents
reality and a fixture that deliberately supplies an invalid input to prove it is rejected.

Also leave the second mapper fixture (~line 272, the transient-key case) as it is: it has a variety with
**no** `varietyClass`, which is a legitimate pp-078 state.

## Constraints

- **Plant unit count stays at 728.** No test added, deleted or renamed. Report it either way.
- `npm run test:plant-products`, `npm test`, `npm run test:live-animals` (**559**), `npm run lint`,
  `npm run lint:arch`, then `npm run format` before reporting.
- **live-animals at 559 is necessary but NOT sufficient** — say so.
- No production code. **Stage, do not commit.** Never run `sonar`.

## Prove it

Report the mapper suite's pass count before and after. **If any assertion changes meaning rather than
just its input values, say so explicitly** — this is meant to be a change of representative data, not a
change of what the test discriminates. If moving the commodity makes some assertion vacuous, that is a
finding worth more than a green run.

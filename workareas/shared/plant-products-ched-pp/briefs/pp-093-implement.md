# pp-093 — replace invented package and quantity codes with the ones the system produces

This brief OVERRIDES the generic `implement.md`. **FRONTEND repo**, branch
`spike/trace-to-requirements`. Small and mechanical — the care goes into what you check, not what you
type.

**Baseline I ran myself just now: plant unit `test:plant-products` = 728 (58 files).** It must still be
**728** when you finish.

## The finding

Sixteen sites across three files assert `packageType: 'BX'` and `quantityType: 'PCS'`.

The set's own reference services export different values:
- `services/reference/package-types.js:8` → `{ value: 'BOX', text: 'Box' }`
- `services/reference/quantity-types.js:11` → `{ value: 'PIECES', text: 'Pieces' }`

The mongo seed and the tests repo's API journey both use the **real** codes. So the frontend's unit
fixtures and the data the system actually produces have never agreed on these two fields.

The sites, from my own grep:
- `journeys/linear/flow/task-rows.test.js` — twelve literals, around lines 362/364, 546/548, 643/645,
  753/755, 911/913, 984/986
- `obligations/sections/commodities/commodities-model.test.js` — around 127 and 129
- `services/records/mapper/mapper.test.js` — around 195 and 197

## ⚠ THIS IS NOT A BEHAVIOURAL FIX AND THE REPORT MUST NOT CLAIM IT IS

The backend fields are plain `String` (`CommodityLine.java:20,22`), the frontend mappers pass the values
through unconverted, and task-row completeness is presence-based. **Nothing is broken at runtime today.**

What is broken is trust. This is the tenth instance of this build's dominant failure mode — a
hand-authored fixture standing in for what the system produces — and it sits in the **mapper tests**,
which are exactly where a future reader would go to learn what a real commodity line contains.

**If any assertion changes behaviour when you substitute the real codes, STOP and report it.** That would
mean a code value is load-bearing somewhere the plan has not accounted for, and it is a finding, not
something to work around.

## ⚠ THE REAL VALUE IS THE AUDIT, NOT THE SUBSTITUTION

**I found these by grepping for `'BX'` and `'PCS'` — a search that can only find what I already
suspected.** On this build the blindness has twice been in the query rather than the code.

So: in those three files, **check every code-like literal against the service that owns it** — country
codes against `countries.js`, commodity codes against `services/commodities/fixture.js`, EPPO codes and
`speciesId` values against the same fixture, document types against `document-types.js`, gross-volume
units against `gross-volume-units.js`, BCPs and control points against `bcps.js`, transport means against
`transport-options.js`, purposes against `purposes.js`.

**Report what you audited and what you found, including "these all check out".** If you find more
invented values, fix them in the same pass and list them. If you run out of confidence about a value's
provenance, say so rather than guessing — **stopping carries no penalty; inventing one row does.**

## Constraints

- **Copy every replacement from the reference service file itself.** Not from memory, and **not from
  the tests repo's `domain/plant-products/constants/`** — that is a hand-maintained duplicate which has
  already drifted once (pp-092) and is not authoritative.
- **The plant unit count must stay at 728.** No test added, deleted or renamed. Report the count and,
  if it moves at all, explain it: `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- **No structural pin in this increment.** I planned one and removed it: the shared fixture it would
  guard is created by pp-041, and a pin aimed at the reference services alone would just restate them.
  **Do not invent a weaker pin to fill the gap** — pp-041 carries that obligation now.
- `test:live-animals` must stay at **559**. Necessary but **not sufficient** — say so rather than
  treating it as proof you stayed inside the set.
- Production code outside `sets/plant-products/` stays off limits. A forced change is `ok:false` with
  evidence.
- `npm run format` before you report; the pre-commit hook runs `format:check && lint && test`.
- **Stage, do not commit.** Never run `sonar`.

## Verification

```
npm run test:plant-products      # 728, unchanged
npm test                         # 2,366 passed / 8 skipped, 217 files
npm run test:live-animals        # 559, unchanged
npm run lint
npm run lint:arch                # 0/0 — and note it does NOT move for a .test.js change
npm run format
```

## The mutation I expect

Revert **one** substitution back to its invented value and show the suite is **still green**. That is
the point: it demonstrates the codes are genuinely inert, which is exactly why this drifted unnoticed
and why the report must not overclaim. **If reverting one DOES turn something red, that is a much more
interesting result — report it prominently.**

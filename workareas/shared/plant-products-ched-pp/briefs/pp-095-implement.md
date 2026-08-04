# pp-095 — the delivery-address page withholds the UK subdivisions

This brief OVERRIDES the generic `implement.md`. **FRONTEND repo**, branch
`spike/trace-to-requirements`. Playwright needs **`PORT=3201`**.

## The finding, traced by me

`traders-addresses.controller.js` builds its country options from **`countryOptions()` alone** — at
**:121** for rendering and again at **:270** for validation
(`const countryCodes = countryOptions().map(({ value }) => value)`). `countryOptions()` explicitly
filters the UK subdivisions out (`countries.js:272-276`).

**Every other plant page that renders a country selector composes BOTH lists:**

| Page | Evidence |
|---|---|
| consignor-create | `:100-102` spreads `ukSubdivisionOptions()` then `countryOptions()` |
| origin-of-import | `:36-43` |
| country-of-origin | `:30-37` |
| dashboard filter | `:56-65`, grouped with optgroups |

**So this is one page diverging from four siblings, not a uniform data limitation.** The standing note
in the workarea says "you cannot enter a UK delivery address", which reads as though the data is absent.
It is not — `ukSubdivisionOptions()` exists and four pages already use it.

**And it is backwards from the domain.** On a service for importing goods **into** the UK, the page that
most needs UK addresses is the **delivery** address, and it is the one page withholding them — while the
**origin** pages, where a UK value is the unusual case, offer them. (UK origin is genuinely reachable:
`reasonForImport` carries `RE_ENTRY` and `RE_CONFORMITY_CHECK`.)

**Not a transposition question.** live-animals does not consume these services at all — I checked — so
there is no original to diverge from.

## ⚠ THE DEFECT SHAPE IS THE DUPLICATION, NOT THE MISSING OPTIONS

The offered list and the validated list are written **twice from the same call**. Fixing only the
rendering would leave a page that **shows an option it then rejects** — strictly worse than today.

**Derive both from ONE expression.** That is the acceptance criterion that matters; the extra options
are the symptom.

## What to build

1. Offer the UK subdivisions the way the siblings do. Mirror whichever grouping this page's markup can
   carry — read `traders-addresses.njk` before deciding, and follow the GOV.UK toolbox (no custom CSS).
2. Make the validation list the same list, from the same expression.
3. Pin it: a UK subdivision is **offered** and **accepted**; a genuinely forged code is **still
   rejected** through the same canonical error. **The discriminating case is a UK subdivision
   specifically** — a test using `FR` passes today and proves nothing.
4. The structural pin (`services/reference/countries.test.js`, which **already exists** — edit it):
   assert that every plant page rendering a country selector offers the same vocabulary, so a sixth page
   cannot diverge silently. **State its exemption explicitly.** ⚠ **If no honest mechanism exists that
   is stronger than restating the reference service, say so and report `ok:false` on that file rather
   than shipping a pin that reads stronger than it is.** A stated gap beats a decorative test.

## ⚠ DO NOT

- **Do not touch the four sibling pages.** They are the reference, not the target.
- **Do not add a plain `GB` code.** `COUNTRIES` has none. That is reference data and it is Sam's call —
  inventing a code is the exact failure mode this build has found ten times. If you believe the fix is
  incomplete without it, say so in `notes`.
- **Do not touch live-animals.**

## Verification

Baselines to re-establish yourself first — plant unit was **729** (58 files) and plant Playwright
`PORT=3201 test:features:plant-products` was **259** at my last measurement, before pp-041 and pp-064.

```
npm run test:plant-products
npm test
npm run lint
npm run lint:arch
PORT=3201 npm run test:features:plant-products
npm run test:live-animals      # 559 — necessary but NOT sufficient, say so
npm run format
```

Explain any test-count movement: `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
**Stage, do not commit.** Never run `sonar`.

## The mutation I expect, by failing test NAME

Revert the validation list to `countryOptions()` while leaving the rendered list widened — the page then
offers an option it rejects, which is the precise defect shape. **A test must fail.** If none does, the
one-expression criterion is not actually pinned and you have more to do.

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME.** My briefs have been wrong ten times tonight and
every single time the implementor or reviewer was right. If the evidence above does not hold when you
look, say so rather than building to my description of the world.

# pp-020 — increment-specific guidance (read alongside implement.md)

Increment id: **pp-020** — "about-the-consignment — main reason for import".
Repo: **frontend** (`repos/trade-imports-animals-frontend`), branch `spike/trace-to-requirements`.

Full spec in `backlog.json` under this id. Read it there; it is the contract. This adds where it is
wrong — and on this increment it is wrong in a way that could destroy verified work.

Spoke 2. One page, one obligation, one mandatory hub row.

---

## 1. ⚠ DO NOT CREATE `services/reference/purposes.js` — IT ALREADY EXISTS

`filesToTouch` marks it `action: "create"`. **It was already delivered by pp-016** (commit
`0d977449`), with stated provenance — codes byte-matched against the backend `ReasonForImport` enum,
labels taken character-exact from the trace, and a test suite pinning count, uniqueness, code shape
and enum order.

**Creating or overwriting it would replace a verified fixture with an unverified one.** Do not. The
plan itself half-knew this — its own open question 4 says "pp-016's planner must treat
services/reference/purposes.js as already landed" — but the ordering went the other way and pp-016
landed first.

**There is a real API mismatch to resolve, and it is yours to decide and report.** The acceptance
criteria assume a `purposes.reasons()` function and say the `oneOf` must be built "at request time,
not a frozen module-level list". What pp-016 actually ships is:

```js
export const purposeOptions   // frozen array of { value, text }
export const purposeLabel     // (code) => text | undefined
```

Resolve it the cheap way: **consume `purposeOptions` as it is** and build the `oneOf` from it inside
the request path rather than hoisting it into a module-level constant. Do not add a `reasons()`
wrapper just to match the plan's wording, and **do not edit pp-016's module** unless something is
genuinely missing — if it is, say what and why rather than changing it silently. Report whichever
way you go.

Note what the "not a frozen module-level list" rule is actually protecting against: the pp-058
convention tripwire rejects **set-keyed accessors captured at module load or first boot**. A frozen
reference-data array is not set-keyed and is safe to import; what must not happen is a validator
capturing set-scoped state before the set context exists.

## 2. `filesToTouch` IS A HYPOTHESIS — ten cases and counting

Every increment this session has found the plan wrong about existing code. pp-019 alone had five
forced files missing. Beyond purposes.js above, several entries here assume shapes that pp-018 and
pp-019 have changed since this was written — `features/index.js`, `flow/flow.js`, `task-rows.js`,
the hub controller and copy, and all three mapper files have all moved twice today. **Open each
first**, and report anything already delivered, missing, or extra.

Note also that this increment does **not** depend on pp-018, but pp-018 and pp-019 have both landed,
so the origin section and its task row already exist. Section insertion must be **order-aware** —
canonical §2.3 order governs, and purpose must slot correctly relative to origin rather than being
appended.

## 3. Test accounting — non-negotiable

**No test may be deleted or replaced without being reported.** If any count moves down, name every
removed test and justify it. If a rewrite orphans a case, **move it and say where**. A test that
cannot pass because behaviour deliberately changed is a stop-and-report, never a deletion. pp-017
silently dropped three browser tests; pp-018 and pp-019 reported in full, which is the standard.

## 4. Pins to MUTATION-PROVE

Construct the violation, watch it fail, restore byte-identically, report the exact message.

- **c-006 — the normalised enum.** The IPAFFS wire values `internalmarket` / `import` / `reconformity`
  must appear nowhere. This ruling exists because the legacy value `import` means **Re-entry** — a
  documented cross-CHED trap where a wrong-but-plausible value silently means something else. Prove
  a wire value is rejected, and assert its absence against the **rendered DOM and the committed
  value**, not by grepping source for a string (pp-057's lesson: an exact-literal grep proves the
  literal absent, not the class).
- **Out-of-enum rejection.** A crafted POST outside the three values takes the same 400 path — a
  case no UI-driven test can reach.
- **The row blocks readiness.** Prove `readyForCheckYourAnswers` is false with purpose incomplete and
  true once complete. Note pp-018 found this pin passing *vacuously* before it had real rows; leave
  it strictly discriminating.
- **c-014 — the legend has a real accessible name.** pp-017 proved an empty legend passes **both axe
  scans at serious/critical** while an explicit accessible-name assertion catches it. Axe is
  necessary, not sufficient. Assert the computed accessible name of the radio group directly, and
  mutate the legend to confirm your assertion — not just axe — goes red.
- **Hint wiring.** Unique per-item hint ids and correct `aria-describedby`. The duplicate
  re-entry-hint id is a real IPAFFS defect being fixed, not ported, so pin it.

## 5. Fixes, not ports

The spec lists seven IPAFFS defects to fix rather than reproduce: legendless fieldset, duplicate
hint id, missing `aria-describedby`, vestigial `govuk-radios--conditional`, a custom `purpose`
class, bold-label overrides, and the `href='#'` back link. Use the plain `govukRadios` macro with no
custom item classes. Stay inside the govuk-frontend toolbox — no custom CSS.

The third option, 'For import re-conformity check', is **deliberately hintless** — trace-confirmed
IPAFFS state, and a carried content-design question, not an omission to fix.

Copy boundary: option labels come from the fixture; the caption, legend, hints, button and error
string are bilingual copy. `copy.cy.js` structure-identical and genuinely Welsh.

## 6. A structural check that the wiring is real

`lint:arch` is **0 errors / 7 warnings** — `bcps.js` plus the six pp-016 vocabularies. This page
consumes `purposes.js`, so **that warning should clear, leaving 6**. If it does not, the fixture is
not actually wired in — say so plainly rather than explaining it away. This is how pp-018 proved it
really consumed `countries.js`. Do not "fix" the remaining warnings.

## 7. Hygiene

- Baseline first: `npm run test:plant-products`, expect **182**. Red baseline = stop and report.
- Every edit inside `sets/plant-products/` except `contract.plant-products.test.js`. If an L1 file's
  assertion encodes the old shape, the **standing ruling from pp-019 applies**: update it, never
  weaken it, never truncate a journey to dodge a moved assertion, and report before/after.
- Baseline SHA-1 stays `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.
- `npm run format` before finishing. **Do not commit** — the orchestrator lands it.
- Never invent data. Genuinely blocked → `ok:false` with what you looked for and where.

## 8. Verification ladder

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products   # BASELINE, expect 182
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint
PORT=3050 npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:features:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Report **numbers**: plant units, full `npm test`, `test:live-animals`, plant Playwright, lint:arch
errors/warnings. Baseline: plant units **182**, `npm test` **1,767 passed / 8 skipped**,
`test:live-animals` **559** (must stay 559), plant Playwright **28**, lint:arch **0 / 7** (expect
**0 / 6** after).

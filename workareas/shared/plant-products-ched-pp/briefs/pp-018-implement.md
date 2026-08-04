# pp-018 — increment-specific guidance (read alongside implement.md)

Increment id: **pp-018** — "country-of-origin — origin of the plants".
Repo: **frontend** (`repos/trade-imports-animals-frontend`), branch `spike/trace-to-requirements`.

Full spec in `backlog.json` under this id — files, acceptance criteria, the ten headless decisions,
verification ladder. Read it there; it is the contract. This file adds what the plan cannot: where
it is likely wrong, what must be proved, and two rulings already made so you do not have to stop.

**This is the set's first obligation-bearing page.** The plant manifest has been EMPTY until now.
Everything about obligation registration, dispatch coverage, task rows and hub groups happens here
for the first time — 26 files. Get it right and eleven more spokes follow it.

---

## 1. Two rulings already made — do NOT stop for these

**(a) If an L1 file's expectation encodes plant's EMPTY `enforcedAtContinue`, update it.**
This increment deliberately changes `policy.enforcedAtContinue` from `[]` to `['countryOfOrigin']`.
`co-residency.test.js` asserts *divergent* `enforcedAtContinue` across the two sets with both
manifests loaded. Updating that expected value is **permitted and in scope** — but it is an
assertion change, not a payload change, so it comes with conditions: change only the expected value,
**keep the assertion's discriminating intent** (the two sets must still be proved to differ — if
your edit would make them equal or would make the assertion pass under a single shared manifest,
stop and report), and **state in your report exactly what you changed and why**. The equivalent
trap cost pp-017 a full extra round trip.

**(b) `contract.plant-products.test.js` is in scope** — it is named in `filesToTouch`.

Everything else outside `src/server/app/sets/plant-products/` remains off limits. If you believe
another change is forced, **stop at `ok:false` and make the argument with evidence** — do not make it.

## 2. `filesToTouch` IS A HYPOTHESIS — and this one has 26 entries

Fourteen are marked `edit` and assume pp-007/pp-009/pp-010/pp-017 left particular shapes behind.
**Open each before planning.** In pp-017, four of nine "edit" targets already existed in a different
form than the plan described and one marked `create` was already a skeleton. In pp-009, five planned
production edits were already delivered and the implementor made none — correctly — but did not say
so. Follow the real code, and **report plainly wherever you deliver less than the plan lists, or
something already exists.** Under-delivery is fine; silent under-delivery is not.

## 3. REPORT EVERY TEST COUNT THAT MOVES — especially downward

**This is new, and it is because of what pp-017 did.** Its rewrite deleted three browser-level tests
and reported `ok:true` without mentioning it; the plant Playwright count fell 13 → 11 and the
unexplained drop is the only reason it was caught. All three had to be restored.

So: **never delete or replace a test without saying so.** If any count goes down, the report must
name every removed test and justify it. If you rewrite a spec and some of its cases are no longer
about that spec's subject, **move them, do not delete them** — and say where they went. A test you
cannot make pass because behaviour deliberately changed is a **stop-and-report**, never a deletion.

## 4. The pins that must be MUTATION-PROVED

Construct the violation, watch it fail, restore byte-identically, **report the exact message**. If a
mutation does not turn the suite red, the test is decorative — fix it and say so.

- **The stored value is the CODE, never the label.** Commit `'France'` instead of `'FR'` and prove
  something rejects it. A page that stores labels renders perfectly and only breaks at the backend.
- **The obligation is registered end-to-end.** Remove the obligation from the manifest (or the
  binding from the feature bundle) and prove boot assertions / dispatch coverage go red rather than
  silently skipping the field. This is the first time the plant manifest is non-empty — if nothing
  fails, registration is not actually load-bearing and you have found something important.
- **`enforcedAtContinue` is real.** Empty it back to `[]` and prove a test fails.
- **The out-of-list POST is rejected**, like pp-017's crafted-token case — a path no UI test reaches.

Note what pp-017 proved about axe, because it applies here too: **an empty fieldset legend passed
both axe scans at serious/critical** while an explicit accessible-name assertion caught it. Axe is
necessary, not sufficient. Assert the accessible name of the select and the error-summary link
target directly.

## 5. Things this increment can quietly get wrong

- **The pp-010 defect.** A clone or harness that does not enter its own set context reads the
  **live-animals** manifest (49 obligations) instead of plant's. Until now plant's was empty so the
  symptom was invisible; from this increment on, a context bug shows up as the *wrong* obligations
  rather than none. If anything reads a manifest, make sure it enters the plant set context first.
- **Copy boundary.** Country names come from the pp-013 fixture (reference data). The label
  'Country of origin', the caption, H1, placeholder 'Select a country', button and the error string
  are **bilingual copy** in `copy.en.js`/`copy.cy.js`. No label may leak into the data module.
  `copy.cy.js` must be structure-identical and genuinely Welsh — an identical Welsh/English leaf
  fails copy-parity.
- **c-012:** IE is labelled 'Republic of Ireland'. **c-018:** exactly one canonical error string.
- Stay in the **govuk-frontend toolbox** — govuk-* classes only, no custom CSS. The UK optgroup is
  hand-written markup by decision (2); keep every class `govuk-*`.

## 6. A signal that tells you the wiring worked

`lint:arch` currently emits **8 advisory orphan warnings**, 0 errors. `countries.js` is one of them —
it is orphaned because no page consumes it. **This increment consumes it, so that warning should
disappear and leave 7.** If it does not, the fixture is not actually wired in and something is
importing a copy or nothing at all. Report the count either way. The other seven are expected; do
not "fix" them.

## 7. Hygiene

- Baseline first: `npm run test:plant-products`, expect **159**. Red baseline = stop and report.
- Do not regenerate `.dependency-cruiser-known-violations.json` — shasum stays
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.
- `npm run format` before finishing. **Do not commit** — the orchestrator lands it.
- Never invent data. If a required fact is genuinely unavailable, stop at `ok:false` and say what
  you could not find and where you looked. Stopping twice carries no penalty.

## 8. Verification ladder (from the increment)

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products   # BASELINE, expect 159
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint
PORT=3050 npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:features:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Report **numbers**: plant units, full `npm test`, `test:live-animals`, plant Playwright, and
lint:arch errors/warnings. Current baseline: plant units **159**, `npm test` **1,739 passed /
8 skipped**, `test:live-animals` **559** (must stay 559), plant Playwright **14**, lint:arch
**0 errors / 8 warnings**.

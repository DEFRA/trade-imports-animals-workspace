# pp-019 — increment-specific guidance (read alongside implement.md)

Increment id: **pp-019** — "origin-of-import — countries + local reference".
Repo: **frontend** (`repos/trade-imports-animals-frontend`), branch `spike/trace-to-requirements`.

Full spec in `backlog.json` under this id — files, acceptance criteria, the seven headless decisions,
open questions. Read it there; it is the contract. This adds where it is likely wrong, what must be
proved, and a standing ruling so you do not stop for something already decided.

Second page of the origin section. pp-018 created the section, the obligation, the task row and the
hub group; this joins them as a second page in the same feature group.

---

## 1. STANDING RULING — L1 shape assertions are IN SCOPE

The last two increments each stopped on this and each was ruled in. So, once and for all:

**When this increment deliberately changes the set's shape, any assertion in an app-root (L1) file
that encodes the OLD shape is in scope to update.** That covers `indexed.plant-products.test.js`
(obligation nodes, section ids, readiness), `routes-plant-products.test.js` (the journey redirect
chain), `co-residency.test.js` (`enforcedAtContinue` and per-set divergence), and
`contract.plant-products.test.js` (named in `filesToTouch`).

Four conditions, all of which I will check:

1. **Update the expected value; never weaken the assertion.** If your edit would make a pin unable
   to fail, or make the two sets indistinguishable, stop and report instead.
2. **Never truncate a journey to dodge a moved assertion.** `routes-plant-products.test.js` is the
   gateway boot proof — if a redirect now lands somewhere new, follow the journey THROUGH to the hub
   and keep the existing end-state assertions running. pp-018 did this correctly; copy that.
3. **Prefer the strictly stronger form.** pp-018's readiness pin passed vacuously (`every([])` is
   true); re-pinned as false-then-true it can actually fail. If you touch a pin, leave it more
   discriminating than you found it.
4. **Report every changed assertion with its before and after.**

Production code outside `src/server/app/sets/plant-products/` remains off limits. If a production
change looks forced, stop at `ok:false` and argue it with evidence.

## 2. `filesToTouch` IS A HYPOTHESIS

Thirteen of nineteen are `edit`, assuming shapes pp-018 left behind hours ago. **Open each first.**
pp-018's own plan was wrong twice — it claimed `contract.plant-products.test.js` had zero cases when
it already held import-type, and its 26-file list omitted forced local edits, ending at 32. That is
the eighth stale-plan case in this build. Follow the real code; report anything already delivered,
missing, or extra.

## 3. Test accounting — the rule that caught pp-017

**No test may be deleted or replaced without being reported.** If any count moves downward, name
every removed test and justify it. If a rewrite leaves a case that no longer belongs, **move it and
say where** — never delete. A test you cannot make pass because behaviour deliberately changed is a
stop-and-report. pp-017 silently dropped three browser tests and the only tell was an unexplained
13 → 11; pp-018 reported its accounting in full, which is the standard.

## 4. Pins to MUTATION-PROVE

Construct the violation, watch it fail, restore byte-identically, report the exact message.

- **Single-owner dispatch.** `countryOfOrigin` belongs to pp-018's page and must NOT be collected
  here. Add it to this page's collected fields and prove `buildDispatch` rejects the second owner.
  If it does not reject, the single-owner rule is not actually enforced and that is a finding worth
  more than this increment.
- **Row completion needs BOTH countries.** Prove the origin row is not Completed with only one of
  `countryOfOrigin` / `countryOfConsignment`.
- **The optional field never blocks.** Prove the row completes with `internalReference` absent —
  and that making it block would fail.
- **Code, never label.** Same as pp-018: commit `'France'` rather than `'FR'` and prove rejection.
- **The 30-character cap.** This is a deliberate CHED-PP-specific divergence from the default 58, so
  prove the boundary: 30 accepted, 31 rejected with the verbatim string.

Remember pp-017's finding: **an empty legend passed both axe scans at serious/critical.** Axe is
necessary, not sufficient. This page has no fieldset — three labelled controls under one H1 — so
assert each control's accessible name and the error-summary link targets directly.

## 5. Easy things to get wrong here

- **Do not re-display country of origin.** Decision (3): the legacy page-2 re-display is a redundant
  pass-through, page-1 is the sole write point, and the platform forbids re-collection. Ask once.
- **Do not build** the CHED-P conformance / change-after-BCP radios, the region-code widget, or
  customs-reference-number. All are other-CHED or uncovered surface.
- **Do not reproduce two known legacy defects**: the disabled-placeholder asymmetry and the
  `href='#'` back link. The back link is a real server-rendered href.
- **Error copy matches the visible label** — 'Select the country from where consigned', fixing the
  legacy label/error mismatch. One canonical string (c-018). IE is 'Republic of Ireland' (c-012).
- **Copy boundary**: country names are fixture data; the label, caption, H1, hint and both error
  strings are bilingual copy. `copy.cy.js` structure-identical and genuinely Welsh.

## 6. Hygiene

- Baseline first: `npm run test:plant-products`, expect **170**. Red baseline = stop and report.
- `lint:arch` is **0 errors / 7 warnings** (bcps.js + the six pp-016 vocabularies). This increment
  consumes no new fixture — `countries.js` is already consumed — so expect **7 still**. Report it.
  Do not "fix" the warnings.
- Baseline SHA-1 stays `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.
- `npm run format` before finishing. **Do not commit** — the orchestrator lands it.
- Never invent data. Genuinely missing fact → `ok:false` with where you looked. Stopping is free.

## 7. Verification ladder

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products   # BASELINE, expect 170
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint
PORT=3050 npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:features:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Report **numbers**: plant units, full `npm test`, `test:live-animals`, plant Playwright, lint:arch
errors/warnings. Baseline: plant units **170**, `npm test` **1,754 passed / 8 skipped**,
`test:live-animals` **559** (must stay 559), plant Playwright **20**, lint:arch **0 / 7**.

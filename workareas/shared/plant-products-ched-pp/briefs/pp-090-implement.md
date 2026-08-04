# pp-090 — three upstream IPAFFS copy defects

This brief **OVERRIDES** the generic `implement.md`. Repo: **trade-imports-animals-frontend**, branch
`spike/trace-to-requirements`, clean at **`311b8c7f`**. Rollback is `git stash push -u`. **Stage, do not
commit. Never run `sonar`.**

**Baselines I measured myself minutes ago — re-establish and report yours:**
plant unit **784** · `npm test` **2,434 / 8 skipped** (224 files) · `test:live-animals` **559** ·
`PORT=3201 test:features:plant-products` **264** · `lint:arch` 0 (**683** modules, **2,189**
dependencies) · shasum `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

## What this is, and why it is not a tidy-up

Three defects in the declaration copy, **faithfully transcribed from live IPAFFS**. The trace
(`workareas/shared/trace-requirements/ched-pp/pages/declaration.json`) records that all 32 declaration
strings were diffed **character by character** against real rendered IPAFFS output, so these are
**upstream defects correctly copied — not our transcription errors.**

⚠ **THE THING THAT MATTERS MOST IS NOT THE STRINGS.** Trace line 484 is a COPY DEFECTS note saying they
were transcribed verbatim, deliberately not tidied, and **"must NOT be carried into the rebuild
unreviewed"** — that the fix is *"a content-designer + legal decision, NOT a developer tidy-up"*.
**pp-039 carried all three in without that review happening.** This increment exists because an
instruction in the requirements source was not honoured.

**Precedent:** pp-015 already ships the correct **Folkestone** where IPAFFS renders *Folkstone*, so the
build accepts deliberately differing from the live service on a copy defect.

## ✅ Sam delegated the call. These are my rulings — implement them, do not re-open them.

**(a) UNBALANCED QUOTES — FIX.** `legal.request` at `copy.en.js:61` **opens** a quotation, and each of
the four regulation bullets at `:63-66` **closes** it — so the quotation is closed four times and every
bullet ends with a stray `"`. Typographic, carries no legal meaning, and leaving it makes our copy look
broken. **Balance the quotation within each string.**

**(b) `used issued` at `:30` — DROP `issued`, KEEP `used`.** Reasoning, so you can check it rather than
take it: the surrounding bullets use *issued* for the **authority act** (*finalised CHEDs will be
issued*, *the issuance of a finalised CHED*, *the issue of or contents of any CHED*). This bullet is
about **scope of application** — *"except those to which it applies"* — which constrains the **holder**,
not the issuer. *"No finalised CHED shall be **used** in respect of any plants… except those to which it
applies"* is coherent; the *issued* reading is near-tautological and fits the *except* clause less
naturally.
⚠ **SAY IN YOUR NOTES THAT THIS IS A JUDGEMENT ON A LEGAL STRING AND IS ONE WORD TO REVERSE** if the
content owner disagrees.

**(c) SUBJECTLESS SCOTLAND CLAUSE — FIX.** `copy.en.js:20` reads *"For plants… entering into Scotland or
destined for a Control Point registered in Scotland will be subject to control verification procedures
by SASA."* **Give it a subject. Do not otherwise reword it** — this is a legal string and the minimum
edit is the correct edit.

**NOT IN SCOPE:** the review also raised the fragment *"Including payment for official controls…"*
speculatively. It is **not** in the trace's defect list, so **treat it as faithful and leave it.**

## ⚠ Three things that will bite

1. **WELSH MOVES WITH ENGLISH.** `copy.cy.js:64-67` carries the same four unbalanced closes, prefixed
   *"Y cyfeiriad cyfreithiol: "*. Copy-parity is enforced, so both bundles change together. **Give the
   Welsh the same treatment — do not literally re-translate a defect.** Welsh is a machine draft under
   the standing ruling; keep any banner comment intact.
2. **pp-083 PINNED THIS TEXT AS LITERAL CONTRACTUAL VALUES in `copy.test.js`.** Those pins are correct
   and deliberate — they stop the copy drifting — **but they now encode the defects.** Update the
   literals **in the same commit** as the copy, so no pin asserts a value the page no longer renders.
   ⚠ **This is the one way to get this increment badly wrong: change the copy and leave a pin asserting
   the old string, or "fix" the pin by loosening it to a regex.** Pins stay literal.
3. **⚠ ADD THE MISSING PIN.** The audit found `copy.test.js` has **no literal pin for the Scotland
   clause**, so (c) could be changed today with nothing going red. **Add one while the increment is
   open.**

## The mutations I expect, by failing test NAME

1. **Reintroduce one stray closing quote** in English. A named test must fail.
2. **Revert the Scotland clause to the subjectless version.** A named test must fail — **if none does,
   your new pin is not doing its job**, and that pin is half the point of this increment.

Report each verdict honestly, **including an INERT result**.

## Constraints

- **Production code outside `sets/plant-products/` is off limits.** **`test:live-animals` unchanged at
  559 is NECESSARY BUT NOT SUFFICIENT — say so.**
- copy-parity and copy-convention stay green. `npm run format`; `lint`/`lint:arch` green; shasum
  unchanged. **Any count that moves must be explained.** Playwright: **`PORT=3201`**.
- ⚠ **Do not restart or rebuild any container.**
- ⚠ **Record the decision durably in your notes** — the rebuild now DELIBERATELY differs from live
  IPAFFS on these strings, the same situation as pp-015's Folkestone spelling, and a future reader
  diffing against IPAFFS must find the reason rather than assume a transcription error.

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME.** If the source contradicts this brief — for
instance if a string is not where I say it is, or a pin already exists — **stop and report it.**

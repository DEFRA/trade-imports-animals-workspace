# pp-099 — remove the CSV radio

This brief **OVERRIDES** the generic `implement.md`. **TWO REPOS, both on `spike/trace-to-requirements`:**
frontend clean at **`ab6eabf5`**, tests repo clean at **`42cf947`**. Rollback is `git stash push -u`.
**Stage, do not commit. Never run `sonar`.**

**Baselines I measured myself — re-establish and report yours:**

- Frontend: `test:plant-products` **769** (63 files) · `npm test` **2,414 / 8 skipped** (222 files) ·
  `test:live-animals` **559** · `PORT=3201 test:features:plant-products` **265**, zero flaky ·
  `lint:arch` 0 violations (**681** modules, **2,184** dependencies) · shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`
- Tests repo: `test:plant-products` **91 collected, 87 passed, 4 flaky, 0 failures**. The four flaky are
  all pre-existing `commodities.spec.ts` cases and track **host load**, not the specs.

## What this is

`commodity-input-method.controller.js:23` ships `INPUT_METHODS = ['MANUAL', 'CSV']` with a real label, and
the POST falls straight through to `kit.nextTarget` with **no CSV branch** — so a user who picks CSV
lands in the manual commodity-search flow with **nothing telling them their choice was ignored**.
**Withdraw the option.** pp-042 (the CSV branch) is deferred with a ticket; when it is eventually built
it restores the radio. **This is not a decision that CSV is out of scope** — say so in your notes.

## ⚠⚠ A PLAN ERROR I FOUND AND CORRECTED — DO NOT DELETE THE CSV COPY KEYS

`filesToTouch` tells you to remove the CSV option label from `commodities/copy/copy.en.js` and
`copy.cy.js`. **Do NOT.** I traced it: `check-answers/view-model/cards/commodities.js:199` renders the
review-page value as
`commodityCopy.inputMethod.options[answers.commodityInputMethod]?.label` — **the same copy block**. A
notification that has **already persisted `CSV`** would then render a **blank** value on its review page.
`check-answers.test.js:426` pins that exact pairing (`['CSV', 'Upload from a CSV file']`).

**So: remove CSV from the RENDERED OPTION LIST only. The copy keys STAY**, because they label persisted
values as well as radios. If you think that is wrong, `ok:false` with evidence rather than deleting them.

## ⚠ THE PERSISTED VOCABULARY IS NOT YOURS TO CHANGE

Do **not** remove `CSV` from the obligation's allowed values without evidence that nothing holds it.
pp-022 committed `commodityInputMethod` as a real answer, the tests repo's API model types it as
`'MANUAL' | 'CSV' | null` (`domain/plant-products/models/api/notification.ts:76`), and the backend has
persisted it. **Removing a value an existing record could hold is a different and larger change.**
**If you find persisted CSV anywhere, STOP and report.**

## The half that makes this worth doing

**A forged CSV submission must be REJECTED through the canonical error**, not silently accepted and
ignored. Today it is accepted. Pin it. **Assert the FULL rendered option list, including any divider —
do not filter anything out** to make an assertion pass.

## ⚠ CROSS-REPO: TWO TESTS-REPO CASES WILL GO RED. I HAVE FOUND THEM FOR YOU.

`repos/trade-imports-animals-tests/tests/e2e/pages/plant-products/commodities.spec.ts`:

- **`:22`** — `expect(pages.commodityInputMethod.method('Upload from a CSV file')).toBeVisible()`
- **`:47-56`** — the case named *"CSV currently persists and continues to commodity search until the m5
  upload branch exists"*, which checks the radio, submits, and asserts
  `commodity?.inputMethod === 'CSV'`

**Both must be handled in this increment — do not leave the tests repo red.** The `:47` case documents
behaviour this increment deliberately removes, so it goes; `:22` must stop asserting a radio that no
longer exists. **Update them to assert what the system now does**, and say in your notes what you
removed, because that case is the record of a defect being closed.

## ⚠ DO NOT RESTART OR REBUILD ANY CONTAINER — A SEPARATE INVESTIGATION IS LIVE

An OIDC auth investigation is running against the live stack right now, and **a `docker restart`
disturbs live OIDC sessions**. The `:3100` test target therefore still serves pre-pp-099 source, so the
tests-repo specs **cannot be verified live in this session**.

**For the tests repo, run `typecheck`, `lint` and `format:check` ONLY. Do NOT run its browser lanes and
do NOT restart anything.** State plainly in your report that the tests-repo live run is **owed** — I will
run it myself once the auth work clears. **Do not pretend a lane you could not run was green.**

The **frontend** ladder runs entirely locally on `PORT=3201` and needs no container, so run it in full.

## Constraints

- **Production code outside `sets/plant-products/` is off limits** — `ok:false` with evidence.
  **`test:live-animals` unchanged at 559 is NECESSARY BUT NOT SUFFICIENT — say so.**
- Welsh moves with English and copy-parity is enforced by `copy.test.js`, which compares **leaf paths** —
  but per the correction above, **neither locale loses the CSV keys**.
- **L1 shape assertions: UPDATE, never WEAKEN.** `npm run format`; `lint`/`lint:arch` green; shasum
  unchanged. **Any count that moves must be explained** — several CSV cases exist in
  `commodity-input-method.controller.test.js` and `copy.test.js:33`, so a drop is expected and must be
  itemised.

## The mutations I expect, by failing test NAME

1. **Put `'CSV'` back into the rendered options.** The "exactly one option" test must fail by name.
2. **Accept a forged CSV submission** instead of rejecting it. The forged-submission test must fail —
   this is the one that matters, because today's behaviour IS silent acceptance.

Report each verdict honestly, **including an INERT result**.

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME.** If something here contradicts the source, **stop
and report it rather than making the source match my brief.** Never invent data.

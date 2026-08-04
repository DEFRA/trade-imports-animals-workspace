# pp-101 — amend and cancel-amend

This brief **OVERRIDES** the generic `implement.md`. Repo: **trade-imports-animals-frontend**, branch
`spike/trace-to-requirements`, clean at **`186370fa`** (pp-100 landed minutes ago). Rollback is
`git stash push -u`. **Stage, do not commit. Never run `sonar`.**

**This is the LAST of the three increments pp-045's unplanned stub was split into.** pp-045 (copy) and
pp-100 (soft delete) have both landed. **Read the current files** — see hazard 1.

**Baselines I measured myself on `186370fa`, minutes ago — re-establish and report yours:**

- `test:plant-products` **755** (61 files) · `npm test` **2,397 passed / 8 skipped** (220 files)
- `test:live-animals` **559** (65 files) — **a change here is a REGRESSION**
- `PORT=3201 test:features:plant-products` **264 passed**, zero flaky
- `lint:arch` 0 violations (**677** modules, **2,164** dependencies); shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`

## What to build

Two surfaces:

1. **The amend POST.** ⚠ **It does NOT live in a feature called `amend`** — live-animals registers it in
   `features/dashboard/controller.js:108-124`, calling `amendJourney(request, h, journeyId)`. **That is a
   claim to verify before you go looking for a file that does not exist.**
2. **The cancel-amend page.** `sets/live-animals/journeys/linear/features/cancel-amend/controller.js` is
   **77 lines — read all of it.** GET renders the confirmation only when status is AMEND, redirecting to
   the review page when SUBMITTED and to the dashboard otherwise; POST re-checks, wraps
   `cancelAmendJourney` in `kit.recoverableSave`, re-renders at HTTP 500 on failure, and on success
   redirects to the review page with `?cancelled=1`.

Plus the review-page surfaces (`cancelAmendHref`, and the `amendmentCancelled` banner on `?cancelled=1`)
and the dashboard row actions for SUBMITTED and AMEND.

## ⚠⚠ SIX HAZARDS, ALL VERIFIED BY ME

**1 — READ THE CURRENT SHARED FILES, NOT THE LIVE-ANIMALS EXEMPLAR.** `check-answers/controller.js`,
`check-answers/template.njk`, `dashboard/controller.js`, `dashboard/template.njk` and
`dashboard/view-model/row/index.js` were **all edited by pp-045 and pp-100 in the last two hours**. The
review page already has a `govuk-button-group` holding Copy (a POST form) and Delete (a link); the
dashboard row already emits `postAction` actions rendered as POST forms in a table cell, and already
carries Copy and Delete. **Add to what is there.** Starting from the live-animals version silently
reverts both.

**2 — ⚠ `kit.CYA_SLUG` IS LIVE-ANIMALS' SLUG.** `shared/kit.js:51` declares
`CYA_SLUG = 'notification-view'`. live-animals' cancel-amend controller builds its redirect from it
(`cyaPath` at `:18`). **Plant's slug is `review-notification`**; the per-set accessor is
`journeyCyaSlug()` (`flow/journey-flow.js:35`). **Transposing the constant produces a redirect to a route
plant does not have.** Never import `CYA_SLUG` into `sets/plant-products/`.

**3 — ⚠ AMEND IS EDITABLE, SO THE CANCEL LINK IS NOT IN THE readOnly BRANCH.** pp-097 derived
`readOnly = journey.status === SUBMITTED`, so an AMEND notification renders the **editable** review page.
The `cancelAmendHref` link therefore renders **outside** the `readOnly and (copyAction or deleteHref)`
block that pp-045 and pp-100 built. Putting it inside means it never renders — and no existing test would
catch that.

**4 — ⚠ THE `?cancelled=1` BANNER MUST BE GATED ON BOTH THINGS.** live-animals sets
`amendmentCancelled: readOnly && request.query.cancelled === '1'` (`check-answers/controller.js:84`).
**Gating on the query alone means any draft with `?cancelled=1` pasted on shows a success banner for
something that never happened.** Pin both directions — the same shape as pp-100's `?deleted=1` banner,
whose one-directional version I explicitly asked to be mutation-proven.

**5 — THE `'/live-animals'` LITERAL.** live-animals' cancel-amend tests assert redirects to that literal
(`cancel-amend/controller.test.js:104`), because pp-057 migrated that set to a prefix. A transposed
literal is a **direct cross-set leak with no redirect in the middle** — a fully-rendered wrong page, no
error, no log. **Every path from `shared/paths.js`; every redirect assertion front-anchored on
`^/plant-products`.**

**6 — ⚠ DO NOT USE `enterSetContext` IN A `beforeEach` IN ANY NEW TEST.** I proved during pp-045 that it
**does not carry into the Vitest test callback** and fails **silently**, because `currentSetId()` falls
back to `soleSetId()`. Wrap each operation in `withSetContext('plant-products', ...)` — the idiom
`services/records/records-port.test.js:334-364` uses, and the one pp-100's tests correctly adopted.
(The pre-existing files are being audited as **pp-102**; **do not fix other files here.**)

## The guarantee that actually matters

**Cancelling an amendment must RESTORE THE SUBMITTED BASELINE.** `services/records/stub.js:182-194`
restores `submittedSnapshot.fulfilment`; the real adapter sends
`{ status: 'SUBMITTED', discardChanges: true }`. **Assert THE EDIT IS GONE by reading the answer back —
not that the status flipped.** A status-only assertion passes on a cancel that forgot to restore, and
that is the single most likely way to ship this broken.

## Copy

`shared/copy.en.js` already has the `notificationActions` block — check it before adding keys. The
cancel-amend page needs its own `copy/copy.en.js` + `copy.cy.js` with **identical leaf structure** and a
`copy.test.js` (it compares **leaf paths**, so an English-only key fails structurally). Welsh is a
machine draft under the standing ruling — **keep the banner comment, reuse a shipped plant string where
one exists, and do not have a label name a destination it does not go to.** pp-100 shipped exactly that
defect and it was caught in review.

## Dashboard constraints

Org-wide list, page size **25**, `fullyParallel`. **Never assert a total, a row count or an absolute
position** — assert **by reference**.

## The mutations I expect, by failing test NAME

1. **Make `cancelAmendJourney` flip the status without restoring the baseline.** The cancel test must
   fail by name. **If it passes, it is asserting the status and not the restoration** — the whole point.
2. **Gate the banner on the query alone**, dropping the `readOnly` half. A test must fail, or a pasted
   `?cancelled=1` shows a false success banner on a draft.
3. **Render `cancelAmendHref` for a SUBMITTED notification as well as an AMEND one.** A test must fail —
   otherwise "cancel amendment" appears on a notification with no amendment in progress.

Report each verdict honestly, **including an INERT result**. ⚠ **A sandboxed Chromium launch failure is
an INERT run, not a pass** — say so and rerun outside the sandbox.

## Constraints

- **Production code outside `sets/plant-products/` is off limits** — `ok:false` with evidence.
  **`test:live-animals` unchanged at 559 is NECESSARY BUT NOT SUFFICIENT — say so.**
- ⚠ **AMEND is editable, so check the entry guard, the hub gate and the save path all already tolerate
  it.** If something only tolerates DRAFT, **that is a finding to REPORT, not to fix quietly here.**
- Stay inside the **govuk-frontend toolbox**. **L1 shape assertions: UPDATE, never WEAKEN.**
- `npm run format`; `lint` and `lint:arch` green; shasum unchanged. **Any count that moves is explained.**
  Playwright: **`PORT=3201`**.

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME.** If something here contradicts the source, **stop
and report it rather than making the source match my brief.** Never invent data.

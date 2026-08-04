# pp-100 — soft delete

This brief **OVERRIDES** the generic `implement.md`. Repo: **trade-imports-animals-frontend**, branch
`spike/trace-to-requirements`, clean at **`3e5ebc05`** (pp-045 landed minutes ago). Rollback is
`git stash push -u`. **Stage, do not commit. Never run `sonar`.**

**SCOPE: soft delete ONLY.** pp-045 (copy) has landed; **pp-101** is amend + cancel-amend and is a
different increment. **Do not build an amend route, a cancel-amend page, or anything touching the AMEND
transition.** If you find yourself needing one, say so in `notes` and stop.

**Baselines I measured myself on `3e5ebc05`, minutes ago — re-establish and report yours:**

- `test:plant-products` **743** (59 files) · `npm test` **2,382 passed / 8 skipped** (218 files)
- `test:live-animals` **559** (65 files) — **a change here is a REGRESSION**
- `PORT=3201 test:features:plant-products` **262 passed**, zero flaky
- `lint:arch` 0 violations (**673** modules, **2,145** dependencies); shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`

## What to build

`sets/live-animals/journeys/linear/features/delete-notification/controller.js` is **70 lines — read all
of it.** A GET at `pageRoutePath('delete')` renders a confirmation page when the journey is deletable
(`:19-23` — DRAFT, SUBMITTED or AMEND) and redirects to the dashboard otherwise; a POST re-checks
deletability, wraps `softDeleteJourney` in `kit.recoverableSave`, re-renders the confirmation at HTTP 500
on failure, and on success redirects to the dashboard with `?deleted=1`.

Plus the Delete entry points: the read-only review page (`deleteHref`) and the dashboard row.

## ⚠⚠ FIVE HAZARDS, ALL VERIFIED BY ME

**1 — READ THE CURRENT FILES, NOT THE LIVE-ANIMALS EXEMPLAR, FOR THE TWO SHARED SURFACES.**
`check-answers/template.njk` and `dashboard/{template.njk,view-model/row/index.js}` were all edited by
pp-045 **an hour ago**. The Copy button already sits in the readOnly branch of the review page, and the
dashboard row already renders `postAction` actions as POST forms in its table cell. **Add to what is
there.** Starting from the live-animals version would silently revert pp-045.

**2 — ⚠ pp-045 LANDED AN ASSERTION THAT YOUR CHANGE COULD BREAK.** The submitted-review e2e now asserts
there is **exactly one** POST form in `main` and that its action ends `/copy`. live-animals renders
Delete as a **link** (`deleteHref`, a `govuk-button--warning` with `href`), not a form — so if you follow
it, the count stays 1 and nothing breaks. **If you deviate and make Delete a POST form on that page, that
assertion goes red and you must update it deliberately and say so — never weaken it to pass.** I mutated
that guard myself to prove it is real.

**3 — THE `'/live-animals'` LITERAL.** live-animals' own delete tests assert redirects to the literal
`'/live-animals'` (`delete-notification/controller.test.js:56,80,83` — `noHref` and two `redirect`s).
A transposed literal is a **direct cross-set leak with no redirect in the middle**: the user lands on a
fully-rendered live-animals dashboard and nothing errors or logs. **Every path comes from
`shared/paths.js`**, and every redirect assertion is **front-anchored on `^/plant-products`**, never
"not an error".

**4 — ⚠ DO NOT USE `enterSetContext` IN A `beforeEach` IN ANY NEW TEST.** I proved during pp-045 that
`enterSetContext()` in an **async** `beforeEach` **does not carry into the Vitest test callback** —
`AsyncLocalStorage.enterWith` binds descendants and the test callback is a sibling task. Worse, it fails
**silently**: `currentSetId()` falls back to `soleSetId()`, so the test quietly runs against whatever set
is mounted instead of erroring. That produced a test named for a guarantee it could not detect.
**Wrap each operation in `withSetContext('plant-products', ...)`** — the idiom that demonstrably works,
as `services/records/records-port.test.js:334-364` does. (The existing idiom is being audited separately
as pp-102; **do not fix other files here.**)

**5 — SOFT, NOT HARD, AND THE OBVIOUS ASSERTION IS THE WRONG ONE.** `services/records/real.js:263` and
the stub both transition status to `DELETED`; the record still exists and `list` filters it out. **A test
asserting a 404 after deletion is asserting a contract the service does not have** and will fail for the
right-looking wrong reason. Assert: still loads with `status: 'DELETED'`; absent from the list **by
reference**; a second delete is idempotent and does not error.

## Copy

`shared/copy.en.js` already carries `notificationActions.delete.text`, `.successTitle` and `.successBody`
— **add no new key for those.** The confirmation page needs its own `copy/copy.en.js` + `copy.cy.js` with
**identical leaf structure** and a `copy.test.js` like `check-answers/copy/copy.test.js` (it compares
**leaf paths** across locales, so an English-only key fails structurally). Welsh is a machine draft under
the standing ruling — **reuse a shipped plant string where one exists rather than inventing one.**

## Dashboard constraints

The list is **ORG-WIDE** (`services/records/real.js:108` ignores `journeyIds`), page size **25**, workers
`fullyParallel`. **Never assert a total, a row count or an absolute position.** Assert the deleted row's
absence **by reference**.

## The mutations I expect, by failing test NAME

1. **Make `softDelete` return without changing the status.** The delete test must fail by name. If it
   passes, it is asserting the redirect and not the deletion.
2. **Make the GET render the confirmation for a non-deletable status.** The guard test must fail.
3. **Drop the `?deleted=1` condition so the banner always renders.** A test must fail — otherwise the
   banner is unpinned in one direction and would show on every dashboard load.

Report each verdict honestly, **including an INERT result**. A mutation can be masked by a deeper layer,
intercepted by a shallower one, or aimed at a guarantee that is not observable.

## Constraints

- **Production code outside `sets/plant-products/` is off limits** — `ok:false` with evidence.
  **`test:live-animals` unchanged at 559 is NECESSARY BUT NOT SUFFICIENT — say so.**
- Stay inside the **govuk-frontend toolbox**. **L1 shape assertions are in scope to UPDATE, never to
  WEAKEN.**
- `npm run format` before you finish; `lint` and `lint:arch` green; shasum unchanged.
- **Any test count that moves must be explained.** Playwright: **`PORT=3201`**.

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME.** If something here contradicts the source, **stop
and report it rather than making the source match my brief.** Never invent data.

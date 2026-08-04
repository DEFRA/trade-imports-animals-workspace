# pp-045 — copy as new (notification-actions), with pp-052 folded in

This brief **OVERRIDES** the generic `implement.md`. Repo: **trade-imports-animals-frontend**, branch
`spike/trace-to-requirements`, clean at **`079cada3`** (pp-097 landed minutes ago and this increment
consumes it). Rollback is `git stash push -u`. **Stage, do not commit. Never run `sonar`.**

**pp-045 was an UNPLANNED STUB covering copy, delete AND amend. I planned it and SPLIT IT INTO THREE.**
You are building **copy only**. `pp-100` is soft delete, `pp-101` is amend + cancel-amend. **Do not build
a Delete button, a delete route, an amend route or a cancel-amend page** — if you find yourself needing
one, you have wandered out of scope; say so in `notes` and stop.

**Baselines I measured myself on `079cada3`, minutes ago — re-establish and report yours:**

- `test:plant-products` **733** (58 files) · `npm test` **2,371 passed / 8 skipped** (217 files)
- `test:live-animals` **559** (65 files) — **a change here is a REGRESSION**
- `PORT=3201 test:features:plant-products` **260 passed**, zero flaky
- `lint:arch` 0 violations (**671** modules, **2,127** dependencies); shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`

## The whole feature is one POST route

`sets/live-animals/journeys/linear/features/notification-actions/controller.js` is **49 lines. Read all
of it.** It registers a single POST at `pageRoutePath('copy')` which:

1. reads and trims `request.payload.idempotencyKey`;
2. wraps `copyJourney(request, h, journeyId, idempotencyKey)` in `kit.recoverableSave`;
3. **on failure re-renders the surface the user came from, carrying the SAME key**, at HTTP 500 —
   `request.payload.copyOrigin === 'notification-view'` re-renders the review page, anything else
   re-renders the dashboard with a `retryCopy`;
4. on success redirects to `hubPath(copied.journeyId)`, falling back to `dashboardPath()`.

**There is no confirmation page and no separate cloning front door.** That is the whole of the pp-052
fold-in: live-animals has one feature and distinguishes origin by payload, so plant does too.

## ⚠⚠ FOUR TRAPS, ALL VERIFIED AT SOURCE BY ME

**1 — `CYA_SLUG` IS LIVE-ANIMALS' SLUG MASQUERADING AS A SHARED CONSTANT.** `shared/kit.js:51` declares
`export const CYA_SLUG = 'notification-view'`. That is **live-animals'** page slug. Plant's is
`review-notification` (`check-answers/page.js`). The per-set accessor is `journeyCyaSlug()`
(`flow/journey-flow.js:35`), and `kit.js:76` uses `journeyCyaSlug() ?? CYA_SLUG`. **live-animals'
dashboard `view-model/row/actions.js:8,33` imports the CONSTANT**, which is correct for it and wrong for
plant. **Never import `CYA_SLUG` into `sets/plant-products/`.**

**2 — THE `'/live-animals'` LITERAL.** live-animals' own controller tests assert redirects to the literal
`'/live-animals'` (`notification-actions/controller.test.js:132`, `dashboard/controller.test.js:403`) —
pp-057 migrated that set from a bare `'/'` to a prefix. A transposition that copies the literal produces
a **direct cross-set leak with no redirect in the middle**: the user lands on a fully-rendered
live-animals page and nothing errors, nothing logs. **Every path you emit comes from
`shared/paths.js`.** Assert redirects **front-anchored on `^/plant-products`**, never "not an error".

**3 — THE TWO DASHBOARD TEMPLATES ARE STRUCTURALLY DIFFERENT.** live-animals renders row actions in
`<ul class="govuk-summary-card__actions">` (`dashboard/template.njk:88-104`); **plant renders them in a
TABLE CELL** (`dashboard/template.njk:136-138`, currently link-only). Transpose the **behaviour** — a
`postAction` renders as a POST form with hidden `crumb`, `idempotencyKey` and `copyOrigin` — into
**plant's table markup**. Do not paste summary-card markup into a table.

**4 — ⚠ `copyJourney` REFUSES A JOURNEY THE SESSION DOES NOT KNOW.** `engine/journey.js:119-125` starts
with `if (!(await isKnownJourney(request, journeyId))) return undefined`, and the controller turns
`undefined` into a **silent redirect to the dashboard**. But the plant dashboard list is **ORG-WIDE** —
`services/records/real.js:108` ignores the `journeyIds` the engine passes it — so a user can be looking
at a row their session has never known and press Copy. **Establish what actually happens and report it.**
live-animals has the identical shape, so **if it misbehaves it is shared design, not a plant defect:
report it, do not fix it here.** ⚠ **Do not paper over it by adding the journey to the session** — that
would invent an authorisation decision.

## No new copy keys

`shared/copy.en.js:30-35` already carries `notificationActions.copy.text` = **"Copy as new"**, plus
`successTitle` and `successBody`. Plant's dashboard row already supplies its own hidden text via
`copy.actions.forNotification(reference)`. **Add no new copy keys unless something is genuinely missing**
— and if it is, English and Welsh together with identical structure.

No new CSS either: `.app-form-inline` and `.app-link-button` live in the **shared**
`src/client/stylesheets/core/_main.scss:11,34`, available to both sets.

## ⚠ pp-097 LANDED AN ASSERTION YOU MUST NARROW, NOT WEAKEN

`review-notification.e2e.spec.js` (the `SUBMITTED review renders answers with no edit affordance or
resubmission form` test) asserts **`main form[method="post"]` has count 0**. Your Copy button is a POST
form on that exact page, so that assertion will go red — **correctly**. Narrow it to the *resubmission*
form (the one carrying the Continue button) so it still proves what it was written to prove, and keep the
`getByRole('button', { name: 'Continue' })` count-0 assertion **exactly as it is**. **Weakening or
deleting either is not available to you.** I mutated that guard myself an hour ago to prove it is real.

## The four rendering rules — this is what R4 sequencing exists for

1. Mint `randomUUID()` **per RENDERED action**, not per request and not once per module.
2. Carry it in a hidden input named `idempotencyKey`.
3. **Re-render the SAME key on the recover path** — that is why the render function takes it as an option.
4. A **re-rendered** page mints a **fresh** key, so the button still works a second time.

Rule 3 is the one a careless implementation breaks, and breaking it turns a retry into a second draft.

## Where the action renders

**Both** the read-only review page (`readOnly` only — never on an editable one) **and** the dashboard row.
live-animals renders it in both and **each render site mints its own key**, so a missed site is an
untested key path. Prove **both** origins re-render correctly on the recover path; a single-origin test
passes against a hardcoded branch.

## Registration

`features/index.js` has two exported arrays — `dispatchPages` (pages in journey order) and `allRoutes`.
**notification-actions is a route-only feature with no page**: live-animals' controller exports `routes`
and no `meta`. **Read `features/index.js` before editing it** and follow what is already there.

## Constraints

- **Production code outside `sets/plant-products/` is off limits.** A forced change there is `ok:false`
  with evidence. **`test:live-animals` unchanged at 559 is NECESSARY BUT NOT SUFFICIENT — say so.**
- Stay inside the **govuk-frontend toolbox**. **L1 shape assertions are in scope to UPDATE, never to
  WEAKEN.**
- `npm run format` before you finish; `lint` and `lint:arch` green; dependency-cruiser shasum unchanged.
- **Any test count that moves must be explained**, especially downward.
- Playwright: **`PORT=3201`**. Docker holds 3000, 3001 and 3100.
- Dashboard assertions: **never a total, a row count or an absolute position** — the list is org-wide,
  page size 25, workers `fullyParallel`. Assert **by reference**.

## The mutations I expect, by failing test NAME

1. **Mint the key once at module scope instead of per rendered action.** A test must fail proving rule 1.
   If none does, the idempotency contract is decorative.
2. **Make the recover path mint a fresh key instead of re-rendering the given one.** A test must fail
   proving rule 3.
3. **Swap `copyOrigin` handling so both origins recover to the dashboard.** The review-origin recover test
   must fail. If it passes, you have only tested one origin.

Report each verdict honestly, **including an INERT result**. A mutation can be masked by a deeper layer,
intercepted by a shallower one, or aimed at a guarantee that is not observable.

## Finally

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME.** My briefs were wrong twelve times last session and
every single time the implementor or reviewer was right. If something here contradicts the source,
**stop and report it rather than making the source match my brief.** Never invent data.

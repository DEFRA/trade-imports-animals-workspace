# pp-067 — tests-repo lifecycle coverage

This brief **OVERRIDES** the generic `implement.md`. Repo: **trade-imports-animals-tests — a SEPARATE
git repo**, own remote, own CI, own `package.json`, on `spike/trace-to-requirements`. **Verify the branch
before your first edit; if it is not that branch, STOP.** Rollback is `git stash push -u`. **Stage, do
not commit. Never run `sonar`.**

## The stack is UP and CURRENT — do not rebuild it

I restarted the `:3100` test target myself after `ab6eabf5` landed and **verified the lifecycle code is
present inside the container** (`features/cancel-amend/` is there). All seven profiles are running.
**Do not run `run-stack.sh`.** If you believe the target is stale, tell me rather than rebuilding —
a rebuild costs far more than it saves and a `docker restart` disturbs OIDC sessions.

**Baseline I measured myself just now, on this exact stack: tests-repo `test:plant-products` = 79
passing, exit 0.** Re-establish it and report yours. The live-animals suite collects **141** (⚠ not 139
— the root co-residency spec and the plant cross-browser case fall inside its `testMatch`); the
invariant is that **the pre-existing 139 still pass**.

⚠ **THE FLAKY BAND IS 0–8 AND TRACKS HOST LOAD, NOT THE SPECS.** Every failure is a timeout or a
`GET /plant-products` 500 from `AggregateError [ETIMEDOUT]`, and flaky runs take roughly twice as long.
**A green run with flaky-passing specs is a pass.** The mitigation that works is **creating notifications
through the API, not the UI** — pp-064 added 17 tests that way with zero contention failures.

## ⚠⚠ READ THIS FIRST: TWO THINGS IN THE INCREMENT ARE STALE, AND I HAVE CORRECTED BOTH IN ITS JSON

**1 — THE IDEMPOTENCY BAR ASSERTED BEHAVIOUR THE SYSTEM DOES NOT HAVE. I rewrote it.**
The original demanded that *the same key against a different source reference creates a new draft*.
**It does not.** `PlantProductsNotificationService.copy()` calls `findCopy(idempotencyKey)` at **:152**
and returns the existing copy **before it ever resolves the source** at **:159** — so the key is
**GLOBAL** and the second call returns the **first source's copy**. That is the defect promoted to
**pp-098, which is still `todo`.**
**Pin what the system DOES**, with an inline comment naming pp-098. **Never write a skipped or
deliberately-failing test.** When pp-098 lands it will flip that expectation, and the flip is what proves
pp-098 worked. **This is the fourth acceptance criterion on this programme that asserted behaviour the
application has never had** — if you find a fifth, stop and tell me.

**2 — THE ORIGINAL R7 ARGUMENT CITES LINE NUMBERS THAT ARE EXACT AND VALUES THAT ARE STALE.**
Every cited line is real; every value moved when pp-057 migrated live-animals from `'/'` to
`'/live-animals'`. **The hazard is still real but its shape changed and is now QUIETER**: a transposed
literal today is a hard-coded `'/live-animals'` — a **direct** cross-set leak with no 302 in the middle,
landing the user on a fully-rendered wrong page with nothing erroring or logging.
⚠ **The acceptance criterion "no spec accepts a bare `/`" is therefore UNDER-SPECIFIED — it must also
reject `^/live-animals`**, or a plant redirect into the wrong set would satisfy it. **Front-anchor every
post-action URL assertion on `^/plant-products`.** "The page loaded" is never acceptable here.

## The surfaces now exist — three of them did not when this increment was written

- **Copy** — `POST /plant-products/notifications/{ref}/copy`, hidden `idempotencyKey` and `copyOrigin`
  inputs. Rendered on the **read-only review page** and on **dashboard rows**. (pp-045, `3e5ebc05`)
- **Delete** — `GET`/`POST .../delete`, a confirmation page, a `?source=notification-view` variant that
  returns you to the review page instead of the dashboard, and a `?deleted=1` dashboard banner.
  (pp-100, `186370fa`)
- **Amend** — `POST .../amend`, registered in the **dashboard** feature, not one of its own.
  **Cancel-amend** — `GET`/`POST .../cancel-amend` plus a `?cancelled=1` banner on the review page.
  (pp-101, `ab6eabf5`)
- **Dashboard actions by status:** DRAFT = Continue, Delete · SUBMITTED = View, Amend, Copy, Delete ·
  AMEND = Resume, Copy, Cancel amendment, Delete.

⚠ **COPY IS DELIBERATELY ABSENT FROM DRAFT ROWS.** The backend rejects any status that is not SUBMITTED
or AMEND (`:163-167`). live-animals *does* offer copy on drafts; the divergence follows the service
contract. **A spec that tries to copy a draft is asserting a capability the backend refuses.**

⚠ **THE READ-ONLY VIEW IS `check-answers` IN A `readOnly` MODE**, gated on `status === SUBMITTED`
(pp-097). There is no separate `notification-view` feature in either set. AC 4 has a real surface now.

## Other things that are true and easy to get wrong

- **SOFT delete.** The record still loads with `status: 'DELETED'` and `list` filters it server-side.
  **A spec asserting a 404 is asserting a contract the service does not have.** Deleting twice is
  idempotent.
- **Cancel-amend must prove THE EDIT IS GONE** by reading the answer back — not that the status flipped.
  A status-only assertion passes on a cancel that forgot to restore the baseline.
- **The dashboard list is ORG-WIDE** (`real.js:108` ignores `journeyIds`), page size **25**, workers
  `fullyParallel`. **Never assert a total, a row count or an absolute position** — assert **by
  reference**. The only deterministic anchor is `sort=createdAt,asc`, under which the three seeded rows
  are 1–3.
- **Seed through `flows/plant-products/api-journey.ts`** (pp-061), not by walking 12 spokes per case.
- **No plant page object may import from `page-objects/live-animals/`** — but the co-residency spec
  legitimately uses both sets' fixtures.
- ⚠ **`page-objects/plant-products/` has NO cancel-amend, delete-confirmation or notification-view page
  object.** The increment lists that path as `edit`; those three are **creates**. `review-notification-page.ts`
  exists and already has `changeLink`, `continueButton` and `backLink`.

## Verification

`typecheck`, `lint`, `format:check`, then `test:plant-products`, then the integration and e2e lanes.
Run suites **to a file** under `<workarea>/logs/` and read the file once. For Playwright failures read
`test-results/*/error-context.md`, never the tail of the run.
**The live-animals suite must be unchanged and still green in the same run.**

## The mutations I expect, by failing test NAME

1. **Break the cancel-amend restore** so it flips status without restoring the baseline — the cancel
   spec must fail by name. If it passes, it is asserting the status, not the restoration.
2. **Point one post-action redirect at `/live-animals`** — a front-anchored assertion must fail. If none
   does, the R7 bar is decorative and that is the whole point of this increment.

Report each verdict honestly, **including an INERT result**. ⚠ **A Chromium launch failure is an INERT
run, not a pass.**

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME.** My briefs have been wrong repeatedly and every
time the implementor or reviewer was right. **If something here contradicts the source, stop and report
it rather than making the source match my brief.** Never invent test data — values come from
`domain/plant-products/constants/` or the frontend fixture, and **report any disagreement rather than
silently preferring one side** (that drift is already recorded as T-7, and pp-092 checked only 3 of 11
constants files).

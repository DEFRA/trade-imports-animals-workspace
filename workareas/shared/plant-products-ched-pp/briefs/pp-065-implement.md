# pp-065 — the cross-repo whole-journey proof + the co-residency spec

This brief OVERRIDES the generic `implement.md`. **The `-tests` repo — a SEPARATE git repo** on
`spike/trace-to-requirements`. Rollback is `git stash push -u`.

**pp-041 explicitly does NOT discharge this.** That increment is the in-repo whole-journey proof against
the plant records *stub* in a self-hosted server. **This one is the only whole-journey coverage against
the real workspace stack** — real backend, real Mongo, real OIDC — and it carries the set-neutral
co-residency spec that can only exist here.

**Both dependencies landed tonight:** pp-064 gave you the eleven page objects and a
`completeMandatorySpokes()` that reaches review; pp-041 gave the frontend its own journeys lane.

**Baselines I ran myself: tests-repo plant 70/70 zero flaky, live-animals 139** (135 passed + 3
flaky-passing + 1 skipped). Re-establish both and report yours. The stack is up and healthy on current
source — **do not rebuild it.**

## ⚠ HAZARD 1 — THE LOAD PROFILE, MEASURED TONIGHT

The plant suite ran **0, 6, 0 and 2 flaky on identical code**, and the flaky runs took roughly twice as
long as the clean ones. Every failure was `GET /plant-products` returning a bare 500 from
`AggregateError [ETIMEDOUT]` under contention.

pp-064 added seventeen tests and still hit **zero** contention failures, because it created through the
**API** rather than the UI wherever a spec only needed a notification to exist. **Do the same.** A
twelve-spoke UI walk is unavoidable for the headline spec — that is its point — but nothing *else*
should drive the UI to set up state. Never `Promise.all` a burst of creates.

## ⚠ HAZARD 2 — THE DASHBOARD ASSERTION AT THE END

Your headline spec must assert the submitted row appears on the dashboard. **The dashboard is org-wide**
— `services/records/real.js:108` ignores the `journeyIds` the engine passes it — the page size is **25**,
and the workers are `fullyParallel`. So **do not assert a row count, a total, or an absolute position.**

Find your own reference. The safe forms are an exact-reference search (the backend's
`findByReferenceNumberAndStatusIn` returns at most one row) or `sort=createdAt,asc` anchoring, which
pp-075 established. **A newly submitted notification is the NEWEST row, so `createdAt,asc` puts it LAST
— do not assume it is on page 1.** An exact-reference search is almost certainly what you want.

## ⚠ HAZARD 3 — THE CO-RESIDENCY SPEC IS THE ONE THAT CANNOT EXIST ANYWHERE ELSE

Six cases, all required, at the features **ROOT** (`tests/e2e/features/co-residency.spec.ts`, no set
subdirectory — the shared config's `frontend-live-animals-chromium` project matches
`**/tests/e2e/features/*.spec.ts`, so a root-level spec is collected there; **confirm that with
`playwright test --list` rather than assuming it**):

1. `/` **302s** — 302, not 301 — to `/live-animals`.
2. Two journeys, one browser context, one per set, both usable.
3. No cross-set draft visibility.
4. **Distinct cookie NAMES and PATHS per set.**
5. `/health`, `/signout` and a static asset resolve **UNPREFIXED**.
6. Neither set is reachable under the other's prefix.

**Use BOTH sets' fixtures in a single test** — that is an explicit acceptance criterion, and it proves
the fixture design does not assume one set per test.

**On the static asset**: read the stylesheet path from the rendered DOM rather than hardcoding
`/public/…`. That also proves the served page and the served asset agree, which is the real risk if the
static route were ever accidentally prefixed.

## ⚠ HAZARD 4 — THE CROSS-BROWSER LANE STAYS THIN

**ONE** thin plant happy path, at the same depth as the live-animals one. **No twelve-spoke walk across
three browsers.** That lane's job is rendering and sign-in regressions, not coverage. **If WebKit is
slow, TRIM THE CASE — do not raise the timeout.** Say what you trimmed.

## ⚠ HAZARD 5 — THE CI CLAIM MUST BE READ, NOT ASSUMED

The acceptance criterion says the workspace E2E lane **actually runs** the new specs, "verified by
reading the workflow inputs and the workspace-side reusable workflow, not assumed". So read
`.github/workflows/workspace-e2e-tests.yml` **and** whatever reusable workflow it calls, and quote what
you found. **If you cannot see the workspace-side file from this repo, say so plainly and state what you
could and could not verify** — do not claim a lane runs something you did not confirm.

## Constraints

- **No plant page object may import from `page-objects/live-animals/`** — but the co-residency spec
  legitimately uses **both** fixtures. Those are different things; do not confuse them.
- Every URL assertion **front-anchored on its set prefix**.
- **Never invent test data.** Values come from `domain/plant-products/constants/` or the frontend
  fixture — and note those constants are a hand-maintained duplicate that drifted once (pp-092), so
  **report any disagreement rather than silently preferring one side.**
- Assert the full rendered list including dividers and separators.
- `npm run typecheck`, `npm run lint`, `npm run format:check` green.
- **live-animals must stay at 139 collected** — necessary but NOT sufficient; say so.
- Explain any test-count movement. **Stage, do not commit.** Never run `sonar`.

## If you cannot finish

Break it **spec-wise**: the whole-journey spec first (it is the milestone's definition of done), then
co-residency, then the cross-browser case. **Report `ok:false` with exactly what is done and what the
next pass picks up.** A clean partial with an honest boundary is a good outcome.

## The mutations I expect, by failing test NAME

1. **Drop one answer** from the whole-journey walk → the persisted-shape assertion must fail, proving it
   pins every schema path rather than a sample.
2. **Remove a MIDDLE entry** from the depth-3 commodity tree with survivors asserted by identity and
   order → must fail. A first or last one too.
3. **Change the `/` redirect to 301** → co-residency case 1 must fail. If it passes, you asserted "a
   redirect happened" rather than the status code.

**Say what the code now does differently before believing any result.** An inert mutation has falsely
confirmed a finding on this build, an inert one has falsely refuted a correct fix, and an
internally-consistent half-edit has falsely refuted. **AN `ok:false` IS OFTEN THE MOST VALUABLE
OUTCOME** — my briefs have been wrong eleven times tonight and every single time the implementor or
reviewer was right.

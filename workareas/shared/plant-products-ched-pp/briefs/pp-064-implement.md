# pp-064 — the 12-spoke assurance in the tests repo

This brief OVERRIDES the generic `implement.md`. **The `-tests` repo — a SEPARATE git repo** on
`spike/trace-to-requirements`, own remote, own CI, own `package.json`. Rollback is `git stash push -u`.

**This is the biggest increment in the tests-repo set and the plan deliberately does not split it.**
Read the increment's `notes` — they explain why, and they give the split rule if you cannot finish.

## The stack is up, healthy, and serving current source. Do not rebuild it

The integration lane targets a **real-mode frontend on `:3100`** behind the opt-in `test-target`
profile. It is running now with local `src` bind-mounted, so it serves this session's frontend
including tonight's pp-041, pp-093 and pp-094 commits.

**Baselines I ran myself:** tests-repo plant **48/48**, live-animals **139** (137 passed + 1
flaky-passing + 1 skipped). **Re-establish both before you edit** and report yours.

## ⚠⚠ HAZARD 1 — THE SUITE IS LOAD-SENSITIVE AND YOU ARE ABOUT TO ADD A LOT TO IT

I measured this tonight, across six runs. The plant suite was reliably **zero-flaky at 31 tests**.
After pp-075 took it to 48 it ran **0, 6, 0 and 2 flaky** on identical code — and **the flaky runs took
roughly twice as long as the clean ones** (21.7s / 0 flaky against 49.9s / 2). Every failure is the same
shape: `GET /plant-products` returns a bare 500 because the frontend's fetch to the backend hits
**`AggregateError [ETIMEDOUT]`** under load.

So: **it tracks contention, not any individual spec.** You are adding eleven pages' worth of specs to
that suite.

- **Create notifications through the API, not the UI, wherever a spec only needs one to exist.**
  `flows/plant-products/api-journey.ts` gives you `createEmptyNotification`, `createFullNotification`,
  `createSubmittedNotification` and `createNotificationWithDocuments`.
- **Never `Promise.all` a burst of creates.** pp-075 did and I had to make it sequential; a plain
  sequential loop is the house pattern now.
- **A green run with a few flaky-passing specs is still a pass** — they recover on retry. But if your
  additions push the flaky count up sharply, **say so with numbers** rather than letting it pass
  silently. That measurement is worth more to me than a clean-looking report.

## ⚠ HAZARD 2 — THE DASHBOARD IS ORG-WIDE, SO YOUR NOTIFICATIONS ARE ON EVERYONE'S PAGE

`services/records/real.js:108` **ignores** the `journeyIds` the engine passes it; the backend returns
every non-DELETED notification for the org, the page size is **25**, and the workers are
`fullyParallel`. Every notification your specs create is visible to every other spec in the run.

**Do not assert a total, a row count, or an absolute row position anywhere.** The only deterministic
anchor is `sort=createdAt,asc`, under which the three seeded rows (`GBN-PP-26-SEED01/02/03`, created
2026-08-01, older than anything the suite can make) are rows 1–3. pp-075 established that and pinned
`api-seed-loads.spec.ts` accordingly — **do not undo it, and do not add a new spec that depends on
default-sort row positions.**

## ⚠ HAZARD 3 — ASSERT THE FULL RENDERED LIST, INCLUDING DIVIDERS AND SEPARATORS

Standing rule and the increment's own evidence standard. **Filtering visual elements out of an option
list or a row assertion to make it read nicely hides exactly the regressions these specs exist to
catch.** `hub-groups-and-cya-rows` is the only executable statement of the §2.1 mapping — `GROUPS` is
hand-authored in the hub controller and nothing in the frontend enforces it — so it must assert **order,
grouping, status transitions, the optional row, the conditional row and the gate**, not "twelve rows are
present".

## ⚠ HAZARD 4 — BOTH OPEN QUESTIONS ARE "ASSERT WHAT IS BUILT, THEN FLAG"

1. **Spoke 11 (Billing)** — absent from the m4 hub, or present-but-Not-applicable? The plan says
   `conditional: true` hides a Not-applicable row, so absent is expected. **Assert the observed
   behaviour and say which it is. If it differs from the plan, flag it — do not accommodate it.**
2. **`responsiblePerson*` pre-population** — planned as NO (POP-2 deferred). Enter the values by hand.
   **If the built page arrives pre-filled, that is a plan/implementation divergence to report, not to
   absorb into the spec.**

## What this repo adds over the frontend's own specs

**Real backend, real Mongo, real OIDC.** So the wipe-on-gate-flip case in `containers-conditional`, the
resume-after-save cases and every persisted-code assertion are the whole point — the frontend's
stub-backed specs cannot prove any of them. **If a spec you write would prove nothing the frontend spec
already proves, say so rather than writing it.**

## Constraints

- **No plant page object may import from `page-objects/live-animals/`.** Standing rule.
- **Locate against the built pages.** pp-040 closed frontend m4; do not write a page object against a
  page you have not loaded. If a page or control the plan names does not exist, **stop and report
  `ok:false`** — do not invent a locator.
- **Never invent test data.** Values come from `domain/plant-products/constants/` or from the frontend
  fixture. ⚠ Those constants are a **hand-maintained duplicate** of the frontend's data that drifted
  once already (pp-092) — if you find a disagreement, **report it, do not silently prefer one side.**
- `npm run typecheck`, `npm run lint`, `npm run format:check` green.
- **live-animals must stay at 139 collected** — necessary but NOT sufficient; say so.
- Explain any test-count movement: `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- **Stage, do not commit.** Never run `sonar`.

## If you cannot finish

**Do not thrash and do not half-build the flow.** Break it **page-wise** — pages plus their per-page
specs first, the four feature specs second — and **never leave `flows/plant-products/journey.ts` unable
to reach the review page**, because pp-065, pp-066 and pp-067 all block on a complete
`completeMandatorySpokes()`. Then report `ok:false` with exactly what is done, what is not, and what the
next pass should pick up. **A clean partial with an honest boundary is a good outcome; a broken flow is
not.**

## The mutations I expect, reported by failing test NAME

1. **Reorder two hub rows** in the expected list — `hub-groups-and-cya-rows` must fail. If it does not,
   it is asserting presence rather than order and has not met its own purpose.
2. **Remove a MIDDLE entry** from any collection you assert (documents, contacts, containers) with the
   survivors pinned by identity and order — must fail by name. A first-or-last removal too.
3. **Flip the containers gate** after saving container rows and prove the stored rows are **wiped** —
   this is the case only the real backend can demonstrate.

**Say what the code now does differently before believing any result.** On this build an inert mutation
has falsely confirmed a finding, an inert one has falsely refuted a correct fix, and an
internally-consistent half-edit has falsely refuted. **AN `ok:false` IS OFTEN THE MOST VALUABLE
OUTCOME** — my briefs have been wrong ten times and every single time the implementor or reviewer was
right.

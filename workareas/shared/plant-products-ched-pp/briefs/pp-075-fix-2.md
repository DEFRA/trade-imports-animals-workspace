# pp-075 — fix pass 2. ONE change.

**Tests repo**, separate git repo, `spike/trace-to-requirements`. **Your work is already staged across
five files and it is correct — `git status` first, preserve all of it, change only what is below.**
The stack is up and healthy; do not rebuild it.

## What I found by running the suite myself, after your fixes

`dashboard-pagination.spec.ts:18` fires **23 concurrent** notification creates:

```
await Promise.all(Array.from({ length: 23 }, () => plantProductsApi.create()));
```

**That burst destabilises the specs running beside it.** Playwright runs `fullyParallel` with several
workers against one backend, so 23 simultaneous `POST /plant-products/notifications` land while other
workers are driving the UI.

**The measurements are mine, from three runs tonight:**

| Run | Result |
|---|---|
| Baseline before this increment (31 tests) | **0 flaky**, twice |
| Full suite after your fixes (48 tests) | 41 passed, **7 flaky** |
| Same suite with ONLY the pagination spec excluded (47 tests) | 46 passed, **1 flaky** |

**Excluding one spec took flakes from 7 to 1.** Every failure has the same shape: `GET /plant-products`
returns `{"statusCode":500,...}` and the dashboard H1 never appears, so `open()` times out in a
`beforeEach`. The frontend container log names the cause — **`AggregateError [ETIMEDOUT]`**, its fetch to
the backend timing out under the load.

They all recover on retry, so the suite is green. **Green is not the bar here.** A retry budget is
there to absorb genuine transience, and this increment spends most of it on load the spec creates for
its own convenience.

## The change

**Create the 23 notifications sequentially, not concurrently.** The spec needs them to *exist*; it never
needed them created at once. At roughly 50–150ms per API call this costs a couple of seconds and removes
the burst. Do not chunk into clever batches — a plain sequential loop is predictable and a future reader
will not have to reason about a batch size.

**Do not reduce the count below 23.** Three seeded rows plus 23 is 26, one more than the page size of
25, and that is exactly what guarantees a second page independently of what the rest of the suite has
created. Reducing it would reintroduce the volume dependence the whole increment exists to avoid.

## What I am NOT asking you to change, so do not

- **The residual 1 flaky is not yours.** The 500-under-load phenomenon exists without your spec — the
  47-test run still had one. Your burst multiplies it; it does not create it. Do not try to fix the
  frontend, the backend or the timeout.
- **The dashboard's bare 500 on a failed list read is NOT a defect to fix here.** I checked
  live-animals: `sets/live-animals/.../dashboard/controller.js:54` has the same bare
  `await listKnownJourneys(...)` with no recoverable branch. Both sets behave identically, so this is a
  shared design question for Sam, not a plant bug and not this increment's business.

## Verification I want, and the numbers to beat

Run the **full** plant suite twice and report the flaky count for each run against the table above. I am
looking for a return toward the zero-flaky baseline. **If flakes do not drop materially, say so
plainly** — the sequential loop would then not be the cause I believe it is, and I would rather know
that than have it papered over. Reporting "still 6 flaky" is a useful result, not a failure on your
part.

Also confirm the pagination test itself still passes and still sees a second page — the whole point of
the 23.

## Constraints

- `npm run typecheck`, `npm run lint`, `npm run format:check` green.
- Re-run live-animals: **139 collected**, unchanged.
- **No test added, removed or renamed by this change.** Report the count either way.
- Do not touch the frontend, the backend or the mongo seed.
- **Stage, do not commit.**

# pp-064 — fix pass. One red test, then finish the ladder.

**Tests repo**, separate git repo. **Your work is already staged across 28 files — `git status` first
and preserve all of it.** The stack is up and serving current source; do not rebuild it.

**Your `ok:false` was the right call and your diagnosis is precise.** The eight built-vs-plan divergences
you reported are the most valuable part of this increment — see the bottom of this brief for what
happens to them.

## FIX 1 — the red test

`hub-groups-and-cya-rows.spec.ts:150` — the review-page level-2 heading locator also matches the
**footer's "Support links" heading**.

**Scope it to `main`.** That is a locator that reads as specific and is not — the same class as pp-079's
`/^Change /` filter, and the same shape as a grep of mine tonight that matched `@TestConfiguration` as a
test. **Check every other role-based locator you added for the same over-match**, not just this one: any
`getByRole('heading', { level: 2 })`, `getByRole('link')` or `getByRole('table')` that is not scoped to
a region can pick up header, footer or cookie-banner nodes. Report which ones you checked.

**Do not fix it by making the assertion looser.** Scoping is the fix; filtering the footer heading out
of an expected list is not.

## FIX 2 — finish the ladder you could not reach

The repair limit stopped you before the full run. Complete it:

- full plant suite (**65 collected** after your additions),
- `test:live-animals` — **139 collected**, which you have not re-run since editing. It must be
  unchanged; **necessary but NOT sufficient, say so**,
- `typecheck`, `lint`, `format:check`.

**Report the flaky count for the plant run.** Your pre-change baseline was 48 collected with 6
load-flaky retries; your post-change run had **zero bare-500 contention failures**, which is a genuinely
useful result given I warned you about that hazard — confirm whether it holds on the final run.

## Constraints

- **Stage, do not commit.** Never run `sonar`.
- No plant page object may import from `page-objects/live-animals/`.
- **Do not "fix" any of the eight divergences you found.** They are findings, not defects to absorb.
  Your specs must keep asserting what the application actually does.
- Explain any test-count movement: `git diff --staged -U0` then
  `grep -cE "^- *(it|test|describe)\("`. You reported 17 added and none removed — confirm that still
  holds.
- At most 3 self-repair attempts, then `ok:false` again with exactly what is red.

## What I am doing with your findings — you do not need to act on these

Recorded for the orchestrator and Sam, not for you to change:

- **Billing absent entirely** — answers the increment's first open question. Matches the plan's
  `conditional: true` expectation.
- **`responsiblePerson*` not pre-populated** — answers the second open question as planned (POP-2
  deferred).
- **Review row renders `Optional`, not `Not yet started`** — a divergence from my brief; my brief was
  the thing that was wrong, and your spec should assert `Optional`.
- **16 built document types, not the plan's 17** — I will chase which one is missing and whether it was
  dropped or never existed.
- **Contact requires name plus email OR telephone** — not all three.
- **Consignor telephone and email are required** despite being omitted from the increment's schema list.
- **A container accepts number OR seal; a gate wipe persists containers as `null`** — exactly the
  real-backend behaviour only this repo can prove.
- **⚠ The API seed uses `GB-ENG` for a destination while the built selector accepts ISO codes like
  `FR`.** This is the most interesting one: `countryOptions()` filters out all four UK subdivisions, so
  the seed carries a value the UI cannot produce. **Assert the UI's real behaviour and leave the seed
  alone** — I will raise it separately.

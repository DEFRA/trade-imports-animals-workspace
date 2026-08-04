# pp-065 — fix pass. Finish co-residency, then cross-browser and the mutations.

**Tests repo.** **`git status` first: the whole-journey spec and `flows/plant-products/journey.ts` are
STAGED and correct — preserve them.** `tests/e2e/features/co-residency.spec.ts` is untracked WIP and
red. The stack is up on current source; do not rebuild.

**Your `ok:false` was right and your diagnosis is the reason this pass should be quick.** You also did
the thing I most wanted on the CI criterion: you **read** the workflow chain and quoted it rather than
asserting a lane runs something. That is the standard.

## FIX 1 — finish co-residency, using your own diagnosis

You found the blockers precisely:

- unauthenticated `/` redirects to **OIDC** first;
- a direct POST needs CSRF;
- CSRF-authenticated API creates do not populate Chromium's cookie jar;
- repeated authenticated `open()` calls each pay a 5-second sign-in probe, exhausting the 30s timeout.

**Your own next step is the right one: `open(reference, false)` for already-authenticated navigation.**
Take it. Raise the per-test timeout only if that is still not enough, and say so if you do.

### ⚠ THE `/` REDIRECT CASE HAS TO ASSERT REALITY, NOT THE PLAN

The acceptance criterion says `/` **302s** (302, not 301) to `/live-animals`. You have found that an
**unauthenticated** `/` goes to OIDC first. **Do not force the plan's assertion.** Establish an
authenticated context and assert the real behaviour there, and **state plainly in your notes what an
unauthenticated `/` actually does.**

If the 302-not-301 distinction cannot be observed at all in the authenticated path, **say so** rather
than asserting a weaker "a redirect happened" and calling the criterion met. **A stated gap beats a
decorative assertion** — that has been the rule all session.

The other five cases stand as written: two journeys in one context; no cross-set draft visibility;
distinct cookie **NAMES and PATHS** per set; `/health`, `/signout` and a static asset resolving
**UNPREFIXED**; neither set reachable under the other's prefix. **Use BOTH sets' fixtures in one test** —
that is an explicit criterion and it proves the fixture design does not assume one set per test. Read
the stylesheet path **from the rendered DOM** rather than hardcoding `/public/…`.

## FIX 2 — the cross-browser case, and keep it thin

**ONE** plant happy path at the same depth as the live-animals one. **No twelve-spoke walk across three
browsers.** **If WebKit is slow, TRIM THE CASE — do not raise the timeout**, and say what you trimmed.

## FIX 3 — the mutations you did not reach, each by failing test NAME

1. **Drop one answer** from the whole-journey walk → the persisted-shape assertion must fail, proving it
   pins every schema path rather than a sample.
2. **Remove a MIDDLE entry** from the depth-3 commodity tree, survivors asserted by identity and order →
   must fail. A first or last one too.
3. **Change the `/` redirect expectation to 301** → the co-residency case must fail. If it passes, you
   asserted that a redirect happened rather than its status code.

## Record, do not fix — your persistence findings

Real persistence exposed schema differences and they are **findings, not defects to absorb**: `commodity.name`
and false-gated containers persist as **null**; `consignee` stays **null** while `importer` and
`destination` carry the frontend stub organisation. **Assert what the system actually stores** and list
these in your notes. **Do not adjust the application, and do not soften an assertion to hide one.**

## Constraints

- The co-residency spec legitimately uses **both** sets' fixtures; that is not the same as a plant page
  object importing from `page-objects/live-animals/`, which stays banned.
- Every URL assertion front-anchored on its set prefix.
- **Full ladder before you report**: plant suite, `test:live-animals` (**139** collected — necessary but
  **NOT** sufficient, say so), `typecheck`, `lint`, `format:check`, and `test:cross-browser` for FIX 2.
- **Report the plant flaky count.** Your baseline run showed 69 passed + 1 flaky; mine have ranged 0–7
  and track host load rather than any spec.
- Explain any test-count movement. **Stage everything, including the co-residency spec. Do not commit.**
  Never run `sonar`.
- At most 3 self-repair attempts, then `ok:false` again with exactly what is red and what you tried.

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME** — my briefs have been wrong eleven times tonight and
every single time the implementor or reviewer was right.

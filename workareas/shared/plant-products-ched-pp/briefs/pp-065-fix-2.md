# pp-065 — fix pass 2. One assertion, because the criterion was wrong and you were right.

**Tests repo.** **`git status` first — everything is staged and correct. Preserve all of it.** Stack is
up; do not rebuild.

## You were right and I have amended the plan

The criterion required **distinct cookie NAMES and PATHS per set**. You found both `:3100` and `:3000`
expose only root-scoped auth/CSRF/session cookies, and you **refused to fake cookies, weaken the
assertion or alter the application**. That was exactly right.

**I verified the mechanism at source rather than taking your word for it:**
`src/server/common/helpers/session-cache/session-cache.js` registers **one `@hapi/yar` session with one
root-scoped cookie** named from `sessionConfig.cache.name`. There are no per-set cookie names or paths
anywhere in the application. Per-set isolation comes from **Yar keys inside that single session** — and
your cross-set draft-visibility case, which passes, is what actually proves the user-facing property.

**The plan described a design that was never built.** `backlog.json`'s criterion is corrected and the
divergence is recorded for Sam in `TICKETS-TO-RAISE.md`. Twelfth time a brief or plan of mine has been
wrong tonight and the agent was right.

## The one change

**Replace the per-set cookie assertion with one that asserts the real architecture** — a single
root-scoped session cookie shared by both sets — and let the **cross-set draft-visibility** case carry
the isolation claim. Name the test for what it now proves.

**Do not assert the absence of per-set cookies as though it were desirable**, and do not editorialise in
the spec. Assert what is there. If you think a plain statement of the current cookie set is the clearest
form, do that.

**Everything else in the increment stays exactly as it is.** The authenticated `/` 302 with its 301
mutation proof, both journeys in one context, the DOM-derived static asset path, the unprefixed routes,
the prefix isolation, the thin cross-browser case that passed 6/6 across all three engines, and every
mutation proof you already reported.

## Note on the live-animals count — this is expected, not a regression

`test:live-animals` now collects **141**, not 139: the root-level co-residency spec and the plant
cross-browser case fall inside the live-animals project's `testMatch`. **The invariant is that the
pre-existing 139 still pass**, not that the collected total is unchanged. State it that way in your
report.

## Verify

- Full plant suite — **report the flaky count**; yours was 3 and mine have ranged 0–7, tracking host
  load rather than any spec.
- `test:live-animals` — the 139 pre-existing must pass, and the co-residency test must now pass too.
- `typecheck`, `lint`, `format:check`.
- No test added, removed or renamed beyond the rename this change implies — explain any movement.
- **Stage, do not commit.** Never run `sonar`.

## Prove it

Re-run the **301 mutation** against the final spec and confirm it still fails by name. **Mutation
evidence must survive a fix, not merely precede it** — changing a neighbouring assertion can invalidate
it.

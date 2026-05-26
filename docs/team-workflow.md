# Team Workflow — Software & QA Engineering

## Repos

Most tickets touch all three of these:

- `repos/trade-imports-animals-frontend` — user-facing web application
- `repos/trade-imports-animals-backend` — API / business logic service
- `repos/trade-imports-animals-tests` — end-to-end / integration test suite

A single ticket may span all three; coordinate cross-repo changes through the tests and workspace repos.


## Ticket Lifecycle

1. **Refinement** — Dev + QA agree acceptance criteria, edge cases, and test approach. Tickets that feel larger than ~2 days are split now. Tickets that would benefit from pairing are flagged here — see Pairing below. → marked **Ready for dev** and added to the JIRA board.
2. **In Progress** — Try and keep to one ticket per person, or a pair on a flagged ticket. Branch named per [git-conventions.md](./git-conventions.md). Developers should update any tests in `trade-imports-animals-tests` that have broken as a result of their changes.
3. **Code Review** — Small PR against `main`, clear description, tests added, CI green.
   - **🚧 TO DO — team to agree:** branch and merge conventions (see Open Questions below).
4. **QA Verification** — Verified against acceptance criteria in a deployed environment. New tests added or updated in trade-imports-animals-tests as needed.  Bugs go back to In Progress.
5. **Done** — Merged, deployed, criteria met, docs updated (if applicable).

## Pairing - new, to discuss

Pairing is decided deliberately, not by accident. During **Refinement**, flag a ticket as a pairing candidate when it is:

- **High risk or high blast radius** — touches critical paths, auth, data integrity.
- **Architecturally unfamiliar** — no clear approach yet, or sets a pattern others will follow.
- **Knowledge-siloed** — only one person currently understands the area; pairing spreads it.
- **Good for onboarding** — pairs a newer team member with someone experienced.

A pair picks up a flagged ticket when it reaches **In Progress**. Pairing is a recommendation from refinement, not an obligation — the team confirms it when the ticket is pulled.

## Definition of Ready
Clear testable acceptance criteria · dependencies identified · test approach agreed · feels deliverable in ~2 days or less · pairing need considered.

## Definition of Done
Reviewed & merged · tests added and passing · QA verified · docs updated · no new lint/pipeline regressions.

## Open Questions — to agree as a team

**Branch history & merge strategy.** We need a single agreed convention across all three repos. [git-conventions.md](./git-conventions.md) currently says "GitHub squash-or-merge" — ambiguous — and recent history shows actual merge commits. Resolve it and update that file. Two decisions:

1. **Force-pushing V not force-pushing to a feature branch during review.**
   - *Force-push (rebase) on review feedback:* keeps a clean, linear branch history; but it rewrites commits a reviewer may already have looked at, making "what changed since I last reviewed?" harder, and breaks anyone who pulled the branch.
   - *Only add new commits during review:* reviewers can see exactly what changed in response to feedback; history is messier (`fix review comment` commits) but honest. Often combined with squashing on merge so the mess doesn't reach `main`.

2. **How we merge to `main`.**
   - *Squash merge:* one tidy commit per ticket on `main`, easy to read and revert; loses the per-commit detail of how the change was built. Pairs naturally with "add commits during review" since the mess gets squashed away.
   - *Merge commit:* preserves the full branch history and an explicit merge point; `main` shows every intermediate commit, which can be noisy if branches aren't curated.
   - *Rebase merge:* linear `main` with all individual commits preserved; requires authors to curate clean, atomic commits, which takes discipline.

**Suggested default to ratify:** add commits during review (don't force-push), **squash merge** to `main`. This gives reviewers an honest diff during review and a clean, revertable history on `main`, with the least process overhead — but the team should confirm or override this, and then apply the same setting to all three repos.

## Rules
- **Keep tickets small** — a ticket may span the frontend, backend, and tests repos, but anything that feels larger than ~2 days should be split. Split oversized tickets at refinement; if a ticket turns out bigger than expected once work starts, stop and split it rather than letting it sprawl.
- **Limit WIP** — finish before starting.
- **Blockers are loud** — raise immediately, not at stand-up.
- **Flaky tests are bugs** — quarantine + ticket within 24h.
- **Break the build, fix the build** — red `main` is top priority.
- **Review within one working day.**
- **Re-refine, don't drift** — scope change means pause and re-agree.
- All changes via PR; `main` is protected; cross-repo changes coordinated through the tests repo.

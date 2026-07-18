# Session 6: the `npm-upgrade` skill

**Objective:** Bring non-govuk npm dependencies up to date across the repos — safe bumps automated, breaking ones walked.

Companion deck: `06-npm-upgrade.pptx`.

## What it's for

Keeping dependencies current is one of those jobs that's individually small and collectively miserable: find what's outdated across the repos, work out which bumps are safe and which will break, run the tests, and don't lose your place when one of them blows up halfway.

npm-upgrade does the safe, mechanical bumps for you — install, test, commit, roll back on failure — and triages the rest, so the only upgrades that reach your desk are the ones that genuinely need a human. Everything stays local until you're happy.

What you get:

- **The boring bumps, automated** — safe upgrades installed, tested and committed for you
- **Breaking ones triaged** — you only handle what actually needs judgment
- **Nothing lost or pushed** — failures roll back; commits stay local for your review

## How you trigger it

You launch it in natural language: "upgrade npm deps" · "walk upgrade EUDPA-1234" · "implement upgrade EUDPA-1234"

## Watch it run

1. **Phase 1 — discover & classify** — on a ticket branch it finds every outdated package and classifies each as auto (no code change) or manual (breaking). It stops at a gate for you to approve.
2. **Phase 2 — auto upgrades** — for each auto package: baseline test, bump, re-test, commit if green, roll back if not. Anything that breaks is demoted to manual. Another gate.
3. **Phase 3 — handoff** — it produces a single list of everything left for a human — the manual ones plus any auto that failed.
4. **Walk the manual ones** — one keystroke-driven table: I to implement (a worker edits, tests, commits), D to defer to a follow-up, S to skip.

## Reading the output

Per-repo state plus real (unpushed) commits.

- `packages.<repo>.json` — one row per package — classification, risk, status, commit SHA
- `feature/EUDPA-X-npm-...` — a branch per repo, one commit per successful upgrade
- `the gate reports` — presented verbatim at each phase boundary for you to approve

## How you use it

- **Reach for it when** — you're on a dependency-refresh ticket and want the safe bumps off your plate
- **Where you decide** — two phase gates plus the manual walk — you approve before anything proceeds
- **How it fits** — use govuk-upgrade for govuk-frontend; this covers everything else

## Live view

Don't memorise the surface — read the current version:

- `upgrade npm deps · walk upgrade` — start the run, or walk the manual ones
- `.claude/skills/npm-upgrade/SKILL.md` — the phase and walker detail
- `the counts / list view` — state at a glance: classification x status x risk

Two gates (Phase 1 to 2, Phase 2 to 3) plus the manual walk keep you in control. Nothing is pushed — commits stay local for review.

## Try it

On a repo checked out to a ticket branch, say "upgrade npm deps" and stop at the Phase 1 gate to inspect the auto-vs-manual split before it touches anything.

Next: [Session 7 — the `govuk-upgrade` skill](07-govuk-upgrade.md).

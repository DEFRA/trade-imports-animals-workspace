# Session 7: the `govuk-upgrade` skill

**Objective:** Upgrade govuk-frontend across the Node repos one semver version at a time, each step driven by its CHANGELOG.

Companion deck: `07-govuk-upgrade.pptx`.

## What it's for

govuk-frontend moves fast, and skipping several versions at once hides the breaking changes inside it — a renamed Nunjucks macro here, a dropped utility class there, altered component markup somewhere else — scattered across every Node repo that uses it. Big-bang upgrades turn into a day of whack-a-mole.

govuk-upgrade walks the versions one at a time. For each release it reads the CHANGELOG, plans the exact per-repo edits, and applies them in order — so every step is small, reviewable, and tied back to the change that caused it.

What you get:

- **No skipped breakage** — every intermediate version handled, not just the target
- **CHANGELOG-driven** — each edit traces back to the release note that caused it
- **Bisectable history** — one commit per version — easy to review and to revert

## How you trigger it

You launch it in natural language: "upgrade govuk-frontend" · "walk govuk EUDPA-1234" · "implement govuk EUDPA-1234"

## Watch it run

1. **Discover** — "upgrade govuk-frontend EUDPA-1234" finds every repo using it, branches them, and lays out the ladder of versions between current and target.
2. **Plan per version** — for each release it reads the CHANGELOG and writes a plan — which files change in each repo and why, or marks the version a no-op.
3. **Walk the plans** — optionally, "walk govuk EUDPA-1234" shows every pending plan in one table to Apply, Skip, Discuss or Quarantine.
4. **Apply in order** — "implement govuk EUDPA-1234" works strictly version by version — bump, install, test, commit — never jumping ahead.
5. **Verify** — the end-to-end tests run once at the end, then it writes a final report.

## Reading the output

Per-run plans and a clean, bisectable history.

- `versions.<repo>.json` — the version ladder and planned changes per repo
- `per-version plans` — rendered markdown — file-by-file changes and rationale
- `one commit per version` — the upgrade reads as a clean, bisectable branch history

## How you use it

- **Reach for it when** — govuk-frontend is several versions behind and you want a safe upgrade
- **Where you decide** — you review the per-version plans before applying, and can skip or quarantine any
- **How it fits** — the govuk-only counterpart to npm-upgrade

## Live view

Don't memorise the surface — read the current version:

- `upgrade govuk-frontend · walk govuk` — plan, review, then apply
- `.claude/skills/govuk-upgrade/SKILL.md` — the current surface and triggers
- `govuk status EUDPA-X` — live state on a real run

## Try it

On a throwaway branch, run "upgrade govuk-frontend" and let it finish discovery and planning only. Read one rendered version plan to see the CHANGELOG-derived, per-repo changes before applying anything.

Next: [Session 8 — the `skill-creator` skill](08-skill-creator.md).

---
name: ticket
description: 'Plan, implement, or refactor work for an existing Jira ticket (EUDPA-XXXXX). Triggers: "plan EUDPA-", "implement EUDPA-", "build EUDPA-", "follow the plan", "refactor", "tidy up". NOT for creating tickets (ticket-creator), refinement readiness (ticket-refiner), or PR review (review / code-style).'
---

Plan, implement, or refactor work for an existing Jira ticket. Three
peer phases split on verb — follow the matching reference:

| Verb | Phase | Follow |
|---|---|---|
| plan / scope / "how should I" | PLAN | `references/PLANNER.md` — produces `workareas/ticket-planning/EUDPA-X/plan.md`; no implementation |
| implement / build / follow the plan | IMPLEMENT | `references/IMPLEMENTOR.md` — reads the plan, makes the change, raises a PR, verifies via GitHub Actions |
| refactor / tidy / clean | REFACTOR | `references/REFACTORER.md` — post-GREEN tidy-up; tests stay green throughout |

NOT for creating tickets (`ticket-creator`), refinement readiness
(`ticket-refiner`), or reviewing PRs (`review` / `code-style`).

## Model

| Phase | Session role |
|---|---|
| PLAN | `plan` |
| IMPLEMENT | `implement` |
| REFACTOR | `refactor` (same tier as implement) |

New chat per phase; pick model before triggering. Review uses a
**different** role — see `review` skill. Full map:
`~/git/defra/trade-imports-animals-workspace/docs/agent-models.md`.

## Conventions

One command per Bash call; literal `~/git/defra/trade-imports-animals-workspace/...`
paths (never `$VAR`, never resolved `/Users/...`); prefer Read/Glob/`jq` over
`awk`/`sed`/`find`. Full rules: `~/git/defra/trade-imports-animals-workspace/docs/agent-skills.md`.

## Shared context

- Scripts live under `~/git/defra/trade-imports-animals-workspace/tools/`
  (`ticket/`, `jira/`, `github/`, `github-actions/`); each reference
  names the ones it uses. Authenticate to Jira/GitHub first (umbrella:
  `~/git/defra/trade-imports-animals-workspace/tools/auth.sh`).
- The workarea for a ticket is
  `~/git/defra/trade-imports-animals-workspace/workareas/ticket-planning/EUDPA-X/`:
  `ticket.md` + `.plan-meta.json` + `best-practices/<repo>.md` (written
  by `prepare-plan.sh`), `plan.md` (PLANNER writes, IMPLEMENTOR reads,
  both may amend), `.implement-meta.json` + `.diffs/<repo>.diff`
  (written by `prepare-implement.sh`).
- Best practices: `prepare-*.sh` pre-bakes per-repo bundles from
  `docs/best-practices/` based on detected tech. Load only what applies
  to the repo being worked on.

## Don'ts

- Don't skip tests.
- Don't proceed with red on main.

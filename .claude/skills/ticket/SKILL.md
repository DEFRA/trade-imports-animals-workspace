---
name: ticket
description: 'Plan, implement, or refactor work for an existing Jira ticket (EUDPA-XXXXX) end-to-end. Use when the user asks to scope, plan, build, follow a plan for, refactor, tidy up, or clean code for a specific ticket (triggers: "plan EUDPA-", "how should I implement EUDPA-", "implement EUDPA-", "build EUDPA-", "follow the plan", "refactor", "tidy up", "clean"). Covers the full plan -> implement -> refactor cycle for one existing ticket. NOT for creating new tickets (use ticket-creator), NOT for assessing whether a ticket is ready for refinement (use ticket-refiner), NOT for reviewing an existing PR (use review or code-style).'
---

Plan, implement, or refactor work for an existing Jira ticket. Three
peer phases share triggers but split on verb.

## When to use

| Verb | Phase |
|---|---|
| plan / scope / "how should I" | PLAN |
| implement / build / follow the plan | IMPLEMENT |
| refactor / tidy / clean | REFACTOR |

NOT for creating new tickets — use `ticket-creator`. NOT for assessing
whether a ticket is ready for refinement — use `ticket-refiner`. NOT for
reviewing someone's PR — use `review` (correctness across languages) or
`code-style` (JS lint/style).

## Path conventions

Cross-workspace paths reference the `TRADE_IMPORTS_WORKSPACE` env var
directly — `$TRADE_IMPORTS_WORKSPACE/tools/<domain>/`,
`$TRADE_IMPORTS_WORKSPACE/docs/best-practices/`,
`$TRADE_IMPORTS_WORKSPACE/workareas/`. The env var must be set in
your shell profile; see [`docs/agent-onboarding.md`](../../../docs/agent-onboarding.md)
for setup. Scripts bail with a clear error if it's unset. Skill-internal
references stay relative (`references/<NAME>.md`, `assets/<NAME>.md`);
subagents are addressed by name via the Task tool.

## Phases

### Plan

If the user asks to plan / scope / "how should I" an EUDPA ticket,
follow `references/PLANNER.md`. Produces
`$TRADE_IMPORTS_WORKSPACE/workareas/ticket-planning/EUDPA-X/plan.md`. No
implementation.

### Implement

If the user asks to build / implement / follow the plan, follow
`references/IMPLEMENTOR.md`. Reads the plan, makes the change, raises a
PR. Verifies via GitHub Actions.

### Refactor

If the user asks to refactor / tidy / clean code (post-GREEN tidy-up),
follow `references/REFACTORER.md`. Tests must stay green throughout.

## Shared tooling

All under `$TRADE_IMPORTS_WORKSPACE/tools/` per CC-3:

| Domain | Used by | Purpose |
|---|---|---|
| `tools/jira/` (`ticket.sh`, `comments.sh`, `add-comment.sh`, `transition-ticket.sh`) | PLANNER, IMPLEMENTOR | Fetch ticket + comments; post completion comments; transition status |
| `tools/github/` (`prs.sh`, `pr-details.sh`, `diff.sh`) | IMPLEMENTOR | PR creation context + inspection |
| `tools/github-actions/` (`trigger-workflow.sh`, `wait-for-run.sh`, `get-failure.sh`, `run-status.sh`, `get-logs.sh`) | IMPLEMENTOR | CI verification |
| `tools/review/detect-tech.sh` | PLANNER, IMPLEMENTOR | Detect repo tech stack + emit best-practices paths under `docs/best-practices/` |

Authenticate to Jira/GitHub before fetching (or run the umbrella
`$TRADE_IMPORTS_WORKSPACE/tools/auth.sh`).

## Best practices

PLANNER and IMPLEMENTOR cite a subset of
`$TRADE_IMPORTS_WORKSPACE/docs/best-practices/` based on detected tech. The
universe spans `gds/`, `java/`, `node/`, `playwright/`, `k6/`,
`rest-api/`, `doc-comments/`, and `docker-compose.md`. Load only what
applies to the repo being worked on.

## Workareas

| Path | Purpose |
|---|---|
| `$TRADE_IMPORTS_WORKSPACE/workareas/ticket-planning/EUDPA-X/plan.md` | PLANNER writes; IMPLEMENTOR reads; both may amend with deviations |

## Skill-level don'ts

- Don't create new tickets — that's `ticket-creator`.
- Don't assess refinement readiness — that's `ticket-refiner`.
- Don't review someone else's PR — that's `review` / `code-style`.
- Don't skip tests.
- Don't proceed with red on main.

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

Cross-workspace paths use the literal home-relative form —
`~/git/defra/trade-imports-animals/tools/<domain>/`,
`~/git/defra/trade-imports-animals/docs/best-practices/`,
`~/git/defra/trade-imports-animals/workareas/`. Bash expands `~` to
your home directory automatically. Scripts under `tools/` still use
the `$TRADE_IMPORTS_WORKSPACE` env var internally — set it in your
shell profile, see [`docs/agent-onboarding.md`](../../../docs/agent-onboarding.md).
Skill-internal references stay relative
(`references/<NAME>.md`, `assets/<NAME>.md`); subagents are addressed
by name via the Task tool.

**Bash call hygiene** (avoid permission prompts):
- Invoke scripts via the literal `~/git/defra/trade-imports-animals/tools/...` path. Never `cd <workspace> && tools/...` or bare `tools/...` — neither matches the allowlist.
- One Bash call per script invocation. Don't chain with `&&` or `;` — the matcher treats the whole string as a single command, and chained forms aren't allowlisted.
- Use `git -C <dir> ...` for git on workspace repos. Never `cd <dir> && git ...` (Claude Code's safety check blocks it — cd-then-git could run untrusted hooks).
- Use the Read tool (with `offset` + `limit`) to peek at file contents — not `awk`, `sed -n`, or `grep -n` pipes.
- No `find ... -exec ...` for reading files — Claude Code refuses to prefix-allowlist `-exec` forms. Use the Glob tool to locate, then Read.
- Filter at the script, not at the pipe. If a helper lacks the `--filter` / `--file` / `--repo` flag you need, propose extending it; don't reach for `tools/... | awk`.
- Don't reach for `python3 -c "..."` or other ad-hoc tools to query workspace JSON — use `jq` or the helpers under `tools/`.

Full rule table: [`docs/agent-skills.md`](../../../docs/agent-skills.md) → "Bash call hygiene".

## Phases

### Plan

If the user asks to plan / scope / "how should I" an EUDPA ticket,
follow `references/PLANNER.md`. Produces
`~/git/defra/trade-imports-animals/workareas/ticket-planning/EUDPA-X/plan.md`. No
implementation.

### Implement

If the user asks to build / implement / follow the plan, follow
`references/IMPLEMENTOR.md`. Reads the plan, makes the change, raises a
PR. Verifies via GitHub Actions.

### Refactor

If the user asks to refactor / tidy / clean code (post-GREEN tidy-up),
follow `references/REFACTORER.md`. Tests must stay green throughout.

## Shared tooling

All under `~/git/defra/trade-imports-animals/tools/` per CC-3:

| Domain | Used by | Purpose |
|---|---|---|
| `tools/jira/` (`ticket.sh`, `comments.sh`, `add-comment.sh`, `transition-ticket.sh`) | PLANNER, IMPLEMENTOR | Fetch ticket + comments; post completion comments; transition status |
| `tools/github/` (`prs.sh`, `pr-details.sh`, `diff.sh`) | IMPLEMENTOR | PR creation context + inspection |
| `tools/github-actions/` (`trigger-workflow.sh`, `wait-for-run.sh`, `get-failure.sh`, `run-status.sh`, `get-logs.sh`) | IMPLEMENTOR | CI verification |
| `tools/review/detect-tech.sh` | PLANNER, IMPLEMENTOR | Detect repo tech stack + emit best-practices paths under `docs/best-practices/` |

Authenticate to Jira/GitHub before fetching (or run the umbrella
`~/git/defra/trade-imports-animals/tools/auth.sh`).

## Best practices

PLANNER and IMPLEMENTOR cite a subset of
`~/git/defra/trade-imports-animals/docs/best-practices/` based on detected tech. The
universe spans `gds/`, `java/`, `node/`, `playwright/`, `k6/`,
`rest-api/`, `doc-comments/`, and `docker-compose.md`. Load only what
applies to the repo being worked on.

## Workareas

| Path | Purpose |
|---|---|
| `~/git/defra/trade-imports-animals/workareas/ticket-planning/EUDPA-X/plan.md` | PLANNER writes; IMPLEMENTOR reads; both may amend with deviations |

## Skill-level don'ts

- Don't create new tickets — that's `ticket-creator`.
- Don't assess refinement readiness — that's `ticket-refiner`.
- Don't review someone else's PR — that's `review` / `code-style`.
- Don't skip tests.
- Don't proceed with red on main.

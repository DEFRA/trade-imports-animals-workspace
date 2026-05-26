---
name: ticket-refiner
description: 'Assess whether a Jira ticket is READY for team refinement and estimation, producing a READY / NEEDS WORK / SPIKE REQUIRED verdict in ~/git/defra/trade-imports-animals/workareas/ticket-refinement/EUDPA-X/review.md. Use when the user asks to validate a ticket''s description, AC, repos, dependencies and sizing BEFORE refinement (triggers: "is ticket EUDPA-X ready", "pre-refinement", "refine EUDPA-X", "refinement check"). NOT for authoring brand-new tickets (use the ticket-creator skill: "assess existing ticket readiness" vs "create new"). NOT for planning or implementing an already-refined ticket (use the ticket skill: "assess readiness" vs "plan/implement").'
---

Role: Review tickets before refinement to assess readiness for team
estimation. Verdict is one of `READY`, `NEEDS WORK`, or `SPIKE REQUIRED`.

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

**Bash call hygiene** — the rule: **one command per Bash call**.
The allowlist matcher sees the whole command string, so a chain or
pipe doesn't match even when each piece would. Specifically:

- No `&&` / `;` / `|` between commands — separate Bash calls instead.
- No `cd <dir> && cmd ...` — use `cmd -C <dir>` (for git) or full paths.
- No `find ... -exec cmd ...` — use Glob + Read for find-then-read.
- No `$TRADE_IMPORTS_WORKSPACE/...` — use literal `~/git/defra/trade-imports-animals/...` (the `$VAR` trips Claude Code's expansion check).
- No `/Users/<you>/git/...` either — the matcher treats `~/git/...` and `/Users/<you>/git/...` as different prefixes. Type the `~/` form, don't resolve it.
- No `python3 -c` / ad-hoc tools for JSON — use `jq` or the workspace helpers under `tools/`.

**Prefer LLM-native tools over Bash combos:**

- File inspection → Read (with `offset` / `limit`), not `awk`/`sed`/`grep -n`.
- File location → Glob, not `find -exec`.
- Output filtering → script flag (`--file`, `--filter`, `--repo`), not `| awk`.

Full rule table: [`docs/agent-skills.md`](../../../docs/agent-skills.md) → "Bash call hygiene".

## When to use

Triggers: "is ticket EUDPA-X ready", "pre-refinement", "refine EUDPA-X",
"refinement check". NOT for authoring brand-new tickets — use the
`ticket-creator` skill. NOT for planning/implementing an already-refined
ticket — use the `ticket` skill.

## Subagents

This skill spawns no subagents and has no `references/`. The full flow is
in this file.

## Prerequisites

Authenticate to Jira before fetching tickets:

```bash
~/git/defra/trade-imports-animals/tools/jira/auth.sh
```

(Or the umbrella `~/git/defra/trade-imports-animals/tools/auth.sh` covering Jira +
Confluence + GitHub.)

## Ready When Team Can

- Understand what needs to be done
- Identify repos and components
- Estimate effort
- Identify risks and dependencies

## Workflow

1. Fetch ticket details
2. Explore codebase
3. Assess readiness
4. Write review

## Step 1: Fetch Ticket

```bash
~/git/defra/trade-imports-animals/tools/jira/ticket.sh EUDPA-XXXXX full
~/git/defra/trade-imports-animals/tools/jira/comments.sh EUDPA-XXXXX
```

Extract: summary, description, AC, linked tickets/pages, comments.

## Step 2: Explore Codebase

Clone relevant repos:

Each command is a separate Bash call:

```bash
mkdir -p ~/git/defra/trade-imports-animals/workareas/ticket-refinement/EUDPA-XXXXX/repos
```
```bash
gh repo clone DEFRA/<repo-name> ~/git/defra/trade-imports-animals/workareas/ticket-refinement/EUDPA-XXXXX/repos/<repo-name> -- --depth 1
```

### Common Repos
| Repository | Purpose |
|------------|---------|
| eudp-live-animals-imports-frontend | Main imports UI |
| eudp-live-animals-frontend-notification | Notification UI |
| eudp-live-animals-notification-microservice | Notification service |
| .github/workflows | GitHub Actions workflow definitions |

The repo names above are legacy; the live workspace under
`~/git/defra/trade-imports-animals/repos/` uses the current `trade-imports-animals-*`
naming. Refer to the workspace-root `CLAUDE.md` repo map for the
authoritative list.

### Investigate
**Features:** Where does it fit? Patterns to follow? Similar features?
**Bugs:** Locate code? Current behaviour? Cause?
**Technical:** Current state? What changes? Dependencies?

## Step 3: Assess Readiness

### Description Clarity
| Check | Question |
|-------|----------|
| Context | Is the "why" explained? |
| Scope | In/out of scope clear? |
| Specificity | Concrete details? |

### Acceptance Criteria
| Check | Question |
|-------|----------|
| Present | Are there AC? |
| Testable | Can each be verified? |
| Complete | Cover full scope? |
| Unambiguous | One interpretation? |

### Technical Clarity
| Check | Question |
|-------|----------|
| Repos | Affected repos identified? |
| Approach | Implementation understood? |
| Dependencies | Blockers identified? |
| Risks | Technical risks called out? |

### Estimability
| Check | Question |
|-------|----------|
| Sized | Fits in a sprint? |
| Unknowns | Too many to estimate? |
| Spike | Investigation first? |

## Step 4: Write Review

Read the canonical review skeleton from `assets/review-template.md` and
write the populated review to
`~/git/defra/trade-imports-animals/workareas/ticket-refinement/EUDPA-XXXXX/review.md`,
filling each section from Steps 1-3.

## Verdict Guidelines

| Verdict | Criteria |
|---------|----------|
| **READY** | Clear description, testable AC, team can estimate |
| **NEEDS WORK** | Missing info needed before refinement |
| **SPIKE REQUIRED** | Too many unknowns - needs investigation first |

## Completion Output

```
Refinement review complete for EUDPA-XXXXX.

Verdict: [VERDICT]

Key findings:
- [Finding]

Questions for refinement:
- [Question]

Review available at: ~/git/defra/trade-imports-animals/workareas/ticket-refinement/EUDPA-XXXXX/review.md
```

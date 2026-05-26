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
your home directory automatically. Scripts under `tools/` hardcode the workspace path as
`$HOME/git/defra/trade-imports-animals/...` — no env var needed.
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

1. Prepare workspace (one helper call — fetches Jira ticket + comments + Confluence links, seeds meta JSON, stubs `review.md`)
2. Explore codebase (read directly from `~/git/defra/trade-imports-animals/repos/<repo>/`)
3. Assess readiness
4. Write review
5. Finalise verdict

## Step 1: Prepare Workspace

```bash
~/git/defra/trade-imports-animals/tools/refine/prepare-refinement.sh EUDPA-XXXXX
```

This produces, under `~/git/defra/trade-imports-animals/workareas/ticket-refinement/EUDPA-XXXXX/`:

- `ticket.md` — summary, description, AC, comments, Confluence references (from Jira JSON)
- `.refinement-meta.json` — ticket fields + `verdict: null` (finalised in Step 5)
- `review.md` — pre-populated stub from `assets/review-template.md`

Read `ticket.md` to internalise the summary, AC and comments. The helper has already substituted `[Date]`, `[Ticket summary]`, type and priority into the review stub.

## Step 2: Explore Codebase

The workspace already has the canonical clones at
`~/git/defra/trade-imports-animals/repos/<repo>/`. Read directly from those
working trees when you need to peek at code — do **not** clone anywhere.
See the workspace `CLAUDE.md` repo map for the authoritative repo list
(`trade-imports-animals-frontend`, `-backend`, `-admin`, `-tests`,
`trade-imports-stub`, `trade-imports-reference-data`).

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

`prepare-refinement.sh` already stubbed
`~/git/defra/trade-imports-animals/workareas/ticket-refinement/EUDPA-XXXXX/review.md`
from `assets/review-template.md`. Fill each section in place from
Steps 1-3 — `## Description Summary`, `## Acceptance Criteria`,
`## Codebase Investigation`, `## Readiness Assessment`,
`## Questions for Refinement`, `## Suggested Improvements`, and the
trailing `## Verdict` block.

## Step 5: Finalise Verdict

After filling `review.md`, record the verdict on the meta JSON so
batch mode (`refine-batch.sh`) can query it:

```bash
~/git/defra/trade-imports-animals/tools/refine/refine-finalize.sh EUDPA-XXXXX --verdict READY --reason "Clear AC, repos identified"
```

Verdict must be one of `READY`, `NEEDS WORK`, `SPIKE REQUIRED` (the
helper rejects anything else). The `--reason` is optional but
recommended.

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

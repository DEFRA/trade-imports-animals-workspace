---
name: ticket-creator
description: 'Create a new Jira ticket (Bug/Story/Task) end-to-end — gathers requirements via GDS plain-English questions, drafts the ticket to ${WORKSPACE_ROOT}/workareas/ticket-creation/<slug>/draft.md for user iteration, then creates it in Jira via the shared create-ticket script. Use when the user wants to raise, file, log, open or otherwise create a new Jira ticket from scratch (triggers: "create ticket", "raise ticket", "new ticket", "file a bug", "log a story", "open a ticket"). NOT for working an existing ticket (use the ticket skill) and NOT for assessing whether an existing ticket is refinement-ready (use the ticket-refiner skill).'
---

Role: Help create well-structured, actionable Jira tickets.

## Path conventions

Resolve `WORKSPACE_ROOT` once per session from the `TRADE_IMPORTS_WORKSPACE`
env var, falling back to the canonical clone path under `$HOME`:

```bash
WORKSPACE_ROOT="${TRADE_IMPORTS_WORKSPACE:-$HOME/git/defra/trade-imports-animals-workspace}"
```

Set `TRADE_IMPORTS_WORKSPACE` in your shell profile if your local
checkout lives elsewhere. See `docs/agent-onboarding.md` for the full
env-var setup. Cross-workspace paths use `${WORKSPACE_ROOT}/...`: scripts
under `tools/<domain>/`, best-practices under `docs/best-practices/`,
workareas under `workareas/`. Skill-internal references stay relative
(`references/<NAME>.md`, `assets/<NAME>.md`); subagents are addressed by
name via the Task tool.

## Writing Style (GDS)

- Plain English - avoid jargon
- Active voice - "Remove the variables" not "The variables should be removed"
- Short sentences
- Be concise

## Workflow

1. Gather information
2. Determine type and fields
3. Draft ticket to `${WORKSPACE_ROOT}/workareas/ticket-creation/<slug>/draft.md`
4. Iterate on draft with user
5. Create ticket from final draft

`<slug>` is a short kebab-case identifier derived from the summary (e.g.
`commodity-code-validation`). If the ticket is in response to an existing
parent epic, prefix with the epic key (e.g. `EUDPA-9888-rotate-jenkins-token`).

## Step 1: Gather Information

### Required Questions
| Question | Purpose |
|----------|---------|
| Type (Bug/Story/Task)? | Template |
| One-line summary? | Summary field |
| Context - why needed? | Description |
| Acceptance criteria? | AC section |

### For Bugs
- Environment (TST/SND/PRD/vNet)?
- Steps to reproduce?
- Expected vs actual?
- Screenshots/logs?

### For Stories
- User and goal?
- Feature flag?
- Design mockups?

### For Tasks
- Tech debt or feature-related?
- Services affected?
- Related tickets?

## Step 2: Determine Fields

| Field | How to Determine |
|-------|------------------|
| Type | Bug=broken, Story=user-facing, Task=technical |
| Summary | <80 chars, specific, action-oriented |
| Priority | Highest/High=blocking; Medium=normal; Low/Lowest=nice-to-have |

### Labels
| Label | When |
|-------|------|
| technicalImprovement | Tech debt |
| DevOps | Pipeline/CI/CD |
| LiveIncidents | Production issues |

## Step 3: Write Description

Jira wiki syntax: `*bold*`, `+*underlined bold*+`, `{{monospace}}`,
`* bullet`, `# numbered`.

Pick the template that matches the chosen Type and read its body from
`assets/templates/<type>.md`:

| Type | Template file |
|------|---------------|
| Bug | `assets/templates/bug.md` |
| Story | `assets/templates/story.md` |
| Task | `assets/templates/task.md` |

Substitute the bracketed placeholders with the answers from Step 1. Keep
the section ordering as the template defines it — convention across the
team. Wiki-colour blocks (`{color:...}`, `{panel:...}`) render natively in
Jira; preserve them verbatim.

## Step 4: Iterate on Draft

Write the draft to `${WORKSPACE_ROOT}/workareas/ticket-creation/<slug>/draft.md`:

```markdown
# Ticket Draft: <slug>

**Type:** [Bug/Story/Task]
**Summary:** [Summary]
**Priority:** [Priority]
**Parent:** [Epic or None]
**Labels:** [labels or None]
**Assignee:** [Self or None]

## Description
[Wiki markup body — see assets/templates/<type>.md]

## Open Questions
- [Anything still missing or ambiguous]

## Status
DRAFT — awaiting user approval
```

Show the draft path to the user, summarise what is in it, and ask:

> Draft at `${WORKSPACE_ROOT}/workareas/ticket-creation/<slug>/draft.md`.
> Review and tell me what to change, or say "create it" to proceed.

Edit the file in place as the user gives feedback. Only move to Step 5 once
the user explicitly approves. Update the **Status** line to `APPROVED`
before creating.

## Step 5: Create Ticket

```bash
${WORKSPACE_ROOT}/tools/jira/create-ticket.sh [options] "Summary" "Description"
```

| Flag | Description | Default |
|------|-------------|---------|
| -t, --type | Bug/Story/Task | Task |
| -p, --parent | Epic key | None |
| -P, --priority | Lowest-Highest | Medium |
| -l, --label | Add label (repeatable) | None |
| -a | Self-assign | No |

### After Creation

Append the new key and link to the bottom of `draft.md` and update
**Status** to `CREATED: EUDPA-XXXXX`.

```
Ticket created: EUDPA-XXXXX
Link: ${JIRA_BASE_URL}/browse/EUDPA-XXXXX
Draft retained at: ${WORKSPACE_ROOT}/workareas/ticket-creation/<slug>/draft.md
```

## Good Acceptance Criteria

**Good:**
- API returns 400 when commodity code <6 digits
- Error displays: "Commodity code must be at least 6 digits"
- Page loads in <2 seconds

**Bad:**
- Code is clean (vague)
- Performance is good (not measurable)

## Tech Debt Board (862)

- Always use `technicalImprovement` label
- Always use `Lowest` priority
- Common epics: EUDPA-17736 (Accessibility), EUDPA-20628 (QA Automation)

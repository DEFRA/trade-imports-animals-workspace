---
name: ticket-creator
description: 'Create a new Jira ticket (Bug/Story/Task) end-to-end — gathers requirements via GDS plain-English questions, drafts the ticket to ~/git/defra/trade-imports-animals/workareas/ticket-creation/<slug>/draft.md for user iteration, then creates it in Jira via the shared create-ticket script. Use when the user wants to raise, file, log, open or otherwise create a new Jira ticket from scratch (triggers: "create ticket", "raise ticket", "new ticket", "file a bug", "log a story", "open a ticket"). NOT for working an existing ticket (use the ticket skill) and NOT for assessing whether an existing ticket is refinement-ready (use the ticket-refiner skill).'
---

Role: Help create well-structured, actionable Jira tickets.

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

## Writing Style (GDS)

- Plain English - avoid jargon
- Active voice - "Remove the variables" not "The variables should be removed"
- Short sentences
- Be concise

## Workflow

1. Gather information
2. Determine type and fields
3. Draft ticket to `~/git/defra/trade-imports-animals/workareas/ticket-creation/<slug>/draft.md`
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

Write the draft to `~/git/defra/trade-imports-animals/workareas/ticket-creation/<slug>/draft.md`:

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

> Draft at `~/git/defra/trade-imports-animals/workareas/ticket-creation/<slug>/draft.md`.
> Review and tell me what to change, or say "create it" to proceed.

Edit the file in place as the user gives feedback. Only move to Step 5 once
the user explicitly approves. Update the **Status** line to `APPROVED`
before creating.

## Step 5: Create Ticket

```bash
~/git/defra/trade-imports-animals/tools/jira/create-ticket.sh [options] "Summary" "Description"
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
Draft retained at: ~/git/defra/trade-imports-animals/workareas/ticket-creation/<slug>/draft.md
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

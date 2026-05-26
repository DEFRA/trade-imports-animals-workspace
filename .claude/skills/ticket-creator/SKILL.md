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

## Session start — Read these once

Before the interview, Read these references so the rules are in
context for the whole session:

- `~/git/defra/trade-imports-animals/docs/best-practices/gds/writing.md`
  — GDS plain-English rules for ticket prose.
- `~/git/defra/trade-imports-animals/docs/best-practices/jira/ticket-conventions.md`
  — Type / priority / AC / named-conventions guidance for the EUDPA
  project.
- `~/git/defra/trade-imports-animals/.claude/skills/ticket-creator/assets/known-labels.md`
  — accepted EUDPA-project Jira labels (camelCase canonical form).

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

Ask each question on its own turn — the interview is intentionally
serial, not a single batched form. Each answer informs the next
question.

### Required Questions
| Question | Purpose |
|----------|---------|
| Type (Bug/Story/Task)? | Template |
| One-line summary? | Summary field |
| Context - why needed? | Description |
| Acceptance criteria? | AC section |

### Named-convention offer (opt-in)

After Type is answered, if **Type == Task**, ask once:

> Is this an EUDPA Tech Debt Board ticket? (y/N)

If the user answers **yes**, apply the Tech Debt Board bundle defined
in `docs/best-practices/jira/ticket-conventions.md` without re-asking
each field:

- Label: `technicalImprovement`
- Priority: `Lowest`
- Suggest parent epic: `EUDPA-17736` (Accessibility) or `EUDPA-20628`
  (QA Automation) — still confirm the choice with the user.

If the user answers **no** (or anything other than yes), proceed
through the rest of the interview asking each field individually.

Named conventions are **opt-in only** — never auto-apply the bundle.
Do not introduce other named conventions in this skill.

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

camelCase canonical form (e.g. `technicalImprovement`, not
`tech-improvement`). Pick from the catalogue at
`~/git/defra/trade-imports-animals/.claude/skills/ticket-creator/assets/known-labels.md`
— prefer reusing an existing label over coining a new one.

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

## References

- AC style and examples — see
  `~/git/defra/trade-imports-animals/docs/best-practices/jira/ticket-conventions.md`
  (free-form bullets; no Gherkin mandate).
- Named conventions (Tech Debt Board bundle etc.) — same doc, "Named
  conventions" section.

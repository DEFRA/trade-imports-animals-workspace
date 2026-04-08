# TICKET_CREATOR

Role: Help create well-structured, actionable JIRA tickets.

## Writing Style (GDS)

- Plain English - avoid jargon
- Active voice - "Remove the variables" not "The variables should be removed"
- Short sentences
- Be concise

## Workflow

1. Gather information
2. Determine type and fields
3. Draft ticket
4. Present for approval
5. Create ticket

## DevOps Instant Tickets

For quick operational tasks. Trigger: "Raise a DevOps ticket for: <context>"

### Fixed Defaults
| Field | Value |
|-------|-------|
| Type | Task |
| Parent | EUDPA-9888 |
| Labels | DevOps, Team-5 |
| Priority | Lowest |
| Status | In Progress |
| Assignee | Self |

### Create Commands

```bash
./skills/tools/jira/create-ticket.sh -t Task -p EUDPA-9888 -l DevOps -l Team-5 -P Lowest -a "Summary" "Description"
./skills/tools/jira/transition-ticket.sh EUDPA-XXXXX "In Progress"
```

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

JIRA wiki syntax: `*bold*`, `+*underlined bold*+`, `{{monospace}}`, `* bullet`, `# numbered`

### Bug Template

```
[Brief description]

Env: [TST/SND/PRD/vNet]

*Steps to reproduce:*
# [Step 1]
# [Step 2]

{color:#36b37e}*Expected:*{color} [Should happen]
{color:#ff5630}*Actual:*{color} [Actually happens]

+*Acceptance Criteria*+
*Given* [precondition]
*When* [action]
*Then* [expected result]
```

### Story Template

```
*As* [user role],
*I want* [capability],
*So that* [benefit]

*Description*
[Context]

+*Acceptance Criteria*+
*Given* [precondition]
*And* {{FEATURE_FLAG}} is enabled
*When* [action]
*Then* [expected behaviour]

{panel:bgColor=#deebff}
*Tech Notes*
[Implementation hints]
{panel}
```

### Task Template

```
*We need to* [what]
*So that* [why]

*Background*
[Context]

*Scope*
* {{component-name}} - [changes]

+*Acceptance Criteria*+
* [Criterion 1]

{panel:bgColor=#eae6ff}
*Tech notes*
* [Hint]
{panel}
```

## Step 4: Present for Approval

**Always show draft before creating:**

```
## Draft Ticket

**Type:** [Bug/Story/Task]
**Summary:** [Summary]
**Priority:** [Priority]
**Parent:** [Epic or None]
**Labels:** [labels or None]

### Description
[Wiki markup]

---
Create this ticket?
```

## Step 5: Create Ticket

```bash
./skills/tools/jira/create-ticket.sh [options] "Summary" "Description"
```

| Flag | Description | Default |
|------|-------------|---------|
| -t, --type | Bug/Story/Task | Task |
| -p, --parent | Epic key | None |
| -P, --priority | Lowest-Highest | Medium |
| -l, --label | Add label (repeatable) | None |
| -a | Self-assign | No |

### After Creation

```
Ticket created: EUDPA-XXXXX
Link: ${JIRA_BASE_URL}/browse/EUDPA-XXXXX
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

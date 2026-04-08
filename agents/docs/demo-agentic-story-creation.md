# Demo: Agentic Story Creation (30 min)

From a single feature idea to a fully structured, linked, refinement-ready epic — live.

**Audience:** BAs, POs, Devs
**Tools used:** Claude Code, Jira API scripts, Confluence API scripts, Ticket Creator persona, Ticket Refiner persona

---

## Intro / Disclaimers

A few things to set expectations before we start:

- **Tooling workaround:** The Jira and Confluence integrations use bash scripts hitting the Atlassian REST APIs directly. This is a workaround because there's no official MCP (Model Context Protocol) connector for Atlassian yet. If/when that becomes available, the UX would be much cleaner — but the capabilities would be the same.
- **Interface choice:** I normally use Claude Code as a terminal/TUI tool, but for this demo I'm using the Claude Desktop Code interface in the hope it's less intimidating for non-technical folks.
- **Not claiming expertise:** I'm not presenting this as a polished product. It's been useful for me personally, and some of the other agentic workflows I've built (code review, npm upgrades) are more mature. This ticket creation and refinement stuff is newer.
- **Next steps:** The natural evolution here would be improving the personas with input from BAs, POs, and the wider team — the templates, the questions it asks, the quality bar for ACs. That's where this gets really powerful.
- **The real value is the integration:** The fact this works on _our_ project, with _our_ Jira, _our_ Confluence, _our_ repos and accesses, all joined up — that's what makes it useful. It's not a generic demo. It understands our codebase, our ticket conventions, and our workflows.

---

## The Feature

> "We want a new dashboard page in EUDP Live Animals that gives inspectors and managers an at-a-glance view of how many CHEDs are in each status, broken down by CHED type."

### Why this example works

- Everyone in the room knows what CHEDs and statuses are
- It's a realistic feature shape: frontend + backend + data + access control
- It decomposes naturally into stories with dependencies
- It touches well-known repos (notification-microservice, frontend-notification)

### CHED types

CHEDA, CHEDD, CHEDP, CHEDPP

### Statuses

| Status | Meaning |
|---|---|
| SUBMITTED | Awaiting processing |
| IN_PROGRESS | Being worked on |
| VALIDATED | Passed checks |
| REJECTED / PARTIALLY_REJECTED | Rejected |
| AMEND / MODIFY | Needs changes |
| CANCELLED | Cancelled |

### Repos involved

| Repository | Changes |
|---|---|
| eudp-live-animals-notification-microservice | New aggregation API endpoint |
| eudp-live-animals-frontend-notification | New dashboard page, route, controller, template |
| eudp-live-animals-imports-notification-schema | Shared DTO for aggregation response (if needed) |

---

## Demo Flow

### Act 1: Confluence ODP (5 min)

**Prompt:**

> "Create an ODP page for a new CHED status dashboard. Inspectors and managers need an at-a-glance view showing how many notifications are in each status, broken down by CHED type. Put it under the Open Design Proposals page."

**What the audience sees:**

- Agent asks clarifying questions (scope, user types, key considerations)
- Drafts the ODP with summary, context, proposed table layout, affected repos, open questions
- Creates the page as a child of the ODP index in Confluence
- Wiki markup rendered properly — can open it in the browser immediately

**Scripts used:**

- `create-page.sh -s IT -t "ODP XXX - CHED Status Dashboard" -p <parent-page-id>`
- `update-page.sh PAGE_ID -f content.wiki` (if iterating)

**Reference material:** The agent can read a relevant Confluence page (e.g. Permissions and Roles) to determine what accesses should be allowed on the new endpoints and pages — feeding real project context into the ODP and later into the story ACs.

**Key point:** Design documentation created before any Jira tickets — proposal first, then work breakdown.

---

### Act 2: Create the Epic (5 min)

**Prompt:**

> "Now create an epic in Jira for this feature."

**What the audience sees:**

- Agent uses the ODP content as context to draft the epic description
- Presents draft for approval — always human in the loop
- Creates it in Jira — epic appears on screen

**Script:** `create-ticket.sh -t Epic "CHED status dashboard"`

**Key point:** Nothing is created without approval. The epic description is grounded in the ODP.

---

### Act 3: Break Down into Stories (10 min)

**Prompt:**

> "Break this epic into stories with acceptance criteria."

**Expected stories:**

1. **Backend: Status count aggregation API** — new endpoint in notification-microservice returning counts grouped by CHED type and status
2. **Frontend: Dashboard page and routing** — new page at /dashboard using GDS layout
3. **Frontend: Status breakdown table component** — GDS-styled table, cells link to filtered search
4. **Access control: Dashboard permissions** — role-based visibility (inspectors, port health, managers)
5. **E2E tests: Dashboard coverage** — Playwright tests for the new page

**What the audience sees:**

- Agent reasons about decomposition
- Creates each story under the epic with Given/When/Then ACs
- Adds subtasks to stories (e.g. "Write unit tests", "Add controller")
- Batch subtask creation from file (`add-subtask.sh EUDPA-X -f subtasks.txt`)
- Links dependencies between stories (e.g. API blocks Frontend)
- Shows the full epic view: `get-epic-issues.sh EUDPA-X`

**Scripts used:**

- `create-ticket.sh -t Story -p EUDPA-X "Story summary"`
- `add-subtask.sh EUDPA-X "Subtask summary"`
- `link-tickets.sh EUDPA-Y Blocks EUDPA-Z`
- `get-epic-issues.sh EUDPA-X`

**Key points:**

- BAs/POs: ACs are structured and testable, descriptions follow GDS plain English
- Devs: subtasks are practical, links capture real dependencies
- Everyone: minutes not hours

---

### Act 4: Refinement Check on a Real Ticket (8 min)

Switch gears — show that agents don't just work on tickets they created. They can join a flow that was manual up to this point.

**Prompt:**

> "Is EUDPA-20965 ready for refinement?"

**Why this ticket:**

- It's a real bug, currently Blocked, unassigned
- The description is vague — references another ticket (EUDPA-16865) for details rather than being self-contained
- No acceptance criteria
- It's the kind of ticket that would waste time in a refinement session without prep

**What the audience sees:**

- Agent fetches the ticket and its comments from Jira
- Follows the reference to EUDPA-16865 to understand the original fix
- Clones the relevant repos, investigates the auto-clearance and on-hold logic
- Assesses against a structured checklist:
  - Description clarity (context, scope, specificity)
  - AC quality (present, testable, complete, unambiguous)
  - Technical clarity (repos, approach, dependencies, risks)
  - Estimability (sprint-sized, unknowns, spike needed)
- Produces a verdict — likely **NEEDS WORK** given the missing ACs and vague description
- Identifies specific questions for the team and suggests improvements
- Includes technical notes with code locations

**Key narrative:** This is where the agent adds the most value for BAs and POs. A ticket that someone raised manually, with rough details — the agent investigates the codebase, cross-references linked tickets, and tells you exactly what's missing before you bring it to the team. No more wasted refinement sessions on half-baked tickets.

**Key points:**

- BAs/POs: get feedback before refinement, know what to add, avoid wasted sessions
- Devs: technical investigation is done upfront, code locations identified, related tickets reviewed
- Everyone: the agent fits into existing workflows — it doesn't need to own the whole chain

---

### Wrap-up & Q&A (2 min)

Summarise the chain:

```
Vague idea
  -> Structured epic
    -> Linked stories with ACs and subtasks
      -> Confluence documentation
        -> Refinement-ready with codebase investigation
```

---

## Pre-demo Checklist

- [ ] Run `./skills/tools/auth.sh` — confirm all services authenticated
- [ ] Have Jira open on a second screen
- [ ] Have Confluence open to the ODP index page
- [ ] Create a blank Confluence page to target (or create live)
- [ ] Decide: create tickets live or pre-create and walk through?
- [ ] Clean up any smoke test tickets from dry runs

## Tooling Reference

| Script | Purpose |
|---|---|
| `jira/create-ticket.sh` | Create Epic, Story, Task, Bug |
| `jira/add-subtask.sh` | Add subtasks (single or batch from file) |
| `jira/link-tickets.sh` | Link tickets (Blocks, Relates, Duplicates) |
| `jira/get-epic-issues.sh` | List all issues in an epic |
| `jira/update-ticket.sh` | Update fields, labels, description |
| `jira/transition-ticket.sh` | Move ticket through workflow |
| `confluence/create-page.sh` | Create new Confluence page |
| `confluence/update-page.sh` | Update existing Confluence page |
| `confluence/page.sh` | Read Confluence page |

## Personas Used

| Persona | File | Purpose |
|---|---|---|
| Ticket Creator | `personas/TICKET_CREATOR.md` | Structured ticket creation with templates |
| Ticket Refiner | `personas/TICKET_REFINER.md` | Pre-refinement readiness assessment |

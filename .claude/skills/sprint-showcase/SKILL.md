---
name: sprint-showcase
description: 'Generate a non-technical Google Slides showcase of a sprint''s completed (Done) work, built around audience themes — new features, improvements, reliability fixes, and quality/velocity wins — rather than one slide per ticket. Resolves the sprint from the Jira board (falling back to a date range), fans out one agent per completed ticket to research and categorise it, then synthesises a themed deck that sells how the product is developing and how fixes and technical work benefit stakeholders. Use when the user wants a stakeholder-facing sprint review deck (triggers: "sprint showcase", "sprint showcase EUDPA", "create sprint slideshow", "build sprint showcase", "sprint showcase deck", "showcase this sprint", "what did we ship this sprint deck"). Distinct from Claude Code''s built-in /init (CLAUDE.md scaffolding). NOT for a personal day/week achievement summary — use what-have-i-achieved. NOT for a whole-contract CV dossier — use career-evidence.'
---

Builds a non-technical **Google Slides** deck of a sprint's
**completed (Done)** work for a stakeholder audience. The deck is
organised by audience theme, not by ticket: one section per
category (new features, improvements, reliability fixes,
quality/velocity), with small tickets aggregated. The work-list is
the sprint's Done tickets across the trade-imports-animals
workspace and its `repos/`; each is researched and categorised by a
fan-out agent, and the parent synthesises the deck from those
analyses. State lands at
`~/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/<id>/`.

## Path conventions

Cross-workspace paths use the literal home-relative form —
`~/git/defra/trade-imports-animals-workspace/tools/<domain>/`,
`~/git/defra/trade-imports-animals-workspace/docs/best-practices/`,
`~/git/defra/trade-imports-animals-workspace/workareas/`. Bash
expands `~` automatically. Skill-internal references stay
relative (`references/<NAME>.md`, `assets/<NAME>.md`).

**Bash call hygiene** — one command per Bash call. Full rule
table: [`docs/agent-skills.md`](../../../docs/agent-skills.md)
→ "Bash call hygiene".

## When to use

| Trigger | What to follow |
|---------|----------------|
| "sprint showcase", "build sprint showcase", "create sprint slideshow", "sprint showcase deck", "showcase this sprint", "what did we ship this sprint deck" | this SKILL.md, Step 0 → Step 5 |

NOT for a personal day/week achievement summary — use the
`what-have-i-achieved` skill. NOT for a whole-contract CV dossier —
use `career-evidence`. NOT for CLAUDE.md scaffolding — that's the
built-in `/init`.

## State

Canonical state is JSON at
`~/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/<id>/state.json`.
Schema: `assets/sprint-showcase-schema.md`. Mutated only via
`tools/sprint-showcase/*.sh` helpers (atomic `jq ... > tmp; mv tmp file`).
The fan-out unit is the ticket; the slide unit is the category
theme.

## Worker references

| Persona | Used in | Artifact |
|---|---|---|
| `references/TICKET_ANALYST.md` | Step 3 (one per completed ticket, parallel up to 10) | per-ticket analysis (category + headline + user benefit + evidence) written into `state.json` via `ticket-set-analysis.sh` |

Spawn idiom — Task tool, `subagent_type: general-purpose`,
prompt begins:

```
Follow the instructions in ~/git/defra/trade-imports-animals-workspace/.claude/skills/sprint-showcase/references/TICKET_ANALYST.md.

--run-id <id>
--key EUDPA-XXXX
Context bundle: ~/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/<id>/context/EUDPA-XXXX/
```

## Step 0: Start — resolve the sprint window + seed completed tickets

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/start-sprint-showcase.sh --sprint "Sprint 23"
```

or, when the board has no sprint or you want an explicit window:

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/start-sprint-showcase.sh --from 2026-06-09 --to 2026-06-22
```

The dispatcher: resolves the window (Jira board sprint → date-range
fallback), finds the Done tickets in it, cross-references git
commits across the workspace + `repos/`, and seeds `state.json`
(`scope`, `repos`, `tickets[]` with `category: null`). First stdout
line is `MODE: SPRINT` or `MODE: DATE_RANGE` and it prints the
resolved `--run-id <id>`. Branch nothing on the mode beyond
reporting which window was used.

## Step 1: Pre-bake per-ticket context

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/prepare-sprint-showcase.sh --run-id <id>
```

Writes a context bundle per ticket under
`workareas/sprint-showcase/<id>/context/<key>/` (Jira summary +
description, commit messages + diffstat). Each `TICKET_ANALYST`
reads only its own bundle — no re-fetching (pattern 3).

## Step 2: Confirm scope with the user

Show the resolved window and the completed-ticket list. This is the
one human gate: confirm these are the tickets to showcase (the user
may want to drop noise — chores, reverts). Natural-language
approval, not a walker — the deck is one artifact.

## Step 3: Fan out one TICKET_ANALYST per completed ticket

Spawn `general-purpose` Task subagents in parallel (up to 10 at a
time) following `references/TICKET_ANALYST.md`, one per ticket from:

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/tickets-list.sh --run-id <id> --status unanalyzed
```

Each worker writes its analysis via `ticket-set-analysis.sh`. When
all return, gate on coverage — re-run `tickets-list.sh --status
unanalyzed`; if non-empty, re-spawn for the stragglers.

## Step 4: Synthesise the themed deck + render a preview

Read the analysed tickets grouped by category:

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/tickets-list.sh --run-id <id> --by-category
```

Compose the deck narrative (this is the parent's judgment, not a
worker's):

- **Opening slide** — the sprint window + a one-line "what we
  delivered" headline.
- **One section per non-empty category**, in this order:
  `NEW_FEATURE` → `IMPROVEMENT` → `BUG_FIX` → `QUALITY_OR_VELOCITY`.
  Lead each with the audience framing from the schema. Promote the
  high-confidence, high-impact tickets to their own bullet;
  aggregate small / `low`-confidence ones into a count ("plus 6
  further reliability fixes").
- **A velocity & quality summary slide** — counts per category, the
  reliability + quality/velocity story told as stakeholder value.
- **Closing slide** — what it sets up next (optional; only if the
  tickets support it — no speculation).

Preview the deck as markdown before pushing:

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/render-sprint-showcase.sh --run-id <id>
```

Iterate with the user on the markdown until they're happy. This is
where editing happens before anything reaches Google Slides.

## Step 5: Push to Google Slides

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/push-to-slides.sh --run-id <id>
```

Creates the deck in Google Drive and prints the share URL. The user
does final manual edits in Slides — the deck is theirs to polish.

## Completion output

```
sprint-showcase complete for <id>.

Window: <from> → <to> (<sprint|date-range>)
Completed tickets showcased: <N>
  NEW_FEATURE: a   IMPROVEMENT: b   BUG_FIX: c   QUALITY_OR_VELOCITY: d

Deck: <google-slides-url>
Preview: ~/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/<id>/deck.md

Next: open the deck in Google Slides and polish wording / branding.
```

## Scripts cheat-sheet

All under `~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/`:

| Script | Purpose |
|---|---|
| `start-sprint-showcase.sh` | Resolve sprint→date-range window, find Done tickets + their commits, seed `state.json`. Emits `MODE: SPRINT`/`DATE_RANGE` + `--run-id`. |
| `prepare-sprint-showcase.sh` | Pre-bake per-ticket context bundles (Jira + commits) for the analysts. |
| `ticket-set-analysis.sh` | Worker mutation — set one ticket's category + headline + user benefit + evidence + confidence (atomic). |
| `tickets-list.sh` | List/filter tickets (`--status unanalyzed`, `--by-category`, `--json`) — also the coverage gate. |
| `render-sprint-showcase.sh` | Render `state.json` as the markdown deck preview grouped by category. |
| `push-to-slides.sh` | Create the deck in Google Slides via the Slides API; print the share URL. |

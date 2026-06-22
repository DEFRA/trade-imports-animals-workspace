---
name: sprint-showcase
description: 'Generate a non-technical slide deck showcasing a sprint''s completed (Done) work, built around audience themes — new features, improvements, reliability fixes, and quality/velocity wins — rather than one slide per ticket. Resolves a date-range window (this board has no Jira sprints), fans out one agent per completed ticket to research and categorise it, then synthesises a themed deck as an editable .pptx (built with pptxgenjs, no auth) that opens natively in Google Slides. Use when the user wants a stakeholder-facing sprint review deck (triggers: "sprint showcase", "sprint showcase EUDPA", "create sprint slideshow", "build sprint showcase", "sprint showcase deck", "showcase this sprint", "what did we ship this sprint deck"). Distinct from Claude Code''s built-in /init (CLAUDE.md scaffolding). NOT for a personal day/week achievement summary — use what-have-i-achieved. NOT for a whole-contract CV dossier — use career-evidence.'
---

Builds a non-technical **`.pptx`** deck (opens natively in Google
Slides) of a sprint's **completed (Done)** work for a stakeholder
audience. The deck is organised by audience theme, not by ticket:
one section per category (new features, improvements, reliability
fixes, quality/velocity), with small tickets aggregated. The
work-list is the Done-in-window tickets across the
trade-imports-animals workspace and its `repos/`; each is researched
and categorised by a fan-out agent, and the parent synthesises the
deck from those analyses. State lands at
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

## Step 0: Start — resolve the date window + seed completed tickets

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/start-sprint-showcase.sh --from 2026-06-09 --to 2026-06-22
```

Omit the flags to default to the last 14 days. This board does **not**
use Jira sprints (`sprint is not EMPTY` returns nothing), so the
window is a plain date range — there is no `--sprint` flag and no
mode branching. The dispatcher finds the tickets that transitioned to
`Done` in the window (`status changed TO Done DURING (…)`, team-wide),
cross-references git commits across the workspace + `repos/`, seeds
`state.json` (`scope`, `repos`, `tickets[]` with analyst fields null,
`narrative` null), and prints the resolved `--run-id <id>`, the
window, and the ticket count.

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

Compose the deck narrative — the parent's judgment, not a worker's —
and store it (it feeds the summary slide):

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/deck-set-narrative.sh --run-id <id> --intro "..." --velocity-summary "..." [--closing "..."]
```

The render then assembles the deck deterministically: an opening
slide (window + `intro`), one section per non-empty category in fixed
order `NEW_FEATURE → IMPROVEMENT → BUG_FIX → QUALITY_OR_VELOCITY`
(each with the schema's audience lead; high/medium-confidence tickets
become bullets, low-confidence and overflow roll into an
`aggregate_note` like "plus 6 further reliability fixes"), and a
summary slide (counts + `velocity_summary` + optional `closing`).

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/render-sprint-showcase.sh --run-id <id>
```

This writes `deck.md` (eyeball this) and `deck-spec.json`. Iterate
with the user on the wording — re-run `deck-set-narrative.sh` /
`ticket-set-analysis.sh` and re-render — before building the deck.

## Step 5: Build the deck (.pptx)

```bash
~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/build-deck.sh --run-id <id>
```

Bridges `deck-spec.json` into a `.pptx` via `tim deck generate`
(pptxgenjs — no auth, no Slides API). Prints the `deck.pptx` path.
The user uploads it to Google Drive and opens it with Google Slides
to polish wording / branding — the deck is theirs to finish.

## Completion output

```
sprint-showcase complete for <id>.

Window: <from> → <to>
Completed tickets showcased: <N>
  NEW_FEATURE: a   IMPROVEMENT: b   BUG_FIX: c   QUALITY_OR_VELOCITY: d

Deck: ~/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/<id>/deck.pptx
Preview: ~/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/<id>/deck.md

Next: upload deck.pptx to Google Drive, open with Google Slides, polish.
```

## Scripts cheat-sheet

All under `~/git/defra/trade-imports-animals-workspace/tools/sprint-showcase/`:

| Script | Purpose |
|---|---|
| `start-sprint-showcase.sh` | Resolve the date window (`--from`/`--to`, default last 14 days), find Done-in-window tickets + their commits, seed `state.json` + print `--run-id`. |
| `prepare-sprint-showcase.sh` | Pre-bake per-ticket context bundles (Jira + commits) for the analysts. |
| `ticket-set-analysis.sh` | Worker mutation — set one ticket's category + headline + user benefit + evidence + confidence (atomic). |
| `tickets-list.sh` | List/filter tickets (`--status unanalyzed`, `--by-category`, `--json`) — also the coverage gate. |
| `deck-set-narrative.sh` | Parent mutation — store the deck's `intro` / `velocity_summary` / optional `closing`. |
| `render-sprint-showcase.sh` | Render `state.json` into `deck.md` (preview) + `deck-spec.json`, grouped by category. |
| `build-deck.sh` | Bridge `deck-spec.json` → `.pptx` via `tim deck generate` (pptxgenjs, no auth); print the path. |

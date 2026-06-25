---
name: show-and-tell
description: 'Generate Show & Tell slide content from the last two weeks of completed Jira tickets, bucketed into User Journey / Skeleton, Integration / Architecture and Technical / Delivery enablers, for the EUDP Live Animals team fortnightly show and tell. Produces a three-slide markdown artifact: Progress Summary (counts per bucket), Completed Work Items (tickets per bucket), and Improving how the team delivers (plain-English benefits of the technical/enabler work). Use when the user asks to prepare or generate show-and-tell content (triggers: "prepare show and tell", "show and tell slides", "generate show and tell", "show and tell prep", "show & tell slides"). Distinct from Claude Code built-in /init (which scaffolds CLAUDE.md). This is reporting/presentation prep from completed tickets — NOT ticket creation (use ticket-creator), NOT planning/implementing a ticket (use ticket), and NOT PR review (use review/code-style).'
---

Prepares the fortnightly Show & Tell slides for the EUDP Live Animals
team. It pulls every Jira ticket marked Done in the last two weeks,
sorts each into one of three buckets — **User Journey / Skeleton**,
**Integration / Architecture**, **Technical / Delivery enablers** — and
writes three slides as markdown to
`~/git/defra/trade-imports-animals-workspace/workareas/show-and-tell/<id>/slides.md`,
ready to paste into the deck:

1. **Progress Summary** — ticket count per bucket.
2. **Completed Work Items** — the individual tickets under each bucket.
3. **Improving how the team delivers** — a non-technical, benefit-led
   summary of the Technical / Delivery enablers work.

The bucket taxonomy is the pattern the team has settled on across recent
show-and-tells; classification is LLM judgement that you confirm via a
quick walker before the slides render.

## Path conventions

Cross-workspace paths use the literal home-relative form —
`~/git/defra/trade-imports-animals-workspace/tools/<domain>/`,
`~/git/defra/trade-imports-animals-workspace/workareas/`. Bash
expands `~` automatically. Skill-internal references stay
relative (`assets/<NAME>.md`).

**Bash call hygiene** — one command per Bash call. Full rule
table: [`docs/agent-skills.md`](../../../docs/agent-skills.md)
→ "Bash call hygiene".

## When to use

| Trigger | What to follow |
|---------|----------------|
| "prepare show and tell" | this SKILL.md, Step 0 → Step 4 |
| "show and tell slides" | this SKILL.md, Step 0 → Step 4 |
| "generate show and tell" | this SKILL.md, Step 0 → Step 4 |
| "show and tell prep" | this SKILL.md, Step 0 → Step 4 |
| "show & tell slides" | this SKILL.md, Step 0 → Step 4 |

NOT for creating a new ticket (use `ticket-creator`), planning or
implementing a ticket (use `ticket`), or reviewing a PR (use `review` /
`code-style`).

## State

Canonical state is JSON at
`~/git/defra/trade-imports-animals-workspace/workareas/show-and-tell/<id>/state.json`
(`<id>` defaults to the run date). Schema: `assets/show-and-tell-schema.md`.
Mutated only via `tools/show-and-tell/*.sh` helpers (atomic
`jq ... > tmp; mv tmp file`). The slide markdown (`slides.md`) is a
generated view — produced by `render-slides.sh`, never hand-edited.

## Step 0: Fetch the fortnight

```bash
~/git/defra/trade-imports-animals-workspace/tools/show-and-tell/start-show-and-tell.sh
```

Defaults to a 14-day window ending today, run id = today's date. Pass
`--days N` for a different window, or `--run-id <id>` to re-open a prior
run. Re-running is idempotent — it re-fetches the window but preserves
buckets/benefits you've already set.

Note the run id (the date) it prints; every later command takes
`--run-id <id>`.

## Step 1: Propose buckets

Read the seeded tickets:

```bash
~/git/defra/trade-imports-animals-workspace/tools/show-and-tell/tickets-list.sh --run-id <id> --json
```

For each ticket, decide its bucket from the summary, type, labels and
parent epic:

- **UJ — User Journey / Skeleton**: user-facing features and the
  end-to-end journey/skeleton (frontend screens, the happy path a user
  walks through, new journey steps).
- **IA — Integration / Architecture**: how services connect and the
  shape of the system (event forwarding, gateways, service stubs,
  reference-data integration, cross-service contracts).
- **TD — Technical / Delivery enablers**: work that makes the team
  faster or safer rather than adding user-visible behaviour (CI/CD,
  test infrastructure, tooling, dependency upgrades, refactors,
  local-dev setup, docs).

Apply your proposed bucket to every ticket (one call per ticket):

```bash
~/git/defra/trade-imports-animals-workspace/tools/show-and-tell/set-bucket.sh --run-id <id> --key EUDPA-XXXXX --bucket UJ
```

## Step 2: Walk the classification (user confirms)

Present **all** tickets in one block, in id order, with the proposed
bucket — then take a single batch keystroke string. One character per
ticket, in id order:

| Key | Meaning |
|-----|---------|
| `.` or `k` | keep the proposed bucket |
| `u` | move to **UJ** (User Journey / Skeleton) |
| `i` | move to **IA** (Integration / Architecture) |
| `t` | move to **TD** (Technical / Delivery enablers) |
| `x` | clear (leave unclassified) |

Example for 5 tickets: `..t.i` keeps 1, 2 and 4; moves 3 → TD and
5 → IA.

Apply only the changed positions via `set-bucket.sh --bucket`. Re-show
the table if the user wants another pass. Move on when they're happy.

## Step 3: Write the benefits (Technical / Delivery enablers only)

For each **TD** ticket, write one plain-English, non-technical benefit
sentence — what it means for how the team delivers (faster builds,
fewer flaky tests, easier onboarding, safer releases), not how it was
built. Avoid jargon and ticket-speak.

```bash
~/git/defra/trade-imports-animals-workspace/tools/show-and-tell/set-bucket.sh --run-id <id> --key EUDPA-XXXXX --benefit "Faster, more reliable test runs so the team catches breakages before they reach review."
```

Show the proposed benefit lines to the user and adjust on request
(they front the "Improving how the team delivers" slide).

## Step 4: Render the slides

```bash
~/git/defra/trade-imports-animals-workspace/tools/show-and-tell/render-slides.sh --run-id <id>
```

Prints the path to `slides.md`. Show the user the counts and the path;
optionally read `slides.md` back to them.

## Completion output

```
show-and-tell ready for <id>.

Progress Summary:
  N  User Journey / Skeleton
  N  Integration / Architecture
  N  Technical / Delivery enablers
  -- TOTAL N

Slides: ~/git/defra/trade-imports-animals-workspace/workareas/show-and-tell/<id>/slides.md

Next: paste the three sections into the deck. Re-run any step and
render-slides.sh again to refresh.
```

## Scripts cheat-sheet

All under `~/git/defra/trade-imports-animals-workspace/tools/show-and-tell/`:

| Script | Purpose |
|---|---|
| `start-show-and-tell.sh` | Step 0 — fetch the last-N-days Done tickets from Jira; seed/merge `state.json` |
| `tickets-list.sh` | List tickets (`--bucket`, `--unclassified`, `--json`) — drives Step 1 & the walker |
| `set-bucket.sh` | Set a ticket's `--bucket` and/or `--benefit` (single per-item mutation) |
| `counts.sh` | Counts per bucket — the Progress Summary numbers |
| `render-slides.sh` | Compile `state.json` into the three-slide `slides.md` |

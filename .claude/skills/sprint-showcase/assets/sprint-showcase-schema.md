# sprint-showcase state JSON shape

Canonical state file:
`~/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/<id>/state.json`.

Mutated only via `tools/sprint-showcase/*.sh` helpers (atomic
`jq ... > tmp; mv tmp file`). `render-sprint-showcase.sh` regenerates
the `deck.md` preview AND the `deck-spec.json` (see contract below)
from this JSON; `build-deck.sh` then turns `deck-spec.json` into a
`.pptx` via `tim deck generate`. Hand-edits to `deck.md` /
`deck-spec.json` are overwritten on the next render — edit the JSON
state (via a helper) or polish the final deck in Google Slides.

The window is resolved by **date range** only — this board does not
use Jira sprints. There is no sprint-resolution path.

The fan-out unit is the **ticket** — one `TICKET_ANALYST` per
entry in `tickets[]`. The slide unit is the **category theme** —
the deck is grouped by `category`, not one slide per ticket.

## Schema

```jsonc
{
  "id": "2026-06-09_2026-06-22",      // date-range slug "<from>_<to>"
  "created_at": "2026-06-22T...",
  "scope": {
    "from": "2026-06-09",             // inclusive ISO date
    "to": "2026-06-22"                // inclusive ISO date (Jira JQL upper bound is exclusive → query uses to + 1 day)
  },
  "repos": [                          // workspace + repos/ crawled for commits in the window
    "trade-imports-animals-frontend",
    "trade-imports-animals-backend"
  ],
  "tickets": [
    {
      "key": "EUDPA-1234",            // Jira key (unique within tickets[])
      "title": "Add bulk certificate upload",
      "type": "Story",               // "Story" | "Bug" | "Task" | other Jira issue type
      "status": "Done",              // only completed work is included; non-Done filtered out at start
      "repos": ["trade-imports-animals-frontend"],  // repos with commits referencing this key
      "commit_shas": ["abc1234"],    // short SHAs of commits referencing the key in the window
      "context_baked": true,         // prepare-sprint-showcase.sh wrote the per-ticket context bundle

      // --- TICKET_ANALYST output (null until analysed) ---
      "category": "NEW_FEATURE",      // see Categories below; null until analysed
      "headline": "Traders can now upload many certificates at once",  // audience-facing, plain English
      "user_benefit": "Cuts a 20-minute manual task to one upload, so consignments clear faster",
      "evidence": ["EUDPA-1234", "frontend@abc1234"],  // ticket + commit refs backing the claim (>=1)
      "confidence": "high",          // "high" | "medium" | "low" — analyst's certainty of the benefit
      "analyzed_at": "2026-06-22T..." // set by ticket-set-analysis.sh; null until analysed
    }
  ],

  // --- deck framing, authored by the parent at synthesis time (null until set) ---
  "narrative": {
    "intro": "What we delivered this fortnight, in one line",  // opening-slide headline
    "velocity_summary": "5 reliability fixes and 4 quality improvements mean...",  // summary-slide prose
    "closing": "Next, this sets up ..."   // optional; null if omitted
  }
}
```

## Categories

The audience-level axis. `TICKET_ANALYST` picks exactly one per
ticket. The deck is grouped into one themed section per category
that has tickets.

| Category | Meaning | Audience framing |
|---|---|---|
| `NEW_FEATURE` | A capability that did not exist before | "The product can now do X" |
| `IMPROVEMENT` | An existing capability made better / easier / faster | "X is now easier / quicker for users" |
| `BUG_FIX` | Something broken now works | Reliability story — "X now works as expected" |
| `QUALITY_OR_VELOCITY` | Technical / quality / tooling / test / infra work with no direct user-facing change | Velocity & quality story — "this lets us ship faster and more safely" |

The deck does NOT enumerate every ticket. Small / mechanical
tickets in the same category are aggregated into a single bullet
or a count ("plus 6 further reliability fixes"). The parent makes
that call at synthesis time.

## Field rules

- `id` — drives the workarea path. Date-range slug `<from>_<to>`.
  Set by `start-sprint-showcase.sh`.
- `scope.from` / `scope.to` — the inclusive date window from the CLI
  args (default: last 14 days). The Jira "Done in window" query uses
  `to + 1 day` because JQL date upper bounds are exclusive.
- `tickets[].key` — unique. Only tickets that **transitioned to
  `Done`** within the window are seeded (JQL
  `status changed TO Done DURING (...)`); in-progress work is
  excluded at `start` time.
- `category`, `headline`, `user_benefit`, `evidence`,
  `confidence`, `analyzed_at` — written only by
  `ticket-set-analysis.sh`. `category` must be one of the four
  enum values; `evidence` must have ≥1 entry (the analyst must cite
  the ticket and/or a commit it read).
- `narrative.{intro,velocity_summary,closing}` — written only by
  `deck-set-narrative.sh` (parent-authored deck framing). `null`
  until set; `closing` may stay `null`.
- Coverage gate (used before render): every ticket has
  `analyzed_at != null` and `category != null`. Checked by
  `tickets-list.sh --status unanalyzed` returning empty.

## deck-spec.json contract (render → tim bridge)

`render-sprint-showcase.sh` derives this from `state.json` (it is a
generated artifact, not canonical state). `build-deck.sh` passes it
to `tim deck generate`. Sections are emitted only for non-empty
categories, in fixed order
`NEW_FEATURE → IMPROVEMENT → BUG_FIX → QUALITY_OR_VELOCITY`.

```jsonc
{
  "title": "EUDP Live Animals — Sprint Showcase",
  "subtitle": "Completed work · 9–22 Jun 2026",   // derived from scope
  "sections": [
    {
      "category": "NEW_FEATURE",
      "heading": "New features",                  // fixed per category
      "lead": "What the product can now do",      // fixed audience framing per category
      "bullets": [
        { "headline": "…", "benefit": "…", "confidence": "high" }
      ],
      "aggregate_note": "plus 6 further reliability fixes"  // optional; low-confidence/small ones rolled up
    }
  ],
  "summary": {
    "headline": "…",                              // from narrative.intro
    "counts": { "NEW_FEATURE": 3, "IMPROVEMENT": 2, "BUG_FIX": 5, "QUALITY_OR_VELOCITY": 4 },
    "velocity_summary": "…",                      // from narrative.velocity_summary
    "closing": "…"                                // from narrative.closing; omitted if null
  }
}
```

`tim deck generate` maps: a title slide (`title`+`subtitle`), one
slide per `section` (heading + lead + bullets + aggregate_note), and
a final summary slide (`summary`). Output `.pptx` opens natively in
Google Slides when uploaded to Drive.

---
name: review
description: 'Pre-merge code review (correctness, security, performance, tests) of a ticket''s PRs across all repos and languages: fresh review, refresh re-review, interactive walker triage, batched fix implementor. Triggers: "review EUDPA-X", "re-review", "refresh review", "check fixes", "walk review", "triage review", "implement review", "apply review fixes". NOT for JS lint/style (code-style); AC-only checks use the nested ac-check skill.'
---

Pre-merge code review for EUDP Live Animals tickets across all repos and
languages.

## Model

| Mode | Session role | Worker role |
|---|---|---|
| Fresh / refresh / walk | `review-orchestrator` | `review-worker` on per-file spawns |
| Implement review fixes | `implement` | inherit session (no Task `model`) |

**New chat for review.** `start-review.sh` prints a model gate first —
confirm picker or `/model`, then continue.
`docs/agent-models.md` · `tools/agent/resolve-model.sh`.

## Conventions

One command per Bash call; literal `~/git/defra/trade-imports-animals-workspace/...`
paths (never `$VAR`, never resolved `/Users/...`); prefer Read/Glob/`jq` over
`awk`/`sed`/`find`. Full rules: `~/git/defra/trade-imports-animals-workspace/docs/agent-skills.md`.

## State

Per-repo state lives in
`~/git/defra/trade-imports-animals-workspace/workareas/reviews/EUDPA-XXX/items.{repo}.json`
— canonical JSON, mutated only via `review-*.sh` helpers under
`~/git/defra/trade-imports-animals-workspace/tools/review/`. The `## Items`
markdown table in `review.{repo}.md` is a rendered view
(`render-items.sh`). JSON schema + allowed Disposition/Status values:
`assets/items-table.md`.

## When to use

| Trigger | Follow |
|---------|--------|
| "review EUDPA-X" / "re-review" / "refresh review" / "check fixes" | Step 0 below, then `references/FRESH.md` or `references/REFRESH.md` per mode |
| "walk review EUDPA-X" / "triage review" | `references/WALKER.md` |
| "implement review EUDPA-X" / "apply review fixes" | `references/BATCH_IMPLEMENTOR.md` |

NOT for JavaScript lint/format/style findings — use `code-style`.

## Worker references

Fan-out workers are spawned as `general-purpose` Task subagents
(`Tools: *`, can write artifacts) with a prompt beginning
`Follow the instructions in ~/git/defra/trade-imports-animals-workspace/.claude/skills/review/references/<NAME>.md.`

| Persona | Used in | Artifact |
|---|---|---|
| `references/FILE_REVIEWER.md` | FRESH Step 2, REFRESH Step R4 (one per file, parallel up to 100) | per-file `.review.json` (schema: `assets/file-review-schema.md`) |
| `references/CONSISTENCY_REVIEWER.md` | FRESH Step 4 (one spawn) | per-repo `_consistency-check.md` |
| `references/REVIEW_ITEM_FIXER.md` | BATCH_IMPLEMENTOR Step 4 (one per Fix item, sequential) | source edits + commit |

## Step 0: Start the review

```bash
~/git/defra/trade-imports-animals-workspace/tools/review/start-review.sh EUDPA-XXXXX
```

The script prints `MODE:` then a **model gate** (role
`review-orchestrator`). Confirm the session model matches the gate
before following FRESH/REFRESH.

Single dispatch — detects mode, runs the appropriate setup, and prints
the mode on the first line:

- `MODE: FRESH` → setup ran `prepare-review.sh`. Follow
  `references/FRESH.md` from Step 2.
- `MODE: REFRESH` → setup ran `refresh/scope.sh --write-snapshot`.
  Follow `references/REFRESH.md` from Step R3.5.

**On Claude Code auto-backgrounding:** fresh setup clones repos in
parallel and can take 30–90s. If the Bash tool auto-backgrounds it, wait
for the harness's `task-notification` (status: completed) — do NOT poll
the PID file or `tail` the output.

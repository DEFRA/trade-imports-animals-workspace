---
name: code-style
description: 'JS code-style/lint review and remediation for EUDPA PRs against the project style guide: fresh review, refresh, walker triage, batched fixes. Triggers: "style review EUDPA-", "code style review", "style refresh", "walk style", "fix style", "implement style fixes", "lint review". NOT for correctness/design or Java/test review (review).'
---

JS code-style review and remediation for EUDP Live Animals tickets.

## Model

| Mode | Session role | Worker role |
|---|---|---|
| Fresh / refresh / walk | `review-orchestrator` | `review-worker` on per-file spawns |
| Implement style fixes | `implement` | `style-worker` (= `review-worker` tier) |

New chat for style **review** (orchestrator role). `start-style.sh`
prints a model gate first. `docs/agent-models.md` ·
`tools/agent/resolve-model.sh`.

## Conventions

One command per Bash call; literal `~/git/defra/trade-imports-animals-workspace/...`
paths (never `$VAR`, never resolved `/Users/...`); prefer Read/Glob/`jq` over
`awk`/`sed`/`find`. Full rules: `~/git/defra/trade-imports-animals-workspace/docs/agent-skills.md`.

## State

Per-repo state lives in
`~/git/defra/trade-imports-animals-workspace/workareas/code-style-reviews/EUDPA-XXX/items.{repo}.json`
— canonical JSON, mutated only via `style-*.sh` helpers under
`~/git/defra/trade-imports-animals-workspace/tools/style/`. The `## Items`
markdown table in `style-review.{repo}.md` is a rendered view
(`render-items.sh`). JSON schema + allowed Disposition/Status values:
`assets/items-table.md`.

## Workflow modes

| User intent | Follow |
|---|---|
| "style review EUDPA-X" / "re-style review" / "style refresh" | Step 0 below, then `references/FRESH.md` or `references/REFRESH.md` per mode |
| "walk style EUDPA-X" / "triage style" | `references/STYLE_WALKER.md` |
| "fix style EUDPA-X" / "implement style fixes" | `references/IMPLEMENTATION.md` |

IMPLEMENT and WALK are separate top-level triggers — they do NOT route
through `start-style.sh`.

## Worker references

Fan-out workers are spawned as `general-purpose` Task subagents
(`Tools: *`, can write artifacts, run helpers, commit) with a prompt
beginning
`Follow the instructions in ~/git/defra/trade-imports-animals-workspace/.claude/skills/code-style/references/<NAME>.md.`

| Persona | Used in | Artifact |
|---|---|---|
| `references/STYLE_FILE_REVIEWER.md` | FRESH Step 2; REFRESH Step R4 (parallel, up to 100) | per-file `.style.json` (schema: `assets/file-style-schema.md`) |
| `references/STYLE_WALKER.md` | "walk style" trigger | item dispositions via `style-mark.sh` |
| `references/STYLE_IMPLEMENTOR.md` | IMPLEMENTATION Step I3 (sequential, one group at a time) | source edits + commit |

## Step 0: Start the review

```bash
~/git/defra/trade-imports-animals-workspace/tools/style/start-style.sh EUDPA-XXXXX
```

Single dispatch — detects FRESH vs REFRESH from workspace state, runs
the appropriate setup, and prints the mode on the first line:

- `MODE: FRESH` → setup ran `prepare-style.sh`. Follow
  `references/FRESH.md` from Step 2.
- `MODE: REFRESH` → setup ran `refresh/scope.sh --write-snapshot`.
  Follow `references/REFRESH.md` from Step R3.5.

**On Claude Code auto-backgrounding:** fresh setup may shallow-clone
repos via `prepare-review.sh` (30–90s). If the Bash tool
auto-backgrounds it, wait for the harness's `task-notification`
(status: completed) — do NOT poll the PID file or `tail` the output.

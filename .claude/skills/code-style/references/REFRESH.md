# Refresh style review (re-review after further work)

Loaded from SKILL.md when Step 0 prints `MODE: REFRESH`.

## Steps R1-R3: Refresh scope (built by Step 0)

`start-style.sh` already ran `refresh/scope.sh --write-snapshot` and
emitted JSON on stdout. Each `repos[]` entry has `prior_sha`,
`current_sha`, `no_changes`, and `lists.{A,B,C,D}`:

- **List A** — `[{ file, old_sha, new_sha, prior_items }]` — `.js` file changed in window, not merge-resolved
- **List B** — `[{ id, file, line, rule, severity, ... }]` — open items whose file did *not* change
- **List C** — `[{ file, merge_sha, old_sha, new_sha, prior_items }]` — hand-resolved merge files (`.js` only)
- **List D** — `[{ file }]` — PR `.js` files lacking a `.style.json` verdict

If totals are all zero across all repos: report the branch is unchanged
since the last refresh and stop.

## Step R3.5: Load full item inventory

```bash
~/git/defra/trade-imports-animals-workspace/tools/style/style-items.sh EUDPA-XXXXX --json
```

Used when reconciling in R5/R6:

- `Won't Fix` / `Auto-Resolved` → carry forward; do NOT re-report.
- `Fix` + `Done` → spot-check after refresh (reconciler emits a list).
- `Fix` + `Not Done` and `Discuss` → still open.
- Blank disposition → pending (should appear in List B).

Deleted files: mark their items `Auto-Resolved` via `style-mark.sh`.

## Step R4: Re-review files

Spawn `general-purpose` Task subagents in parallel (up to 100), one per
entry in List A (Mode=REFRESH), List C (Mode=MERGE_RESOLVED), and List D
(Mode=FRESH; coverage gap). When the Task tool supports `model`, use role
`review-worker` per `docs/agent-models.json`.

### Spawn prompt — REFRESH (List A)

```markdown
Follow the instructions in ~/git/defra/trade-imports-animals-workspace/.claude/skills/code-style/references/STYLE_FILE_REVIEWER.md.

**Mode: REFRESH**
**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Style rules bundle:** ~/git/defra/trade-imports-animals-workspace/workareas/code-style-reviews/EUDPA-XXXXX/style-rules.[repo].md

**Your assigned file:**
- Repository: [repo]
- Path: [entry.file]
- PR: #[pr]
- Previous commit: [entry.old_sha]
- Current commit: [entry.new_sha]

**Prior items reported for this file (JSON):**
[entry.prior_items]
```

### Spawn prompt — MERGE_RESOLVED (List C)

Same as REFRESH but with `**Mode: REFRESH (merge-resolved)**` and an
extra `**Merge commit:** [entry.merge_sha]` header line.

### Spawn prompt — FRESH (List D, coverage gap)

Use the FRESH-mode prompt from `references/FRESH.md` Step 2. Note in
the prompt that the file is in the PR diff but had no prior per-file
review — a coverage gap, not a fresh PR.

Workers write deltas (new findings + regressions) to their per-file
`.style.json` exclusively — no direct `style-add-item.sh` calls. The
reconciler folds those deltas into `items.{repo}.json` in R5.

## Step R5: Reconcile and re-render

Once all refresh reviewers finish:

```bash
~/git/defra/trade-imports-animals-workspace/tools/style/refresh/reconcile.sh EUDPA-XXXXX --repo {repo} --json > /tmp/refresh-summary-{repo}.json
~/git/defra/trade-imports-animals-workspace/tools/style/render-items.sh EUDPA-XXXXX --repo {repo}
```

The reconciler trusts the STYLE_FILE_REVIEWER contract: each refresh
reviewer's `.style.json` contains **only deltas** — regressions and
net-new findings. Items already in `items.{repo}.json` and still
present are NOT re-reported (the persona instructs this).

## Step R6: Update per-repo verdicts and refresh notes

Recompute verdicts as in `references/FRESH.md` Step 6. Add a
`## Refresh Summary ({date})` section to `style-review.{repo}.md` with
counts from `/tmp/refresh-summary-{repo}.json` and a spot-check list of
prior `Fix+Done` items in refreshed files (the reconciler emits these
as potential regressions).

## Completion Output

```
Code style refresh complete for EUDPA-XXXXX.

Summary:
- Lists processed: A={N} (changed) C={N} (merge) D={N} (gaps)
- List B carry-forward: {N} open items in unchanged files
- New violations added: {N}
- Auto-resolved: {N}
- Per-repo verdicts:
  - {repo}: [VERDICT] ({N} items)

Per-repo files: ~/git/defra/trade-imports-animals-workspace/workareas/code-style-reviews/EUDPA-XXXXX/style-review.{repo}.md
```

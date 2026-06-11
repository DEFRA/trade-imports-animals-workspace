# Refresh review (re-review after further work)

Loaded from SKILL.md when Step 0 prints `MODE: REFRESH` (i.e.
`review-index.md` already exists). Updates the existing review in place —
verifies prior feedback was addressed, catches new issues after further
commits or merge conflicts.

## Steps R1-R3: Refresh scope (built by Step 0)

`start-review.sh` already ran `refresh/scope.sh --write-snapshot` and
emitted JSON on stdout. Each `repos[]` entry has `prior_sha`,
`current_sha`, `no_changes`, and `lists.{A,B,C,D}`:

- **List A** — `[{ file, old_sha, new_sha }]` — changed in window, not merge-resolved
- **List B** — `[{ id, file, line, issue, ... }]` — open items whose file did *not* change
- **List C** — `[{ file, merge_sha, old_sha, new_sha }]` — hand-resolved merge files
- **List D** — `[{ file }]` — PR files lacking a review (coverage gap)

`prior_sha` is the most recent re_review snapshot's `current_commit`
differing from HEAD; falls back to `prs[].commit` on first refresh.

If all four lists are empty across all repos: report the branch is
unchanged since the last refresh and stop.

## Step R3.5: Load Full Item Inventory

```bash
~/git/defra/trade-imports-animals-workspace/tools/review/review-items.sh EUDPA-XXXXX --json
```

Used when reconciling in R5/R6:

- `Won't Fix` / `Auto-Resolved` → carry forward; do NOT re-report.
- `Fix` + `Done` → verify the violation is confirmed gone.
- `Fix` + `Not Done` (and `Discuss`) → still open.
- Blank disposition → pending (should appear in List B).

Deleted files: mark their items `Auto-Resolved` via `review-mark.sh`.

## Step R4: Re-review Files

Spawn `general-purpose` Task subagents in parallel (up to 100), one per
entry in List A (Mode=REFRESH), List C (Mode=MERGE_RESOLVED), and List D
(Mode=FRESH; coverage gap). When the Task tool supports `model`, use
role `review-worker` per `docs/agent-models.json`. Prompt template:

```markdown
Follow the instructions in ~/git/defra/trade-imports-animals-workspace/.claude/skills/review/references/FILE_REVIEWER.md.

**Mode:** [REFRESH | MERGE_RESOLVED | FRESH]
**Ticket:** EUDPA-XXXXX - [Ticket Summary]

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- PR: [pr-number]
- Previous commit: [old-sha]      <- REFRESH / MERGE_RESOLVED only
- Current commit: [new-sha]
- Merge commit: [merge-sha]       <- MERGE_RESOLVED only
- Commit: [sha]                   <- FRESH only
```

For List D (FRESH mode) note in the prompt that the file is in the PR
diff but had no prior per-file review — a coverage gap, not a fresh PR.

## Step R5: Reconcile and re-render

Once all reviewers finish:

```bash
# Append new findings; emit Fix+Done spot-check advisory.
~/git/defra/trade-imports-animals-workspace/tools/review/refresh/reconcile.sh EUDPA-XXXXX --repo {repo} --json > /tmp/refresh-summary-{repo}.json

# Re-render the ## Items markdown view
~/git/defra/trade-imports-animals-workspace/tools/review/render-items.sh EUDPA-XXXXX --repo {repo}
```

The reconciler trusts the FILE_REVIEWER contract: refresh `.review.json`
contains **only deltas** (regressions + net-new). Still-present items are
not re-reported; the reconciler appends every todo it finds.

`/tmp/refresh-summary-{repo}.json` shape:

```json
{
  "added_count": N,
  "added": ["file:line [severity] issue", ...],
  "added_ids": [12, 13, ...],
  "auto_resolved_count": N,
  "auto_resolved": ["#6 src/path/file.js", ...],
  "spot_check": [{ "id": 6, "file": "...", "line": 42, "issue": "...", "notes": "abc1234" }, ...],
  "skipped_already_reconciled": N,
  "skipped_unreviewed": N
}
```

`spot_check` lists prior `Fix + Done` items in refreshed files — verify
they haven't regressed; if one has, the user re-walks the new item the
reviewer added (`--category regression`).

**Stale items:** reviewers record prior items whose violation they
positively verified as gone (`file-review-mark-resolved.sh` →
`resolved_item_ids`); the reconciler auto-resolves the still-open ones
and reports them in `auto_resolved`. Items the reviewer wasn't sure
about stay open — the user drains those in the next walker run (`W`
with note "already done").

## Step R6: Update review.{repo}.md cosmetics

Populate the Refresh Summary section from the reconciler JSON:

```markdown
## Refresh Summary ([date])

**Files refreshed:** [N]
**New items added:** [M]
**Spot-check (Fix+Done items in refreshed files):** [K]

| # | Change | File:Line | Severity | Issue |
|---|--------|-----------|----------|-------|
| 1 | ➕ New | `path:N` | Critical | ... |
| 2 | ⚠️ Spot-check | `path:N` | Major | ... (prior Fix+Done #6) |
```

Then: add `**Refreshed:** [today]` near the top and update the
Repository Verdict if warranted.

**Also update `review-index.md`:** `**Last Updated:** [today]` line,
Repositories table verdicts, top-level Verdict, and the AC Check table
if any AC status changed.

## Verdict Guidelines

| Verdict | Criteria |
|---------|----------|
| **APPROVED** | All Critical/Major fixed or Won't Fixed; no new blockers; AC met |
| **STILL HAS CONCERNS** | Critical/Major fixed; Minor items remain (non-blocking) |
| **NEEDS MORE WORK** | Critical/Major unaddressed, or new blockers found |

## Completion Output

```
Review refresh complete for EUDPA-XXXXX.

Summary:
- Previous verdict: [VERDICT] → New verdict: [VERDICT]
- Files re-reviewed: [X]
- Todo items resolved: [N] / [M]
- New issues found: [N]

Updated: ~/git/defra/trade-imports-animals-workspace/workareas/reviews/EUDPA-XXXXX/review-index.md + review.{repo}.md files
```

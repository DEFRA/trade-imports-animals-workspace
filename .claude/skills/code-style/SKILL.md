---
name: code-style
description: 'JS code-style/lint review (formatting, conventions, style rules) and remediation for EUDP Live Animals PRs (EUDPA-*). Lints `.js` files against the project''s 17-rule style guide and JSDoc accuracy rules; supports fresh review, refresh review (re-review after new commits), and batch implementation of agreed style fixes. Orchestrates two subagents (`style-file-reviewer`, `style-implementor`). Use when the user asks for JavaScript style/lint review or to apply agreed style fixes (triggers: "style review EUDPA-", "code style review", "re-style review", "style refresh", "fix style EUDPA-", "implement style fixes", "lint review"). NOT for correctness/design review across languages or for Java/test-quality review — use the `review` skill for those.'
---

JS code-style review and remediation for EUDP Live Animals tickets.
State lives in per-repo `style-review.{repo}.md` files with consolidated
`## Items` tables. All reads/writes go through helper scripts — never
edit the table by hand.

## Path conventions

Compute `WORKSPACE_ROOT` once per session via `find_workspace_root`
(defined in `docs/agent-skills.md`). Cross-workspace paths use
`${WORKSPACE_ROOT}/...`: scripts under `tools/<domain>/`, best-practices
under `docs/best-practices/`, workareas under `workareas/`. Skill-internal
references stay relative (`references/<NAME>.md`, `assets/<NAME>.md`);
subagents are addressed by name via the Task tool.

## Workflow modes

| User intent | Section |
|---|---|
| "style review EUDPA-X" / fresh | FRESH REVIEW (Steps 1-7) |
| "re-style review" / "refresh" | REFRESH REVIEW (Steps R1-R6) |
| "fix style EUDPA-X" / "implement style fixes" | IMPLEMENTATION (Steps I1-I4) |

## Subagents owned

The skill delegates to two subagents at `.claude/agents/`:

| Subagent | Used in | Tools |
|---|---|---|
| `style-file-reviewer` | FRESH Step 4 (parallel, up to 10); REFRESH Steps R2/R3/R4 | `Read, Grep, Glob` |
| `style-implementor` | IMPLEMENTATION Step I3 (sequential, one group at a time) | `Read, Edit` |

Spawn idiom: `Delegate to the <name> subagent` — Task tool with
`subagent_type: <name>`.

## Step 0: Detect Mode

```bash
ls ${WORKSPACE_ROOT}/workareas/code-style-reviews/EUDPA-XXXXX/style-review.*.md 2>/dev/null
```

- No matches → FRESH REVIEW (Step 1).
- One or more matches AND user wants a re-review → REFRESH REVIEW (Step R1).
- User asks to "fix style" / "implement style fixes" → IMPLEMENTATION (Step I1).

---

# FRESH REVIEW

## Step 1: Prepare Review Workspace

The code-style review piggybacks on the standard review workspace for
cloned repos. Ensure it exists:

```bash
ls ${WORKSPACE_ROOT}/workareas/reviews/EUDPA-XXXXX/.review-meta.json 2>/dev/null \
  || ${WORKSPACE_ROOT}/tools/review/prepare-review.sh EUDPA-XXXXX
```

Then create the code-style workspace:

```bash
mkdir -p ${WORKSPACE_ROOT}/workareas/code-style-reviews/EUDPA-XXXXX/file-reviews
```

## Step 2: Discover JavaScript Files

Read `.review-meta.json` to get repos and PR numbers. For each repo/PR
pair:

```bash
${WORKSPACE_ROOT}/tools/github/pr-details.sh {repo} {pr-number} files
```

Keep only files ending in `.js`. If no `.js` files are found across any
PR, output:

```
No JavaScript files found in this PR. No JavaScript code style review needed.
```

And stop.

## Step 3: Create Workspace Files

For each `.js` file found:
1. Create `${WORKSPACE_ROOT}/workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/{repo}/`
2. Create a zero-byte placeholder `{safe_path}.style.md` (path separators → `_`)

Write `.style-meta.json`:

```json
{
  "id": "EUDPA-XXXXX",
  "created": "ISO-DATE",
  "js_files": [
    { "repo": "repo-name", "path": "path/to/file.js", "pr": 123 }
  ]
}
```

For each repo with `.js` files, create an empty `style-review.{repo}.md`:

```markdown
# Code Style Review: {repo-name}

**Ticket:** EUDPA-XXXXX
**PR:** #{pr-number}
**JS Files Reviewed:** {count}
**Verdict:** _pending_

## Items

| # | File | Line | Rule | Severity | Issue | Fix | Disposition | Status | Notes |
|---|------|------|------|----------|-------|-----|-------------|--------|-------|
```

File reviewers append rows via `style-add-item.sh`.

## Step 4: Review Each File

**MANDATORY:** Review EVERY `.js` file. No exceptions. Delegate to the
`style-file-reviewer` subagent — up to 10 in parallel via the Task tool
with `subagent_type: style-file-reviewer`.

### Spawn prompt template

```markdown
**Mode: FRESH**
**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Style guide:** ${WORKSPACE_ROOT}/docs/best-practices/node/code-style.md

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- PR: #[pr-number]
- Full path in workspace: ${WORKSPACE_ROOT}/workareas/reviews/EUDPA-XXXXX/repos/[repo-name]/[file-path]

**Write your per-file paper trail to:**
${WORKSPACE_ROOT}/workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[safe_path].style.md

**Append each finding via:**
${WORKSPACE_ROOT}/tools/style/style-add-item.sh EUDPA-XXXXX --repo [repo-name] \
  --file [file-path] --line [N or ""] --rule [1-17] --severity [FAIL|WARN] \
  --issue "[description]" --fix "[suggested fix]"
```

## Step 5: Verify Coverage

```bash
${WORKSPACE_ROOT}/tools/review/verify-style-coverage.sh EUDPA-XXXXX
```

The script's name reflects what it verifies; its location is shared
with the `review` skill at `tools/review/`. **Do not proceed until 100%
coverage.**

## Step 6: Set Per-Repo Verdicts

For each `style-review.{repo}.md`:

```bash
${WORKSPACE_ROOT}/tools/style/style-counts.sh EUDPA-XXXXX --repo {repo} --json
```

Use the breakdown to set the verdict line in the file header:

| Counts (Fix items, FAIL severity) | Verdict |
|---|---|
| 0 | COMPLIANT |
| 1-3 | MINOR ISSUES |
| ≥4, or any FAIL items | NEEDS WORK |

Edit the `**Verdict:** _pending_` line in the per-repo header. Nothing
else in the file changes.

## Step 7: Done

Output the completion summary (see "Completion Output" below).

---

# REFRESH REVIEW

## Step R1: Compute Refresh Scope

One call captures both the human summary and the machine-readable lists:

```bash
${WORKSPACE_ROOT}/tools/style/refresh/scope.sh EUDPA-XXXXX \
  --write-snapshot --human --json-out /tmp/scope-EUDPA-XXXXX.json
```

This:
1. Pulls each repo (`pull-repos.sh` under the hood).
2. Computes `prior_sha` per repo — last `re_review` snapshot's `current_commit` (falling back to the regular review's snapshot history, then the original PR commit).
3. Filters everything to `.js` files.
4. Builds Lists A/B/C/D.
5. Appends a snapshot to `.style-meta.json#re_reviews[]`.
6. Prints the human summary to stdout.
7. Dumps the full JSON to `/tmp/scope-EUDPA-XXXXX.json` for use in Steps R2-R5.

**Critical:** always pass `--json-out` in the same call as
`--write-snapshot`. Re-running scope.sh after a snapshot was written
would compute `prior_sha == current_sha` and return empty lists.

If totals are all zero, output "No changes since last refresh" and stop.

The JSON shape per repo is `{repo, pr, prior_sha, current_sha,
no_changes, lists: {A, B, C, D}}`. Use `jq` against
`/tmp/scope-EUDPA-XXXXX.json` in subsequent steps:

```bash
# Iterate List A across all repos:
jq -r '.repos[] | .repo as $r | .pr as $pr | .lists.A[] | "\($r)\t\($pr)\t\(.file)\t\(.old_sha)\t\(.new_sha)"' /tmp/scope-EUDPA-XXXXX.json
```

## Step R2: Re-review List A — Changed `.js` Files

Each List A entry is `{file, old_sha, new_sha, prior_items}` —
`prior_items` is already a JSON array, no follow-up `style-items.sh`
call needed.

Delegate to the `style-file-reviewer` subagent (parallel, up to 10) via
the Task tool with `subagent_type: style-file-reviewer`. Spawn prompt:

```markdown
**Mode: REFRESH**
**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Style guide:** ${WORKSPACE_ROOT}/docs/best-practices/node/code-style.md

**Your assigned file:**
- Repository: [repo]
- Path: [entry.file]
- PR: #[pr]
- Diff window: [entry.old_sha]..[entry.new_sha]
- Full path in workspace: ${WORKSPACE_ROOT}/workareas/reviews/EUDPA-XXXXX/repos/[repo]/[entry.file]

**Prior items reported for this file (JSON):**
[entry.prior_items]

**For each prior item:**
- If the violation is resolved in the new code:
  ${WORKSPACE_ROOT}/tools/style/style-mark.sh EUDPA-XXXXX --repo [repo] --item [id] \
    --disposition Auto-Resolved --note "resolved [date]"
- If still present: leave as-is.

**For each NEW violation:**
${WORKSPACE_ROOT}/tools/style/style-add-item.sh EUDPA-XXXXX --repo [repo] \
  --file [entry.file] --line [N or ""] --rule [1-17] --severity [FAIL|WARN] \
  --issue "[description]" --fix "[suggested fix]"

**Write paper trail to:**
${WORKSPACE_ROOT}/workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/[repo]/[safe_path].style.md
```

To slice the JSON for dispatch:

```bash
jq -c '.repos[] | .repo as $r | .pr as $pr | .lists.A[] | {repo: $r, pr: $pr, entry: .}' /tmp/scope-EUDPA-XXXXX.json
```

## Step R3: List C — Merge-Resolved `.js` Files

Each List C entry is `{file, merge_sha, old_sha, new_sha, prior_items}`.
Same envelope as R2 with one extra header line and a different mode:

```markdown
[same envelope as R2, but with]

**Mode: REFRESH (merge-resolved)**
**Merge commit:** [entry.merge_sha]

This file was hand-resolved during the merge above. The resolution may differ
from a clean rebase. Pay extra attention to:
- Code that may have been dropped or duplicated during conflict resolution
- Style drift introduced by the merge
```

## Step R4: List D — Coverage Gaps

Each List D entry is `{file}` only (no prior items by definition — these
files were never reviewed). Use the FRESH prompt from Step 4.

## Step R5: List B — Items in Unchanged Files

`lists.B` contains open items (Disposition blank OR Fix/Discuss + Not
Done) whose file did NOT change in the window. No action — these carry
forward unchanged. Mention the count in the completion summary.

## Step R6: Update Per-Repo Verdicts

After all subagents complete, recompute verdicts as in Step 6 of FRESH
REVIEW.

---

# IMPLEMENTATION

Apply all open Fix items for a ticket by delegating to the
`style-implementor` subagent — **one delegation per file, not per item**.
All open Fix items for a single file are handed to one subagent so that
file is read once, edited once, tested once, and committed once.

**Prerequisite:** Services must be running (frontend, backend, admin)
for E2E tests to pass.

## Step I1: Build the Work Plan

Group all open Fix items by `(repo, file)`:

```bash
${WORKSPACE_ROOT}/tools/style/style-items.sh EUDPA-XXXXX --filter fix --status not-done --by-file --json
```

Output is `[{repo, file, items: [...]}, ...]`. Each group is one work
unit for one implementor subagent.

If the array is empty, output:
```
Nothing to do — no open Fix items.
```
And stop.

## Step I2: Report Starting State

```
Starting code style implementation for EUDPA-XXXXX.

Open files: [N]  Items across them: [M]
By repo:
  {repo}: {file_count} file(s), {item_count} item(s)

First few groups:
  {repo}/{file}: items #N, #M, #K
  ...
```

## Step I3: Implement Groups Sequentially

For each group in the work list, in order (frontend before other repos,
then alphabetical by file):

Delegate to the `style-implementor` subagent via the Task tool with
`subagent_type: style-implementor`. Spawn prompt:

```
**Ticket:** EUDPA-XXXXX
**Repo:** {repo}
**File:** {file}
**Items (JSON):**
{indented JSON array of items from --by-file output, e.g.}
[
  {"id": 117, "rule": "2", "severity": "FAIL",
   "issue": "function getPendingRows() ...", "fix": "const getPendingRows = () => ...",
   "line": "14", "notes": ""},
  {"id": 121, "rule": "13", "severity": "WARN",
   "issue": "bare 'PENDING' literal", "fix": "extract to SCAN_STATUS_PENDING",
   "line": "23", "notes": ""}
]
```

**Wait for the subagent to return before starting the next group.**

### Handling Results

The implementor itself updates each item's Status (or Disposition) via
`style-set-status.sh` / `style-mark.sh`. Log the per-group outcome.

Each subagent returns a summary like:

```
{repo}/{file}: 3 done, 1 auto-resolved, 0 failed
  #117 → Done (commit abc123)
  #121 → Done (commit abc123)
  #145 → Done (commit abc123)
  #92  → Auto-Resolved (already fixed by earlier work)
```

Or on failure:
```
{repo}/{file}: 0 done, 0 auto-resolved, 3 failed
Reason: unit tests broke after change, all items reverted
```

Or on pre-existing-failures:
```
CANNOT START: {repo}/{file} — pre-existing test failures
```
**Stop immediately on `CANNOT START`** — pre-existing failures must be
resolved before continuing.

## Step I4: Final Report

After all groups are processed (or stopped early):

```
Code style implementation complete for EUDPA-XXXXX.

Results:
  ✅ Done:          {N} items across {F} files
  ⏭️  Auto-Resolved: {N} items (already fixed)
  ❌ Failed:        {N} items
  🚫 Stopped:       [yes/no — pre-existing failures]

Done:
  {repo}/{file} → items #...,#... (commit {sha})
  ...

Auto-Resolved:
  {repo}/{file} → items #..., reason: ...
  ...

Failed (reverted, marked Status=Failed):
  {repo}/{file} → items #..., reason: ...
  ...
```

---

## Verdict Guidelines

| Verdict | Criteria |
|---------|----------|
| **COMPLIANT** | No open Fix items |
| **MINOR ISSUES** | 1-3 open Fix items, no FAIL severity |
| **NEEDS WORK** | ≥4 open Fix items, or any FAIL severity |

---

## Completion Output

**Fresh review:**
```
Code style review complete for EUDPA-XXXXX.

Summary:
- Per-repo verdicts:
  - {repo}: [VERDICT] ({N} items)
- Total items: [X]
- Files reviewed: [X] (verified 100% coverage)

Per-repo files: ${WORKSPACE_ROOT}/workareas/code-style-reviews/EUDPA-XXXXX/style-review.{repo}.md
```

**Refresh review:**
```
Code style refresh complete for EUDPA-XXXXX.

Summary:
- Lists processed: A={N} (changed) C={N} (merge) D={N} (gaps)
- List B carry-forward: {N} open items in unchanged files
- New violations added: {N}
- Auto-resolved: {N}
- Per-repo verdicts:
  - {repo}: [VERDICT] ({N} items)

Per-repo files: ${WORKSPACE_ROOT}/workareas/code-style-reviews/EUDPA-XXXXX/style-review.{repo}.md
```

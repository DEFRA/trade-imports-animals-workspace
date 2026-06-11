# Implementation (apply queued style fixes)

Loaded from SKILL.md on "fix style EUDPA-X" / "implement style fixes".
Applies all open Fix items by delegating one
`STYLE_IMPLEMENTOR.md`-following `general-purpose` Task subagent per
file (not per item) — each file is read once, edited once, tested once,
committed once.

**Prerequisite:** services must be running (frontend, backend, admin)
for E2E tests to pass.

## Step I1: Build the Work Plan

Group all open Fix items by `(repo, file)`:

```bash
~/git/defra/trade-imports-animals-workspace/tools/style/style-items.sh EUDPA-XXXXX --filter fix --status not-done --by-file --json
```

Output is `[{repo, file, items: [...]}, ...]` — one work unit per
implementor subagent. If the array is empty, output
`Nothing to do — no open Fix items.` and stop.

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

For each group, in order (frontend before other repos, then
alphabetical by file), spawn a `general-purpose` Task subagent:

```
Follow the instructions in ~/git/defra/trade-imports-animals-workspace/.claude/skills/code-style/references/STYLE_IMPLEMENTOR.md.

**Ticket:** EUDPA-XXXXX
**Repo:** {repo}
**File:** {file}
**Items (JSON):**
{indented JSON array of items from --by-file output, e.g.}
[
  {"id": 117, "rule": "2", "severity": "FAIL",
   "issue": "function getPendingRows() ...", "fix": "const getPendingRows = () => ...",
   "line": "14", "notes": ""}
]
```

**Wait for the subagent to return before starting the next group.**

### Handling Results

The implementor updates each item's Status (or Disposition) via
`style-set-status.sh` / `style-mark.sh`. Log the per-group outcome.
Subagents return summaries like:

```
{repo}/{file}: 3 done, 1 auto-resolved, 0 failed
  #117 → Done (commit abc123)
  #92  → Auto-Resolved (already fixed by earlier work)
```

Or on failure:

```
{repo}/{file}: 0 done, 0 auto-resolved, 3 failed
Reason: unit tests broke after change, all items reverted
```

Or:

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

Auto-Resolved:
  {repo}/{file} → items #..., reason: ...

Failed (reverted, marked Status=Failed):
  {repo}/{file} → items #..., reason: ...
```

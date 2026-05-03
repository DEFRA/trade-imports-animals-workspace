# CODE_STYLE_ORCHESTRATOR

Role: Work through all open code style violations for a ticket by spawning `CODE_STYLE_IMPLEMENTOR` agents — **one agent per file, not per item**. All open Fix items for a single file are handed to one agent so that file is read once, edited once, tested once, and committed once.

**Prerequisite:** Services must be running (frontend, backend, admin) for E2E tests to pass.

---

## Step 1: Build the Work Plan

Group all open Fix items by `(repo, file)`:

```bash
./skills/tools/style/style-items.sh EUDPA-XXXXX --filter fix --status not-done --by-file --json
```

Output is `[{repo, file, items: [...]}, ...]`. Each group is one work unit for one implementor agent.

If the array is empty, output:
```
Nothing to do — no open Fix items.
```
And stop.

---

## Step 2: Report Starting State

```
Starting code style implementation for EUDPA-XXXXX.

Open files: [N]  Items across them: [M]
By repo:
  {repo}: {file_count} file(s), {item_count} item(s)

First few groups:
  {repo}/{file}: items #N, #M, #K
  ...
```

---

## Step 3: Implement Groups Sequentially

For each group in the work list, in order (frontend before other repos, then alphabetical by file):

Spawn a `general-purpose` agent via the Task tool using this prompt template:

```
Follow the instructions in skills/personas/code-style/CODE_STYLE_IMPLEMENTOR.md.

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

**Wait for the agent to return before starting the next group.**

### Handling Results

The implementor itself updates each item's Status (or Disposition) via `style-set-status.sh` / `style-mark.sh`. The orchestrator only logs the per-group outcome.

Each agent returns a summary like:

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
**Stop immediately on `CANNOT START`** — pre-existing failures must be resolved before continuing.

---

## Step 4: Final Report

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

If any items failed, list them so the user can address them manually. The Status=Failed marker is already in the items table; users can re-run the orchestrator after fixes to retry.

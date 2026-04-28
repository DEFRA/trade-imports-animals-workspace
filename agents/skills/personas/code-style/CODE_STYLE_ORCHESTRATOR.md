# CODE_STYLE_ORCHESTRATOR

Role: Work through all open code style violations for a ticket, one at a time, by spawning `CODE_STYLE_IMPLEMENTOR` agents sequentially.

**Prerequisite:** Services must be running (frontend, backend, admin) for E2E tests to pass.

---

## Step 1: Load the Review Doc

Read:
```
workareas/code-style-reviews/EUDPA-XXXXX/code-style-review.md
```

Build the work list: every row where **both** Addressed and Won't Address are `[ ]`. Group by repo section.

Skip any row where Won't Address is `[x]` — those are deliberately deferred, do not attempt them.

If the work list is empty, output:
```
Nothing to do — all open items are either addressed or marked Won't Address.
```
And stop.

---

## Step 2: Report Starting State

```
Starting code style implementation for EUDPA-XXXXX.
Open items: [N] across [repos]
Won't Address (skipped): [N]

Items to implement:
  frontend: #1, #5, #12, ...
  admin: #2, #4, ...
```

---

## Step 3: Implement Items Sequentially

For each item in the work list, in order (frontend items first, then other repos):

Spawn a `general-purpose` agent via the Task tool using this prompt template:

```
Follow the instructions in skills/personas/code-style/CODE_STYLE_IMPLEMENTOR.md.

**Ticket:** EUDPA-XXXXX
**Item:** #[N]
**Repo:** [repo-name]
**File:** [path/to/file.js]
**Rule:** [rule number]
**Issue:** [exact text from the Issue column]
```

**Wait for the agent to return before starting the next item.**

### Handling Results

| Result | Action |
|--------|--------|
| `DONE` | Log success, continue to next item |
| `SKIPPED` | Log as already fixed, continue |
| `FAILED` | Log failure with reason, continue to next item (don't stop the run) |
| `CANNOT START` | **Stop immediately** — pre-existing failures must be resolved before continuing |
| `WON'T FIX` | Log reason, update the review doc to mark Won't Address `[x]` for this item, continue |

---

## Step 4: Final Report

After all items are processed (or stopped early):

```
Code style implementation complete for EUDPA-XXXXX.

Results:
  ✅ Done:     [N] items
  ⏭️  Skipped:  [N] items (already fixed)
  ❌ Failed:   [N] items
  🚫 Stopped:  [yes/no — pre-existing failures]

Done:
  #N [repo] — [description]
  ...

Failed (not committed):
  #N [repo] — [reason]
  ...

Review doc updated: workareas/code-style-reviews/EUDPA-XXXXX/code-style-review.md
```

If any items failed, list them clearly so the user can address them manually.

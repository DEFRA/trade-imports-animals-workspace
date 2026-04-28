# REVIEW_BATCH_IMPLEMENTOR

Role: Apply all queued `FIX` decisions from a completed walker session. Reads `decisions.md`, spawns a fixer agent per item, and updates `review.md` with results — no user input required during the run.

**Trigger:** `"implement review EUDPA-XXXXX"` or `"implement review EUDPA-XXXXX {repo}"` (optional repo filter).

See `CLAUDE.md` for helper scripts.

---

## Step 1: Load Decisions

Read:
```
workareas/reviews/EUDPA-XXXXX/decisions.md
```

If the file does not exist or contains no `FIX` rows:
```
No fix decisions found for EUDPA-XXXXX. Run `walk review EUDPA-XXXXX` first.
```
And stop.

Build the fix list: every row where the first field is `FIX`.

Apply any filters from the trigger:
- `{repo}` — only rows matching that repo

If the fix list is empty after filtering:
```
No queued fixes for EUDPA-XXXXX [{repo filter}].
```
And stop.

---

## Step 2: Report Starting State

```
Implementing fixes for EUDPA-XXXXX [{repo filter}]
Queued fixes: [N] ([breakdown by repo])

Order: [list of item numbers]

No input needed — running all fixes now.
```

---

## Step 3: Pre-flight Test Check

Before making any changes, run tests for each repo that has queued fixes.

### Node.js repos (frontend, admin, tests)

Unit tests:
```bash
cd ../repos/{repo} && npm test
```

E2E tests:
```bash
cd ../repos/trade-imports-animals-tests && npm run test:local
```

### Java repo (backend)
```bash
cd ../repos/trade-imports-animals-backend && mvn test -q
```

**If tests fail in any repo:**
```
CANNOT START: pre-existing test failures in {repo}
Unit: [pass/fail summary]
E2E: [pass/fail summary]

Resolve failures before running the implementor.
```
And stop. Do not attempt any fixes.

---

## Step 4: Apply Fixes (one at a time, sequential)

Process fixes in item-number order within each repo.

For each `FIX` row, spawn a `general-purpose` agent via the Task tool:

```
Follow the instructions in skills/personas/review/REVIEW_ITEM_FIXER.md.

**Ticket:** EUDPA-XXXXX
**Item:** #{N}
**Repo:** {repo-name}
**File:** {path/to/file}
**Line:** {NN}
**Issue:** {issue text from decisions.md}
**Fix:** {fix text from decisions.md}
```

Wait for the agent to return before spawning the next one (fixes within the same repo may affect shared files or tests).

### Handling fixer results

| Result | Action |
|--------|--------|
| `DONE` | Mark Fixed `[x]` in `review.md` (item's row). Mark Fixed `[x]` in the per-file `.review.md` at `workareas/reviews/EUDPA-XXXXX/file-reviews/{repo}/{filename}.review.md`. Update the row in `decisions.md` from `FIX` to `DONE`. Log success. |
| `SKIPPED` | Auto-mark Fixed `[x]` (already resolved). Update row to `AUTO_RESOLVED`. Log as auto-resolved. |
| `FAILED` | Log failure with reason. Update row to `FAILED`. Leave `review.md` row unchanged. Continue to next item. |
| `CANNOT START` | **Stop immediately.** Report pre-existing failures. Ask user to resolve before re-running. |
| `WON'T FIX` | Mark Won't Fix `[x]` in both docs. Update row to `WONT_FIX`. Log the fixer's reason. Continue. |

---

## Step 5: Final Report

```
Implementation complete for EUDPA-XXXXX [{filters}].

Results:
  ✅ Fixed:          N items
  🔍 Auto-resolved:  N items (already fixed in code)
  ❌ Won't Fix:      N items (fixer determined not applicable)
  🔥 Failed:         N items

Fixed:
  #{N} [{repo}] — {description} ({short-sha})
  ...

Failed (not committed — still in decisions.md as FAILED):
  #{N} [{repo}] — {reason}
  ...

Remaining queued: N items (run `implement review EUDPA-XXXXX` to retry)
```

If all items succeeded, the decisions file retains the history with `DONE`/`AUTO_RESOLVED` statuses.

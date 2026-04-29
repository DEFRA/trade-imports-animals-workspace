# REVIEW_WALKER

Role: Interactive walkthrough of open review items for an EUDPA ticket. Presents items one at a time with real code context, waits for a user decision, **records decisions to a file**, then moves on. No fixing happens here — the implementor does that afterwards.

**Trigger:** `"walk review EUDPA-XXXXX"` or `"walk review EUDPA-XXXXX {repo}"` (optional repo filter) or `"walk review EUDPA-XXXXX --major"` (optional severity filter).

See `CLAUDE.md` for helper scripts.

---

## Step 1: Load the Work List

Read all per-repo review files:
```
workareas/reviews/EUDPA-XXXXX/review.{repo}.md   (one per repo, e.g. review.trade-imports-animals-frontend.md)
```

Build the work list: every row in every todo section where **both** Fixed and Won't Fix are `[ ]`.

Apply any filters from the trigger:
- `{repo}` — only read `review.{repo}.md` for that specific repo
- `--critical` — only Critical severity rows
- `--major` — only Critical and Major severity rows

Skip any row where Won't Fix is `[x]` — deliberately deferred.

Also read any existing decisions files to skip items already decided:
```
workareas/reviews/EUDPA-XXXXX/decisions.{repo}.md   (one per repo, e.g. decisions.trade-imports-animals-frontend.md)
```
If they exist, exclude items already marked `FIX`, `WONT_FIX`, or `SKIP` in those files (unless the user is re-walking deliberately).

If the work list is empty:
```
Nothing to do — all open items are fixed, Won't Fix, or filtered out.
```
And stop.

---

## Step 2: Report Starting State

```
Walking review EUDPA-XXXXX [{repo filter}] [{severity filter}]
Open items: [N] ([breakdown by repo])
Won't Fix (skipped): [N]

Order: [list of item numbers]

Decisions will be saved to: workareas/reviews/EUDPA-XXXXX/decisions.{repo}.md (one per repo)
Run `implement review EUDPA-XXXXX` afterwards to apply fixes.
```

---

## Step 3: Present Items One at a Time

For each item in work list order:

### 3a. Check whether the violation is still present

Try to read the file from the live repo first:
```
../repos/{repo}/{file-path}
```
Fall back to the workspace copy if the live repo is not available:
```
workareas/reviews/EUDPA-XXXXX/repos/{repo}/{file-path}
```

Extract ~10 lines of context centred on the reported line number. Scan those lines for the specific pattern named in the Issue column (function name, variable name, operator, attribute, etc.).

**If NOT found:** the violation has already been resolved. Auto-record as `AUTO_RESOLVED` in `decisions.{repo}.md`, report it, and move on — no user input needed.

### 3b. Present the item

```
─── Item N of M ── [{SEVERITY}] ── {repo} ──────────────────────
File: {path/to/file}  Line: {NN}
Category: {category}
Issue: {issue description}

{code snippet — ~10 lines, with the offending line highlighted}

Fix: {fix description from todo list}
──────────────────────────────────────────────────────────────────
Options: [F]ix  [W]on't Fix  [S]kip  [D]iscuss
```

### 3c. Wait for user response

Do not proceed until the user responds. Handle responses:

| Response | Action |
|----------|--------|
| `F` / `fix` / `yes` / `fix it` | → Step 4: Record Fix decision |
| `W` / `won't fix` / `wont fix` / `no` | → Step 5: Record Won't Fix decision |
| `S` / `skip` | Leave undecided, move to next item |
| `D` / `discuss` / any question | Answer conversationally, then re-present the item for a decision. If the discussion concludes with a fix approach, record any clarifications in the decision notes. |

---

## Step 4: Record Fix Decision

Append to `workareas/reviews/EUDPA-XXXXX/decisions.{repo}.md`:

```
FIX | #{N} | {repo} | {path/to/file} | {NN} | {issue text} | {fix text}
```

Log:
```
✅ Item #N — queued for fixing
```

Move to next item. **Do not spawn a fixer agent.**

---

## Step 5: Record Won't Fix Decision

If the user provides a reason, include it.

Append to `workareas/reviews/EUDPA-XXXXX/decisions.{repo}.md`:

```
WONT_FIX | #{N} | {repo} | {path/to/file} | {NN} | {issue text} | {reason if given}
```

Also mark Won't Fix `[x]` in `review.{repo}.md` (this item's row) and in the per-file `.review.md` at `workareas/reviews/EUDPA-XXXXX/file-reviews/{repo}/{filename}.review.md`.

Log:
```
⏭️  Item #N — Won't Fix{: reason if given}
```

Move to next item.

---

## Step 6: Initialise / Update Decisions Files

Decisions files live at the ticket root, one per repo:
```
workareas/reviews/EUDPA-XXXXX/decisions.{repo}.md   (e.g. decisions.trade-imports-animals-frontend.md)
```

Format:
```markdown
# Decisions — EUDPA-XXXXX ({repo})
<!-- Walker appends rows here. Each pipe-delimited row is one decision. -->
<!-- Decision | Item# | Repo | File | Line | Issue | Notes/Fix -->

AUTO_RESOLVED | #2 | frontend | src/foo.js | 14 | use of == | already uses ===
FIX | #5 | frontend | src/bar.js | 42 | missing error handler | add try/catch around fetchData call
WONT_FIX | #9 | frontend | src/qux.js | 12 | unused import | third-party type augmentation, must stay
SKIP | #11 | frontend | test/foo.test.js | 33 | test description vague | —
```

If a file does not exist for the current repo, create it with the header before appending the first row.

---

## Step 7: Final Report

After all items are processed:

```
Walk complete for EUDPA-XXXXX [{filters}].

Decisions recorded:
  ✅ Fix:            N items  (queued for implementor)
  🔍 Auto-resolved:  N items  (already fixed in code)
  ❌ Won't Fix:      N items  (marked in review.{repo}.md)
  ⏭️  Skipped:       N items  (left undecided)

Decisions saved to: workareas/reviews/EUDPA-XXXXX/decisions.{repo}.md (per repo)

To apply the queued fixes, run:
  implement review EUDPA-XXXXX
```

If there are no Fix decisions, omit the last line.

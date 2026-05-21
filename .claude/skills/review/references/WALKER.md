# REVIEW_WALKER

Role: Interactive walkthrough of pending review items for an EUDPA ticket. Presents items one at a time with real code context, waits for a user decision, **records the disposition by calling helper scripts**, then moves on. No fixing happens here — the implementor does that afterwards.

**Trigger:** `"walk review EUDPA-XXXXX"` or `"walk review EUDPA-XXXXX {repo}"` (optional repo filter) or `"walk review EUDPA-XXXXX --major"` (optional severity filter).

See `CLAUDE.md` for helper scripts.

---

## Step 1: Load the Work List

Pull all items missing a disposition (i.e. the user has not hand-marked them and the walker has not yet recorded one):

```bash
./skills/tools/review/review-items.sh EUDPA-XXXXX --filter pending --json
```

Apply any filters from the trigger:
- `{repo}` — add `--repo {repo}`
- `--critical` / `--major` — filter the JSON output for matching severities

The items table is the single source of truth. Hand-marked rows (where the user typed `Fix` / `Won't Fix` into the Disposition column themselves) are already excluded by `--filter pending`.

If the work list is empty:
```
Nothing to walk — all items have a disposition.
```
And stop.

---

## Step 2: Report Starting State

```
Walking review EUDPA-XXXXX [{repo filter}] [{severity filter}]
Pending items: [N] ([breakdown by repo])
Hand-marked / decided: see `review-counts.sh EUDPA-XXXXX`

Order: [list of item numbers]

Decisions are written directly to: workareas/reviews/EUDPA-XXXXX/review.{repo}.md
Run `implement review EUDPA-XXXXX` afterwards to apply Fix-disposition items.
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

**If NOT found:** the violation has already been resolved. Auto-record:
```bash
./skills/tools/review/review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Auto-Resolved" --note "{what was found instead}"
```
Report it, and move on — no user input needed.

### 3b. Present the item

```
─── Item N of M ── [{SEVERITY}] ── {repo} ──────────────────────
File: {path/to/file}  Line: {NN}
Category: {category}
Issue: {issue description}

{code snippet — ~10 lines, with the offending line highlighted}

Fix: {fix description from the items table}
──────────────────────────────────────────────────────────────────
Options: [F]ix  [W]on't Fix  [S]kip  [D]iscuss
```

### 3c. Wait for user response

Do not proceed until the user responds. Handle responses:

| Response | Action |
|----------|--------|
| `F` / `fix` / `yes` / `fix it` | → Step 4: Record `Fix` |
| `W` / `won't fix` / `wont fix` / `no` | → Step 5: Record `Won't Fix` |
| `D` / `discuss` | → Step 6: Discuss inline, then record `Discuss` (or `Fix` / `Won't Fix` if the discussion concludes) |
| `S` / `skip` | Leave the row's disposition blank, move to next item |

---

## Step 4: Record `Fix`

```bash
./skills/tools/review/review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Fix" [--note "{refined fix or context}"]
```

The script auto-sets Status to `Not Done`. Log:
```
✅ Item #N — queued as Fix
```

Move to next item. **Do not spawn a fixer agent.**

---

## Step 5: Record `Won't Fix`

If the user provides a reason, pass it as `--note`.

```bash
./skills/tools/review/review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Won't Fix" [--note "{reason}"]
```

Log:
```
⏭️  Item #N — Won't Fix{: reason if given}
```

Move to next item.

---

## Step 6: Discuss

Answer the user's question(s) inline using whatever context is available (read code, follow up on related items, etc.). When the discussion settles:

- If the conclusion is **fix it** → call Step 4 with a `--note` summarising the agreed approach.
- If the conclusion is **leave it** → call Step 5 with the reason.
- If the user wants to **defer to a wider conversation** (e.g. PR thread, standup) →
  ```bash
  ./skills/tools/review/review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Discuss" --note "{summary of open question / who to ask}"
  ```

Log:
```
💬 Item #N — Discuss queued: {note}
```

Move to next item.

---

## Step 7: Final Report

After all items are processed:

```
Walk complete for EUDPA-XXXXX [{filters}].

Dispositions recorded this run:
  ✅ Fix:            N items  (queued for implementor)
  🔍 Auto-resolved:  N items  (already fixed in code)
  ❌ Won't Fix:      N items
  💬 Discuss:        N items  (left flagged for human follow-up)
  ⏭️  Skipped:       N items  (still pending — re-walk to revisit)

Items table updated in: workareas/reviews/EUDPA-XXXXX/review.{repo}.md (one per repo)

To apply the Fix items, run:
  implement review EUDPA-XXXXX
```

If there are no Fix dispositions added in this run, omit the last line.

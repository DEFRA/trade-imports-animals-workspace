# Walker — interactive triage

Interactive walkthrough of pending review items for an EUDPA ticket.
Presents items one at a time, **fast**, from `items.{repo}.json` only —
no file reads, no code context, no fix-already-applied auto-detection.
Just disposition, next item.

User hits a single key per item. When they want context, they hit `D`
and the walker switches to slow-track for that one item.

**Trigger:** `"walk review EUDPA-XXXXX"`, `"walk review EUDPA-XXXXX
{repo}"` (repo filter), or `"walk review EUDPA-XXXXX --major"`
(severity filter).

The items table schema lives in `assets/items-table.md`.

---

## Step 1: Load the work list

```bash
$TRADE_IMPORTS_WORKSPACE/tools/review/review-items.sh EUDPA-XXXXX --filter pending --json
```

Apply trigger filters:
- `{repo}` — add `--repo {repo}`
- `--critical` / `--major` — filter the JSON for matching severities

Hand-marked rows (where the user typed `Fix` / `Won't Fix` directly
into `items.{repo}.json`) are excluded by `--filter pending`.

If empty:
```
Nothing to walk — all items have a disposition.
```
Stop.

---

## Step 2: Announce

```
Walking review EUDPA-XXXXX [{filters}]
Pending items: [N] ([breakdown by repo])

F = Fix · W = Won't Fix · D = Discuss · S = Skip
```

---

## Step 3: Present items one at a time

For each item in work-list order:

```
[i/N] {Severity} · {repo} · {file}:{line} · {category}
  Issue: {issue}
  Fix:   {fix}
  Cite:  {best_practice}                ← omit if null
  [F]ix [W]on't Fix [D]iscuss [S]kip:
```

All fields come from the JSON. **Do not read the source file. Do not
print code snippets. Do not check whether the violation is still
present.** That's all on the slow path (Discuss).

Wait for user response.

| Response | Action |
|----------|--------|
| `F` / `fix` / `yes` | Step 4 — record Fix |
| `W` / `won't fix` / `no` | Step 5 — record Won't Fix |
| `D` / `discuss` | Step 6 — slow-track this one item |
| `S` / `skip` | Leave disposition pending, move to next |

Multi-key shortcuts: if the user types a sequence like `FFW`, apply
them in order to the current and next two items.

---

## Step 4: Record Fix

```bash
$TRADE_IMPORTS_WORKSPACE/tools/review/review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Fix"
```

Auto-sets Status to `Not Done`.

```
✓ #{N} Fix
```

Move to next.

---

## Step 5: Record Won't Fix

If the user provided a reason inline (e.g. `W: not in scope`), pass it
as `--note "{reason}"`.

```bash
$TRADE_IMPORTS_WORKSPACE/tools/review/review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Won't Fix" [--note "{reason}"]
```

```
✗ #{N} Won't Fix
```

Move to next.

---

## Step 6: Discuss — slow-track this one item

The user wants more context before deciding. Switch modes for this
item only:

1. **Read the file** from the workspace copy:
   ```
   $TRADE_IMPORTS_WORKSPACE/workareas/reviews/EUDPA-XXXXX/repos/{repo}/{file-path}
   ```
2. **Show ~10 lines around the reported line.** Highlight the
   reported line.
3. **Engage with the user.** Answer their question, follow related
   items, read whatever neighbouring files help.
4. **Conclude with a disposition.** When the discussion settles, call
   the right helper:
   - "fix it" → Step 4 with `--note "{agreed approach}"`
   - "leave it" → Step 5 with `--note "{reason}"`
   - "defer to PR thread / standup / wider conversation":
     ```bash
     $TRADE_IMPORTS_WORKSPACE/tools/review/review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Discuss" --note "{open question / who to ask}"
     ```
     ```
     💬 #{N} Discuss — {note}
     ```

Move to next.

---

## Step 7: Final report

After all items processed:

```
Walk complete for EUDPA-XXXXX [{filters}].

  Fix:        N
  Won't Fix:  N
  Discuss:    N
  Skipped:    N  (still pending)

To apply the Fix items: implement review EUDPA-XXXXX
```

Omit the last line if no Fix dispositions were recorded.

---

## Speed notes

The point of the walker is **rate of decision-making**. Don't:
- Read the source file before D.
- Print code snippets before D.
- Check whether the violation is "still present" — if the user spots
  a stale item, they hit W with note "already done".
- Verbose-log between items. One line per disposition is enough.

For long backlogs, prefer the multi-key shortcut (`FFWFFW`) over
per-item single keys. The user knows what they want; the walker just
records it.

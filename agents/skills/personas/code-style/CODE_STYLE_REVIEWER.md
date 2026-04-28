# CODE_STYLE_REVIEWER

Role: Code style review for EUDP Live Animals tickets. **JavaScript canary** — checks `.js` files against the project code style guide. Handles first reviews and subsequent re-reviews from a single entry point.

See `CLAUDE.md` for helper scripts.

---

## Step 0: Detect Mode

Check whether a style review already exists for this ticket:

```bash
ls workareas/code-style-reviews/EUDPA-XXXXX/code-style-review.md 2>/dev/null
```

- **File not found → Fresh Review**: proceed to Step 1.
- **File found → Refresh Review**: jump to Step R1.

---

# FRESH REVIEW

## Step 1: Prepare Review Workspace

The code-style review piggybacks on the standard review workspace for cloned repos. Ensure it exists:

```bash
ls workareas/reviews/EUDPA-XXXXX/.review-meta.json 2>/dev/null \
  || ./skills/tools/review/prepare-review.sh EUDPA-XXXXX
```

Then create the code-style workspace:

```bash
mkdir -p workareas/code-style-reviews/EUDPA-XXXXX/file-reviews
```

## Step 2: Discover JavaScript Files

Read `.review-meta.json` to get repos and PR numbers:

```bash
cat workareas/reviews/EUDPA-XXXXX/.review-meta.json
```

For each repo/PR pair, list changed files and filter for `.js`:

```bash
./skills/tools/github/pr-details.sh {repo} {pr-number} files
```

Keep only files ending in `.js`. If **no `.js` files are found across any PR**, output:

```
No JavaScript files found in this PR. No JavaScript code style review needed.
```

And stop — no further steps required.

## Step 3: Create Zero-Byte Placeholders

For each `.js` file found:

1. Create the repo subdirectory under the code-style workspace:
   `workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/{repo}/`

2. Create a zero-byte placeholder (path separators replaced with `_`):
   `workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/{repo}/{safe_path}.style.md`

Also create one zero-byte per-repo placeholder:
`workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/{repo}/repo-style-review.md`

Write `.style-meta.json` to the workspace root:

```json
{
  "id": "EUDPA-XXXXX",
  "created": "ISO-DATE",
  "js_files": [
    { "repo": "repo-name", "path": "path/to/file.js", "pr": 123 }
  ]
}
```

## Step 4: Review Each File

**MANDATORY:** Review EVERY `.js` file. No exceptions.

### Parallel Execution

Spawn up to **10 agents in parallel** using Task tool with `subagent_type=general-purpose`.

#### Agent Prompt Template

```markdown
Follow the instructions in skills/personas/code-style/CODE_STYLE_FILE_REVIEWER.md.

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Style guide:** ../docs/node/code-style.md (relative to agents dir)

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- PR: #[pr-number]
- Full path in workspace: workareas/reviews/EUDPA-XXXXX/repos/[repo-name]/[file-path]

**Write your review to the placeholder file:**
workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[safe_path].style.md

Note: Nested paths use underscores (e.g., `src/utils/helper.js` → `src_utils_helper.js.style.md`)
```

## Step 5: Verify Coverage

```bash
./skills/tools/review/verify-style-coverage.sh EUDPA-XXXXX
```

**You may NOT proceed to Step 6 until 100% coverage.**

## Step 6: Create Per-Repo Style Summaries

For each repository with `.js` files, fill in its `repo-style-review.md` placeholder by reading all `*.style.md` files for that repo and synthesising:

```markdown
# Code Style Review: {repo-name}

**Ticket:** EUDPA-XXXXX
**PR:** #{pr-number}
**JS Files Reviewed:** {count}

## Rule Compliance

| # | Rule | Status | Violations |
|---|------|--------|------------|
| 1 | Do one thing | ✅ / ⚠️ / ❌ | N |
| 2 | Fat-arrow functions | ✅ / ⚠️ / ❌ | N |
| 3 | No unnecessary braces/returns | ✅ / ⚠️ / ❌ | N |
| 4 | Functional style | ✅ / ⚠️ / ❌ | N |
| 5 | Small composed functions | ✅ / ⚠️ / ❌ | N |
| 6 | Naming | ✅ / ⚠️ / ❌ | N |
| 7 | Destructuring and defaults | ✅ / ⚠️ / ❌ | N |
| 8 | Early returns | ✅ / ⚠️ / ❌ | N |
| 9 | No clever one-liners | ✅ / ⚠️ / ❌ | N |
| 10 | Named exports | ✅ / ⚠️ / ❌ | N |
| 11 | const > let, never var | ✅ / ⚠️ / ❌ | N |
| 12 | Optional chaining / nullish | ✅ / ⚠️ / ❌ | N |
| 13 | No magic numbers/strings | ✅ / ⚠️ / ❌ | N |
| 14 | async/await preferred | ✅ / ⚠️ / ❌ | N |
| 15 | Self-documenting code | ✅ / ⚠️ / ❌ | N |
| 16 | Modern array/object methods | ✅ / ⚠️ / ❌ | N |

## File-by-File Summary

| File | Status | Top Violations |
|------|--------|----------------|

## Violations

### Must Fix
[Violations that clearly contradict the style guide — `var`, mutation where functional is expected, `.then()` chains where `async/await` is the rule, etc.]

### Should Fix
[Style deviations worth addressing but not blocking]

## Todo List

One row per actionable violation (FAIL or WARN). Be specific: name the function, line range, or pattern. This list is handed to an agent to action.

| # | File | Rule | Issue | Addressed | Won't Address |
|---|------|------|-------|-----------|---------------|
| 1 | `path/to/file.js` | 2 | Convert `function foo` → `const foo = () =>` | [ ] | [ ] |

## Repository Verdict

**Status:** COMPLIANT / MINOR ISSUES / NEEDS WORK
**Summary:** [One sentence]
```

**Note:** Skip this step if only one repository has `.js` files — the overall review in Step 7 serves the same purpose.

## Step 7: Write Overall Code Style Review

Create `workareas/code-style-reviews/EUDPA-XXXXX/code-style-review.md`:

```markdown
# Code Style Review: EUDPA-XXXXX

**Ticket:** [Summary]
**Reviewer:** Claude Code Agent
**Date:** [Date]
**Verdict:** COMPLIANT / MINOR ISSUES / NEEDS WORK

## Scope

| Repository | PR | JS Files Reviewed | Verdict |
|------------|-----|-------------------|---------|

## Rule Compliance Across All Repos

| # | Rule | Status | Total Violations |
|---|------|--------|-----------------|
| 1 | Do one thing | | |
...

## Top Violations

| Repository | File | Line | Rule | Issue | Recommendation |
|------------|------|------|------|-------|----------------|

## Patterns of Note

[Recurring violations that suggest a team habit to address, or consistent good practice to call out]

## Recommendations

### Must Fix
### Should Fix

## Todo List

Concatenation of all per-repo todo lists. Each row is one actionable item. An agent can work through this list top to bottom.

### {repo-name-1}

| # | File | Rule | Issue | Addressed | Won't Address |
|---|------|------|-------|-----------|---------------|

### {repo-name-2}

| # | File | Rule | Issue | Addressed | Won't Address |
|---|------|------|-------|-----------|---------------|

## Conclusion
[2-3 sentences]
```

---

# REFRESH REVIEW

Used when a style review already exists and you want to: check whether reported issues have been addressed, catch any new violations introduced since the last review, and update the doc in place.

## Step R1: Update Workspace Repos

Pull the latest code into each cloned repo so file checks reflect current branch state:

```bash
git -C workareas/reviews/EUDPA-XXXXX/repos/{repo} pull --rebase --quiet
```

Repeat for every repo listed in `.review-meta.json`.

## Step R2: Get Changes Since Last Review

```bash
./skills/tools/review/diff-since-review.sh EUDPA-XXXXX --json
```

This compares the commit at last review time against the current PR head. Note which `.js` files changed and which repos had no changes.

If **no changes detected across all repos**: report that the branch is unchanged since the last style review and stop.

## Step R3: Determine Work Scope

From the diff output and the existing `code-style-review.md`, build two work lists:

**List A — Files to re-review** (spawn file reviewer agents):
- Any `.js` file that changed since the last review (`change_type: modified`)
- Any new `.js` file added since the last review (`change_type: added`)

**List B — Unchanged files with open todo items** (check inline, no agent needed):
- `.js` files that did NOT appear in the diff but still have unchecked `[ ]` items in the Addressed column AND `[ ]` in the Won't Address column
- Skip any item where Won't Address is `[x]` — those are deliberately deferred and should not be re-reported
- For each remaining item: read the current file in the workspace and check whether the specific violation is still present

Deleted `.js` files can be ignored — mark their todo items as addressed.

## Step R4: Re-review Changed Files

For every file in List A, spawn a `CODE_STYLE_FILE_REVIEWER` agent (up to 10 parallel).

Pass existing violations for that file so the reviewer knows what was previously flagged:

```markdown
Follow the instructions in skills/personas/code-style/CODE_STYLE_FILE_REVIEWER.md.

**Mode: REFRESH** — this file has changed since the last style review.

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Style guide:** ../docs/node/code-style.md (relative to agents dir)

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- PR: #[pr-number]
- Full path in workspace: workareas/reviews/EUDPA-XXXXX/repos/[repo-name]/[file-path]

**Previously reported violations for this file (from last review):**
[Paste the relevant rows from the todo list for this file, or "None" if it's a new file]

**Write your updated review to (overwrite existing):**
workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[safe_path].style.md
```

The file reviewer will note which old violations are resolved and identify any new ones.

## Step R5: Update the Review Doc

Once all agents complete and you have checked List B items inline:

**Build a change summary:**
- Which todo items are now resolved (mark `[x]` in Addressed)
- Which todo items remain genuinely open (Addressed `[ ]` AND Won't Address `[ ]`)
- Items with Won't Address `[x]` — omit from the summary entirely, they are already decided
- Which new violations were found (append as new rows)

**Update `code-style-review.md` in place:**

1. Add an "Updated" line near the top (keep original date, add update date):
   ```
   **Date:** [original date]
   **Last Updated:** [today]
   ```

2. Update the todo list:
   - Mark resolved items: change `[ ]` → `[x]` in the Addressed column
   - Append new violations as new rows at the bottom of the relevant repo section
   - Do NOT remove rows — keep the full history visible

3. Add a "Refresh Summary" section before the Conclusion:
   ```markdown
   ## Refresh Summary ([date])

   **Changes since last review:** [X] files modified, [Y] files added
   **Todo items resolved:** [N] of [M] open items
   **New violations found:** [N]

   | Change | File | Detail |
   |--------|------|--------|
   | ✅ Resolved | `path/to/file.js` | Item #N: [brief description] |
   | ➕ New | `path/to/file.js` | Rule [N]: [brief description] |
   | ⚠️ Still open | `path/to/file.js` | Item #N: [brief description] |

   Do NOT include Won't Address items (`[x]` in Won't Address column) in this table.
   ```

4. Update the top-level **Verdict** if warranted (e.g. was NEEDS WORK, now MINOR ISSUES).

---

## Verdict Guidelines

| Verdict | Criteria |
|---------|----------|
| **COMPLIANT** | All reviewed JS follows the style guide, or only trivial deviations |
| **MINOR ISSUES** | Some deviations but nothing systemic; 1-3 isolated violations |
| **NEEDS WORK** | Multiple or systematic violations of the style guide |

---

## Completion Output

**Fresh review:**
```
Code style review complete for EUDPA-XXXXX.

Summary:
- Verdict: [VERDICT]
- JS files reviewed: [X] (verified 100% coverage)
- Repositories: [list]
- Total violations: [X]

Overall review: workareas/code-style-reviews/EUDPA-XXXXX/code-style-review.md
```

**Refresh review:**
```
Code style refresh complete for EUDPA-XXXXX.

Summary:
- Previous verdict: [VERDICT] → New verdict: [VERDICT]
- Files re-reviewed: [X]
- Todo items resolved: [N] / [M]
- New violations found: [N]

Updated review: workareas/code-style-reviews/EUDPA-XXXXX/code-style-review.md
```

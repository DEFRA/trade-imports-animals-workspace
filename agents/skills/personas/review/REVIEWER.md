# REVIEWER

Role: Pre-merge code review for EUDP Live Animals tickets. Handles first reviews and subsequent re-reviews from a single entry point.
Assess: correctness|code-quality|best-practices|error-handling|security|performance|tests

See `CLAUDE.md` for helper scripts.

---

## Step 0: Detect Mode

```bash
ls workareas/reviews/EUDPA-XXXXX/review-index.md 2>/dev/null
```

- **File not found → Fresh Review**: proceed to Step 1.
- **File found → Refresh Review**: jump to Step R1.

---

# FRESH REVIEW

## Step 1: Prepare Workspace

```bash
./skills/tools/review/prepare-review.sh EUDPA-XXXXX
```

Creates: `workareas/reviews/EUDPA-XXXXX/` with ticket.md, repos/, file-reviews/ placeholders.

## Step 2: Review Each File

**MANDATORY:** Create review for EVERY changed file. No exceptions.

### Parallel Execution

Spawn up to **10 agents in parallel** using Task tool with `subagent_type=general-purpose`.

#### Agent Prompt Template

```markdown
Follow the instructions in personas/review/FILE_REVIEWER.md.

**Mode:** FRESH

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Review workspace:** workareas/reviews/EUDPA-XXXXX/

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- Commit: [sha]

**Write your review to the existing placeholder file:**
workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md

Note: Nested paths use underscores (e.g., `src/main/Service.java` → `src_main_Service.java.review.md`)
```

## Step 3: Verify Coverage

```bash
./skills/tools/review/verify-coverage.sh EUDPA-XXXXX
```

**You may NOT proceed to Step 4 until 100% coverage.**

## Step 4: Consistency Review

Spawn **one agent** using `subagent_type=general-purpose`:

```markdown
Follow the instructions in personas/review/CONSISTENCY_REVIEWER.md.

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Review workspace:** workareas/reviews/EUDPA-XXXXX/

Read .review-meta.json for all repos and PR numbers.
Write _consistency-check.md for every repo listed.
```

Wait for the agent to complete. Verify `_consistency-check.md` exists for each repo before proceeding.

## Step 5: Create Repository Summaries

For **each repository** in the review, create `workareas/reviews/EUDPA-XXXXX/review.{repo}.md` at the ticket root (sibling of `decisions.{repo}.md`) by reading all `*.review.md` files for that repo and synthesising:

```markdown
# Repository Review: {repo-name}

**PR:** #{pr-number}
**Commit:** {sha}
**Files Changed:** {count}

## Summary
[2-3 sentences about changes in this repository]

## File Analysis Summary
| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|

## Positive Observations
[What was done well]

## Test Coverage
- Unit tests: [assessment]
- Integration tests: [assessment]

## Risk Assessment
**Overall Risk:** Low / Medium / High
**Rationale:** [One sentence]

## Todo List

Concatenation of all file todo lists for this repo. Re-number rows sequentially (1, 2, 3...) across all files.

| # | File | Line | Severity | Category | Issue | Fix | Fixed | Won't Fix |
|---|------|------|----------|----------|-------|-----|-------|-----------|

## Repository Verdict
**Status:** SAFE / NEEDS ATTENTION / RISKY
```

**Note:** Skip this step if only one repository is involved.

## Step 6: Write Index

Create `workareas/reviews/EUDPA-XXXXX/review-index.md` — a thin navigation index only, no item rows:

```markdown
# Code Review: EUDPA-XXXXX

**Ticket:** [Summary]
**Reviewer:** Claude Code Agent
**Date:** [Date]
**Verdict:** PASS / PASS WITH NOTES / CONCERNS / FAIL

## Summary
[2-3 sentences]

## Repositories Analyzed
| Repository | PR | Merge Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| {repo-name} | #{pr} | {sha} | {N} | SAFE/NEEDS ATTENTION/RISKY | [review.{repo}.md](review.{repo}.md) |

## Acceptance Criteria Check
| # | Criterion | Met? | Notes |
|---|-----------|------|-------|

## Test Coverage Assessment
- **Unit Tests:** Present/Missing/Partial
- **Integration Tests:** Present/Missing/Partial

## Configuration & Environment
- **New Environment Variables:**
- **Database Changes:**

## Risk Matrix
| Category | Risk Level |
|----------|------------|
| Correctness | Low/Medium/High |
| Code Quality | Low/Medium/High |
| Security | Low/Medium/High |
| Test Coverage | Low/Medium/High |

## Conclusion
[2-3 sentences. Full todo lists and item details are in each `review.{repo}.md`.]
```

## Verdict Guidelines

| Verdict | Criteria |
|---------|----------|
| **PASS** | All AC met, good quality, adequate tests |
| **PASS WITH NOTES** | AC met, minor non-blocking suggestions |
| **CONCERNS** | Issues to address before merge |
| **FAIL** | Critical bugs, security issues, missing functionality |

## Completion Output

```
Review complete for EUDPA-XXXXX.

Summary:
- Verdict: [VERDICT]
- Files changed: [X]
- Review files created: [X] (verified 100% coverage)
- Consistency checks: [X repos]
- Repositories: [list]
- Repository summaries: [X review.{repo}.md files]
- Critical findings: [X]
- Total todo items: [X]

Index: workareas/reviews/EUDPA-XXXXX/review-index.md
Repo reviews: workareas/reviews/EUDPA-XXXXX/review.{repo}.md   (e.g. review.trade-imports-animals-frontend.md) (one per repo)
```

---

# REFRESH REVIEW

Used when `review-index.md` already exists. Updates the existing doc in place. Use this to verify review feedback has been addressed, or to catch new issues after further work on a branch.

## Step R1: Pull Latest Code

```bash
git -C workareas/reviews/EUDPA-XXXXX/repos/{repo} pull --rebase --quiet
```

Repeat for every repo listed in `.review-meta.json`.

## Step R2: Get Changes Since Last Review

```bash
./skills/tools/review/diff-since-review.sh EUDPA-XXXXX --json
```

If **no changes detected across all repos**: report that the branch is unchanged since the last review and stop.

## Step R2.5: Load Full Item Inventory

**This step is mandatory.** `review-index.md` is a thin navigation index — item details live in per-repo files.

Read the decisions file for each repo:
```
workareas/reviews/EUDPA-XXXXX/decisions.{repo}.md   (one per repo, e.g. decisions.trade-imports-animals-frontend.md)
```

Each `decisions.{repo}.md` is written by the REVIEW_WALKER as the user walks through items for that repo. Together they record the decision for **every** review item: `DONE`, `WONT_FIX`, `AUTO_RESOLVED`, or `SKIP`.

For each repo, also read the per-repo review to get the full item list:
```
workareas/reviews/EUDPA-XXXXX/review.{repo}.md   (e.g. review.trade-imports-animals-frontend.md)
```

Build an **item inventory**: a map of `item-key → status` where item-key is `{repo}#{N}` and status is one of: `open`, `done`, `wont-fix`, `auto-resolved`.

- Items with `DONE` in decisions.{repo}.md → status `done` (should be verified by agent)
- Items with `WONT_FIX` in decisions.{repo}.md → status `wont-fix` (exclude from all work lists; do NOT re-report)
- Items with `AUTO_RESOLVED` in decisions.{repo}.md → status `auto-resolved` (treat as fixed)
- Items absent from decisions.{repo}.md with `Won't Fix [x]` in their review file → status `wont-fix`
- All remaining items → status `open`

## Step R3: Determine Work Scope

From the diff output and the item inventory built in R2.5, build two work lists:

**List A — Files to re-review** (spawn file reviewer agents):
- Any file that changed since the last review (modified or added)

**List B — Unchanged files with open todo items** (check inline, no agent needed):
- Files NOT in the diff that have any `open` items in the inventory (Fixed `[ ]` AND Won't Fix `[ ]`, AND not `WONT_FIX`/`AUTO_RESOLVED` in decisions.{repo}.md)
- For each remaining item: read the current file and check whether the specific violation is still present

Deleted files: mark their todo items as Fixed.

## Step R4: Re-review Changed Files

For every file in List A, spawn a FILE_REVIEWER agent (up to 10 parallel).

**IMPORTANT:** Do NOT paste violation lists from `review-index.md` — it is a navigation index only. Instead, tell the agent to read the per-file review and decisions files directly. The per-file `.review.md` contains the accurate Won't Fix markings written by the WALKER.

```markdown
Follow the instructions in personas/review/FILE_REVIEWER.md.

**Mode: REFRESH** — this file has changed since the last review.

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Review workspace:** workareas/reviews/EUDPA-XXXXX/

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- Previous commit: [old-sha]
- Current commit: [new-sha]

**Previously reported violations:** Read them from:
workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md

**Decisions context:** Read decisions from:
workareas/reviews/EUDPA-XXXXX/decisions.[repo].md
Items marked WONT_FIX or AUTO_RESOLVED there must NOT be re-reported as open.

**Write your updated review to (overwrite existing):**
workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md
```

## Step R5: Check List B Items Inline

For each item in List B: read the current file from the workspace. Determine if the specific violation is still present (unchanged file may still have had a quiet fix in a prior commit). Cross-reference `decisions.{repo}.md` — if the item is `WONT_FIX` or `AUTO_RESOLVED` there, skip it regardless of what `review.{repo}.md` says.

## Step R6: Update review-index.md and review.{repo}.md In Place

Once all agents complete and List B is checked:

**Build a change summary using decisions.{repo}.md + agent results as the source of truth:**
- Items where decisions.{repo}.md = `DONE` and agent confirms fixed → mark `[x]` in Fixed column in `review.{repo}.md`
- Items where decisions.{repo}.md = `DONE` but agent finds still present → list as ⚠️ Still open
- Items where decisions.{repo}.md = `WONT_FIX` or `AUTO_RESOLVED` → do NOT include in the summary table at all; ensure Won't Fix `[x]` is set in `review.{repo}.md` if not already
- Items remaining open (neither DONE nor WONT_FIX in decisions.{repo}.md, and not fixed by agent) → list as ⚠️ Still open
- New violations from refresh agents → append as new rows

**Important:** Use the `review.{repo}.md` files at the ticket root for the full item count — `review-index.md` is a thin navigation index only. Your "N of M open items" counts must reflect the full inventory from decisions.{repo}.md and review.{repo}.md.

**Update each `workareas/reviews/EUDPA-XXXXX/review.{repo}.md` in place:**

1. Add a "Refreshed" line near the top:
   ```
   **Refreshed:** [today]
   ```

2. Update the todo list:
   - Mark resolved items: `[ ]` → `[x]` in Fixed column
   - Append new violations as new rows at the bottom
   - Do NOT remove rows — keep full history visible

3. Add a "Refresh Summary" section before the Verdict (multiple refresh summaries accumulate):

   ```markdown
   ## Refresh Summary ([date])

   **Changes since last review:** [X] files modified, [Y] files added
   **Todo items resolved:** [N] of [M] open items
   **New issues found:** [N]

   | Change | File | Detail |
   |--------|------|--------|
   | ✅ Resolved | `path/to/file` | Item #N: [description] |
   | ➕ New | `path/to/file` | [Severity]: [description] |
   | ⚠️ Still open | `path/to/file` | Item #N: [description] |

   Do NOT include Won't Fix items (`[x]` in Won't Fix column) in this table.
   ```

4. Update the Repository Verdict if warranted.

**Also update `workareas/reviews/EUDPA-XXXXX/review-index.md`:**

1. Add `**Last Updated:** [today]` line.
2. Update the Repositories table verdicts.
3. Update the top-level Verdict if warranted.
4. Update the AC Check table if any AC status has changed.

## Refresh Verdict Guidelines

| Verdict | Criteria |
|---------|----------|
| **APPROVED** | All Critical/Major items fixed or Won't Fixed; no new blockers; AC met |
| **STILL HAS CONCERNS** | Critical/Major fixed; Minor items remain (non-blocking) |
| **NEEDS MORE WORK** | Critical/Major items unaddressed, or new blockers found |

## Completion Output

```
Review refresh complete for EUDPA-XXXXX.

Summary:
- Previous verdict: [VERDICT] → New verdict: [VERDICT]
- Files re-reviewed: [X]
- Todo items resolved: [N] / [M]
- New issues found: [N]

Updated: workareas/reviews/EUDPA-XXXXX/review-index.md + review.{repo}.md files
```

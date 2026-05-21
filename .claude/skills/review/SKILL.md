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

For **each repository** in the review, create `workareas/reviews/EUDPA-XXXXX/review.{repo}.md` at the ticket root by reading all `*.review.md` files for that repo and synthesising:

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

## Items

Concatenation of all file todo lists for this repo. Re-number rows sequentially (1, 2, 3...) across all files. Disposition and Status start blank — the walker / implementor / hand-marking will fill them in. Escape any literal `|` in cell content as `\|`.

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|

## Repository Verdict
**Status:** SAFE / NEEDS ATTENTION / RISKY
```

The `Disposition` column takes one of `Fix`, `Won't Fix`, `Discuss`, `Auto-Resolved`, or blank (pending). The `Status` column takes `Not Done`, `Done`, `Failed`, `—`, or blank. Together they replace the old `Fixed [ ]` / `Won't Fix [ ]` columns and the separate `decisions.{repo}.md` file. Hand-edit the Disposition column to manually mark items before running the walker.

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

**Hand-marking shortcut:** open the items table in `review.{repo}.md` and type `Fix` or `Won't Fix` directly into the Disposition column for items you have a clear answer on. Then run `walk review EUDPA-XXXXX` — the walker will skip those and only present items still pending a disposition.

---

# REFRESH REVIEW

Used when `review-index.md` already exists. Updates the existing doc in place. Use this to verify review feedback has been addressed, or to catch new issues after further work on a branch.

## Step R1–R3: Build Refresh Scope

One command pulls every repo, computes the diff window per repo, identifies merge-resolved files and coverage gaps, then assembles the four work lists.

```bash
./skills/tools/review/refresh/scope.sh EUDPA-XXXXX --write-snapshot
```

Output is a JSON object on stdout. Each `repos[]` entry has `prior_sha`, `current_sha`, `no_changes`, and `lists.{A,B,C,D}`:

- **List A** — `[{ file, old_sha, new_sha }]` — file changed in window, not merge-resolved
- **List B** — `[{ id, file, line, issue, fix, disposition, status, ... }]` — open items whose file did *not* change
- **List C** — `[{ file, merge_sha, old_sha, new_sha }]` — hand-resolved merge files (non-trivial resolution)
- **List D** — `[{ file }]` — PR files lacking a `.review.md`

`prior_sha` is the most recent re_review snapshot's `current_commit` that differs from today's HEAD (i.e. "since the last refresh"); falls back to `prs[].commit` on the first refresh.

If **all four lists are empty** across all repos: report that the branch is unchanged since the last refresh and stop.

## Step R3.5: Load Full Item Inventory (for context)

```bash
./skills/tools/review/review-items.sh EUDPA-XXXXX --json
```

Use this when reconciling agent results in R6:

- `Won't Fix` / `Auto-Resolved` → carry forward; do NOT re-report.
- `Fix` + `Done` → verify the agent confirms the violation is gone.
- `Fix` + `Not Done` (and `Discuss`) → still open.
- Blank disposition → pending (walker will pick up; should appear in List B).

Deleted files: mark their items as `Auto-Resolved` via `review-mark.sh`.

## Step R4: Re-review Files

Spawn FILE_REVIEWER agents in parallel (up to 10) — one per entry in List A, List C, and List D. Substitute `[repo-name]`, `[file-path]`, etc. from the JSON output of `scope.sh`.

### Prompt template — REFRESH (List A)

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

**Prior dispositions:** Pull existing items for this file from the consolidated items table:
./skills/tools/review/review-items.sh EUDPA-XXXXX --repo [repo-name] | awk -F'\t' '$3 == "[file-path]"'
Items with Disposition=`Won't Fix` or `Auto-Resolved` must NOT be re-reported as open.

**Write your updated review to (overwrite existing):**
workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md
```

### Prompt template — MERGE_RESOLVED (List C)

```markdown
Follow the instructions in personas/review/FILE_REVIEWER.md.

**Mode: MERGE_RESOLVED** — this file is the product of a hand-resolved merge conflict. The prior review covered one parent only; the resolution exists in *neither* parent and is unreviewed.

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Review workspace:** workareas/reviews/EUDPA-XXXXX/

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- Previous reviewed commit: [old-sha]
- Current commit: [new-sha]
- Merge commit: [merge-sha]

**Focus your review on:**
1. The resolution diff: `git -C workareas/reviews/EUDPA-XXXXX/repos/[repo-name] diff [old-sha]..[new-sha] -- [file-path]` — read it; this is the unreviewed delta.
2. **Prior items survive the merge?** For every Fix+Done item on this file, verify the fix is still present at HEAD. If a prior fix has been undone by the merge, log as a regression in your review.
3. **Smuggled behaviour?** Did the resolution import code from the source branch (sibling tickets) that contradicts decisions made for the current ticket?
4. **Integration points.** Where the two sides meet — those are the most likely defect sites.

**Previously reported violations:** Read them from:
workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md

**Prior dispositions:** `./skills/tools/review/review-items.sh EUDPA-XXXXX --repo [repo-name] | awk -F'\t' '$3 == "[file-path]"'`. Items with Disposition=`Won't Fix` or `Auto-Resolved` must NOT be re-reported as open.

**Write your updated review to (overwrite existing):**
workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md
```

### Prompt template — FRESH (List D, coverage gap)

Use the FRESH-mode prompt from Step 2 of the Fresh Review section above. Note in the prompt that the file is in PR diff but had no prior per-file review — this is a coverage gap, not a fresh PR.

## Step R5: Check List B Items Inline

For each item in List B: read the current file from the workspace. Determine if the specific violation is still present (unchanged file may still have had a quiet fix in a prior commit). If the item is `Won't Fix` or `Auto-Resolved` in the consolidated table, skip it.

## Step R6: Update review.{repo}.md In Place

Once all agents complete and List B is checked, apply changes via the helper scripts. Do NOT hand-edit the items table — the scripts keep escaping consistent.

**Map agent / inline-check results to script calls:**
- Item already `Auto-Resolved` or `Won't Fix` → leave alone (the script enforces no re-reporting).
- Item `Fix` + `Done` and agent confirms fix is in place → leave alone.
- Item `Fix` + `Done` and agent finds the pattern back → log as a regression in the Refresh Summary; do NOT change disposition (the user can re-walk it).
- Item `Fix` + `Not Done` confirmed still present → leave alone (still open work).
- Item with no disposition that the inline check determines is no longer present → `review-mark.sh --disposition "Auto-Resolved" --note "..."`.
- New violation found by a refresh agent → `review-add-item.sh --repo R --file F --line L --severity S --category C --issue ... --fix ...`. Returns the new ID.

**Update `review.{repo}.md` cosmetics:**

1. Add a "Refreshed" line near the top: `**Refreshed:** [today]`.
2. Add a "Refresh Summary" section before the Verdict (multiple summaries accumulate):
   ```markdown
   ## Refresh Summary ([date])

   **Changes since last review:** [X] files modified, [Y] files added
   **Items resolved this round:** [N]
   **New issues found:** [M]

   | Change | File | Detail |
   |--------|------|--------|
   | ✅ Resolved | `path/to/file` | Item #N: [description] |
   | ➕ New | `path/to/file` | Item #N: [Severity]: [description] |
   | ⚠️ Regressed | `path/to/file` | Item #N: was Done, pattern back |

   Do NOT include `Won't Fix` items in this table.
   ```
3. Update the Repository Verdict if warranted.

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

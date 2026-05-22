---
name: review
description: 'Code review for correctness, security, error handling, performance, best-practices and test coverage across all languages and repos (Java, Node.js, frontend, tests) for EUDP Live Animals tickets. Handles fresh first-pass review, refresh (re-review after further work, merge conflicts or coverage gaps), interactive walker that triages findings one item at a time, and batched implementor that applies queued fixes. Fans out per-file reviews, per-repo consistency analysis and per-item fixes to `general-purpose` Task subagents that follow worker personas under `references/`. Use when the user says "review EUDPA-XXX", "code review", "re-review EUDPA-XXX", "refresh review", "check fixes", "walk review EUDPA-XXX", "triage review", "implement review EUDPA-XXX", or "apply review fixes". NOT for JS lint/format/style findings — use the code-style skill for those.'
---

Pre-merge code review for EUDP Live Animals tickets across all repos and
languages.

## Path conventions

Cross-workspace paths reference the `TRADE_IMPORTS_WORKSPACE` env var
directly — `${TRADE_IMPORTS_WORKSPACE}/tools/<domain>/`,
`${TRADE_IMPORTS_WORKSPACE}/docs/best-practices/`,
`${TRADE_IMPORTS_WORKSPACE}/workareas/`. The env var must be set in
your shell profile; see [`docs/agent-onboarding.md`](../../../docs/agent-onboarding.md)
for setup. Scripts bail with a clear error if it's unset. Skill-internal
references stay relative (`references/<NAME>.md`, `assets/<NAME>.md`);
subagents are addressed by name via the Task tool.

## What this skill is for

- Fresh review of a new ticket's PR set across all repos.
- Refresh review after further commits, merge conflict resolutions, or new
  files needing coverage.
- Interactive walker to triage findings one item at a time
  (`Follow references/WALKER.md`).
- Batched implementor to apply queued `Fix`-disposition items
  (`Follow references/BATCH_IMPLEMENTOR.md`).

Per-repo state lives in
`${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXX/review.{repo}.md` with a
consolidated `## Items` table — see `assets/items-table.md` for the
schema, allowed Disposition/Status values, and the `|` escape rule.

## When to use

| Trigger | What to follow |
|---------|----------------|
| "review EUDPA-X" / "re-review EUDPA-X" / "refresh review" / "check fixes" | this SKILL.md — Fresh + Refresh sections |
| "walk review EUDPA-X" / "triage review" | `Follow references/WALKER.md` |
| "implement review EUDPA-X" / "apply review fixes" | `Follow references/BATCH_IMPLEMENTOR.md` |

NOT for JavaScript lint/format/style findings — use the `code-style`
skill.

## Worker references

The parent SKILL.md (and `references/BATCH_IMPLEMENTOR.md`) delegate to
three worker personas defined as `references/*.md` prose. Each is spawned
as a `general-purpose` Task subagent with a `Follow …` reference to the
persona file. `general-purpose` carries `Tools: *` (it has Write/Edit/Bash)
and is not subject to the no-write guardrail that restricted custom
subagents receive — so workers can write their on-disk artifacts.

| Persona | Used in | Artifact |
|---|---|---|
| `references/FILE_REVIEWER.md` | Fresh Step 2, Refresh Step R4 (one per file, parallel up to 10) | per-file `.review.md` |
| `references/CONSISTENCY_REVIEWER.md` | Fresh Step 4 (one per repo) | per-repo `_consistency-check.md` |
| `references/REVIEW_ITEM_FIXER.md` | `BATCH_IMPLEMENTOR.md` Step 4 (one per Fix-disposition item, sequential) | source edits + commit |

Spawn idiom: Task tool with `subagent_type: general-purpose` and a prompt
beginning `Follow the instructions in ${TRADE_IMPORTS_WORKSPACE}/.claude/skills/review/references/<NAME>.md.`

## Step 0: Detect Mode

```bash
ls ${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/review-index.md 2>/dev/null
```

- File not found → Fresh Review, Step 1.
- File found → Refresh Review, Step R1.

---

# FRESH REVIEW

## Step 1: Prepare Workspace

```bash
${TRADE_IMPORTS_WORKSPACE}/tools/review/prepare-review.sh EUDPA-XXXXX
```

Creates `${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/` with ticket.md,
repos/, file-reviews/ placeholders, and `.review-meta.json` (the latter
includes detected tech + best-practices paths under
`${TRADE_IMPORTS_WORKSPACE}/docs/best-practices/`).

## Step 2: Review Each File

**MANDATORY:** create a review for EVERY changed file. No exceptions.

### Parallel Execution

Spawn up to **10 in parallel** via the Task tool with
`subagent_type: general-purpose`.

#### Spawn prompt template

```markdown
Follow the instructions in ${TRADE_IMPORTS_WORKSPACE}/.claude/skills/review/references/FILE_REVIEWER.md.

**Mode:** FRESH

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Review workspace:** ${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- Commit: [sha]

**Write your review to the existing placeholder file:**
${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md

Note: Nested paths use underscores (e.g., `src/main/Service.java` → `src_main_Service.java.review.md`).
```

## Step 3: Verify Coverage

```bash
${TRADE_IMPORTS_WORKSPACE}/tools/review/verify-coverage.sh EUDPA-XXXXX
```

**Do NOT proceed to Step 4 until 100% coverage.**

## Step 4: Consistency Review

Spawn one Task subagent with `subagent_type: general-purpose`. Spawn prompt:

```markdown
Follow the instructions in ${TRADE_IMPORTS_WORKSPACE}/.claude/skills/review/references/CONSISTENCY_REVIEWER.md.

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Review workspace:** ${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/

Read .review-meta.json for all repos and PR numbers.
Write _consistency-check.md for every repo listed.
```

Wait for completion. Verify `_consistency-check.md` exists for every repo
before proceeding.

## Step 5: Create Repository Summaries

For each repository, create
`${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/review.{repo}.md` by
synthesising the per-file reviews:

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

(Concatenation of all per-file todo lists for this repo, re-numbered
sequentially. Disposition and Status start blank — the walker /
implementor / hand-marking fills them in. Full schema, allowed values
and the `|` escape rule are in `assets/items-table.md`.)

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|

## Repository Verdict
**Status:** SAFE / NEEDS ATTENTION / RISKY
```

Skip this step if only one repository is involved.

## Step 6: Write Index

Create `${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/review-index.md` —
a thin navigation index only, no item rows:

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

## Verdict Guidelines (Fresh)

| Verdict | Criteria |
|---------|----------|
| **PASS** | All AC met, good quality, adequate tests |
| **PASS WITH NOTES** | AC met, minor non-blocking suggestions |
| **CONCERNS** | Issues to address before merge |
| **FAIL** | Critical bugs, security issues, missing functionality |

## Completion Output (Fresh)

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

Index: ${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/review-index.md
Repo reviews: ${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/review.{repo}.md (one per repo)
```

**Hand-marking shortcut:** open the items table in `review.{repo}.md`
and type `Fix` or `Won't Fix` directly into the Disposition column for
items you have a clear answer on. Then run `walk review EUDPA-XXXXX` —
the walker skips those and only presents items still pending.

---

# REFRESH REVIEW

Used when `review-index.md` already exists. Updates the existing doc in
place — verifies prior feedback has been addressed, catches new issues
after further work or merge conflicts.

## Step R1-R3: Build Refresh Scope

```bash
${TRADE_IMPORTS_WORKSPACE}/tools/review/refresh/scope.sh EUDPA-XXXXX --write-snapshot
```

Output is a JSON object on stdout. Each `repos[]` entry has `prior_sha`,
`current_sha`, `no_changes`, and `lists.{A,B,C,D}`:

- **List A** — `[{ file, old_sha, new_sha }]` — file changed in window, not merge-resolved
- **List B** — `[{ id, file, line, issue, fix, disposition, status, ... }]` — open items whose file did *not* change
- **List C** — `[{ file, merge_sha, old_sha, new_sha }]` — hand-resolved merge files (non-trivial resolution)
- **List D** — `[{ file }]` — PR files lacking a `.review.md`

`prior_sha` is the most recent re_review snapshot's `current_commit` that
differs from today's HEAD; falls back to `prs[].commit` on the first
refresh.

If all four lists are empty across all repos: report the branch is
unchanged since the last refresh and stop.

## Step R3.5: Load Full Item Inventory

```bash
${TRADE_IMPORTS_WORKSPACE}/tools/review/review-items.sh EUDPA-XXXXX --json
```

Use this when reconciling agent results in R6:

- `Won't Fix` / `Auto-Resolved` → carry forward; do NOT re-report.
- `Fix` + `Done` → verify the agent confirms the violation is gone.
- `Fix` + `Not Done` (and `Discuss`) → still open.
- Blank disposition → pending (walker will pick up; should appear in List B).

Deleted files: mark their items as `Auto-Resolved` via `review-mark.sh`.

## Step R4: Re-review Files

Spawn `general-purpose` Task subagents in parallel (up to 10), one per
entry in List A (Mode=REFRESH), List C (Mode=MERGE_RESOLVED), and List D
(Mode=FRESH; coverage gap). Each spawn prompt begins with
`Follow the instructions in ${TRADE_IMPORTS_WORKSPACE}/.claude/skills/review/references/FILE_REVIEWER.md.`

### Spawn prompt — REFRESH (List A)

```markdown
Follow the instructions in ${TRADE_IMPORTS_WORKSPACE}/.claude/skills/review/references/FILE_REVIEWER.md.

**Mode: REFRESH** — this file has changed since the last review.

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Review workspace:** ${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- Previous commit: [old-sha]
- Current commit: [new-sha]

**Previously reported violations:** Read them from:
${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md

**Prior dispositions:** Pull existing items for this file from the consolidated items table:
${TRADE_IMPORTS_WORKSPACE}/tools/review/review-items.sh EUDPA-XXXXX --repo [repo-name] | awk -F'\t' '$3 == "[file-path]"'
Items with Disposition=`Won't Fix` or `Auto-Resolved` must NOT be re-reported as open.

**Write your updated review to (overwrite existing):**
${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md
```

### Spawn prompt — MERGE_RESOLVED (List C)

```markdown
Follow the instructions in ${TRADE_IMPORTS_WORKSPACE}/.claude/skills/review/references/FILE_REVIEWER.md.

**Mode: MERGE_RESOLVED** — this file is the product of a hand-resolved merge conflict. The prior review covered one parent only; the resolution exists in *neither* parent and is unreviewed.

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Review workspace:** ${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- Previous reviewed commit: [old-sha]
- Current commit: [new-sha]
- Merge commit: [merge-sha]

**Focus your review on:**
1. The resolution diff: `git -C ${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/repos/[repo-name] diff [old-sha]..[new-sha] -- [file-path]` — read it; this is the unreviewed delta.
2. **Prior items survive the merge?** For every Fix+Done item on this file, verify the fix is still present at HEAD. If a prior fix has been undone by the merge, log as a regression in your review.
3. **Smuggled behaviour?** Did the resolution import code from the source branch (sibling tickets) that contradicts decisions made for the current ticket?
4. **Integration points.** Where the two sides meet — those are the most likely defect sites.

**Previously reported violations:** Read them from:
${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md

**Prior dispositions:** `${TRADE_IMPORTS_WORKSPACE}/tools/review/review-items.sh EUDPA-XXXXX --repo [repo-name] | awk -F'\t' '$3 == "[file-path]"'`. Items with Disposition=`Won't Fix` or `Auto-Resolved` must NOT be re-reported as open.

**Write your updated review to (overwrite existing):**
${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].review.md
```

### Spawn prompt — FRESH (List D, coverage gap)

Use the FRESH-mode prompt from Step 2 of the Fresh Review section above.
Note in the prompt that the file is in PR diff but had no prior per-file
review — this is a coverage gap, not a fresh PR.

## Step R5: Check List B Items Inline

For each item in List B: read the current file from the workspace.
Determine if the specific violation is still present (unchanged file may
still have had a quiet fix in a prior commit). If the item is `Won't Fix`
or `Auto-Resolved` in the consolidated table, skip it.

## Step R6: Update review.{repo}.md In Place

Once all agents complete and List B is checked, apply changes via the
helper scripts. Do NOT hand-edit the items table — the scripts keep
escaping consistent.

**Map agent / inline-check results to script calls:**

- Item already `Auto-Resolved` or `Won't Fix` → leave alone.
- Item `Fix` + `Done` and agent confirms fix is in place → leave alone.
- Item `Fix` + `Done` and agent finds the pattern back → log as a regression in the Refresh Summary; do NOT change disposition (the user can re-walk it).
- Item `Fix` + `Not Done` confirmed still present → leave alone.
- Item with no disposition that the inline check determines is no longer present → `${TRADE_IMPORTS_WORKSPACE}/tools/review/review-mark.sh --disposition "Auto-Resolved" --note "..."`.
- New violation found by a refresh agent → `${TRADE_IMPORTS_WORKSPACE}/tools/review/review-add-item.sh --repo R --file F --line L --severity S --category C --issue ... --fix ...`. Returns the new ID.

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

**Also update `${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/review-index.md`:**

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

## Completion Output (Refresh)

```
Review refresh complete for EUDPA-XXXXX.

Summary:
- Previous verdict: [VERDICT] → New verdict: [VERDICT]
- Files re-reviewed: [X]
- Todo items resolved: [N] / [M]
- New issues found: [N]

Updated: ${TRADE_IMPORTS_WORKSPACE}/workareas/reviews/EUDPA-XXXXX/review-index.md + review.{repo}.md files
```

## Scripts cheat-sheet

All under `${TRADE_IMPORTS_WORKSPACE}/tools/review/`:

| Script | Purpose |
|---|---|
| `prepare-review.sh` | Fresh Step 1 workspace setup; transitively seeds best-practices via `detect-tech.sh` |
| `verify-coverage.sh` | Fresh Step 3 coverage gate |
| `verify-consistency.sh` | Fresh Step 4 consistency gate |
| `verify-style-coverage.sh` | Cross-domain — style-review coverage check (also consumed by code-style) |
| `diff-since-review.sh` | Refresh helper — per-file diff between snapshot SHA and HEAD |
| `review-items.sh` | Walker / batch / refresh — list items with filters |
| `review-mark.sh` | Set Disposition (auto-sets Status) |
| `review-set-status.sh` | Set Status only (after fix attempt) |
| `review-add-item.sh` | Append a newly-found violation; returns the new ID |
| `review-counts.sh` | Final reports (walker + batch implementor) — breakdown by Disposition+Status |
| `review-migrate-decisions.sh` | One-shot legacy migration helper |
| `refresh/scope.sh` | Refresh Steps R1-R3 orchestrator |
| `refresh/pull-repos.sh` | Refresh helper — `git pull --rebase` per repo |
| `refresh/list-merge-resolved.sh` | Refresh helper — hand-resolved merge files (List C) |
| `refresh/list-coverage-gaps.sh` | Refresh helper — PR files lacking a `.review.md` (List D) |

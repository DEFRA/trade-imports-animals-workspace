# REVIEWER

Role: Pre-merge code review for EUDP Live Animals tickets.
Assess: correctness|code-quality|best-practices|error-handling|security|performance|tests

See `CLAUDE.md` for helper scripts.

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

## Step 5: Verify Consistency Coverage

```bash
./skills/tools/review/verify-consistency.sh EUDPA-XXXXX
```

**You may NOT proceed to Step 6 until all consistency checks are complete.**

## Step 6: Create Repository Summaries

For **each repository** in the review, create `workareas/reviews/EUDPA-XXXXX/file-reviews/{repo}/repo-review.md`:

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

## Key Findings for This Repository

### Critical Issues
[Issues that must be addressed]

### Major Issues
[Significant quality/maintainability concerns]

### Minor Issues
[Style, nitpicks]

### Positive Observations
[What was done well]

## Test Coverage
- Unit tests: [assessment]
- Integration tests: [assessment]

## Risk Assessment
**Overall Risk:** Low / Medium / High
**Rationale:** [One sentence]

## Repository Verdict
**Status:** SAFE / NEEDS ATTENTION / RISKY
```

**Note:** Skip this step if only one repository is involved.

## Step 7: Write Overall Summary

Create `workareas/reviews/EUDPA-XXXXX/review.md`:

```markdown
# Code Review: EUDPA-XXXXX

**Ticket:** [Summary]
**Reviewer:** Claude Code Agent
**Date:** [Date]
**Verdict:** PASS / PASS WITH NOTES / CONCERNS / FAIL

## Summary
[2-3 sentences]

## Repositories Analyzed
| Repository | PR | Merge Commit | Files Changed | Verdict |
|------------|-----|--------------|---------------|---------|

**Repository Reviews:** [If multiple repos, reference: "See `file-reviews/{repo}/repo-review.md` for detailed repository analysis"]

## Acceptance Criteria Check
| # | Criterion | Met? | Notes |
|---|-----------|------|-------|

## File-by-File Summary
| Repository | File | Status | Key Concerns |
|------------|------|--------|--------------|

## Key Findings
### Bugs / Correctness Issues
### Code Quality Issues
### Positive Observations

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

## Recommendations
### Must Address
### Should Address

## Conclusion
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
- Consistency checks: [X repos] (verified 100% coverage)
- Repositories: [list]
- Repository summaries: [X repo-review.md files]
- Critical findings: [X]

Verification: workareas/reviews/EUDPA-XXXXX/file-reviews/_VERIFICATION.md
Consistency: workareas/reviews/EUDPA-XXXXX/file-reviews/_CONSISTENCY_VERIFICATION.md
Consistency checks: workareas/reviews/EUDPA-XXXXX/file-reviews/{repo}/_consistency-check.md
Repository reviews: workareas/reviews/EUDPA-XXXXX/file-reviews/{repo}/repo-review.md
Overall review: workareas/reviews/EUDPA-XXXXX/review.md
```

# RE_REVIEWER

Role: Follow-up review after initial feedback addressed. Verify fixes, check regressions, update verdict.

## Tasks

1. **Verify fixes** - Have reported issues been addressed?
2. **Check regressions** - Did fixes introduce new problems?
3. **Re-assess AC** - Are they now fully met?
4. **Update verdict** - Can this be approved?

## Step 1: Get Changed Files

```bash
./skills/tools/review/diff-since-review.sh EUDPA-XXXXX
```

Creates `re_review` section in `.review-meta.json` with:
- Files changed since last review
- Old vs new commits per repo

If **no changes detected**: Report that PRs are unchanged and recommend re-checking PR status.

## Step 2: Load Previous Review Context

Read: `workareas/reviews/EUDPA-XXXXX/review.md`

Extract and note:
- Original verdict
- "Must Address" issues (with file locations)
- "Should Address" issues (with file locations)
- File-level concerns from `file-reviews/`

## Step 3: Review Changed Files

**MANDATORY:** Create review for EVERY changed file. No exceptions.

### Parallel Execution

Spawn up to **10 agents in parallel** using Task tool with `subagent_type=general-purpose`.

#### Agent Prompt Template

```markdown
Follow the instructions in personas/review/FILE_REVIEWER.md.

**Context:** This is a RE-REVIEW. Focus on changes since the last review.

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Review workspace:** workareas/reviews/EUDPA-XXXXX/

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- Previous commit: [old-sha]
- Current commit: [new-sha]

**Previous issues in this file (if any):**
[List issues from original review that relate to this file]

**Write your review to:**
workareas/reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[path_with_underscores].re-review.md

Note: Use `.re-review.md` suffix to distinguish from original reviews.
```

## Step 4: Compare With Original Review

After all file reviews complete, analyse:

### For Each Previous "Must Address" Issue:
1. Was the file changed?
2. Does the new review show it's fixed?
3. Did the fix introduce new issues?

### For Each Previous "Should Address" Issue:
1. Was it addressed? (acceptable if not)
2. Note if deferred vs fixed

### Check for New Issues:
1. Compare new file reviews against originals
2. Flag any new Critical/Major issues
3. Note if new issues are in scope of original ticket

## Step 5: Write Re-Review

Create `workareas/reviews/EUDPA-XXXXX/re-review.md`:

```markdown
# Re-Review: EUDPA-XXXXX

**Ticket:** [Summary]
**Reviewer:** Claude Code Agent
**Date:** [Date]
**Previous Review:** [Date]
**Verdict:** APPROVED / STILL HAS CONCERNS / NEEDS MORE WORK

## Summary
[2-3 sentences]

## Changes Since Last Review

| Repository | PR | Old Commit | New Commit | Files Changed |
|------------|-----|------------|------------|---------------|

## Previous Issues - Verification

### Must Address Items
| # | Issue | File | Status | Notes |
|---|-------|------|--------|-------|
| 1 | [Issue] | [file:XX] | ✅ Fixed | [How] |

### Should Address Items
| # | Issue | File | Status | Notes |
|---|-------|------|--------|-------|
| 1 | [Issue] | [file:XX] | ⏭️ Deferred | [Reason] |

## New File Reviews

| File | Status | New Issues? |
|------|--------|-------------|

## New Issues Found
| Severity | File | Issue | Recommendation |
|----------|------|-------|----------------|

## Acceptance Criteria - Final Check
| # | Criterion | Met? | Notes |
|---|-----------|------|-------|

## Verdict

**Status:** APPROVED / STILL HAS CONCERNS / NEEDS MORE WORK

**Reasoning:**

### If APPROVED
- All "Must Address" fixed
- No new critical issues
- AC met

### If STILL HAS CONCERNS
Outstanding: [non-blocking items]

### If NEEDS MORE WORK
Blocking: [must-fix items]

## Recommendation
[Ready to merge / Merge after X / Requires another round]
```

## Verdict Guidelines

| Verdict | Criteria |
|---------|----------|
| **APPROVED** | All must-fix addressed, no new blockers, AC met |
| **STILL HAS CONCERNS** | Must-fix done, minor issues remain (non-blocking) |
| **NEEDS MORE WORK** | Must-fix not addressed, or new blockers found |

## Completion Output

```
Re-review complete for EUDPA-XXXXX.

Summary:
- Previous verdict: [VERDICT]
- New verdict: [VERDICT]
- Files changed: [X]
- File reviews created: [X]
- Must-fix items: X/Y addressed
- Should-fix items: X/Y addressed
- New issues found: X (Critical: X, Major: X, Minor: X)

Re-review available at: workareas/reviews/EUDPA-XXXXX/re-review.md
```

## Tips

1. Be fair - "should address" items not fixed is often acceptable
2. Stay focused - only review changed files, trust original review for unchanged code
3. Acknowledge effort - note well-done fixes
4. Be decisive - clear approve/reject, avoid endless cycles
5. Check PR comments - author may have explained decisions
6. Compare severity - a fix that introduces minor issues to resolve a critical one is acceptable

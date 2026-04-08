# FILE_REVIEWER

Review **one file** as part of a larger ticket review.

## Workspace

```
eudp-live-animals-utils/agents/
├── best-practices/            # Tech-specific standards (k6, playwright, rest-api, gds)
└── workareas/reviews/EUDPA-XXXXX/
    ├── ticket.md              # <-- READ: ticket details and AC
    ├── .review-meta.json      # <-- READ: detected tech & best_practices paths
    ├── repos/<repo>/          # Code to review
    └── file-reviews/<repo>/   # Write reviews here
```

## Workflow

1. **Read `.review-meta.json`** → get `best_practices` array (paths relative to `agents/`)
2. **Read listed best practice files** → apply these standards during review
3. **Read `ticket.md`** → understand requirements and AC
4. **Read assigned file** → from `repos/<repo>/`
5. **Write review** → to `file-reviews/<repo>/<filename>.review.md`

## Review Criteria

| Category | What to Check |
|----------|---------------|
| Correctness | Meets AC? Bugs? |
| Code Quality | Style, readability, naming |
| Best Practices | SOLID, DRY, patterns |
| Error Handling | Edge cases, null safety, exceptions |
| Security | Injection, auth, data exposure |
| Performance | Efficiency, N+1, resources |
| Test Coverage | Is this change tested? |

**Severity:** Critical (bugs, security) → Major (quality/maintainability) → Minor (style, nitpicks)

## File Type Guidance

| Type | Check For |
|------|-----------|
| Tests (`*.spec.ts`, `*Test.java`) | Coverage, edge cases, isolation, meaningful assertions |
| Config (`*.json`, `*.yml`) | Correct values, no secrets, env consistency |
| Package (`package.json`, `pom.xml`) | Versions, dev vs prod deps, security advisories |
| Lock files | Consistency with manifest, concerning transitive deps |

## Review Template

```markdown
# File Review: [path/to/file.ext]

**Repository:** [repo-name]
**Commit:** [sha]
**Change Type:** Added / Modified / Deleted
**Lines Changed:** +XX / -YY

## Summary

### What Changed
[Describe changes]

### Why
[Purpose based on ticket]

## Analysis

### Key Changes

#### `functionOrMethodName()`
[Analysis, concerns, positives]

### Issues Found

| Severity | Line | Issue | Recommendation |
|----------|------|-------|----------------|

## Risk Assessment

- **Edge Cases:**
- **Error Handling:**
- **Security:**

## Test Coverage

| Test File | Covers This? | Notes |
|-----------|--------------|-------|

## Verdict

**Status:** SAFE / NEEDS ATTENTION / RISKY
**Reason:** [One sentence]

| Critical | Major | Minor |
|----------|-------|-------|
| X | X | X |
```

## Output

Write to the placeholder file specified in your prompt. Filename uses underscores for paths (e.g., `src_utils_helper.js.review.md`).

Parent agent runs `verify-coverage.sh` — empty = pending, non-empty = reviewed.

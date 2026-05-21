# TICKET_PLANNER

Role: Analyse ticket and create implementation plan. **No implementation work.**

**Critical:** Plan is a **first impression**. Mark uncertainty with `[ASSUMPTION]` and `[NEEDS VERIFICATION]`.

## Workflow

### 1. Gather Context

```bash
./skills/tools/jira/ticket.sh EUDPA-XXXXX
./skills/tools/jira/comments.sh EUDPA-XXXXX
```

### 2. Explore Codebase

Find: similar functionality, services involved, integration points, configuration.

```bash
./skills/tools/review/detect-tech.sh ~/git/defra/eudp-live-animals/<repo-name>
```

Include detected technologies and best-practices paths in plan.

### 3. Create Plan

Create: `workareas/ticket-planning/EUDPA-XXXXX/plan.md`

```markdown
# Implementation Plan: EUDPA-XXXXX

**Ticket:** [Summary]
**Date:** [Date]
**Confidence:** High (clear examples) / Medium (some extrapolation) / Low (significant assumptions)

## Summary
[2-3 sentences]

## Repositories & Tech Stack

| Repository | Changes | Technologies | Best Practices |
|------------|---------|--------------|----------------|

## Implementation Steps

### 1. [Step Name]
**Goal:** [What this achieves]
**Files:** `path/to/File.java` - [What changes]
**Pattern:** See `path/to/Example.java:45-80`
**Notes:** [NEEDS VERIFICATION] Check if [thing] applies

## Testing Strategy
| Test File | What to Test |
|-----------|--------------|

## Configuration
| Variable/Flag | Purpose | Where Defined |
|---------------|---------|---------------|

## Risks & Open Questions
| Risk/Question | Mitigation/Notes | Severity |
|---------------|------------------|----------|

## Alternative Approaches (if applicable)
**Option A:** [Pros/Cons]
**Option B (Recommended):** [Pros/Cons/Why]

## References
- `path/to/Similar.java` - [What it does]
```

## Output

```
Plan created: workareas/ticket-planning/EUDPA-XXXXX/plan.md
Repos: [list] | Steps: [X] | Confidence: [level]
Items needing verification: [X]
```

## Don'ts

- Don't implement - plan only
- Don't decide for implementer - provide options
- Don't skip uncertainty markers

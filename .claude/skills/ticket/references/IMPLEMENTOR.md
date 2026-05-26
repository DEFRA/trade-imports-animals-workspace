# Implementor — apply the plan

Role: Implement ticket following a plan. Produce clean, well-tested code.

**Critical:** Plan is a **starting point**. Verify assumptions, adapt as needed, document deviations.

## Before You Start

1. Read plan at `~/git/defra/trade-imports-animals/workareas/ticket-planning/EUDPA-XXXXX/plan.md`
2. Read ticket: `~/git/defra/trade-imports-animals/tools/jira/ticket.sh EUDPA-XXXXX`
3. Check tech stack in plan, or run: `~/git/defra/trade-imports-animals/tools/review/detect-tech.sh ~/git/defra/trade-imports-animals/repos/<repo-name>`
4. Read listed best-practices at `~/git/defra/trade-imports-animals/docs/best-practices/`
5. Verify `[ASSUMPTION]` and `[NEEDS VERIFICATION]` items
6. **Run all tests** - do NOT proceed if failing

Redirect output to a tmp file and read the file once — don't grep streaming output:

```bash
# Java (backend / stub / reference-data)
mvn -f ~/git/defra/trade-imports-animals/repos/<repo>/pom.xml verify > /tmp/<repo>-pre-$(date +%Y%m%d-%H%M%S).txt 2>&1
```
```bash
# Node unit (frontend / admin)
npm --prefix ~/git/defra/trade-imports-animals/repos/<repo> test > /tmp/<repo>-pre-$(date +%Y%m%d-%H%M%S).txt 2>&1
```
```bash
# E2E (only when changing tests repo or cross-cutting code)
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test:local > /tmp/e2e-pre-$(date +%Y%m%d-%H%M%S).txt 2>&1
```

## Implementation

### Branch Setup

Each command is a separate Bash call — `git -C <repo>` not
`cd <repo> && git ...`.

```bash
git -C ~/git/defra/trade-imports-animals/repos/<repo-name> fetch origin
```
```bash
git -C ~/git/defra/trade-imports-animals/repos/<repo-name> checkout <base-branch>
```
```bash
git -C ~/git/defra/trade-imports-animals/repos/<repo-name> pull
```
```bash
git -C ~/git/defra/trade-imports-animals/repos/<repo-name> checkout -b feature/EUDPA-XXXXX-<description>
```

### For Each Step

1. Run tests (baseline)
2. Read existing code, find similar patterns
3. Make minimal change
4. Run tests again
5. Add tests for new functionality

### Code Standards

- Match codebase conventions
- Small, focused functions
- Meaningful error messages (don't swallow exceptions)
- Only comment the "why"
- Follow tech-specific best practices (k6, playwright, rest-api, gds)

## When Plan is Wrong

**Minor:** Fix and note in plan under "## Implementation Notes"
**Significant:** Stop, update plan with reasoning
**Blocker:** Ask user for guidance

```markdown
## Implementation Notes
### Deviations
**Step X - Planned:** [X] **Actual:** [Y] **Reason:** [Z]
### Discoveries
- [Something learned]
```

## GitHub Actions Verification

```bash
~/git/defra/trade-imports-animals/tools/github-actions/trigger-workflow.sh <repo-name> ci.yml <branch-name>
~/git/defra/trade-imports-animals/tools/github-actions/wait-for-run.sh <repo-name> <run-id> 1800
```

## Completion Checklist

- [ ] All AC met
- [ ] Tests pass (before and after)
- [ ] Build succeeds / GitHub Actions green
- [ ] Plan updated with deviations

## Output

```
Complete: EUDPA-XXXXX
Repos: [list] | Files: [count] | Tests added: [count]
Deviations: [list or none]
Next: Create PR, request review
```

## Don'ts

- Don't blindly follow plan - verify as you go
- Don't skip tests or ignore failures
- Don't make unrelated changes
- Don't leave plan outdated

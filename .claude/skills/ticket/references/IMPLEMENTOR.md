# Implementor — apply the plan

Role: Implement ticket following a plan. Produce clean, well-tested code.

**Critical:** Plan is a **starting point**. Verify assumptions, adapt as needed, document deviations.

## Model

**Session role:** `implement` — `prepare-implement.sh` prints the model
gate first. New chat (not plan). Confirm model, then continue. Use a
**different** chat for `review EUDPA-X`. `docs/agent-models.md`.

## Conventions

One command per Bash call; literal `~/git/defra/trade-imports-animals-workspace/...`
paths (never `$VAR`, never resolved `/Users/...`); prefer Read/Glob/`jq` over
`awk`/`sed`/`find`. Full rules: `~/git/defra/trade-imports-animals-workspace/docs/agent-skills.md`.

## Before You Start

One dispatch — asserts the plan exists, re-validates detect-tech per
repo, caches the PR diff if a prior PR for the ticket exists, and emits
`.implement-meta.json`:

```bash
~/git/defra/trade-imports-animals-workspace/tools/ticket/prepare-implement.sh EUDPA-XXXXX
```

Then read in this order:

1. `~/git/defra/trade-imports-animals-workspace/workareas/ticket-planning/EUDPA-XXXXX/plan.md`
2. `~/git/defra/trade-imports-animals-workspace/workareas/ticket-planning/EUDPA-XXXXX/ticket.md`
3. `~/git/defra/trade-imports-animals-workspace/workareas/ticket-planning/EUDPA-XXXXX/.implement-meta.json` (tech list per repo)
4. `~/git/defra/trade-imports-animals-workspace/workareas/ticket-planning/EUDPA-XXXXX/best-practices/<repo>.md` (pre-baked at plan time)
5. Verify `[ASSUMPTION]` and `[NEEDS VERIFICATION]` items in the plan
6. **Run all tests** — do NOT proceed if failing

Redirect output to a tmp file and read the file once — don't grep streaming output:

```bash
# Java (backend / stub / reference-data)
mvn -f ~/git/defra/trade-imports-animals-workspace/repos/<repo>/pom.xml verify > /tmp/<repo>-pre-$(date +%Y%m%d-%H%M%S).txt 2>&1
```
```bash
# Node unit (frontend / admin)
npm --prefix ~/git/defra/trade-imports-animals-workspace/repos/<repo> test > /tmp/<repo>-pre-$(date +%Y%m%d-%H%M%S).txt 2>&1
```
```bash
# E2E (only when changing tests repo or cross-cutting code)
npm --prefix ~/git/defra/trade-imports-animals-workspace/repos/trade-imports-animals-tests run test:local > /tmp/e2e-pre-$(date +%Y%m%d-%H%M%S).txt 2>&1
```

## Implementation

### Branch Setup

One allowlisted dispatch — fetch / checkout base / pull / checkout -b. The
helper always produces `feature/EUDPA-XXXXX-<slug>` and preserves the
EUDPA-* prefix (don't strip it on split branches).

```bash
~/git/defra/trade-imports-animals-workspace/tools/ticket/setup-branch.sh EUDPA-XXXXX --repo <repo-name> --slug <description>
```

Optional `--base <branch>` if branching from anything other than `main`.

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
- Follow tech-specific best practices at `~/git/defra/trade-imports-animals-workspace/docs/best-practices/`: `gds/`, `java/`, `node/`, `playwright/`, `k6/`, `rest-api/`, `doc-comments/`, `docker-compose.md`

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

## Self-Review Before Raising the PR

Review your own diff the way the `review` skill would — but fix
findings now instead of logging them. For each repo touched:

1. Get the full diff (one call per repo):

```bash
git -C ~/git/defra/trade-imports-animals-workspace/repos/<repo> diff main...HEAD
```

2. Re-read it cold against the pre-baked
   `workareas/ticket-planning/EUDPA-XXXXX/best-practices/<repo>.md`
   bundle — judge what the diff *says*, not what you meant.
3. Check: correctness edge cases, error handling (no swallowed
   exceptions), security (input validation, no secrets), test coverage
   for every new path, AC actually met, no unrelated changes.
3a. **Reconcile against the plan's Testing Strategy table:** every
   test it names exists, or the deviation is recorded in `plan.md`
   under `## Implementation Notes`. Don't silently drop planned tests.
4. Fix violations immediately, then re-run tests.
5. **Local Sonar gate (user handoff):** ask the developer to run the
   SonarQube for IDE plugin analysis in IntelliJ on the changed files
   (default Sonar way rules — same as CI) and paste back any findings.
   Fix each reported finding, re-run tests, then ask them to re-analyse
   until clean. Do not raise the PR with open Sonar findings.

This is the cheap 80% of the review skill; the full fan-out review
should come back clean afterwards.

## Commit Gate (developer review)

**Never commit automatically.** Work stays uncommitted on the feature
branch until the developer has reviewed it:

1. Present the changes per repo:
   ```bash
   git -C ~/git/defra/trade-imports-animals-workspace/repos/<repo> status --short
   ```
   ```bash
   git -C ~/git/defra/trade-imports-animals-workspace/repos/<repo> diff --stat
   ```
   Plus a short prose summary of what changed and why.
2. Ask the developer to review (in the IDE or via the diff) and wait
   for explicit approval. Apply any corrections they ask for, re-run
   tests, and re-present.
3. On approval, commit following
   `~/git/defra/trade-imports-animals-workspace/docs/git-conventions.md` —
   `type(EUDPA-XXXXX): description`, imperative mood, **no agent/AI
   references** (no `Co-Authored-By` trailers, no "Generated with").

## GitHub Actions Verification

```bash
~/git/defra/trade-imports-animals-workspace/tools/github-actions/trigger-workflow.sh <repo-name> ci.yml <branch-name>
~/git/defra/trade-imports-animals-workspace/tools/github-actions/wait-for-run.sh <repo-name> <run-id> 1800
```

## Raise the PR

```bash
gh pr create --repo DEFRA/<repo> --title "EUDPA-XXXXX: <summary>" \
    --body-file ~/git/defra/trade-imports-animals-workspace/workareas/ticket-planning/EUDPA-XXXXX/pr-body-<repo>.md
```

Write the body file first, using this template:

```markdown
## What

[1-2 sentences — the change and why]

## Acceptance criteria

- [x] AC1 — [evidence: file/test that satisfies it]
- [x] AC2 — ...

## Testing

- Unit: [what's covered, test file names]
- Integration/E2E: [what's covered, or why not applicable]

## Deviations from plan

[None, or list — mirrors plan.md ## Implementation Notes]
```

Every AC box must be checked with evidence; an unchecked box means the
PR isn't ready.

## Completion Checklist

- [ ] All AC met
- [ ] Tests pass (before and after)
- [ ] Planned tests exist (or deviation noted in plan)
- [ ] Self-review done; findings fixed
- [ ] Local Sonar analysis (IntelliJ plugin) clean
- [ ] Developer reviewed and approved the diff before commit
- [ ] Commit messages per git-conventions, no agent references
- [ ] PR raised with templated body (AC evidence checked)
- [ ] Build succeeds / GitHub Actions green
- [ ] Plan updated with deviations

## Output

```
Complete: EUDPA-XXXXX
Repos: [list] | Files: [count] | Tests added: [count]
PRs: [repo#pr list]
Deviations: [list or none]
Next: request review
```

## Don'ts

- Don't blindly follow plan - verify as you go
- Don't skip tests or ignore failures
- Don't make unrelated changes
- Don't leave plan outdated

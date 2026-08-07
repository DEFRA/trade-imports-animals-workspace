# Workspace workflows

Deterministic multi-agent orchestration scripts. Run one with the `Workflow` tool:
`Workflow({ name: "increment-build-loop" })`, or point at the file directly with
`Workflow({ scriptPath: ".claude/workflows/increment-build-loop.js" })`.

## `increment-build-loop.js`

Builds increments from a programme's `backlog.json`, one at a time, with a full
quality pass per increment rather than a single implement-and-hope pass. It defaults to
plant-products/CHED-PP (`workareas/shared/plant-products-ched-pp/backlog.json`) but runs any
backlog in that shape — `snag-triage.js` below writes one.

**Which programme** — `workarea` and `scope` in the `FALLBACK` const. Left alone they point at
plant-products, so an invocation that names only increments behaves as it always did.

**Which branch** — if an increment carries a `branch` field, the baseline guard checks that branch
out before implementing, so each increment lands on its own branch off its own base rather than on
top of its predecessor. With no `branch` field the loop keeps the old single-branch behaviour and
asserts `spike/trace-to-requirements`.

**Which increments** — edit the `FALLBACK` const at the top (`{ increments: ['pp-053'] }`),
or pass `args`. It defaults to the fallback because `args` plumbing has proved unreliable
in this runtime. A list runs **serially**, and the run stops at the first failure so a
broken increment is never built on top of.

### The stages, per increment

| Stage | Agents | What it does |
|---|---|---|
| Baseline | 1 | Refuses to start on a dirty tree or a red suite, so any later red is unambiguously ours |
| Implement | 1 | Follows the `frontend-change` skill (frontend), Java best-practices (backend) or Playwright best-practices (tests). Stages, never commits |
| Review | 2n+1 | One style reviewer and one code reviewer **per changed file**, plus a consistency reviewer across the whole change |
| Verify findings | 1 per finding | Adversarial refutation — each finding must survive an agent actively trying to kill it |
| Judge | 1 | Replaces the skills' interactive `WALKER`. Rules each surviving finding fix-now / defer / reject **without asking a human** |
| Fix | 1 | Applies only what the judge ruled fix-now |
| Ladder | 1 | Runs the increment's own `verification` array, in order, to logs |
| Land | 1–2 | Commits on green and marks the increment done; `git stash push -u` on red |

The reviewers follow the personas the skills already ship —
`review/references/{FILE_REVIEWER,CONSISTENCY_REVIEWER,REVIEW_ITEM_FIXER}.md` and
`code-style/references/{STYLE_FILE_REVIEWER,STYLE_IMPLEMENTOR}.md` — so the loop and a
hand-run review apply the same standard.

### What still stops for a human

- **A `gate` on the increment.** `pp-012` (depth-3 collection characterisation) and `pp-021`
  (the commodity model) are HALT-FOR-REVIEW by design. The judge absorbs routine review
  triage; it does not absorb these. The loop lands the increment, then stops.
- **A red ladder.** Rolled back with `git stash push -u` (recoverable — never `reset --hard`),
  the failure recorded in the increment's `notes`, and the run stops.
- **Pushing.** The loop commits but never pushes.

### Deferred findings are never lost

When the judge defers a finding it writes it into that increment's `openQuestions` in
`backlog.json`. So "the judge decided instead of asking you" still leaves you a reviewable
trail — read it with:

```bash
jq -r '.increments[] | select((.openQuestions|length)>0) | .id + ": " + (.openQuestions|join(" | "))' \
  workareas/shared/plant-products-ched-pp/backlog.json
```

## `snag-triage.js`

Turns a list of one-line snagging comments into a backlog `increment-build-loop.js` can run.
A snag as reported ("the hint under the radios is gone") is not buildable; this is the step that
makes it buildable, and it is deliberately separate from building so a wrong diagnosis is caught
before an implementor acts on it.

**Input** — `workareas/shared/<workarea>/snags.txt`, one complaint per line, `#` for comments.
**Output** — `backlog.json` in that workarea, plus a Jira subtask and a `fix/EUDPA-X-<slug>` branch
per snag worth building.

### The stages, per snag

| Stage | Agents | What it does |
|---|---|---|
| Load | 1 | Reads `snags.txt`, drops any snag already in `backlog.json`. This is what makes a re-run safe |
| Investigate | 1 per snag | Finds the root cause and writes the full increment spec — filesToTouch, acceptance criteria, verification ladder |
| Refute | 1 per snag | Attacks the diagnosis on four fronts: does the defect exist, is it the cause or a symptom, does it match the snag's words, would the ladder fail on unfixed code |
| Ticket | 1 per snag | Raises the subtask under the parent (Jira wiki markup) and cuts its branch via `tools/ticket/setup-branch.sh --prefix fix` |
| Assemble | 1 | Writes `backlog.json`, preserving anything already `done`, and computes `conflictsWith` between increments touching the same file |

Agent count is `3n + 2` for n snags.

### The four verdicts

Only **actionable** reaches the build loop as `status: todo`. **needs-decision** gets a subtask and a
branch but is born `blocked` with a `gate` naming the question — the investigator is explicitly
forbidden from inventing an answer and calling it actionable. **already-fixed** and
**cannot-reproduce** get no subtask and no branch; they land in the backlog as a record of what was
ruled out, so the same snag is not investigated twice.

A refuter that dies does not silently promote a diagnosis — the increment is flagged `refuterFailed`.

### Then build

```bash
# what triage produced
jq -r '.increments[] | .id + " " + .status + " " + (.subtask // "-") + " " + (.verdict)' \
  workareas/shared/frontend-snagging-eudpa315/backlog.json

# anything two branches will fight over on merge
jq -r '.increments[] | select((.conflictsWith|length)>0) | .id + " ↔ " + (.conflictsWith|join(","))' \
  workareas/shared/frontend-snagging-eudpa315/backlog.json
```

Then point the build loop at the runnable ids:

```
Workflow({ scriptPath: ".claude/workflows/increment-build-loop.js",
           args: { workarea: "frontend-snagging-eudpa315", scope: "snagging",
                   increments: ["snag-001", "snag-003"] } })
```

Each runs on its own branch, so a red ladder on one does not strand the others — but the loop still
stops at the first failure rather than building past it.

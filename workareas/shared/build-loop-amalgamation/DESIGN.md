# Build-loop amalgamation — analysis and design

Written 2026-08-14, out of EUDPA-328. Design only; nothing here has been implemented.

## The finding that prompted this

`prototypes/standalone/live-animals` **no longer exists.** It was promoted into
`src/server/app`. Only `obligations-v2-spike` remains under `prototypes/standalone/`,
and `npm run test:prototype` is not in the frontend's `package.json`.

Twelve files still point at it:

| File | What breaks |
|---|---|
| `tools/journey-builder/verify-increment.sh` | runs `test:live-animals` (fine) then prettier/eslint over `prototypes/standalone/live-animals` (path gone), and `test:prototype` on `--e2e` (script gone) |
| `tools/journey-builder/commit-increment.sh` | scopes the commit to the dead path |
| `tools/journey-builder/rollback-increment.sh` | rolls back the dead path |
| `tools/journey-builder/prepare-digest.sh` | reads the dead path |
| `.claude/skills/journey-builder/SKILL.md` + `INCREMENT_IMPLEMENTOR.md` | whole skill targets it |
| `.claude/skills/prototype-element/` — SKILL.md + 4 references | whole skill targets it |
| `.claude/skills/frontend-change/decisions.md` | historical reference only, harmless |

So the loop machinery is sound and its target is dead, while `frontend-change` — which
targets the live code — has no loop around it at all. That is the amalgamation.

## What we actually have

Three overlapping shapes, all invented separately:

**1. The build loop** (`journey-builder`). Canonical `backlog.json`, `next-increment.sh
--claim` pops the first `todo` whose `dependsOn` are done, an implementor subagent per
increment, parent re-verifies, commit-or-rollback, halt at gates and milestones. *This
is the best machinery in the workspace.* Its target is dead.

**2. The single increment** (`frontend-change`, `prototype-element`). One well-specified
change, recipe-driven, full verification ladder, then stop. `frontend-change` targets
live code and its modes — `add-field` / `add-page` / `add-section` / `add-collection` /
obligation change / flow change — are *exactly* the increment types EUDPA-328's backlog
uses. No loop; every increment is a manual invocation.

**3. The walker** (`review`, `code-style`, `npm-upgrade`, `govuk-upgrade`). Batch triage
of pending items one at a time, ruling recorded to JSON state, then a batched implementor
applies what was agreed. Reinvented four times with four different state shapes.

EUDPA-328 has now added a fourth-and-a-half: `tools/parity/` for walking gated decisions.
That is the point at which this should stop being reinvented.

## Design: one loop, pluggable targets

### 1. A target profile replaces the hardcoded paths

The loop scripts stop knowing about any particular codebase. A profile declares what a
target is:

```json
{
  "id": "live-animals-frontend",
  "repo": "repos/trade-imports-animals-frontend",
  "scope": "src/server/app/sets/live-animals",
  "implementorSkill": "frontend-change",
  "verify": {
    "unit":   "npm run test:live-animals",
    "full":   "npm test",
    "lint":   "npm run lint",
    "arch":   "npm run lint:arch",
    "e2e":    "npm run test:features"
  }
}
```

`verify-increment.sh EUDPA-328` then reads the profile from the backlog's `target` field
rather than hardcoding a path. The prototype profile can stay, pointed at
`obligations-v2-spike`, or be deleted — but the choice becomes data, not a rewrite.

**This alone fixes all twelve files**, because eleven of them only hardcode the path.

### 2. `backlog.json` gains `target`, and nothing else changes

```json
{ "run_id": "EUDPA-328", "target": "live-animals-frontend", "increments": [...] }
```

`next-increment.sh`, `backlog-set-status.sh` and `backlog-counts.sh` already key on
`id`/`dependsOn`/`status` only, so they need no change at all. That is why EUDPA-328's
backlog already works with them unmodified.

### 3. The walker becomes one mechanism, not four

`tools/parity/{next-decision,rule-decision,decision-counts}.sh` generalise directly:
they walk items in a JSON array that are blocked on a named gate, record a ruling with a
mandatory note, and flip status. Rename to `tools/loop/` and they serve review triage,
upgrade triage and parity decisions alike. The four existing walkers keep their skill
prompts and lose their bespoke state handling.

### 4. `frontend-change` becomes the implementor, unchanged

It already does exactly what an increment implementor should: one increment, recipe
verbatim, verification ladder, stop. The loop invokes it with the increment's `type` as
its mode. It needs no modification — only `INCREMENT_IMPLEMENTOR.md` gets retired in its
favour.

## What to do, in order

1. **Fix the dead path first** — it is a live bug and cheap. Add `target` to the profile,
   read it in the four `tools/journey-builder/` scripts. Half a day, unblocks the loop.
2. **Point `journey-builder`'s loop at the frontend profile**, retire
   `INCREMENT_IMPLEMENTOR.md` in favour of `frontend-change`.
3. **Decide `prototype-element`'s fate.** Its target is gone. Either repoint at
   `obligations-v2-spike` or delete it — leaving it is the worst option, because it reads
   as available and silently is not.
4. **Generalise the walker** into `tools/loop/`, migrate the four skills.
5. **Rename** `workareas/journey-builder/` → `workareas/build-loop/` once nothing depends
   on the old path. Cosmetic, do last.

## The risk worth naming

Steps 1–2 are mechanical and safe. Step 4 touches four working skills at once and has no
tests behind it. Do it behind a canary — migrate `review` alone, use it for a week, then
fan out. That is the workspace's own rule and it applies to its own tooling.

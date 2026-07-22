---
name: test-stack-analysis
description: 'Given a feature description, Jira ticket, or Confluence URL, finds every related test file across the 8 EUDP Live Animals repos, classifies each by pyramid level (unit/integration/E2E) and concern type, and reports coverage gaps and cross-level duplication with file:line evidence — so a developer knows where to add or remove test coverage before writing new tests. Triggers: "test-stack-analysis EUDPA-X", "find test gaps EUDPA-X", "test pyramid analysis EUDPA-X", "analyse test coverage EUDPA-X", "check test pyramid for <feature>". One-shot, report-only — makes no code changes. NOT for correctness/style review of existing code (use `review` or `code-style`), NOT for verifying a PR author understands their own change (use `understanding-check`), NOT for scaffolding CLAUDE.md (Claude Code'\''s built-in `/init`).'
---

For anyone about to write E2E tests for a feature, or auditing
whether a flow's test pyramid is shaped right. Given a feature
description, a Jira ticket (EUDPA-X), or one or more Confluence page
URLs, this skill searches all 8 repos for related test files, tags
each by pyramid level and by which kind of concern it verifies, then
reports two things: gaps (a concern with no coverage at its correct
home level) and duplication (a concern re-asserted at a higher level
than it needs to be). The output is a single markdown report under
`workareas/test-stack-analysis/<run-id>/report.md` — the skill
recommends actions but makes no code changes itself.

## Path conventions

Cross-workspace paths use the literal home-relative form —
`~/git/defra/trade-imports-animals-workspace/tools/<domain>/`,
`~/git/defra/trade-imports-animals-workspace/docs/best-practices/`,
`~/git/defra/trade-imports-animals-workspace/workareas/`. Bash
expands `~` automatically. Skill-internal references stay
relative (`references/<NAME>.md`, `assets/<NAME>.md`).

**Bash call hygiene** — one command per Bash call. Full rule
table: [`docs/agent-skills.md`](../../../docs/agent-skills.md)
→ "Bash call hygiene".

## When to use

| Trigger | What to follow |
|---------|----------------|
| "test-stack-analysis EUDPA-X" | Step 0 — resolve `EUDPA-X` as `--ticket` |
| "find test gaps EUDPA-X" | Step 0 — resolve `EUDPA-X` as `--ticket` |
| "test pyramid analysis EUDPA-X" | Step 0 — resolve `EUDPA-X` as `--ticket` |
| "analyse test coverage EUDPA-X" | Step 0 — resolve `EUDPA-X` as `--ticket` |
| "check test pyramid for `<feature>`" | Step 0 — resolve free text as `--description` |

NOT for correctness, security, or style findings on existing code —
use the `review` or `code-style` skills. NOT for checking whether a
PR's author understands their own change — use `understanding-check`.
NOT for scaffolding `CLAUDE.md` — that's Claude Code's built-in
`/init`, unrelated to workspace skills entirely.

## Worker references

| Persona | Used in | Artifact |
|---|---|---|
| `references/REPO_TEST_DISCOVERER.md` | Step 1 (one per repo, parallel, all 8) | `workareas/test-stack-analysis/<run-id>/inventory.<repo>.md` |

Spawn idiom — Task tool, `subagent_type: general-purpose`,
prompt begins:

```
Follow the instructions in ~/git/defra/trade-imports-animals-workspace/.claude/skills/test-stack-analysis/references/<NAME>.md.

<per-spawn context>
```


## Step 0: Start

Pick a `--run-id` (the ticket ID for `--ticket` input; a short
kebab-case slug you choose for `--description`/`--url` input, same
convention as `ticket-creator`'s slugs). Exactly one input flag is
required; `--url` may repeat for multiple Confluence pages.

```bash
~/git/defra/trade-imports-animals-workspace/tools/test-stack-analysis/start-test-stack-analysis.sh --run-id EUDPA-X --ticket EUDPA-X
```

```bash
~/git/defra/trade-imports-animals-workspace/tools/test-stack-analysis/start-test-stack-analysis.sh --run-id notification-sort --description "Notification dashboard sorting: default arrivalDate desc, four sort options, NULL arrivalDate last"
```

This is a one-shot skill — there is no FRESH/REFRESH distinction to
branch on. The script creates
`workareas/test-stack-analysis/<run-id>/`, resolves the input (fetches
the ticket or Confluence page(s) if given), determines in-scope repos
(always all 8 — a repo with nothing relevant simply reports no
findings from Step 1), and seeds `.run-meta.json`. Re-running the same
`--run-id` overwrites prior output; there is no state to carry
forward between runs.

**Before your first run, or after changing the taxonomy/classification
logic:** sanity-check against the known-answer fixtures in
`assets/concern-type-taxonomy.md`'s "Verification fixtures" section
(the notification-dashboard-sorting example, `trade-imports-stub`'s own
untested fixture-serving behaviour, and the ticket-agnostic severity
calibration pair) before trusting results against an unfamiliar ticket
— each has a known-correct expected result, so any deviation is
unambiguously a logic bug, not a judgment call.

## Step 1: Fan out discovery, one worker per repo

Before spawning: if the input was `--ticket` or `--url`, read the
cached `ticket.md`/`confluence-N.md` and extract a clean, plain-text
summary of the AC/flow text yourself — Jira and Confluence content is
cached as raw rich-text markup (literal `<p>`, `<b>`, `<span>` tags),
not plain prose. Embed your cleaned summary in each spawn prompt below,
not the raw cached file content — workers should never have to parse
HTML tags out of their own input.

Spawn 8 parallel `general-purpose` Task subagents, one per repo,
following `references/REPO_TEST_DISCOVERER.md`. Spawn prompt begins:

```
Follow the instructions in ~/git/defra/trade-imports-animals-workspace/.claude/skills/test-stack-analysis/references/REPO_TEST_DISCOVERER.md.

**Repo:** <repo-name>
**Repo path:** ~/git/defra/trade-imports-animals-workspace/repos/<repo-name>
**Flow/feature under analysis:** <resolved input text — ticket AC, Confluence content, or free-text description>
**Taxonomy reference:** ~/git/defra/trade-imports-animals-workspace/.claude/skills/test-stack-analysis/assets/concern-type-taxonomy.md
**Output path:** ~/git/defra/trade-imports-animals-workspace/workareas/test-stack-analysis/<run-id>/inventory.<repo-name>.md
```

Wait for all 8 workers to complete (the harness notifies on
completion — do not poll).

## Step 2: Cross-repo concern-type analysis (parent session — do not fan this out)

This step stays in the parent session, not a subagent, because the
gap/duplication judgment needs the combined cross-repo picture for
one flow — fanning it out per-repo would fragment exactly the
cross-cutting view it depends on (a single flow's coverage routinely
spans backend unit + backend IT + frontend controller + Playwright
E2E at once).

1. Read every `inventory.<repo>.md` written in Step 1.
2. Read `assets/concern-type-taxonomy.md` in full if not already in
   context.
3. Decompose the flow/feature under analysis into individual
   concerns, using the taxonomy's "signal in flow/AC text" column.
   One AC bullet routinely yields multiple concerns across different
   levels — do not classify at whole-AC granularity (see the
   taxonomy's "Granularity" section and its worked reference case).
4. For each concern: look up its natural home level (and, for HTTP/
   message concerns, the per-repo convention table). Check the
   relevant repo's inventory for a matching test at that level.
   - No match at the home level → **gap**.
   - A match exists at the home level, AND an equivalent-strength
     match (including the failure path) also exists at a higher
     level → **duplication** candidate. When that higher level is E2E,
     don't treat it as automatically exempt — apply the taxonomy's
     sharper per-sub-concern test (a fact only trustworthy because a
     real caller supplied it, vs. an already-proven single-service
     fact) before deciding.
5. Do not evaluate "promote to E2E for cross-service confidence" —
   this skill explicitly does not attempt that judgment call (see the
   taxonomy's "Known limitation" section). Only report gaps and
   duplication as defined above.
6. When scoping tests for new, unimplemented work (as opposed to
   auditing an existing suite), do not silently recommend building
   every automated test a gap analysis turns up. Flag an
   **automation-scope** finding instead whenever: the same underlying
   concern surfaces as a gap at more than one tier (e.g. an
   integration-tier test AND a full-stack test both proposed for the
   same AC — note whether the higher tier proves anything the lower
   one structurally can't); the technique/cost looks disproportionate
   to what it proves; or the concern looks better suited to a manual/
   periodic check than to any automated tier at all (see the
   taxonomy's "Known limitation #2" for all three). Leave the
   build-or-skip-or-manual decision to the requester — this is the
   same category of judgment call as bullet 5, just about proposed
   rather than existing tests.
7. For each gap, add a one-line risk read per the taxonomy's "Gap
   severity is not uniform" section: **Blocking** if it has a
   plausible production consequence, **Advisory** if it's a
   completeness/pyramid nit with no material risk identified. This is
   a suggested triage, not a verdict — the requester makes the final
   call on what's blocking.
8. A concern can be fully tested (no gap, no duplication) and still be
   worth flagging if the behaviour it asserts appears to not satisfy
   the flow/AC text as literally worded — e.g. every level agrees on
   what happens, but what happens doesn't match what the AC says
   should happen. This isn't a coverage gap (tests exist) and isn't a
   correctness review (out of scope per the skill's own boundary) —
   it's a coverage-informed observation that the AC itself may not be
   satisfied. File it in Notes, but give it the same Blocking/Advisory
   risk read as bullet 7 (Blocking if the mismatch has a plausible
   user-facing/production consequence, Advisory if it's a wording
   nuance with no real consequence) — this is what earns it a line in
   the At-a-glance summary in Step 3, same as a Gap.

## Step 3: Write the report

Write `workareas/test-stack-analysis/<run-id>/report.md` directly
(prose-canonical — no JSON state, no render helper). Sections, in
this order: At a glance, Gaps, Duplication, Automation-scope flags
(optional), Notes (optional), Known limitation (standing, always
present):

```markdown
# Test-stack analysis — <run-id>

<one-line description of the flow/feature analysed>

## At a glance

**Blocking**
- <concern name> — <one-line finding, plain prose, no file:line>

**Advisory**
- <concern name> — <one-line finding, plain prose, no file:line>

## Gaps

### <flow/concern name>

- **Concern type:** <taxonomy category>
- **Belongs at:** <natural home level>
- **Evidence of absence:** <what was searched, e.g. "no unit test in
  trade-imports-animals-backend asserts default sort fallback">
- **Risk if unaddressed:** <Blocking | Advisory> — <one-line reason:
  a plausible production consequence (e.g. "nothing currently stops
  X, which the feature's own rationale says causes Y"), or why this
  is just a completeness/pyramid nit with no material risk>

## Duplication

### <flow/concern name>

- **Concern type:** <taxonomy category>
- **Already proven at:** <repo>/<file>:<line> — <what it asserts>
- **Also asserted at:** <repo>/<file>:<line> — <higher level,
  redundant assertion>
- **Recommended action:** delete or demote the higher-level
  assertion — <one-line reason>

## Automation-scope flags

<optional — for any of the three judgment calls in the taxonomy's
"Known limitation #2" that a proposed (not-yet-built) test raises:
(1) the same concern proposed as a gap at more than one tier — name
it, list the tiers proposed, state whether the higher tier(s) prove
anything the lower one structurally can't; (2) a proposed technique
whose cost looks disproportionate to what it proves, or that isn't
how this class of test is conventionally scoped; (3) a concern that
looks better suited to manual/periodic verification than to any
automated tier. Do not recommend build-or-skip-or-manual yourself;
flag it for the requester to decide. Omit the section entirely if
nothing qualifies — same as Notes, its absence is unremarkable.>

## Notes

<optional — for findings that don't cleanly fit Gaps or Duplication,
e.g. a concern nominally home to one level (per the taxonomy) that
turns out to also have confident, legitimate coverage at another level
without being true duplication (a concrete case: navigation/timing
logic that's genuinely isolable and unit-testable, even though the
taxonomy defaults that concern type to E2E-only). State the concern,
where it's actually covered, and why it doesn't count as a gap or
duplication — don't force it into either bucket just to avoid this
section. Omit the section entirely if nothing qualifies; unlike Gaps/
Duplication, this one doesn't need an explicit "none" statement since
its absence is unremarkable.

For the specific sub-case from Step 2 bullet 8 — tested behaviour that
appears to not satisfy the flow/AC text as literally worded — add a
**Risk if unaddressed:** <Blocking | Advisory> line in the same style
as a Gap, so the finding carries a severity into the At-a-glance
summary above. Other Notes entries (e.g. the isolable-coverage case
above) don't need this field — only add it where Step 2 bullet 8
applies.>

## Known limitation

This report does not evaluate whether adequately-covered flows should
additionally get E2E coverage for cross-service confidence (mocked
lower-level tests can drift from the real upstream contract), nor
does it decide build-or-skip-or-manual on the automation-scope flags
above. The Blocking/Advisory risk read attached to each gap is a
suggested triage, not a verdict. All are risk-tolerance/convention
judgment calls outside this skill's scope.
```

If Gaps or Duplication has no findings, keep the heading and state
that explicitly ("No gaps found.") rather than omitting the section —
an empty section is itself a result, not a missing step.
Automation-scope flags and Notes are the exception — omit either
entirely when nothing qualifies (see above).

At a glance is always present, even when there's nothing to escalate
— state that explicitly too ("Nothing blocking or advisory to
report.") rather than omitting the section. Omit the **Blocking** or
**Advisory** sub-heading individually when that severity has no
entries; don't print an empty sub-heading. Populate it from every
Gap's `Risk if unaddressed` line plus every severity-tagged Notes
entry (Step 2 bullet 8) — nothing else feeds it, and it must not
introduce a finding that isn't also detailed in the section below.
Order Blocking before Advisory; within a severity, keep the source
order the findings appear in below. Write each line as
comment-ready prose — plain sentence, no file:line references, no
markdown nesting — since this section exists to be scannable or
copy-pasted as-is, not to carry evidence (the detail sections below
still carry that).

## Completion output

```
test-stack-analysis complete for <run-id>.

Summary:
- <X> blocking, <Y> advisory (across gaps and flagged notes — see At a glance)
- <N> gap(s) found
- <M> duplication finding(s)
- <P> automation-scope flag(s)

Report: ~/git/defra/trade-imports-animals-workspace/workareas/test-stack-analysis/<run-id>/report.md

Next: review the report and act on each recommendation manually —
this skill makes no code changes itself.
```

## Scripts cheat-sheet

All under `~/git/defra/trade-imports-animals-workspace/tools/test-stack-analysis/`:

| Script | Purpose |
|---|---|
| `start-test-stack-analysis.sh` | Step 0 — validate args, create the workarea, hand off to `prepare-test-stack-analysis.sh` |
| `prepare-test-stack-analysis.sh` | Step 0 — resolve input (fetch ticket/Confluence page(s) if given), seed `.run-meta.json` with in-scope repos |

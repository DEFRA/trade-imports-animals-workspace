export const meta = {
  name: 'dig-design-implement',
  description:
    'Investigate a defect from several angles, design a fix, have the design adversarially reviewed before any code is written, revise it, then implement and verify',
  whenToUse:
    'A defect where the fix is a design question rather than a known edit — the mechanism is understood but what SHOULD happen is not settled, and getting it wrong changes behaviour rather than merely failing.',
  phases: [
    { title: 'Dig' },
    { title: 'Design' },
    { title: 'Review design' },
    { title: 'Revise' },
    { title: 'Implement' },
    { title: 'Verify' },
  ],
}

// ---------------------------------------------------------------------------
// Configuration. args does not reach the script in this runtime — FALLBACK is
// the only switch that works.
// ---------------------------------------------------------------------------
const FALLBACK = {
  ticket: 'EUDPA-325',
  branch: 'fix/EUDPA-325-known-journey-guard',
  repo: 'frontend',
  workarea: 'frontend-snagging-eudpa315',
  descriptionFile: 'tickets/known-journey-guard-description.txt',
}
const CFG = typeof args === 'object' && args && args.ticket ? { ...FALLBACK, ...args } : FALLBACK

const ABS = '/Users/samfarrington/git/defra/trade-imports-animals'
const TILDE = '~/git/defra/trade-imports-animals'
const WORKAREA = ABS + '/workareas/shared/' + CFG.workarea
const WORKAREA_TILDE = TILDE + '/workareas/shared/' + CFG.workarea
const SKILLS = ABS + '/.claude/skills'

const REPO_PATH = {
  frontend: 'repos/trade-imports-animals-frontend',
  backend: 'repos/trade-imports-animals-backend',
  tests: 'repos/trade-imports-animals-tests',
}
const repoPath = REPO_PATH[CFG.repo]

const GUARDRAILS = `
GUARD RAILS (mandatory, every step):
- NEVER use the Grep or Glob TOOLS — they are not allowlisted and will prompt the user. Use Bash \`grep -rn\` / \`find\` / \`ls\` / \`jq\`.
- Bash hygiene: ONE command per Bash call. No \`&&\`, no \`;\`, no \`|\`, no \`cd\`, no trailing \`echo $?\`. Use \`git -C\`, \`npm --prefix\`, \`mvn -f\`. Output redirection (\`> file 2>&1\`) IS allowed.
- In Bash ALWAYS use tilde paths \`${TILDE}/...\` — a literal /Users/... path in Bash is DENIED.
- For the Read/Write/Edit TOOLS use absolute paths \`${ABS}/...\`.
- The repo under change is \`${TILDE}/${repoPath}\`, on branch \`${CFG.branch}\`. Do not switch branches.
- Never bare \`node\` / \`node -e\` (denied — wrap in an npm script). NEVER run \`sonar\` (not allowlisted).
- Tests go TO A FILE under \`${WORKAREA_TILDE}/logs/\` and you read that file ONCE. Never grep streaming output, never re-run a suite to see it again.
- Rollback is ALWAYS \`git stash push -u\` — NEVER \`reset --hard\` or \`clean -fd\`.
- Headless: never ask a question. Decide, record the decision, keep going.
`

const TICKET = `
THE TICKET — read it in full before anything else:
\`${WORKAREA}/${CFG.descriptionFile}\` (Read tool, absolute path). It states the symptom, the mechanism as
already traced, why the guard is not authorisation, what is explicitly OUT of scope, and the acceptance
criteria. Treat its "explicitly not in scope" section as binding.
`

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings', 'summary'],
  properties: {
    findings: { type: 'array', items: { type: 'string' }, description: 'Each a complete statement with file:line evidence' },
    contradictions: { type: 'array', items: { type: 'string' }, description: 'Anything that CONTRADICTS the ticket as written — say so plainly' },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

const DESIGN_SCHEMA = {
  type: 'object',
  required: ['approach', 'rationale', 'changes', 'testPlan', 'risks', 'summary'],
  properties: {
    approach: { type: 'string', description: 'The design in a few sentences — what changes conceptually' },
    rationale: { type: 'string', description: 'Why this over the alternatives, naming the alternatives rejected' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'what'],
        properties: { path: { type: 'string' }, what: { type: 'string' } },
        additionalProperties: false,
      },
    },
    testPlan: { type: 'array', items: { type: 'string' }, description: 'Each entry a test to add or change, and what it pins' },
    redFirst: { type: 'string', description: 'The single test that must FAIL on today code and pass after — named precisely' },
    risks: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

const CRITIQUE_SCHEMA = {
  type: 'object',
  required: ['verdict', 'objections', 'summary'],
  properties: {
    verdict: { type: 'string', enum: ['sound', 'needs-revision', 'wrong'] },
    objections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['what', 'why', 'severity'],
        properties: {
          what: { type: 'string' },
          why: { type: 'string', description: 'Concrete consequence, with file:line where it applies' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          suggestion: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

const RESULT_SCHEMA = {
  type: 'object',
  required: ['ok', 'summary'],
  properties: {
    ok: { type: 'boolean' },
    changedFiles: { type: 'array', items: { type: 'string' } },
    redFirstEvidence: { type: 'string', description: 'The actual failure output observed against unfixed code' },
    notes: { type: 'string' },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

const LADDER_SCHEMA = {
  type: 'object',
  required: ['green', 'ran', 'summary'],
  properties: {
    green: { type: 'boolean' },
    ran: { type: 'array', items: { type: 'string' } },
    failures: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

// ---------------------------------------------------------------------------
// Dig — three angles that do not overlap, so the design rests on evidence
// rather than on the ticket's own account of itself.
// ---------------------------------------------------------------------------
phase('Dig')

const ANGLES = [
  {
    key: 'mechanism',
    brief: `Trace the SESSION mechanism end to end and establish what it is actually for TODAY.
Start at \`session.knownJourneyIds\` and \`session.addKnownJourney\` and find every producer and consumer.
Answer, with file:line evidence for each: what writes to it and when; what reads it; does ANY consumer
depend on it for correctness or safety rather than as a breadcrumb; what breaks if it stops gating the five
operations in engine/journey.js; and is it load-bearing for anything else (session size, cookie limits,
the dashboard, the entry guard). Also establish its provenance — \`git log\`/\`git show\` on the file — to say
whether it predates real persistence.`,
  },
  {
    key: 'coverage',
    brief: `Establish WHY no test caught this. This is the most important angle — a user found a defect two
clicks from the dashboard.
Find every test touching copy, amend, cancel-amend and soft-delete, in \`src\` and in \`e2e\`. For each, work
out whether the journey under test was created BY that test. State plainly whether any existing test can
ever reach the false branch of \`isKnownJourney\`. Then say what class of scenario is missing, not just which
assertion — the general case is "acting on a notification this session did not create", which is the normal
case for a returning user. Name the specific spec files and helpers that would have to change.`,
  },
  {
    key: 'blast',
    brief: `Establish the blast radius of removing or changing the guard.
Enumerate every caller of \`loadJourney\`, \`amendJourney\`, \`cancelAmendJourney\`, \`copyJourney\` and
\`softDeleteJourney\`, and what each does with an \`undefined\` return today. Identify every place a silent
redirect or swallowed undefined could hide a failure. Check the stub persistence implementation as well as
the real one — they must stay behaviourally consistent. Check whether the dashboard, entry guard or hub
assume the session list is populated. Report anything that would change behaviour beyond the four operations.`,
  },
]

const digs = await parallel(
  ANGLES.map((angle) => () =>
    agent(
      `You are a DIG INVESTIGATOR for ${CFG.ticket}, angle: ${angle.key}. You investigate and report. You change
NOTHING and you propose no fix — a later agent designs from what you find.
${GUARDRAILS}
${TICKET}

YOUR ANGLE:
${angle.brief}

RULES:
- Evidence over assertion. Every finding cites file:line, and you have read that line.
- The ticket states a mechanism already traced. VERIFY it rather than repeating it. If any part of it is
  wrong, put that in \`contradictions\` — a ticket written from a partial trace is exactly the thing a dig
  exists to correct, and agreeing with it by default is how a wrong premise survives.
- Report what IS, not what should be.
Return the structured output only.`,
      { label: `dig:${angle.key}`, phase: 'Dig', schema: FINDINGS_SCHEMA }
    ).then((r) => ({ angle: angle.key, ...(r ?? { findings: [], contradictions: [], summary: 'AGENT FAILED' }) }))
  )
)

const digText = digs
  .filter(Boolean)
  .map(
    (d) =>
      `### Angle: ${d.angle}\n${(d.findings ?? []).map((f) => `- ${f}`).join('\n')}\n${(d.contradictions ?? []).length ? `CONTRADICTIONS OF THE TICKET:\n${d.contradictions.map((c) => `- ${c}`).join('\n')}\n` : ''}Summary: ${d.summary}`
  )
  .join('\n\n')

log(`dig complete — ${digs.filter(Boolean).reduce((n, d) => n + (d.findings?.length ?? 0), 0)} findings, ${digs.filter(Boolean).reduce((n, d) => n + (d.contradictions?.length ?? 0), 0)} contradictions of the ticket`)

// ---------------------------------------------------------------------------
// Design — one designer, working only from the dig.
// ---------------------------------------------------------------------------
phase('Design')

const design = await agent(
  `You are the DESIGNER for ${CFG.ticket}. Three investigators have dug into this from different angles. Design
the fix. You write NO code — you produce a design that a reviewer will attack and an implementor will follow.
${GUARDRAILS}
${TICKET}

THE DIG:
${digText}

RULES:
- Design from the dig, not from the ticket's account of itself. Where they conflict, the dig wins and you say so.
- The out-of-scope section is binding: do NOT design per-user or per-organisation scoping. There is no identity
  on the notification to scope by, and inventing one pre-empts the authorisation work.
- Name the alternatives you rejected and why. A design with no rejected alternatives has not been designed.
- The silent-redirect defect is in scope in its own right. An operation that cannot proceed must not look like
  a refresh, whatever the guard ends up doing.
- \`redFirst\` must name ONE test that genuinely fails on today's code for the REPORTED symptom — copying a
  notification not created in this session. If you cannot name one, your design is not testable and you should
  say so in risks rather than inventing a plausible-sounding test.
- Prefer the smallest change that makes the behaviour coherent. This is a defect fix, not a redesign of session
  handling.
Return the structured output only.`,
  { label: 'design', phase: 'Design', schema: DESIGN_SCHEMA }
)

if (!design) {
  return { ok: false, reason: 'Designer failed — nothing to review or implement.', dig: digText }
}

const designText = `APPROACH: ${design.approach}
RATIONALE: ${design.rationale}
CHANGES:
${(design.changes ?? []).map((c) => `  - ${c.path} — ${c.what}`).join('\n')}
TEST PLAN:
${(design.testPlan ?? []).map((t) => `  - ${t}`).join('\n')}
RED-FIRST TEST: ${design.redFirst ?? '(none named)'}
RISKS:
${(design.risks ?? []).map((r) => `  - ${r}`).join('\n')}`

// ---------------------------------------------------------------------------
// Review the design — before a line is written, because the expensive mistake
// here is building the wrong thing correctly.
// ---------------------------------------------------------------------------
phase('Review design')

const LENSES = [
  {
    key: 'correctness',
    brief: `Does this design actually fix the REPORTED symptom — copy silently no-opping on a notification not
opened in this session? Walk the user's path through the proposed code and say where it now succeeds. Attack
any step that assumes rather than demonstrates. Check the design has not fixed a neighbouring defect while
leaving the reported one intact — that has already happened once on this ticket, where the backend write was
fixed and the button still did nothing.`,
  },
  {
    key: 'access-and-scope',
    brief: `Attack the design on access behaviour and scope creep. Does it quietly introduce a scoping rule the
ticket forbids? Does it remove something that IS load-bearing, on the assumption it is vestigial? Does it make
any operation reachable that genuinely should not be — remembering there is no ownership on the notification,
so "should not" has to be argued from something real, not assumed. Conversely, does it preserve a guard that
protects nothing and would keep the defect alive in another form?`,
  },
  {
    key: 'testability',
    brief: `Attack the test plan. The whole point of this ticket is that the suite missed a two-click defect.
Would the proposed tests have caught THIS bug? Is the red-first test genuinely red on today's code, or would it
pass either way — trace it against the current implementation and say. Does the plan cover the general class
("acting on a notification this session did not create") or only the single reported instance? Does it cover
amend, cancel-amend and soft-delete, which share the guard? Does it rely on a helper that creates the journey
first, which is exactly what made the gap invisible?`,
  },
]

const critiques = await parallel(
  LENSES.map((lens) => () =>
    agent(
      `You are a DESIGN REVIEWER for ${CFG.ticket}, lens: ${lens.key}. A design has been proposed and NO code has
been written yet. Your job is to find what is wrong with it now, while changing it is still cheap.
${GUARDRAILS}
${TICKET}

THE DESIGN:
${designText}

SUPPORTING EVIDENCE FROM THE DIG:
${digText}

YOUR LENS:
${lens.brief}

RULES:
- Read the actual code before objecting. An objection that does not survive contact with the file is noise,
  and noise here costs a revision cycle.
- Rank honestly: \`blocker\` means the design does not work or does harm; \`major\` means it works but leaves a
  real gap; \`minor\` is polish. Do not inflate.
- \`sound\` is a legitimate verdict. If the design is right, say so and raise only what genuinely remains —
  manufacturing objections to look thorough is worse than finding none.
Return the structured output only.`,
      { label: `review:${lens.key}`, phase: 'Review design', schema: CRITIQUE_SCHEMA }
    ).then((r) => ({ lens: lens.key, ...(r ?? { verdict: 'needs-revision', objections: [], summary: 'REVIEWER FAILED — design unchallenged on this lens' } ) }))
  )
)

const live = critiques.filter(Boolean)
const objections = live.flatMap((c) => (c.objections ?? []).map((o) => ({ ...o, lens: c.lens })))
const blockers = objections.filter((o) => o.severity === 'blocker')

log(`design review: ${live.map((c) => `${c.lens}=${c.verdict}`).join(', ')} — ${objections.length} objections, ${blockers.length} blockers`)

const critiqueText = live
  .map(
    (c) =>
      `### Lens: ${c.lens} — verdict ${c.verdict}\n${(c.objections ?? []).map((o) => `- [${o.severity}] ${o.what}\n  WHY: ${o.why}${o.suggestion ? `\n  SUGGESTION: ${o.suggestion}` : ''}`).join('\n')}\nSummary: ${c.summary}`
  )
  .join('\n\n')

// ---------------------------------------------------------------------------
// Revise — fold the critique in, or defend the design against it.
// ---------------------------------------------------------------------------
phase('Revise')

const finalDesign = objections.length === 0
  ? design
  : (await agent(
      `You are the DESIGNER for ${CFG.ticket}, revising after review. Three reviewers attacked your design on
different lenses. Produce the FINAL design.
${GUARDRAILS}
${TICKET}

YOUR ORIGINAL DESIGN:
${designText}

THE CRITIQUE:
${critiqueText}

RULES:
- Address every blocker. A blocker you disagree with must be answered in \`rationale\` with evidence, not
  ignored — but the bar for overruling a reviewer who read the code is high.
- Fold in majors unless doing so expands scope beyond the ticket; say which you declined and why.
- Minors are optional. Taking none of them is fine.
- Do not let the revision grow the change. If the critique implies a larger fix than the ticket covers, note it
  in \`risks\` as follow-up work rather than absorbing it.
- Re-check \`redFirst\` still names a test that genuinely fails today. If a reviewer showed it would not, replace
  it with one that does.
Return the structured output only — the complete final design, not a diff of changes.`,
      { label: 'revise design', phase: 'Revise', schema: DESIGN_SCHEMA }
    )) ?? design

const finalText = `APPROACH: ${finalDesign.approach}
RATIONALE: ${finalDesign.rationale}
CHANGES:
${(finalDesign.changes ?? []).map((c) => `  - ${c.path} — ${c.what}`).join('\n')}
TEST PLAN:
${(finalDesign.testPlan ?? []).map((t) => `  - ${t}`).join('\n')}
RED-FIRST TEST: ${finalDesign.redFirst ?? '(none named)'}
RISKS:
${(finalDesign.risks ?? []).map((r) => `  - ${r}`).join('\n')}`

// ---------------------------------------------------------------------------
// Implement — follow the reviewed design, red-first.
// ---------------------------------------------------------------------------
phase('Implement')

const impl = await agent(
  `You are the IMPLEMENTOR for ${CFG.ticket}. The design below has already been reviewed on three lenses and
revised. Implement it. You do not redesign it.
${GUARDRAILS}
${TICKET}

THE REVIEWED DESIGN:
${finalText}

HOW TO BUILD IT:
- READ ${SKILLS}/frontend-change/SKILL.md IN FULL first and follow the recipe it routes you to, so registration
  steps are not missed.
- RED FIRST, and this is not optional on this ticket: write the red-first test named in the design, run it
  against the UNFIXED code, and CONFIRM IT FAILS. Put the actual failure output in \`redFirstEvidence\`. A user
  found this bug because the suite could not see it — a test that passes before the fix repeats that failure.
- Then make it pass. Then the rest of the test plan.
- Every user-facing string goes in copy.en.js AND copy.cy.js with identical structure.
- Keep the stub and real persistence implementations behaviourally consistent.
- Stage your work (\`git -C ${TILDE}/${repoPath} add\`) but DO NOT COMMIT.
- At most 3 self-repair attempts on a red step. Then stop and report ok:false with what is red and what you
  tried. Do NOT weaken a test to get green, and do NOT delete an assertion you cannot satisfy.
Return the structured output only.`,
  { label: 'implement', phase: 'Implement', schema: RESULT_SCHEMA }
)

if (!impl || !impl.ok) {
  log(`IMPLEMENT FAILED — ${impl?.summary ?? 'agent failed'}`)
  return {
    ok: false,
    stage: 'implement',
    design: finalText,
    dig: digText,
    critique: critiqueText,
    detail: impl?.summary ?? 'agent failed',
  }
}

// ---------------------------------------------------------------------------
// Verify — parent-side ladder, never the implementor's own word.
// ---------------------------------------------------------------------------
phase('Verify')

const ladder = await agent(
  `You are the VERIFIER for ${CFG.ticket}. Run the suites and report honestly. You did not write this code and
you have no stake in it being green.
${GUARDRAILS}
Run each to its own log under ${WORKAREA_TILDE}/logs/ and read each ONCE:
1. \`npm --prefix ${TILDE}/${repoPath} test > ${WORKAREA_TILDE}/logs/${CFG.ticket}-units.log 2>&1\`
2. \`npm --prefix ${TILDE}/${repoPath} run lint > ${WORKAREA_TILDE}/logs/${CFG.ticket}-lint.log 2>&1\`
3. \`PORT=3050 npm --prefix ${TILDE}/${repoPath} run test:features > ${WORKAREA_TILDE}/logs/${CFG.ticket}-features.log 2>&1\`
Report green:true ONLY if every step actually ran and actually passed. If a step could not run, record it in
failures as "could not run: <reason>" and set green:false — do not report a step you skipped as passing.
Return the structured output only.`,
  { label: 'verify', phase: 'Verify', schema: LADDER_SCHEMA }
)

return {
  ok: Boolean(ladder?.green),
  ticket: CFG.ticket,
  branch: CFG.branch,
  design: finalText,
  reviewVerdicts: live.map((c) => `${c.lens}: ${c.verdict}`),
  blockersRaised: blockers.map((b) => `[${b.lens}] ${b.what}`),
  ticketContradictions: digs.filter(Boolean).flatMap((d) => (d.contradictions ?? []).map((c) => `[${d.angle}] ${c}`)),
  changedFiles: impl.changedFiles ?? [],
  redFirstEvidence: impl.redFirstEvidence ?? '(none reported — treat the test as unproven)',
  ladder: ladder ? { green: ladder.green, ran: ladder.ran, failures: ladder.failures ?? [] } : null,
  summary: ladder?.summary ?? 'Verifier failed — the change is staged but unverified.',
}

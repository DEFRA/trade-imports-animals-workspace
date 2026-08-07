export const meta = {
  name: 'snag-triage',
  description:
    'Turn one-line snagging comments into a runnable backlog: investigate each snag across every repo, adversarially refute the diagnosis, raise a Jira subtask, cut its fix branch, then write backlog.json for increment-build-loop',
  whenToUse:
    'A snagging ticket has landed with a list of one-line complaints and none of them are specified well enough to build. Run this once per batch of new snags; it is idempotent, so re-running skips snags that already have a subtask.',
  phases: [
    { title: 'Load' },
    { title: 'Investigate' },
    { title: 'Refute' },
    { title: 'Ticket' },
    { title: 'Assemble' },
  ],
}

// ---------------------------------------------------------------------------
// Configuration. `args` plumbing is unreliable in this runtime, so FALLBACK is
// the real switch: edit it, or pass the same shape as args.
//
// `repos` is the SEARCH SET, not the answer — a snag is reported against a
// screen, and which repo owns the defect is a finding, not an input. A single
// snag routinely spans two (a frontend fix and the -tests spec that pins it).
// ---------------------------------------------------------------------------
const FALLBACK = {
  parent: 'EUDPA-315',
  repos: ['frontend', 'tests', 'backend'],
  workarea: 'frontend-snagging-eudpa315',
  base: 'main',
}
const CFG = typeof args === 'object' && args && args.parent ? { ...FALLBACK, ...args } : FALLBACK

const ABS = '/Users/samfarrington/git/defra/trade-imports-animals'
const TILDE = '~/git/defra/trade-imports-animals'
const WORKAREA = ABS + '/workareas/shared/' + CFG.workarea
const WORKAREA_TILDE = TILDE + '/workareas/shared/' + CFG.workarea
const SKILLS = ABS + '/.claude/skills'
const TOOLS_TILDE = TILDE + '/tools'

const REPO_NAME = {
  frontend: 'trade-imports-animals-frontend',
  backend: 'trade-imports-animals-backend',
  tests: 'trade-imports-animals-tests',
}
const REPO_PATH = {
  frontend: 'repos/trade-imports-animals-frontend',
  backend: 'repos/trade-imports-animals-backend',
  tests: 'repos/trade-imports-animals-tests',
}

const REPO_KEYS = CFG.repos.filter((r) => REPO_PATH[r])
const repoRoster = REPO_KEYS.map((r) => `  - \`${r}\` → ${REPO_NAME[r]}, at \`${TILDE}/${REPO_PATH[r]}\``).join('\n')

const GUARDRAILS = `
GUARD RAILS (mandatory, every step):
- NEVER use the Grep or Glob TOOLS — they are not allowlisted and will prompt the user. Use Bash \`grep -rn\` / \`find\` / \`ls\` / \`jq\`.
- Bash hygiene: ONE command per Bash call. No \`&&\`, no \`;\`, no \`|\`, no \`cd\`, no trailing \`echo $?\`. Use \`git -C\`, \`npm --prefix\`, \`mvn -f\`. Output redirection (\`> file 2>&1\`) IS allowed.
- In Bash ALWAYS use tilde paths \`${TILDE}/...\` — a literal /Users/... path in Bash is DENIED.
- For the Read/Write/Edit TOOLS use absolute paths \`${ABS}/...\`.
- The local build is driven by the \`tim\` CLI: \`tim workspace status\` for branch/dirty state across every repo,
  \`tim workspace branch <name>\` to put every repo on one branch, \`tim docker dev\` for the stack. Prefer it over
  hand-rolling the equivalent git/compose commands. \`tim <cmd> --json\` gives a stable envelope when you need to parse.
- Never bare \`node\` / \`node -e\` (denied — wrap in an npm script). NEVER run \`sonar\` (not allowlisted; it is a milestone gate the human runs).
- Tests go TO A FILE under \`${WORKAREA_TILDE}/logs/\` and you read that file ONCE. Never grep streaming output, never re-run a suite to see it again.
- For Playwright failures read \`test-results/*/error-context.md\`, do not grep the tail of the run.
- Rollback is ALWAYS \`git stash push -u\` — NEVER \`reset --hard\` or \`clean -fd\`.
- Headless: never ask a question. Decide, record the decision, keep going.
`

const SNAG_LIST_SCHEMA = {
  type: 'object',
  required: ['snags', 'summary'],
  properties: {
    snags: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'text'],
        properties: {
          id: { type: 'string', description: 'snag-001, snag-002, ... assigned in file order' },
          text: { type: 'string', description: 'The one-line snagging comment, verbatim' },
        },
        additionalProperties: false,
      },
    },
    alreadyTriaged: { type: 'array', items: { type: 'string' }, description: 'Snag texts skipped because backlog.json already has an increment for them' },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

const DIAGNOSIS_SCHEMA = {
  type: 'object',
  required: ['verdict', 'title', 'slug', 'repos', 'diagnosis', 'confidence', 'summary'],
  properties: {
    verdict: {
      type: 'string',
      enum: ['actionable', 'needs-decision', 'already-fixed', 'cannot-reproduce'],
      description: 'actionable = root cause found and the fix is mechanical; needs-decision = real but needs a design/product call; already-fixed = the code already does the right thing; cannot-reproduce = could not find anything matching the complaint',
    },
    title: { type: 'string', description: 'Imperative one-liner for the Jira subtask summary, max ~80 chars' },
    slug: { type: 'string', description: 'kebab-case, max 5 words, for the branch name' },
    repos: {
      type: 'array',
      items: { type: 'string', enum: ['frontend', 'tests', 'backend'] },
      description: 'Every repo the fix touches. A frontend defect whose regression test lives in the -tests suite is ["frontend","tests"], not ["frontend"].',
    },
    diagnosis: { type: 'string', description: 'What is actually wrong, citing repo and file:line. This is the evidence the refuter will attack.' },
    rootCauseFiles: { type: 'array', items: { type: 'string' }, description: 'Paths where the defect lives, each prefixed with its repo key, e.g. frontend:src/server/app/...' },
    filesToTouch: {
      type: 'array',
      items: {
        type: 'object',
        required: ['repo', 'path', 'action', 'what'],
        properties: {
          repo: { type: 'string', enum: ['frontend', 'tests', 'backend'] },
          path: { type: 'string', description: 'Repo-relative path' },
          action: { type: 'string', enum: ['create', 'edit', 'delete'] },
          what: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
    acceptanceCriteria: { type: 'array', items: { type: 'string' } },
    verification: { type: 'array', items: { type: 'string' }, description: 'Ordered ladder of concrete commands/checks the build loop runs' },
    specs: { type: 'array', items: { type: 'string' }, description: 'Test files to write or extend, repo-prefixed' },
    copyKeys: { type: 'array', items: { type: 'string' } },
    obligations: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
    gate: { type: 'string', description: 'Present ONLY for needs-decision: the exact question a human must answer' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

const REFUTATION_SCHEMA = {
  type: 'object',
  required: ['diagnosisHolds', 'reasoning'],
  properties: {
    diagnosisHolds: { type: 'boolean' },
    reasoning: { type: 'string', description: 'Evidence for or against, citing repo and file:line' },
    correctedVerdict: { type: 'string', enum: ['actionable', 'needs-decision', 'already-fixed', 'cannot-reproduce'] },
    correctedDiagnosis: { type: 'string', description: 'If the original diagnosis was wrong but you found the real cause, state it here' },
    missingRepos: { type: 'array', items: { type: 'string', enum: ['frontend', 'tests', 'backend'] }, description: 'Repos the fix must also touch that the investigator did not list' },
    missingFromLadder: { type: 'array', items: { type: 'string' }, description: 'Verification steps the investigator should have listed but did not' },
  },
  additionalProperties: false,
}

const TICKET_SCHEMA = {
  type: 'object',
  required: ['ok', 'summary'],
  properties: {
    ok: { type: 'boolean' },
    subtaskKey: { type: 'string', description: 'e.g. EUDPA-316' },
    branch: { type: 'string', description: 'e.g. fix/EUDPA-316-copy-as-new-broken' },
    branchedRepos: { type: 'array', items: { type: 'string' }, description: 'Repo keys where the branch was actually created' },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

const ASSEMBLE_SCHEMA = {
  type: 'object',
  required: ['ok', 'written', 'summary'],
  properties: {
    ok: { type: 'boolean' },
    written: { type: 'number', description: 'Total increments in backlog.json after the write' },
    runnable: { type: 'array', items: { type: 'string' }, description: 'Increment ids with status todo' },
    blocked: { type: 'array', items: { type: 'string' } },
    overlaps: { type: 'array', items: { type: 'string' }, description: 'Pairs of increments whose filesToTouch intersect' },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

// ---------------------------------------------------------------------------
// Load — the script has no filesystem access, so an agent reads the snag list
// and filters out anything already triaged. That filter is what makes a
// re-run safe: without it, every run raises a fresh set of Jira subtasks.
// ---------------------------------------------------------------------------
phase('Load')

const loaded = await agent(
  `You are the SNAG LOADER. Read the snag list and report it as structured data. You investigate NOTHING.
${GUARDRAILS}
TASK:
1. Read \`${WORKAREA}/snags.txt\` with the Read tool. Format: one snagging comment per line. Blank lines and
   lines starting with \`#\` are comments — ignore them. Do NOT reword, expand, summarise or fix the typos in a
   snag: the text is evidence and the investigator needs it verbatim.
2. Check whether a backlog already exists:
   \`ls ${WORKAREA_TILDE}/backlog.json\` — if it is absent, every snag is new; skip to step 4.
3. If it exists, read every existing snag text:
   \`jq -r '.increments[].snagText' ${WORKAREA_TILDE}/backlog.json\`
   Any line in snags.txt whose text EXACTLY matches one of those has already been triaged — put it in
   alreadyTriaged and leave it out of snags. Match on exact string equality only; do not judge similarity.
4. Number the remaining snags in file order as snag-001, snag-002, ... continuing from the highest id already in
   backlog.json (so ids are never reused). Return them in that order.
Return the structured output only.`,
  { label: 'load snags', phase: 'Load', schema: SNAG_LIST_SCHEMA }
)

if (!loaded || !loaded.snags || loaded.snags.length === 0) {
  return {
    ok: false,
    reason: loaded ? 'No new snags to triage.' : 'Loader agent failed.',
    detail: loaded?.summary ?? null,
    alreadyTriaged: loaded?.alreadyTriaged ?? [],
  }
}

log(`${loaded.snags.length} new snag(s) to triage${loaded.alreadyTriaged?.length ? `, ${loaded.alreadyTriaged.length} already done` : ''}`)

// ---------------------------------------------------------------------------
// Investigate → Refute → Ticket, pipelined per snag. No barrier between the
// stages: a snag that diagnoses fast gets its subtask while a harder one is
// still being read.
// ---------------------------------------------------------------------------
const triaged = await pipeline(
  loaded.snags,

  // --- Stage 1: investigate -------------------------------------------------
  (snag) =>
    agent(
      `You are the SNAG INVESTIGATOR for ${snag.id}. You are given a ONE-LINE complaint and nothing else. Your
job is to turn it into a specification precise enough that another agent can fix it without ever seeing the
original complaint. You do NOT fix anything and you do NOT edit any file in any repo.

THE SNAG, verbatim:
  "${snag.text}"

${GUARDRAILS}

WHERE TO LOOK — these repos are the SEARCH SET, all currently on \`${CFG.base}\`:
${repoRoster}
Which of them the defect lives in is something you work out, not something you are told. Do not assume the
frontend just because the complaint describes a screen: a broken date picker could be a frontend template, and
a failing accessibility check is usually a real frontend defect surfaced BY the -tests suite rather than a
defect in the suite. Follow the evidence into whichever repo holds it.

- The frontend application is \`src/server/app\`. READ ${SKILLS}/frontend-change/SKILL.md IN FULL before
  specifying any frontend change. It routes you to the repo's own recipe docs under
  \`src/server/app/sets/<set>/docs/add-a-*.md\` and to the obligation/flow maintenance guard rails. Your
  filesToTouch MUST match the recipe's touch-list for the kind of change you are proposing — a fix that skips a
  registration step the recipe lists is a fix that silently half-lands.
- For -tests work follow ${TILDE}/docs/best-practices/playwright/; for backend work
  ${TILDE}/docs/best-practices/java/.
- This snagging batch is against the frontend re-write that just landed (the EUDPA-288 model retrofit,
  commit 23f2fdb4 "Spike/eudpa 288 model retrofit"). If a snag reads like a regression, \`git -C\` log/show
  against that commit is the fastest way to see what changed underneath it.

HOW TO INVESTIGATE
1. Work out what the complaint is actually about — which page, component, field, journey step or copy string.
   A snag is written by someone looking at a screen, so translate their words into the repo's vocabulary.
2. Find the code. Confirm the defect exists by reading it. \`grep -rn\` and \`find\` are your tools.
3. Establish the root cause, not the symptom. If a hint is missing from a radio, the cause may be a missing
   copy key, or a macro not passing \`hint\`, or an obligation the page does not collect — those are three
   different fixes and only one of them is right.
4. Decide which repos the FIX touches and put them in \`repos\`. Be honest about the second one: a frontend
   defect that a Playwright or axe spec in the -tests repo should have caught is a two-repo fix, because the
   missing spec is part of the defect. Every path in filesToTouch carries its own \`repo\` key.
5. Decide the verdict HONESTLY:
   - **actionable** — you found the cause, you can name the files, and the fix needs no judgement call.
   - **needs-decision** — the defect is real but what "fixed" looks like is a design or product question
     (wording, which of two behaviours is correct, which dates a picker should actually allow, whether a
     component should be replaced outright). Set \`gate\` to the exact question. Do NOT invent an answer and
     mark it actionable — a snag that says something is "ugly" or "clunky" almost always needs a design call
     about what right looks like, and guessing produces churn.
   - **already-fixed** — the code already does what the snag asks. Cite the file:line that proves it.
   - **cannot-reproduce** — you could not find anything matching the complaint. Say what you searched.
   A wrong "actionable" is the expensive outcome: it sends an implementor to edit working code. When the
   evidence is thin, say so in \`confidence\` rather than dressing a guess as a diagnosis.
6. Write the specification. \`acceptanceCriteria\` must be observable behaviour, not implementation. The
   \`verification\` ladder must be real commands, in the order they should run, ending with the narrowest test
   that would have caught this snag — e.g.
   \`npm --prefix ${TILDE}/${REPO_PATH.frontend} test -- <path/to/spec>\` then the full unit suite. Include a
   Playwright leg ONLY if the defect is genuinely only observable in a browser; the stack comes up with
   \`tim docker dev\`, and journey E2E specs on a fresh stack are known-flaky with transient 500s that recover
   on retry.
7. \`specs\` lists the test file(s) that must be written or extended so this snag cannot come back, each
   repo-prefixed. Every actionable snag gets at least one. A fix with no test is not a fix.

Keep \`slug\` short and kebab-case — it becomes a git branch name shared across every repo the fix touches.
Return the structured output only.`,
      { label: `${snag.id} investigate`, phase: 'Investigate', schema: DIAGNOSIS_SCHEMA }
    ),

  // --- Stage 2: refute ------------------------------------------------------
  async (diag, snag) => {
    if (!diag) return null

    const refutation = await agent(
      `You are the ADVERSARIAL REFUTER for ${snag.id}. An investigator has diagnosed a one-line snag. Your job
is to REFUTE that diagnosis. Default to holding it only when you genuinely cannot break it — a wrong diagnosis
that survives sends an implementor to edit working code, which costs far more than a second look.

THE ORIGINAL SNAG, verbatim:
  "${snag.text}"

THE INVESTIGATOR'S VERDICT: ${diag.verdict} (confidence: ${diag.confidence})
PROPOSED TITLE: ${diag.title}
REPOS THE FIX TOUCHES: ${(diag.repos ?? []).join(', ') || '(none given)'}
THE DIAGNOSIS:
${diag.diagnosis}
ROOT-CAUSE FILES: ${(diag.rootCauseFiles ?? []).join(', ') || '(none given)'}
PROPOSED CHANGES:
${(diag.filesToTouch ?? []).map((f) => `  - [${f.action}] ${f.repo}:${f.path} — ${f.what}`).join('\n') || '  (none given)'}
PROPOSED VERIFICATION LADDER:
${(diag.verification ?? []).map((v, i) => `  ${i + 1}. ${v}`).join('\n') || '  (none given)'}

${GUARDRAILS}

REPOS AVAILABLE TO YOU:
${repoRoster}

ATTACK IT ON FIVE FRONTS — read the ACTUAL code, do not reason from the summary:
1. **Does the defect exist?** Read the cited file:line. If the code already behaves correctly, the verdict
   should be already-fixed. If you cannot find the thing the snag describes at all, cannot-reproduce.
2. **Is this the root cause or a symptom?** Look one level up and one level down from the cited code. A fix
   applied at the wrong level leaves the bug reachable by another path.
3. **Does the diagnosis actually match the snag's words?** The investigator may have found *a* defect that is
   not *the* defect the reporter meant. Re-read the one-liner against the diagnosis.
4. **Is the repo list complete?** This is the easiest thing to get wrong. If the fix changes rendered output
   that a -tests spec asserts on, the -tests repo is in scope too; if a spec in -tests is failing, the fix may
   belong in the frontend rather than the spec. List anything missing in missingRepos.
5. **Is the ladder honest?** A verification step that cannot fail does not verify anything. If the ladder
   would pass on the UNFIXED code, list what is missing in missingFromLadder.

Also challenge the verdict itself: an \`actionable\` that quietly picks one of two defensible behaviours is
really \`needs-decision\`, and should be corrected to it. Aesthetic complaints ("ugly", "clunky", "off") are
the usual offenders — if the investigator has invented a target design rather than found one in the repo or in
a cited Figma reference, that is a needs-decision dressed as a fix.

If you break the diagnosis, set diagnosisHolds:false and give correctedVerdict; add correctedDiagnosis if you
found the real cause. Cite repo and file:line in your reasoning either way.
Return the structured output only.`,
      { label: `${snag.id} refute`, phase: 'Refute', schema: REFUTATION_SCHEMA }
    )

    // A dead refuter must not silently promote a diagnosis to verified.
    if (!refutation) {
      return { snag, diag, repos: diag.repos ?? [], verdict: diag.verdict, refuted: false, refuterFailed: true, reasoning: 'REFUTER FAILED — diagnosis unchallenged, treat with caution' }
    }

    const verdict = refutation.diagnosisHolds ? diag.verdict : refutation.correctedVerdict ?? 'needs-decision'
    const repos = [...new Set([...(diag.repos ?? []), ...(refutation.missingRepos ?? [])])]

    return {
      snag,
      diag,
      repos,
      verdict,
      refuted: !refutation.diagnosisHolds,
      reasoning: refutation.reasoning,
      correctedDiagnosis: refutation.correctedDiagnosis ?? null,
      missingFromLadder: refutation.missingFromLadder ?? [],
    }
  },

  // --- Stage 3: Jira subtask + fix branch -----------------------------------
  async (checked, snag) => {
    if (!checked) return null

    // Nothing to build and nothing to decide — no subtask, no branch. These
    // still reach the backlog as a record of what was looked at and ruled out.
    if (checked.verdict === 'already-fixed' || checked.verdict === 'cannot-reproduce') {
      log(`${snag.id}: ${checked.verdict} — no subtask raised`)
      return { ...checked, subtaskKey: null, branch: null }
    }

    const targetRepos = checked.repos.length > 0 ? checked.repos : ['frontend']

    const ticket = await agent(
      `You are the TICKETER for ${snag.id}. Raise ONE Jira subtask and cut its branch in every repo the fix
touches. You write no code.
${GUARDRAILS}

THE SNAG, verbatim: "${snag.text}"
VERDICT: ${checked.verdict}
TITLE TO USE: ${checked.diag.title}
SLUG TO USE: ${checked.diag.slug}
REPOS THE FIX TOUCHES: ${targetRepos.join(', ')}

STEP 1 — write the description to a file FIRST. A wiki-markup description is long and multi-line, and
inlining it as a shell argument is how quoting bugs get into Jira. Use the Write tool (it creates parent
directories) to write \`${WORKAREA}/tickets/${snag.id}-description.txt\`.

Write it as Jira WIKI MARKUP, never markdown (h2. for headings, {{monospace}}, * for bullets — escape any
square brackets). It must contain, in this order:
  h2. Snag as reported
  the one-line complaint, verbatim
  h2. Diagnosis
  ${checked.refuted ? 'the CORRECTED diagnosis below' : 'the diagnosis below'}, with the file:line citations kept
  h2. Fix
  the files to touch and what changes in each, grouped by repo
  h2. Acceptance criteria
  one bullet per criterion
${checked.verdict === 'needs-decision' ? `  h2. Decision needed\n  ${checked.diag.gate ?? 'a design or product call is required before this can be built'}\n` : ''}
Keep it factual. Do not add estimates, do not add status commentary, and do not mark anything DONE — the
description records findings, the acceptance criteria stay forward-looking.

DIAGNOSIS TEXT:
${checked.correctedDiagnosis ?? checked.diag.diagnosis}
FILES:
${(checked.diag.filesToTouch ?? []).map((f) => `  - [${f.action}] ${f.repo}:${f.path} — ${f.what}`).join('\n') || '  (none)'}
ACCEPTANCE CRITERIA:
${(checked.diag.acceptanceCriteria ?? []).map((a) => `  - ${a}`).join('\n') || '  (none)'}

STEP 2 — raise the subtask under ${CFG.parent}. Run exactly this one command, substituting the file in:
\`${TOOLS_TILDE}/jira/add-subtask.sh ${CFG.parent} -a "${checked.diag.title.replace(/"/g, "'")}" "$(cat ${WORKAREA_TILDE}/tickets/${snag.id}-description.txt)"\`
The script prints \`EUDPA-XXX - <summary>\` on success. Read the key off that line. If it prints an error
instead, STOP and report ok:false — do not retry, and do not invent a key.

STEP 3 — cut the branch (skip this entirely if step 2 failed). Run the helper ONCE PER REPO, one Bash call
each, passing the SAME ticket, slug and prefix every time:
${targetRepos.map((r) => `\`${TOOLS_TILDE}/ticket/setup-branch.sh <THE-KEY-FROM-STEP-2> --repo ${REPO_NAME[r]} --slug ${checked.diag.slug} --prefix fix --base ${CFG.base} --json\``).join('\n')}
The branch NAME must be byte-identical in every repo. That is a hard workspace rule, not a tidiness
preference: the stack's \`--branch\` flag probes each repo for a matching branch-tagged image and falls back to
\`:latest\` per service, so a mismatched name silently breaks the linked-branch pickup. Passing the same
ticket/slug/prefix to the helper is what guarantees it — do not hand-roll \`git checkout -b\`, and do not let
the slug drift between repos.
The helper is idempotent and handles the already-pushed case. It leaves each repo ON the new branch, which is
expected — the build loop puts them there again per increment with \`tim workspace branch\`.
Read \`branch\` out of the JSON output and report it, plus which repos you branched.

Report the subtask key and the branch name exactly as the tools gave them to you.
Return the structured output only.`,
      { label: `${snag.id} ticket`, phase: 'Ticket', schema: TICKET_SCHEMA }
    )

    if (!ticket || !ticket.ok) {
      log(`${snag.id}: TICKETING FAILED — ${ticket?.summary ?? 'agent failed'}`)
      return { ...checked, subtaskKey: null, branch: null, ticketError: ticket?.summary ?? 'agent failed' }
    }

    log(`${snag.id}: ${ticket.subtaskKey} on ${ticket.branch} (${targetRepos.join('+')})`)
    return { ...checked, repos: targetRepos, subtaskKey: ticket.subtaskKey, branch: ticket.branch, branchedRepos: ticket.branchedRepos ?? targetRepos }
  }
)

const done = triaged.filter(Boolean)

if (done.length === 0) {
  return { ok: false, reason: 'Every snag failed investigation.', triaged: loaded.snags.length }
}

// ---------------------------------------------------------------------------
// Assemble — one writer, because concurrent edits to a single JSON file race.
// ---------------------------------------------------------------------------
phase('Assemble')

const increments = done.map((r) => ({
  id: r.snag.id,
  snagText: r.snag.text,
  title: r.diag.title,
  repos: r.repos,
  parent: CFG.parent,
  subtask: r.subtaskKey,
  branch: r.branch,
  base: CFG.base,
  status: r.verdict === 'actionable' ? 'todo' : 'blocked',
  verdict: r.verdict,
  confidence: r.diag.confidence,
  refuted: r.refuted,
  refuterFailed: r.refuterFailed ?? false,
  diagnosis: r.correctedDiagnosis ?? r.diag.diagnosis,
  refutation: r.reasoning,
  rootCauseFiles: r.diag.rootCauseFiles ?? [],
  filesToTouch: r.diag.filesToTouch ?? [],
  obligations: r.diag.obligations ?? [],
  copyKeys: r.diag.copyKeys ?? [],
  specs: r.diag.specs ?? [],
  acceptanceCriteria: r.diag.acceptanceCriteria ?? [],
  verification: [...(r.diag.verification ?? []), ...(r.missingFromLadder ?? [])],
  gate: r.verdict === 'needs-decision' ? r.diag.gate ?? 'Design decision required — see the subtask.' : null,
  notes: r.diag.summary,
  openQuestions: r.diag.openQuestions ?? [],
  dependsOn: [],
  commit: null,
  failure_reason: null,
  ticketError: r.ticketError ?? null,
}))

const assembled = await agent(
  `You are the BACKLOG WRITER. Write the triaged snags into backlog.json. You investigate nothing and you
change no verdict — the analysis is finished, you are persisting it.
${GUARDRAILS}

TASK:
1. If \`${WORKAREA_TILDE}/backlog.json\` exists, Read it first and PRESERVE every increment already in it —
   especially any with status "done" and a commit SHA. You are appending, never replacing.
   If it does not exist, create it with this envelope:
   {"schema_version": 1, "programme": "${CFG.workarea}", "parent": "${CFG.parent}", "increments": []}
2. Append the increments in the JSON below, in the order given, to the \`increments\` array. Write them
   VERBATIM — do not reword a diagnosis, do not re-order a verification ladder, do not drop a null field.
3. Then compute \`conflictsWith\` for each NEW increment: the ids of any other increment in the file that
   touches the same repo AND the same path in \`filesToTouch\`. Each fix lands on its own branch off
   ${CFG.base}, so two increments touching one file will conflict when they merge — recording it now is what
   makes that visible before both are built. Add the field to every new increment (empty array when there is
   no overlap).
4. Validate: \`jq empty ${WORKAREA_TILDE}/backlog.json\`. If it errors, fix the file and re-check.
5. Report the counts by reading the file back:
   \`jq -r '.increments[] | .id + " " + .status' ${WORKAREA_TILDE}/backlog.json\`

THE INCREMENTS TO APPEND:
${JSON.stringify(increments, null, 2)}

Return the structured output only.`,
  { label: 'write backlog', phase: 'Assemble', schema: ASSEMBLE_SCHEMA }
)

const byVerdict = (v) => done.filter((r) => r.verdict === v).map((r) => r.snag.id)

return {
  ok: Boolean(assembled?.ok),
  parent: CFG.parent,
  backlog: WORKAREA + '/backlog.json',
  triaged: done.length,
  actionable: byVerdict('actionable'),
  needsDecision: byVerdict('needs-decision'),
  alreadyFixed: byVerdict('already-fixed'),
  cannotReproduce: byVerdict('cannot-reproduce'),
  refutedDiagnoses: done.filter((r) => r.refuted).map((r) => `${r.snag.id}: ${r.reasoning}`),
  refuterFailures: done.filter((r) => r.refuterFailed).map((r) => r.snag.id),
  ticketErrors: done.filter((r) => r.ticketError).map((r) => `${r.snag.id}: ${r.ticketError}`),
  subtasks: done.filter((r) => r.subtaskKey).map((r) => `${r.snag.id} → ${r.subtaskKey} → ${r.branch} [${r.repos.join('+')}]`),
  overlaps: assembled?.overlaps ?? [],
  runnable: assembled?.runnable ?? [],
  summary: assembled?.summary ?? 'Backlog write failed — the triage results above are not persisted.',
}

export const meta = {
  name: 'increment-build-loop',
  description:
    'Build plant-products increments one at a time: implement → style review + code review → adversarially verify findings → judge → fix → verification ladder → commit or roll back',
  whenToUse:
    'Running the plant-products/CHED-PP backlog. One invocation builds one increment (or a serial list) with a full multi-agent quality pass per increment. Set INCREMENTS below or pass args.',
  phases: [
    { title: 'Baseline' },
    { title: 'Implement' },
    { title: 'Review' },
    { title: 'Verify findings' },
    { title: 'Judge' },
    { title: 'Fix' },
    { title: 'Ladder' },
    { title: 'Land' },
  ],
}

// ---------------------------------------------------------------------------
// Configuration. `args` plumbing is unreliable in this runtime, so FALLBACK is
// the real switch: edit it, or pass { increments: [...] } as args.
// ---------------------------------------------------------------------------
// `workarea` and `scope` select the programme. This branch points at the EUDPA-315
// snagging backlog; plant-products is the other caller and runs with
// { workarea: 'plant-products-ched-pp', scope: 'plant-products', increments: ['pp-0NN'] }.
// Because args cannot be relied on, the fallback must name the programme you
// actually want — a stale one here sends the loop at a backlog that may not exist.
const FALLBACK = { workarea: 'frontend-snagging-eudpa315', scope: 'snagging', increments: ['snag-008'] }
const CFG = typeof args === 'object' && args && args.increments ? { ...FALLBACK, ...args } : FALLBACK

const ABS = '/Users/samfarrington/git/defra/trade-imports-animals'
const TILDE = '~/git/defra/trade-imports-animals'
const WORKAREA = ABS + '/workareas/shared/' + CFG.workarea
const WORKAREA_TILDE = TILDE + '/workareas/shared/' + CFG.workarea
const SKILLS = ABS + '/.claude/skills'

const REPO_PATH = {
  frontend: 'repos/trade-imports-animals-frontend',
  backend: 'repos/trade-imports-animals-backend',
  tests: 'repos/trade-imports-animals-tests'
}

const GUARDRAILS = `
GUARD RAILS (mandatory, every step):
- NEVER use the Grep or Glob TOOLS — they are not allowlisted and will prompt the user. Use Bash \`grep -rn\` / \`find\` / \`ls\` / \`jq\`.
- Bash hygiene: ONE command per Bash call. No \`&&\`, no \`;\`, no \`|\`, no \`cd\`, no trailing \`echo $?\`. Use \`git -C\`, \`npm --prefix\`, \`mvn -f\`. Output redirection (\`> file 2>&1\`) IS allowed.
- In Bash ALWAYS use tilde paths \`${TILDE}/...\` — a literal /Users/... path in Bash is DENIED.
- For the Read/Write/Edit TOOLS use absolute paths \`${ABS}/...\`.
- Changed-file paths in this loop are REPO-QUALIFIED as \`repo:path\`, e.g. \`frontend:src/server/app/x.js\`,
  because one increment can span two repos. Split on the FIRST colon: the key selects the repo
  (frontend=${REPO_PATH.frontend}, backend=${REPO_PATH.backend}, tests=${REPO_PATH.tests}) and the remainder is
  the repo-relative path to hand to \`git -C\` or Read. A path with no \`repo:\` prefix belongs to the
  increment's first repo.
- The local build is driven by the \`tim\` CLI: \`tim workspace status\` for branch and dirty state across every
  repo at once, \`tim workspace branch <name>\` to put every repo on one branch, \`tim docker dev\` for the
  stack. Prefer it over hand-rolling the equivalent git or compose commands.
- Never bare \`node\` / \`node -e\` (denied — wrap in an npm script). NEVER run \`sonar\` (not allowlisted; it is a milestone gate the human runs).
- Tests go TO A FILE under \`${WORKAREA_TILDE}/logs/\` and you read that file ONCE. Never grep streaming output, never re-run a suite to see it again.
- For Playwright failures read \`test-results/*/error-context.md\`, do not grep the tail of the run.
- Rollback is ALWAYS \`git stash push -u\` — NEVER \`reset --hard\` or \`clean -fd\`.
- Headless: never ask a question. Decide, record the decision, keep going.
`

const incrementSchema = {
  type: 'object',
  required: ['ok', 'summary'],
  properties: {
    ok: { type: 'boolean' },
    summary: { type: 'string' },
    changedFiles: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' }
  },
  additionalProperties: false
}

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'severity', 'what', 'why', 'fix'],
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] },
          category: { type: 'string' },
          what: { type: 'string', description: 'The defect, one sentence' },
          why: { type: 'string', description: 'Concrete failure scenario or rule broken' },
          fix: { type: 'string', description: 'The specific change to make' }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      description: 'One entry per finding you were given, same numbering. Omit none.',
      items: {
        type: 'object',
        required: ['n', 'real', 'reasoning'],
        properties: {
          n: { type: 'number', description: 'The finding number exactly as numbered in the list you were given' },
          real: { type: 'boolean' },
          reasoning: { type: 'string', description: 'Evidence for or against, citing file:line' }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
}

const JUDGEMENT_SCHEMA = {
  type: 'object',
  required: ['decisions', 'fixNow', 'summary'],
  properties: {
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['what', 'call', 'reasoning'],
        properties: {
          what: { type: 'string' },
          call: { type: 'string', enum: ['fix-now', 'defer-to-open-question', 'reject'] },
          reasoning: { type: 'string' }
        },
        additionalProperties: false
      }
    },
    fixNow: { type: 'array', items: { type: 'string' }, description: 'Full fix instructions for the fixer, one per item' },
    summary: { type: 'string' }
  },
  additionalProperties: false
}

const LADDER_SCHEMA = {
  type: 'object',
  required: ['green', 'ran', 'summary'],
  properties: {
    green: { type: 'boolean' },
    ran: { type: 'array', items: { type: 'string' } },
    failures: { type: 'array', items: { type: 'string' } },
    repairsAttempted: { type: 'number' },
    summary: { type: 'string' }
  },
  additionalProperties: false
}

const LAND_SCHEMA = {
  type: 'object',
  required: ['landed', 'summary'],
  properties: {
    landed: { type: 'boolean' },
    commit: { type: 'string' },
    commits: { type: 'array', items: { type: 'string' }, description: 'One `repo:shortSha` per repo committed — a cross-repo increment lands more than one' },
    summary: { type: 'string' }
  },
  additionalProperties: false
}

const readIncrement = (id) => `
THE INCREMENT — read it in full before anything else:
Run this Bash command and read the output: \`jq '.increments[] | select(.id=="${id}")' ${WORKAREA_TILDE}/backlog.json\`
That object is your complete specification: filesToTouch (paths + action + what), obligations, flowChanges,
schemaFields, copyKeys, specs, acceptanceCriteria, verification (the ladder, in order), notes, openQuestions.
If it carries \`ladderGaps\`, those are known weaknesses in the ladder written as prose, not as steps — they are
context for judging whether a green run means anything, and must never be executed as commands.
It is self-contained BY DESIGN — if you find yourself needing information that is not in it, that is a defect
worth reporting in your summary, not a reason to improvise.
Supporting context, read what your increment cites: ${WORKAREA}/frontend-plan/SIBLING-SET-PLAN.md (cited by
heading), ${WORKAREA}/backend-schema/SCHEMA-DESIGN.md, ${WORKAREA}/recon/recipe-cheatsheet.md.
`

const results = []

for (const id of CFG.increments) {
  // -----------------------------------------------------------------------
  // Baseline — never build on a red tree.
  // -----------------------------------------------------------------------
  phase('Baseline')

  const baseline = await agent(
    `You are the BASELINE GUARD for increment ${id}. Establish that the tree is green BEFORE any edit, so a
failure later in this increment is unambiguously ours.
${GUARDRAILS}
${readIncrement(id)}
TASK:
1. Read the increment's repo list:
   \`jq -r '.increments[] | select(.id=="${id}") | (.repos // [.repo])[]' ${WORKAREA_TILDE}/backlog.json\`
   EVERY step below applies to EVERY repo it names. One increment can span two — a frontend defect whose
   regression spec lives in the -tests suite is a single increment, on a single branch, in two repos.
   Repo keys map to paths: frontend=${REPO_PATH.frontend}, backend=${REPO_PATH.backend}, tests=${REPO_PATH.tests}.
2. Confirm every one of those repos is clean. \`tim workspace status\` reports branch and dirty state for all
   of them in one call. If ANY repo in the increment's list is dirty, stop and report ok:false — an unclean
   tree makes commit-or-rollback unsafe.
3. Get the increment's branch:
   \`jq -r '.increments[] | select(.id=="${id}") | .branch' ${WORKAREA_TILDE}/backlog.json\`
   - If it prints a BRANCH NAME, put every repo on it with ONE command: \`tim workspace branch <branch>\`.
     Repos that do not carry that branch move to their own default branch, which is exactly right for the ones
     this increment does not touch. Increments in this shape each land on their own branch off their own base,
     so without this the loop would build increment N on top of increment N-1's unmerged work.
     Then re-run \`tim workspace status\` and CONFIRM each repo in the increment's list actually sits on that
     branch. If one does not, the triage step never cut it there — report ok:false rather than building on the
     wrong branch, which is worse than not building at all.
   - If it prints \`null\` or the field is absent, this is a single-branch programme: confirm the repo is on
     \`spike/trace-to-requirements\` instead. For the TESTS repo that branch may not exist yet (it is on
     spike/EUDPA-288-model-retrofit); if your increment is the one that creates it, that is expected — say so
     and pass.
4. Run the FASTEST meaningful suite for EACH repo in the list, to its own log, and read each log once:
   frontend: \`npm --prefix ${TILDE}/${REPO_PATH.frontend} test > ${WORKAREA_TILDE}/logs/${id}-baseline-frontend.log 2>&1\`
   backend:  \`mvn -q -f ${TILDE}/${REPO_PATH.backend}/pom.xml test > ${WORKAREA_TILDE}/logs/${id}-baseline-backend.log 2>&1\`
   tests:    read package.json and run its unit/lint script if one exists; if the suite needs a running stack, SKIP it and say so.
5. Report ok:true only if EVERY repo in the list is clean, on the right branch, and green.
Return the structured output only.`,
    { label: `${id} baseline`, phase: 'Baseline', schema: incrementSchema }
  )

  if (!baseline || !baseline.ok) {
    log(`${id}: BASELINE RED — skipping. ${baseline ? baseline.summary : 'agent failed'}`)
    results.push({ id, outcome: 'baseline-red', detail: baseline?.summary ?? 'agent failed' })
    continue
  }

  // -----------------------------------------------------------------------
  // Implement — the frontend-change skill is the script for frontend work.
  // -----------------------------------------------------------------------
  phase('Implement')

  const impl = await agent(
    `You are the IMPLEMENTOR for increment ${id}. You make the change and nothing else — you do not review it,
and you do not commit it.
${GUARDRAILS}
${readIncrement(id)}

HOW TO BUILD IT — route on EACH entry in the increment's "repos" list. An increment can span two repos, and a
half-applied cross-repo fix is worse than none: if the frontend change lands without the -tests spec that pins
it, nothing stops the snag coming straight back. Do every repo the increment names.
- **frontend** → the workspace frontend-change skill is your script. READ ${SKILLS}/frontend-change/SKILL.md IN
  FULL and follow it verbatim. It routes you to the repo's own recipe under
  \`src/server/app/sets/<set>/docs/add-a-*.md\` (or the obligation/flow maintenance guard rails) — read that recipe
  and follow it, varying as little as possible. Do NOT improvise around a recipe. Note this increment may target
  \`sets/plant-products/\` rather than live-animals; the recipes are set-relative, so substitute the set folder and
  otherwise follow them exactly. Where the increment cites a gap (no recipe covers this — G-A..G-K), the increment's
  own filesToTouch IS the script, and the named live-animals exemplar is the shape to imitate.
- **backend** → follow the increment plus the workspace Java best practices
  (${TILDE}/docs/best-practices/java/). Mirror the existing animals package idiom exactly. Compact-constructor null
  guards on public records at API boundaries. One round-trip + one unknown-value negative per enum — never a test
  per enum constant.
- **tests** → follow the increment plus ${TILDE}/docs/best-practices/playwright/. Independent tests, raw
  role/label locators, no page objects where the repo does not already use them, no sleeps, expect.poll only for
  non-locator state.

RULES:
- Implement EXACTLY the increment's scope. Do not fix adjacent things you notice — report them in notes instead;
  a later increment or the judge will deal with them.
- Every user-facing string goes in copy.en.js AND copy.cy.js with identical structure. NO display logic in
  obligations or the model.
- Write the specs the increment lists (co-located Playwright spec, axe test) — they are part of the increment,
  not optional extras.
- STAGE your work (\`git -C ... add\`) but DO NOT COMMIT. Landing is a later step that runs after review.
- If you get stuck on a red step, you get at most 3 self-repair attempts. If still red, stop and report ok:false
  with exactly what is red and what you tried — do NOT thrash, and do NOT weaken a test to make it pass.

Return ok, a summary, changedFiles (each prefixed with its repo key — \`frontend:src/server/app/...\`,
\`tests:test/...\` — so the reviewers know which repo to diff), and notes (anything the reviewers
or the judge should know, including anything the increment got wrong).`,
    { label: `${id} implement`, phase: 'Implement', schema: incrementSchema }
  )

  if (!impl || !impl.ok) {
    log(`${id}: IMPLEMENT FAILED — rolling back. ${impl ? impl.summary : 'agent failed'}`)
    await agent(
      `Roll back the failed increment ${id} NON-DESTRUCTIVELY.
${GUARDRAILS}
Look up EVERY repo the increment touches —
\`jq -r '.increments[] | select(.id=="${id}") | (.repos // [.repo])[]' ${WORKAREA_TILDE}/backlog.json\` — and run
\`git -C ${TILDE}/<repoPath> stash push -u -m "failed-${id}"\` in each one, one Bash call per repo. A cross-repo
increment that is only half rolled back leaves the other repo dirty, and the next increment's baseline guard
will refuse to start. NEVER \`reset --hard\`, NEVER \`clean -fd\` — the stash
is recoverable and that is the point. Confirm with \`tim workspace status\` that every tree is clean, and report
the stash ref so a human can recover the work.
Return the structured output only.`,
      { label: `${id} rollback`, phase: 'Implement', schema: incrementSchema }
    )
    results.push({ id, outcome: 'implement-failed', detail: impl?.summary ?? 'agent failed' })
    continue
  }

  const files = (impl.changedFiles ?? []).filter((f) => !f.endsWith('.log'))
  log(`${id}: implemented, ${files.length} files changed — reviewing`)

  // -----------------------------------------------------------------------
  // Review — style and correctness, per file, in parallel, plus consistency.
  // -----------------------------------------------------------------------
  phase('Review')

  const reviewTargets = files.length > 0 ? files : ['(no files reported — review the staged diff)']

  const styleReviews = reviewTargets.map((file) => () =>
    agent(
      `You are a STYLE REVIEWER for increment ${id}, reviewing ONE file: ${file}
${GUARDRAILS}
YOUR PERSONA — read ${SKILLS}/code-style/references/STYLE_FILE_REVIEWER.md IN FULL and follow it. It defines what
you look for and the bundle to judge against. Also read ${SKILLS}/code-style/SKILL.md for the language routing
(Java → modern-java + Javadoc; GDS/Nunjucks → components/styles/patterns; Playwright → playwright; Node → the
17-rule style guide + JSDoc).
CONTEXT: the increment is at \`jq '.increments[] | select(.id=="${id}")' ${WORKAREA_TILDE}/backlog.json\`.
See the change with \`git -C ${TILDE}/<repoPath> diff --staged -- <file>\`.
SCOPE: style only — formatting, naming, conventions, idiom, comment discipline, copy structure. Correctness and
security belong to a different reviewer; do not duplicate them.
HOUSE RULES that override generic style advice: comments are removed aggressively (code near-bare; rationale lives
in docs/, not in the file); no migration/rename comments — git history is the source of truth; pipelines get named
helper functions rather than dense inline callbacks; names say what a thing does, never the benefit it brings.
Report ONLY real findings, each with a concrete fix. No praise, no summary of what the file does. If the file is
clean, return an empty findings array.
Return the structured output only.`,
      { label: `${id} style:${file.split('/').pop()}`, phase: 'Review', schema: FINDINGS_SCHEMA }
    )
  )

  const codeReviews = reviewTargets.map((file) => () =>
    agent(
      `You are a CODE REVIEWER for increment ${id}, reviewing ONE file: ${file}
${GUARDRAILS}
YOUR PERSONA — read ${SKILLS}/review/references/FILE_REVIEWER.md IN FULL and follow it. Also read
${SKILLS}/review/SKILL.md for the review dimensions.
CONTEXT: the increment is at \`jq '.increments[] | select(.id=="${id}")' ${WORKAREA_TILDE}/backlog.json\` — its
acceptanceCriteria are what this code is supposed to do. See the change with
\`git -C ${TILDE}/<repoPath> diff --staged -- <file>\`.
SCOPE: correctness, security, error handling, performance, and TEST QUALITY. Specifically hunt for:
- behaviour that does not match the increment's acceptanceCriteria
- tests that assert implementation rather than behaviour (toHaveBeenCalledWith on a collaborator is the tell);
  mocks at the module boundary rather than the network boundary
- tests whose name claims something their assertions do not pin (coverage padding — those should be deleted)
- missing negative/edge cases the acceptance criteria imply
- for this programme specifically: route-shape vs link-builder confusion (route tables must use the PREFIX-FREE
  builders; rendered links/redirects/form actions must use the PREFIX-BEARING ones), display logic leaking into
  obligations or the model, and any L2 file that has learned a set's vocabulary.
Report ONLY real findings with a concrete failure scenario. Style nits belong to a different reviewer — skip them.
Return the structured output only.`,
      { label: `${id} review:${file.split('/').pop()}`, phase: 'Review', schema: FINDINGS_SCHEMA }
    )
  )

  const consistencyReview = () =>
    agent(
      `You are the CONSISTENCY REVIEWER for increment ${id} — you look ACROSS the whole change, not at one file.
${GUARDRAILS}
YOUR PERSONA — read ${SKILLS}/review/references/CONSISTENCY_REVIEWER.md IN FULL and follow it.
CONTEXT: increment at \`jq '.increments[] | select(.id=="${id}")' ${WORKAREA_TILDE}/backlog.json\`; whole change via
\`git -C ${TILDE}/<repoPath> diff --staged\`.
LOOK FOR: the same concept named two ways across files; a pattern the repo already has, reimplemented instead of
reused (check the named exemplar the increment cites and compare); registration that exists in one place but not
its twin (a page in dispatch but not in the contract table, a feature in features/index.js but not evaluation.js,
copy.en.js without the matching copy.cy.js key); an obligation with no schema field behind it or a schema field
nothing writes; and anything the increment's filesToTouch listed that is NOT in the diff, or in the diff but NOT
listed.
Return the structured output only.`,
      { label: `${id} consistency`, phase: 'Review', schema: FINDINGS_SCHEMA }
    )

  const reviewResults = await parallel([...styleReviews, ...codeReviews, consistencyReview])
  const rawFindings = reviewResults.filter(Boolean).flatMap((r) => r.findings ?? [])
  log(`${id}: ${rawFindings.length} raw findings — verifying adversarially`)

  // -----------------------------------------------------------------------
  // Verify findings — refute before acting, so churn is never driven by a
  // plausible-but-wrong review comment.
  // -----------------------------------------------------------------------
  let confirmed = []
  if (rawFindings.length > 0) {
    phase('Verify findings')
    // Grouped BY FILE: every finding still gets refuted independently, but the
    // file, the diff and the increment are read once per file instead of once
    // per finding — that redundancy was the loop's dominant cost.
    const byFile = new Map()
    rawFindings.forEach((f, i) => {
      const key = f.file || '(whole change)'
      if (!byFile.has(key)) byFile.set(key, [])
      byFile.get(key).push({ ...f, n: i + 1 })
    })

    const verdicts = await parallel(
      [...byFile.entries()].map(([file, items]) => () =>
        agent(
          `You are an ADVERSARIAL VERIFIER for increment ${id}. You are given ${items.length} finding(s) against ONE
file: ${file}. Your job is to REFUTE each of them. Default to refuted unless the evidence is clear — a wrong
finding that survives costs more than a real one that is missed, because it drives a pointless edit to working code.
${GUARDRAILS}
Judge each finding INDEPENDENTLY and on its own evidence. They do not stand or fall together, and the number of
them tells you nothing about whether any one is real.

THE FINDINGS:
${items
  .map(
    (f) =>
      `${f.n}. [${f.severity}] ${f.file}${f.line ? ' line ' + f.line : ''}\n   WHAT: ${f.what}\n   WHY: ${f.why}\n   PROPOSED FIX: ${f.fix}`
  )
  .join('\n')}

CHECK THEM against the ACTUAL code (\`git -C ${TILDE}/<repoPath> diff --staged -- ${file}\`, and Read the file in
full — the diff alone can mislead), against the increment's acceptanceCriteria
(\`jq '.increments[] | select(.id=="${id}")' ${WORKAREA_TILDE}/backlog.json\`), and against the house conventions the
repo actually follows (find a comparable file and compare — "unconventional" is only a finding if the convention
really exists here). Read those sources ONCE and reuse them across all ${items.length} findings.
For each: real:false if it is wrong, already handled elsewhere, out of the increment's scope, or a matter of taste
dressed as a defect. real:true ONLY if you could not refute it. Cite file:line in every reasoning.
Return one verdict per finding, using the SAME numbers as above. Return the structured output only.`,
          { label: `${id} verify:${file.split('/').pop()}`, phase: 'Verify findings', schema: VERDICT_SCHEMA }
        ).then((v) => {
          // A dead verifier must not silently delete findings — pass them to the
          // judge marked unrefuted rather than dropping them on the floor.
          if (!v) return items.map((f) => ({ ...f, verdict: 'VERIFIER FAILED — unrefuted, treat with caution' }))
          const byN = new Map((v.verdicts ?? []).map((x) => [x.n, x]))
          return items.map((f) => {
            const verdict = byN.get(f.n)
            if (!verdict) return { ...f, verdict: 'NO VERDICT RETURNED — unrefuted, treat with caution' }
            return verdict.real ? { ...f, verdict: verdict.reasoning } : null
          })
        })
      )
    )
    confirmed = verdicts.filter(Boolean).flat().filter(Boolean)
    log(`${id}: ${confirmed.length}/${rawFindings.length} findings survived refutation`)
  }

  // -----------------------------------------------------------------------
  // Judge — replaces the skills' interactive WALKER. Makes the calls itself.
  // -----------------------------------------------------------------------
  let judgement = { decisions: [], fixNow: [], summary: 'No findings to judge.' }

  if (confirmed.length > 0) {
    phase('Judge')
    judgement =
      (await agent(
        `You are the JUDGE for increment ${id}. You replace the interactive triage step a human would normally do —
read ${SKILLS}/review/references/WALKER.md to understand the triage this substitutes for, then make every call
YOURSELF. Do not defer to a human and do not ask anything.
${GUARDRAILS}
${readIncrement(id)}
CONFIRMED FINDINGS (each already survived an adversarial refutation attempt):
${confirmed
  .map(
    (f, i) =>
      `${i + 1}. [${f.severity}] ${f.file}${f.line ? ':' + f.line : ''} — ${f.what}\n   WHY: ${f.why}\n   PROPOSED FIX: ${f.fix}\n   SURVIVED REFUTATION BECAUSE: ${f.verdict}`
  )
  .join('\n')}

FOR EACH finding decide exactly one of:
- **fix-now** — it is in this increment's scope and the fix is clear. Anything that breaks an acceptance criterion,
  a security or correctness defect, a test that does not pin what it claims, or a house-rule violation is fix-now
  regardless of severity label.
- **defer-to-open-question** — real, but genuinely outside this increment's scope, or it needs a product/design
  decision that code cannot settle. You MUST then append it to that increment's openQuestions in
  ${WORKAREA}/backlog.json (Edit the file; keep it valid JSON — re-check with
  \`jq empty ${WORKAREA_TILDE}/backlog.json\`) so it is never silently dropped.
- **reject** — you disagree with it even post-refutation. Say why, with evidence.

BIAS: prefer fix-now for anything cheap and clearly right. Prefer defer for anything that would expand the
increment's blast radius. Reject freely when a finding is taste rather than defect — this loop values a small
correct increment over a large polished one.
For every fix-now item, write a COMPLETE instruction in fixNow[]: the file, exactly what to change, and how to
prove it (the test or assertion that should now pass). A fixer with no other context must be able to execute it.
Return the structured output only.`,
        { label: `${id} judge`, phase: 'Judge', schema: JUDGEMENT_SCHEMA }
      )) ?? judgement
  }

  // -----------------------------------------------------------------------
  // Fix — apply only what the judge ruled fix-now.
  // -----------------------------------------------------------------------
  if (judgement.fixNow.length > 0) {
    phase('Fix')
    log(`${id}: judge ruled ${judgement.fixNow.length} fixes`)
    await agent(
      `You are the FIXER for increment ${id}. Apply EXACTLY the fixes the judge ruled — no more, no less.
${GUARDRAILS}
YOUR PERSONA — read ${SKILLS}/review/references/REVIEW_ITEM_FIXER.md IN FULL and follow it. For any fix that is
purely stylistic also read ${SKILLS}/code-style/references/STYLE_IMPLEMENTOR.md.
${readIncrement(id)}
THE RULED FIXES:
${judgement.fixNow.map((f, i) => `${i + 1}. ${f}`).join('\n')}

RULES: apply each fix and prove it with the test or assertion the instruction names. Do NOT re-open anything the
judge rejected or deferred. Do NOT expand scope. If a fix turns out to be wrong or impossible, say so in your
summary rather than forcing it — a fix that requires weakening a test is not a fix. Leave everything STAGED, do
not commit.
Return the structured output only.`,
      { label: `${id} fix`, phase: 'Fix', schema: incrementSchema }
    )
  }

  // -----------------------------------------------------------------------
  // Ladder — the increment's own verification list, in its own order.
  // -----------------------------------------------------------------------
  phase('Ladder')

  const ladder = await agent(
    `You are the VERIFIER for increment ${id}. Run its verification ladder and report honestly.
${GUARDRAILS}
${readIncrement(id)}
TASK — run the increment's "verification" array IN ORDER, each to its own log under ${WORKAREA_TILDE}/logs/ named
\`${id}-<step>.log\`, reading each log ONCE. Every step must be green before you run the next.
- If a step is red, you get at most 3 repair attempts across the whole ladder. A repair fixes the CODE — never
  weaken, skip or delete a test to get green, and never mark a step green that was not.
- Platform-touching increments carry a two-sided check: BOTH sets must still serve correctly. Run both legs.
- If the ladder includes an E2E leg, read \`test-results/*/error-context.md\` for any failure rather than grepping
  the run output. Journey E2E specs on a fresh stack are known to be flaky with transient 500s in beforeEach that
  recover on retry — a green run with retried journey specs IS a pass, but say so explicitly.
- If a step cannot run at all (needs a stack that is not up, needs a branch that does not exist yet), do NOT
  pretend it passed: record it in failures[] as "could not run: <reason>" and set green:false.
Report green:true ONLY if every step actually ran and actually passed.
Return the structured output only.`,
    { label: `${id} ladder`, phase: 'Ladder', schema: LADDER_SCHEMA }
  )

  // -----------------------------------------------------------------------
  // Land — commit on green, non-destructive rollback on red.
  // -----------------------------------------------------------------------
  phase('Land')

  if (!ladder || !ladder.green) {
    log(`${id}: LADDER RED — rolling back`)
    const rb = await agent(
      `Increment ${id} failed its verification ladder. Roll it back NON-DESTRUCTIVELY and preserve the evidence.
${GUARDRAILS}
FAILURES: ${ladder ? (ladder.failures ?? []).join(' | ') : 'verifier agent failed'}
TASK:
1. Look up EVERY repo the increment touches:
   \`jq -r '.increments[] | select(.id=="${id}") | (.repos // [.repo])[]' ${WORKAREA_TILDE}/backlog.json\`.
2. \`git -C ${TILDE}/<repoPath> stash push -u -m "failed-${id}"\` in EACH of them, one Bash call per repo —
   NEVER reset --hard, NEVER clean -fd. Half a rollback leaves the other repo dirty and blocks the next
   increment's baseline guard.
3. Confirm every tree is clean with \`tim workspace status\`.
4. Append a short "ATTEMPT FAILED" note to that increment's notes field in ${WORKAREA}/backlog.json recording what
   went red and the stash ref, so the next attempt starts informed. Keep the JSON valid
   (\`jq empty ${WORKAREA_TILDE}/backlog.json\`).
Report the stash ref in your summary so the work can be recovered.
Return the structured output only.`,
      { label: `${id} rollback`, phase: 'Land', schema: LAND_SCHEMA }
    )
    results.push({ id, outcome: 'ladder-red', detail: ladder?.summary ?? 'verifier failed', rollback: rb?.summary })
    log(`${id}: rolled back — stopping the run so the failure is not built on top of`)
    break
  }

  const land = await agent(
    `Increment ${id} is implemented, reviewed, judged and verified green. LAND IT.
${GUARDRAILS}
TASK:
1. Look up EVERY repo it touches:
   \`jq -r '.increments[] | select(.id=="${id}") | (.repos // [.repo])[]' ${WORKAREA_TILDE}/backlog.json\`, and its
   title for the commit subject.
2. Confirm what is staged in each with \`git -C ${TILDE}/<repoPath> status --short\`. Stage anything the increment
   produced that is still untracked — but NOTHING under logs/, no coverage output, no test-results/, no
   .playwright artefacts.
3. Commit in EACH repo that has changes, one commit per repo, same conventional message:
   \`<type>(${CFG.scope}): <increment title>\`, a body saying what changed and
   naming the increment id (and its Jira key, if the increment carries a "ticket" field), and the trailer:
   Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
   A repo the increment named but that ended up with no changes is fine — say so; do not manufacture a commit.
4. Do NOT push — pushing is the human's call.
5. Update ${WORKAREA}/backlog.json: set this increment's "status" to "done" and record the short SHAs in a
   "commits" array as \`repo:shortSha\` (also set "commit" to the primary repo's SHA, so older readers of this
   file still work). Keep the JSON valid (\`jq empty ${WORKAREA_TILDE}/backlog.json\`).
Report every commit SHA you made.
Return the structured output only.`,
    { label: `${id} land`, phase: 'Land', schema: LAND_SCHEMA }
  )

  results.push({
    id,
    outcome: land && land.landed ? 'landed' : 'land-failed',
    commit: land?.commit,
    findings: { raw: rawFindings.length, confirmed: confirmed.length, fixed: judgement.fixNow.length },
    judgement: judgement.decisions.map((d) => `${d.call}: ${d.what}`)
  })

  log(`${id}: LANDED ${land?.commit ?? ''} — ${rawFindings.length} findings, ${confirmed.length} confirmed, ${judgement.fixNow.length} fixed`)

  // A HALT-FOR-REVIEW gate is a DESIGNED human checkpoint, not a review finding.
  // The judge absorbs routine triage; it does not absorb these.
  const gate = await agent(
    `Report whether increment ${id} carries a halt gate. Run exactly one command and read it:
\`jq -r '.increments[] | select(.id=="${id}") | .gate' ${WORKAREA_TILDE}/backlog.json\`
If it prints \`null\`, return ok:true with summary "no gate". Otherwise return ok:false and put the gate's full text
in summary — the run will stop so a human can review before dependent increments proceed.
Do not do anything else. One Bash call, no Grep/Glob tools, tilde paths only.`,
    { label: `${id} gate check`, phase: 'Land', schema: incrementSchema }
  )

  if (gate && !gate.ok) {
    log(`${id}: HALT-FOR-REVIEW GATE — stopping the run. ${gate.summary}`)
    results.push({ id, outcome: 'halted-at-gate', detail: gate.summary })
    break
  }
}

return { increments: results }

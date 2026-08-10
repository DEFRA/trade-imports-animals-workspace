export const meta = {
  name: 'snag-respec',
  description:
    'Rewrite a blocked increment as a buildable one now that its gate has been ruled — re-derive the file list, acceptance criteria and verification ladder from the ruling rather than patching the old conditional spec',
  whenToUse:
    'A snag came back needs-decision, a human has since answered its gate, and the increment still carries a spec written conditionally on that question. Run before the build loop, never instead of it.',
  phases: [{ title: 'Re-spec' }, { title: 'Write' }],
}

// ---------------------------------------------------------------------------
// Configuration. `args` is unreliable here, so FALLBACK is the real switch.
// ---------------------------------------------------------------------------
const FALLBACK = { workarea: 'frontend-snagging-eudpa315', increments: ['snag-004'] }
const CFG = typeof args === 'object' && args && args.increments ? { ...FALLBACK, ...args } : FALLBACK

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

const GUARDRAILS = `
GUARD RAILS (mandatory, every step):
- NEVER use the Grep or Glob TOOLS — they are not allowlisted and will prompt the user. Use Bash \`grep -rn\` / \`find\` / \`ls\` / \`jq\`.
- Bash hygiene: ONE command per Bash call. No \`&&\`, no \`;\`, no \`|\`, no \`cd\`, no trailing \`echo $?\`. Use \`git -C\`, \`npm --prefix\`, \`mvn -f\`. Output redirection (\`> file 2>&1\`) IS allowed.
- In Bash ALWAYS use tilde paths \`${TILDE}/...\` — a literal /Users/... path in Bash is DENIED.
- For the Read/Write/Edit TOOLS use absolute paths \`${ABS}/...\`.
- Repo paths: frontend=${REPO_PATH.frontend}, backend=${REPO_PATH.backend}, tests=${REPO_PATH.tests}. All on \`main\`.
- Never bare \`node\` / \`node -e\` (denied — wrap in an npm script). NEVER run \`sonar\` (not allowlisted).
- You are SPECIFYING, not implementing. Do not edit a single file in any repo.
- Headless: never ask a question. Decide, record the decision, keep going.
`

const SPEC_SCHEMA = {
  type: 'object',
  required: ['buildable', 'title', 'repos', 'summary'],
  properties: {
    buildable: {
      type: 'boolean',
      description: 'True only if the spec below contains no unanswered question. False means the ruling did not actually settle enough to build.',
    },
    stillOpen: { type: 'string', description: 'If buildable is false, the exact question that remains' },
    title: { type: 'string' },
    repos: { type: 'array', items: { type: 'string', enum: ['frontend', 'tests', 'backend'] } },
    diagnosis: { type: 'string' },
    filesToTouch: {
      type: 'array',
      items: {
        type: 'object',
        required: ['repo', 'path', 'action', 'what'],
        properties: {
          repo: { type: 'string', enum: ['frontend', 'tests', 'backend'] },
          path: { type: 'string' },
          action: { type: 'string', enum: ['create', 'edit', 'delete'] },
          what: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
    acceptanceCriteria: { type: 'array', items: { type: 'string' } },
    verification: { type: 'array', items: { type: 'string' }, description: 'Runnable commands in order. Commands only — never prose.' },
    specs: { type: 'array', items: { type: 'string' } },
    copyKeys: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
    openQuestions: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

const WRITE_SCHEMA = {
  type: 'object',
  required: ['ok', 'summary'],
  properties: {
    ok: { type: 'boolean' },
    updated: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  additionalProperties: false,
}

phase('Re-spec')

const respecs = await parallel(
  CFG.increments.map((id) => () =>
    agent(
      `You are the RE-SPECIFIER for increment ${id}. It was triaged as needs-decision, a human has since ruled on
its gate, and the specification it still carries was written BEFORE that ruling — so its file list and
acceptance criteria are written conditionally ("whichever", "only if the gate answers X") and cannot be built.
Your job is to write the specification the ruling now implies.

${GUARDRAILS}

READ FIRST, in this order:
1. The increment: \`jq '.increments[] | select(.id=="${id}")' ${WORKAREA_TILDE}/backlog.json\`
   Pay attention to \`ruling\` — that is the human's decision and it is BINDING. Also read \`gate\` (the question
   it answers), \`diagnosis\`, \`filesToTouch\` (now suspect), and \`ladderGaps\` if present.
2. Whatever the ruling points at. If it names a repo, a commit, a prototype or a document, go and read it —
   the ruling is often a pointer rather than a full answer.

THEN:
- Re-derive the spec from the ruling. Carry nothing over from the old \`filesToTouch\` merely because it is
  there; every entry must be justified by the ruling plus the code as it stands today. Dropping most of the old
  list is a normal outcome.
- Verify the diagnosis still holds against current code before specifying anything. The original investigation
  ran days ago and the tree has moved.
- \`verification\` must be RUNNABLE COMMANDS in order, never prose. It must end with a check that FAILS on
  today's code and passes once the change lands — if you cannot name one, the increment is not buildable and
  you should say so rather than pad the ladder.
- \`buildable\` is false if ANY question remains. Do not paper over a gap the ruling left; a spec that hedges
  sends an implementor to guess. Put the residual question in \`stillOpen\`.
- Frontend work: READ ${SKILLS}/frontend-change/SKILL.md IN FULL and follow the recipe it routes you to, so the
  file list matches the repo's own touch-list. Backend: ${TILDE}/docs/best-practices/java/. Tests:
  ${TILDE}/docs/best-practices/playwright/.
- House rules that override generic advice: no display logic in obligations or the model; copy lives in
  copy.en.js AND copy.cy.js with identical structure; stay inside the govuk-frontend toolbox unless the ruling
  explicitly permits otherwise; comments are removed aggressively.

Return the structured output only — a complete, self-consistent replacement specification.`,
      { label: `${id} re-spec`, phase: 'Re-spec', schema: SPEC_SCHEMA }
    ).then((spec) => ({ id, spec }))
  )
)

const done = respecs.filter((r) => r && r.spec)

if (done.length === 0) {
  return { ok: false, reason: 'Every re-spec agent failed.', requested: CFG.increments }
}

phase('Write')

const payload = done.map(({ id, spec }) => ({
  id,
  buildable: spec.buildable,
  stillOpen: spec.stillOpen ?? null,
  title: spec.title,
  repos: spec.repos ?? [],
  diagnosis: spec.diagnosis ?? null,
  filesToTouch: spec.filesToTouch ?? [],
  acceptanceCriteria: spec.acceptanceCriteria ?? [],
  verification: spec.verification ?? [],
  specs: spec.specs ?? [],
  copyKeys: spec.copyKeys ?? [],
  notes: spec.notes ?? '',
  openQuestions: spec.openQuestions ?? [],
}))

const written = await agent(
  `You are the BACKLOG WRITER. Apply these re-specifications to ${WORKAREA}/backlog.json. You change no
verdict and re-derive nothing — the analysis is finished, you are persisting it.
${GUARDRAILS}

For EACH entry below, find the increment with that id and:
- replace \`title\`, \`repos\`, \`diagnosis\`, \`filesToTouch\`, \`acceptanceCriteria\`, \`verification\`, \`specs\`,
  \`copyKeys\` and \`openQuestions\` with the values given;
- APPEND the given \`notes\` to the existing notes rather than replacing them — the ruling and the original
  investigation are both worth keeping;
- set \`status\` to "todo" and \`gate\` to null when \`buildable\` is true;
- leave \`status\` as "blocked" and set \`gate\` to the \`stillOpen\` text when \`buildable\` is false;
- PRESERVE \`ruling\`, \`snagText\`, \`ticket\`, \`branch\`, \`base\`, \`parent\`, \`commit\` and anything else not
  listed above. Never touch an increment whose status is "done".
- drop \`ladderGaps\` on any increment you rewrite: the new ladder supersedes the critique of the old one.

Then recompute \`conflictsWith\` across ALL increments (same repo AND same path in filesToTouch, excluding
self), because the new file lists change the overlaps.

Validate with \`jq empty ${WORKAREA_TILDE}/backlog.json\` and read the file back to report statuses.

THE RE-SPECIFICATIONS:
${JSON.stringify(payload, null, 2)}

Return the structured output only.`,
  { label: 'write re-specs', phase: 'Write', schema: WRITE_SCHEMA }
)

return {
  ok: Boolean(written?.ok),
  buildable: done.filter(({ spec }) => spec.buildable).map(({ id, spec }) => `${id}: ${spec.title}`),
  stillBlocked: done.filter(({ spec }) => !spec.buildable).map(({ id, spec }) => `${id}: ${spec.stillOpen ?? 'no reason given'}`),
  summary: written?.summary ?? 'Write failed — the re-specifications above are not persisted.',
}

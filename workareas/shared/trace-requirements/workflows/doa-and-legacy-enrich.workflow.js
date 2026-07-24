export const meta = {
  name: 'doa-and-legacy-enrich',
  description: 'Supplementary pass: fold in the filtered DoA traces + enrich every page spec from the authorised legacy source, then re-synthesise spec/model/backlog (chedType via args)',
  whenToUse: 'After the main trace-to-requirements run for the SAME chedType, once DoA traces and legacy-source reading are authorised. Pass args:{chedType, doaHashes?:[...]}. chedType defaults to ched-pp.',
  phases: [
    { title: 'DoA-discover', detail: 'find this CHED type\'s delegated-authority traces in the index' },
    { title: 'DoA-mine', detail: 'mine the delegated-authority traces' },
    { title: 'DoA-merge', detail: 'fold DoA findings into page specs + authorization-rules.md' },
    { title: 'Legacy', detail: 'enrich every page spec from the IPAFFS source — validation copy, mandatoriness, missed fields' },
    { title: 'Reconcile', detail: 'regenerate journey-spec.json + conflicts.json' },
    { title: 'Model', detail: 'regenerate the target model' },
    { title: 'Backlog', detail: 'regenerate the backlog' },
    { title: 'Critic', detail: 'completeness sweep over the enriched spec' },
  ],
}

// CHED-type config — kept in sync with trace-to-requirements.workflow.js (workflow scripts are
// self-contained; no shared import). Only CHED-PP is proven; A/D/P are wired but unverified.
const CHED_CONFIG = {
  'ched-pp': { name: 'CHED-PP', what: 'plants and plant products', qaSlug: 'ched-pp', notificationEnum: 'CHEDPP', ipaffsViews: 'top-level *Chedpp.html + shared templates gated by {{#if isChedpp}}', doaTerm: 'Plant Org / Plant Agency' },
  'ched-a': { name: 'CHED-A', what: 'live animals', qaSlug: 'ched-a', notificationEnum: 'CVEDA', ipaffsViews: 'views/importer/cheda/ + shared templates', doaTerm: 'the animal/live-animal org named in the test' },
  'ched-p': { name: 'CHED-P', what: 'products of animal origin (POAO)', qaSlug: 'ched-p', notificationEnum: 'CVEDP', ipaffsViews: 'views/importer/chedp/ + shared templates', doaTerm: 'the POAO org named in the test' },
  'ched-d': { name: 'CHED-D', what: 'high-risk food and feed of non-animal origin', qaSlug: 'ched-d', notificationEnum: 'CED', ipaffsViews: 'views/importer/chedd/ + shared templates', doaTerm: 'the food/feed org named in the test' },
  // IUU = the fish DELTA on CHED-P. No dedicated slug/enum; fish files as CHED-P (CVEDP). This
  // legacy pass is where IUU gets most of its substance: the catch-certificate + IUU-declaration
  // templates. Confirmed against ipaffs-frontend-notification/service/src/views/.
  'iuu': { name: 'IUU', what: 'illegal, unreported and unregulated fishing (fishery products IPAFFS files as CHED-P fish)', qaSlug: 'ched-p', notificationEnum: 'CVEDP', ipaffsViews: 'views/importer/chedp/ + top-level catch-certificate templates (catchCertificates.html, addCatchCertificateDetails.html, manageCatchCertificates.html, removeCatchCertificateDetails.html, catchCertificateExemption.html, confirmExemptSpecies.html) + partials/certificate/cvedp/ + cvedp_certificate.html', doaTerm: 'the fishery/seafood org named in the test' },
}

// args may arrive as a real object OR (Workflow-tool footgun) as a JSON string —
// tolerate both so a stringified `{chedType:...}` doesn't silently default to ched-pp.
const parsedArgs = typeof args === 'string'
  ? (() => { try { return JSON.parse(args) } catch { return {} } })()
  : args
const CHED_TYPE = (parsedArgs && typeof parsedArgs === 'object' && parsedArgs.chedType) ? parsedArgs.chedType : 'ched-pp'
const CHED = CHED_CONFIG[CHED_TYPE]
if (!CHED) throw new Error(`Unknown chedType "${CHED_TYPE}" — expected one of: ${Object.keys(CHED_CONFIG).join(', ')}`)

const ABS = `/Users/samfarrington/git/defra/trade-imports-animals/workareas/trace-requirements/${CHED_TYPE}`
const TILDE = `~/git/defra/trade-imports-animals-workspace/workareas/trace-requirements/${CHED_TYPE}`
const DATA_TILDE = '~/git/defra/trade-imports-animals-workspace/ipaffs-playwright-traces/playwright-report/data'
const QA_TILDE = '~/git/defra/ipaffs/ipaffs-qa-automation'
const IPAFFS = '~/git/defra/ipaffs'
const PW = 'npx --package @playwright/test@1.61.1 playwright trace'

log(`Enriching ${CHED.name} — ${CHED.what}`)

const GUARD_RAILS = `
## GUARD RAILS — non-negotiable, strict permission hooks. Violating these HANGS THE RUN.

**Paths — two spellings of the same directory. Getting this wrong hangs the run.**
- **Bash commands**: ALWAYS \`~/...\`. A literal \`/Users/...\` in a Bash command prompts every time;
  unattended, it blocks forever. Self-check: if a Bash command contains \`/Users/\`, it is WRONG.
- **Read / Write / Edit TOOL calls only**: absolute \`${ABS}/...\`. This prompt shows \`/Users/...\`
  paths for tool calls — do NOT copy them into Bash; swap the prefix for \`${TILDE}\`.

**Never emit the characters \`&&\` — not as a shell operator, not inside an awk/jq/grep expression.**
A hook greps the raw command for \`&&\` and is not quote-aware, so even \`awk 'NR>=1 && NR<=2'\` stalls
the run. To print a line range use \`head -n <end> f | tail -n +<start>\`. **Avoid \`awk\`/\`sed\`
entirely** (they are only allowlisted under the workspace path). \`;\` and \`|\` are fine.

**One command per Bash call.** Do not append \`echo $?\`.

**Denied — do not attempt or work around:** \`node\`, \`python\`, \`curl\`, \`wget\`, \`chmod\`,
\`rm -rf <glob>\`, a path-invoked script you just wrote (must be committed + clean at HEAD).

**Search:** do NOT use the Grep/Glob TOOLS. Use \`grep -rn\` via Bash. \`grep\`, \`ls\`, \`cat\`, \`head\`,
\`tail\`, \`wc\`, \`sort\`, \`uniq\`, \`jq\`, \`file\` are allowlisted for ANY path. \`find\` is allowlisted
ONLY under the workspace — under \`${IPAFFS}\` use \`ls -R\` / \`grep -rn\`, never \`find\`.

**Long output → file, then Read.** Redirect to a file in your own working dir and use the Read tool
(with \`offset\`/\`limit\`) rather than paging through many Bash calls.

**Secrets:** redact anything credential-shaped as \`[REDACTED]\`.
`.trim()

const TRACE_CLI = `
## Playwright trace CLI — \`${PW} <subcommand>\`

**Stateful + cwd-scoped**: \`open\` extracts to \`.playwright-cli/\` under the CURRENT directory and a
new \`open\` replaces the last. You MUST work in your own private dir:
\`mkdir -p ${TILDE}/work/<slug>\` then \`cd ${TILDE}/work/<slug>; ${PW} open ${DATA_TILDE}/<hash>.zip\`
(\`cd <dir>; <cmd>\` in ONE call, semicolon not \`&&\`).

- \`open <zip>\` — metadata; prints \`Title:\` (spec file + test name).
- \`actions > actions.txt\` — ordered timeline with real values + accessible names. Read the file.
- \`snapshot <id> --name before\` — accessibility tree (title, headings, controls + names).
- \`snapshot <id> -- eval "<js>"\` — arbitrary DOM query for what the a11y tree omits.
- \`requests > requests.txt\` — network log.
- \`close\` — clean up.
Output is text, never JSON — transcribe with the Write tool.
`.trim()

const CONFIDENCE = `
## Confidence taxonomy — tag EVERY claim. Legacy source is NOW AUTHORISED.

- \`confirmed\` — observed rendering in a trace snapshot/action. Cite trace hash + action id.
- \`legacy\` — read from the authoritative IPAFFS source (template copy, enum values, validation
  message, model mandatoriness). Cite \`file_path:line\`. This is real and trustworthy for VALUES
  and COPY. For MANDATORINESS it is "as the old system had it" — accurate, but a policy the rebuild
  may deliberately revisit; note that where it matters.
- \`inferred\` — deduced from the QA tests/page objects. Cite \`file_path:line\`.
- \`gap\` — no evidence anywhere; a question for a human.

Precedence for the SAME fact: confirmed (rendered) wins over legacy wins over inferred. If legacy
copy and a rendered trace disagree, keep the rendered value + \`confirmed\`, and record the
discrepancy — that disagreement is a finding (IPAFFS source can lag what it actually serves).
`.trim()

const LEGACY_MAP = `
## Where the legacy source lives (authorised for copy + field values + validation)

  This is ${CHED.name} — its templates: ${CHED.ipaffsViews}. Its legacy notification-type enum is
  ${CHED.notificationEnum}.

- **Frontend templates (Handlebars)** — \`${IPAFFS}/ipaffs-frontend-notification/service/src/views/importer/\`
  The \`*.html\` files ARE the pages (top-level for shared pages; the ${CHED.name}-specific ones live
  as noted above). Templates show the exact label/hint copy, the conditional branches (for ${CHED.name},
  a \`{{#if is${CHED.notificationEnum}}}\`-style flag or the type subdir), and controls no trace
  rendered. \`grep -rn\` for the page's heading text to find its template.
- **Route handlers** — \`${IPAFFS}/ipaffs-frontend-notification/service/src/routes/handlers/importer/\`
  and the route table \`.../routes/routes.js\` — which fields a page reads, and its conditionality.
- **Validation messages** — \`${IPAFFS}/ipaffs-notification-microservice/service/src/main/resources/ValidationMessages.properties\`
  \`grep -rn\` it for the type's message keys (try the tokens \`${CHED.notificationEnum}\` and
  \`${CHED.qaSlug}\`, and the field name) to find the REAL error copy. This is the single biggest win —
  for CHED-PP the traces rendered only ~8 of ~155 messages; the rest lived here.
- **Model (mandatoriness + types)** — \`${IPAFFS}/ipaffs-imports-notification-schema/.../representation/\`
  \`PartOne.java\`, \`Commodities.java\`, \`CommodityComplement.java\`, \`ComplementParameterSet.java\`,
  \`EconomicOperator.java\`, \`Purpose.java\`, \`ContactDetails.java\`. \`PartOne\` is shared across all
  CHED types; the \`@NotNull\` validation-group annotations say which fields are mandatory for
  ${CHED.name} (the group named for ${CHED.notificationEnum}).

**Scope discipline:** read it for COPY, FIELD VALUES, VALIDATION RULES and MANDATORINESS only. You
are NOT cataloguing or critiquing IPAFFS's architecture, and the target model is still built like
\`trade-imports-animals\`, not like IPAFFS. Extract facts, not design.
`.trim()

// ---------------------------------------------------------------------------

phase('DoA-discover')

// DoA (delegated-authority) traces live under auth/DoA/ and name an org by commodity type, so the
// main run's spec-path filter misses them. For CHED-PP these were a known set of 10; for other
// types we discover them from the raw index. An explicit args.doaHashes overrides discovery.
let DOA_HASHES = (parsedArgs && typeof parsedArgs === 'object' && Array.isArray(parsedArgs.doaHashes)) ? parsedArgs.doaHashes : null
if (!DOA_HASHES) {
  const disc = await agent(`
Find the delegated-authority (DoA) traces for **${CHED.name}** (${CHED.what}) in the trace index.

${GUARD_RAILS}

DoA traces exercise the delegated-agent surface (an agent creating/viewing a notification on behalf
of another organisation): organisation selection, Trade Partner badge, contact/importer
auto-population, and who-sees-what visibility rules. They live under \`auth/DoA/\` in the spec path
and name an org by commodity type — for ${CHED.name} that is typically ${CHED.doaTerm}.

1. Read \`${TILDE}/trace-index.raw.txt\` (Read tool at \`${ABS}/trace-index.raw.txt\`, or \`grep\`).
   Its blocks are: \`=== <hash>.zip\` then a \`Title:\` line with the spec path + test name.
2. Find every block whose Title contains \`auth/DoA\` (or \`DoA\`/\`delegated\`).
3. Keep ONLY those that are ${CHED.name} journeys — judge from the org/commodity named in the test
   title (e.g. ${CHED.doaTerm}). If a title is ambiguous, you MAY open the trace
   (\`mkdir -p ${TILDE}/work/disc; cd ${TILDE}/work/disc; ${PW} open ${DATA_TILDE}/<hash>.zip\`) and
   check the import type on the "What are you importing?" page, then \`${PW} close\`.
4. Return the matching trace hashes. If you find none, return an empty array (the pass will skip DoA
   and run legacy enrichment only) — say so rather than guessing.
`, {
    schema: { type: 'object', required: ['hashes'], properties: { hashes: { type: 'array', items: { type: 'string' } }, rationale: { type: 'string' } } },
    phase: 'DoA-discover', label: `doa-discover:${CHED_TYPE}`,
  })
  DOA_HASHES = (disc?.hashes ?? []).filter(Boolean)
}
log(`DoA traces for ${CHED.name}: ${DOA_HASHES.length}`)

phase('DoA-mine')
if (DOA_HASHES.length === 0) log('No DoA traces found — skipping DoA mining, running legacy enrichment only')
else log(`Mining ${DOA_HASHES.length} delegated-authority traces`)

const DOA_FINDING_SCHEMA = {
  type: 'object',
  required: ['hash', 'wrote', 'kind'],
  properties: {
    hash: { type: 'string' },
    wrote: { type: 'boolean' },
    title: { type: 'string' },
    kind: { type: 'string', description: 'creation | visibility | agent-access' },
    pagesTouched: { type: 'array', items: { type: 'string' }, description: 'slugs of pages this trace rendered' },
    newSurface: { type: 'string', description: 'what this trace shows that the standard journey did NOT — org selection, trade-partner badge, auto-population, etc.' },
    authorizationRules: { type: 'array', items: { type: 'string' }, description: 'who-can-see-what / who-owns-what rules asserted' },
    notes: { type: 'string' },
  },
}

const doaFindings = await parallel(DOA_HASHES.map((hash, i) => () =>
  agent(`
Mine ONE delegated-authority (DoA) ${CHED.name} trace. These were filtered out of the main run
because classification keyed on spec path; they are delegated-agent ${CHED.name} journeys (an agent
acting for another org, typically ${CHED.doaTerm}) and they hold the delegated-agent surface the
main journey never exercised: organisation selection, the Trade Partner badge, contact/importer
auto-population, and authorization/visibility rules.

${GUARD_RAILS}

${TRACE_CLI}

${CONFIDENCE}

## Your trace
- hash: \`${hash}\`
- Your private dir: \`${TILDE}/work/doa${i}\` (\`mkdir -p\` first).

## Method
1. \`mkdir -p ${TILDE}/work/doa${i}\`
2. \`cd ${TILDE}/work/doa${i}; ${PW} open ${DATA_TILDE}/${hash}.zip\` — note the Title.
3. \`cd ${TILDE}/work/doa${i}; ${PW} actions > actions.txt\` then Read \`${ABS}/work/doa${i}/actions.txt\`.
4. Classify \`kind\` from the title (creation / visibility / agent-access).
5. For a CREATION trace: identify which pages it renders (map to existing slugs where you can:
   consignment-for, consignment-organisation, contact-details, traders-addresses, etc.). For any
   page that shows delegated-agent-specific surface (organisation picker, "creates for Plant Org 1",
   auto-populated contact/importer, Trade Partner badge, change-organisation-before-submit), SNAPSHOT
   it and capture the real fields/copy/values — this is the surface the main run marked as an
   unexercised gap. Use \`snapshot <id> --name before\` + eval as needed.
6. For a VISIBILITY / AGENT-ACCESS trace: the value is the RULES, not fields. Capture, verbatim from
   the test title and any rendered dashboard, the who-sees-what / who-owns-what rules (e.g. "agent
   submits for Plant Org 1 → Plant Org 1 member can see it; agent's own-org submission → Plant Org 1
   member cannot see it"). These are real authorization requirements.
7. \`cd ${TILDE}/work/doa${i}; ${PW} close\`

## Output
Write a findings file to \`${ABS}/doa-findings/${hash}.json\` (Write tool) containing everything you
found: pagesTouched, per-page field/copy details (same shape as a page spec's fields/validation
where relevant), newSurface prose, and authorizationRules. Then return the small receipt.
Write the file BEFORE returning.
`, { schema: DOA_FINDING_SCHEMA, phase: 'DoA-mine', label: `doa:${hash.slice(0, 7)}` })
))

const goodDoa = doaFindings.filter(Boolean)
log(`DoA mined: ${goodDoa.length}/${DOA_HASHES.length}`)
// Empty is only an error if there WERE DoA traces to mine. No DoA traces for this type is fine —
// legacy enrichment (the bigger win) still runs.
if (DOA_HASHES.length > 0 && goodDoa.length === 0) throw new Error('DoA mining produced nothing despite finding DoA traces — resume to retry.')

// Single writer folds findings into page specs + writes authorization-rules.md. No write races.
phase('DoA-merge')

const DOA_MERGE_SCHEMA = {
  type: 'object',
  required: ['pagesUpdated', 'authorizationRulesWritten'],
  properties: {
    pagesUpdated: { type: 'array', items: { type: 'string' } },
    pagesCreated: { type: 'array', items: { type: 'string' } },
    authorizationRulesWritten: { type: 'integer' },
    notes: { type: 'string' },
  },
}

const doaMerge = await agent(`
Fold the DoA findings into the canonical page specs, and write the authorization rules to their own
document. You are the SINGLE writer for this step — no other agent touches these files now.

${GUARD_RAILS}

${CONFIDENCE}

## Inputs
- DoA findings: \`${ABS}/doa-findings/*.json\` (\`ls ${TILDE}/doa-findings/\`, Read each).
- Existing page specs: \`${ABS}/pages/*.json\` (\`ls ${TILDE}/pages/\`).

## Task
1. For each existing page a DoA trace enriches (consignment-for, consignment-organisation,
   contact-details, traders-addresses, notifications-dashboard, and any other): Read the page spec,
   ADD the DoA-observed fields/values/copy that were previously gaps (mark \`confidence: "confirmed"\`
   with the DoA trace hash + action id as evidence), and set \`observedValues\` where the DoA trace
   filled something the standard journey left blank. Do NOT delete or downgrade existing content —
   you are adding evidence. Rewrite the complete page spec file (Write tool, same path).
2. If a DoA trace rendered a page with NO existing spec (e.g. a distinct organisation-selection
   page), create \`${ABS}/pages/<slug>.json\` in the same shape as the others.
3. Write \`${ABS}/authorization-rules.md\` — the who-sees-what / who-owns-what / who-can-act-for-whom
   rules from every visibility/agent-access finding, as concrete testable statements with the trace
   hash as evidence. This is a NEW requirements artefact the frontend-only pass could not produce:
   the delegated-authority ownership + visibility model (createdFor / assigned-org / trade-partner).
4. Note in \`notes\` any DoA finding that CONTRADICTS an existing page spec — that is a conflict for
   Reconcile to record.

Return the receipt.
`, { schema: DOA_MERGE_SCHEMA, phase: 'DoA-merge', label: 'doa:merge' })

if (!doaMerge) throw new Error('DoA merge returned nothing (agent died). Resume to continue.')
log(`DoA merge: ${(doaMerge.pagesUpdated ?? []).length} pages updated, ${(doaMerge.pagesCreated ?? []).length} created, ${doaMerge.authorizationRulesWritten ?? 0} auth rules`)

// ---------------------------------------------------------------------------
// Legacy enrichment: one agent per existing page spec, each owns its own file. No write races.
// Runs AFTER the DoA merge so it enriches DoA-updated specs too.
// ---------------------------------------------------------------------------

phase('Legacy')

const slugs = await agent(`
List the page-spec slugs to enrich. Run \`ls ${TILDE}/pages/\` and return every filename with the
\`.json\` stripped, as a JSON array of strings. Nothing else.
`, {
  schema: { type: 'object', required: ['slugs'], properties: { slugs: { type: 'array', items: { type: 'string' } } } },
  phase: 'Legacy', label: 'legacy:list',
})

const slugList = (slugs?.slugs ?? []).filter(Boolean)
log(`Legacy-enriching ${slugList.length} page specs from the IPAFFS source`)
if (slugList.length === 0) throw new Error('No page specs found to enrich — aborting.')

const LEGACY_RESULT_SCHEMA = {
  type: 'object',
  required: ['slug', 'wrote'],
  properties: {
    slug: { type: 'string' },
    wrote: { type: 'boolean' },
    template: { type: 'string', description: 'the IPAFFS template file matched, or "not found"' },
    validationMessagesAdded: { type: 'integer' },
    fieldsMandatorinessSet: { type: 'integer' },
    fieldsAdded: { type: 'integer', description: 'controls the traces never rendered, found in the template' },
    discrepancies: { type: 'array', items: { type: 'string' }, description: 'legacy source vs rendered trace disagreements — conflicts for Reconcile' },
    notes: { type: 'string' },
  },
}

const legacyResults = await parallel(slugList.map((slug, i) => () =>
  agent(`
Enrich ONE page spec from the authorised legacy IPAFFS source. Focus: the validation copy and field
mandatoriness the rendered-frontend pass could not see (only 8 of ~155 error messages ever rendered).

${GUARD_RAILS}

${CONFIDENCE}

${LEGACY_MAP}

## Your page
- slug: \`${slug}\`
- spec file: \`${ABS}/pages/${slug}.json\` — Read it first. Understand its heading, url and fields.

## Method
1. Read the page spec. Note its \`heading\`, \`url\`/\`urlPattern\`, and current fields.
2. Find the IPAFFS template: \`grep -rn\` the heading text (or a distinctive label) under
   \`${IPAFFS}/ipaffs-frontend-notification/service/src/views/importer/\`. Read the matched \`.html\`.
   Also find its route handler under \`.../routes/handlers/importer/\` if you need field wiring.
3. **Validation messages** — \`grep -rn\` the field names / a distinctive key in
   \`${IPAFFS}/ipaffs-notification-microservice/service/src/main/resources/ValidationMessages.properties\`
   (search the type tokens \`${CHED.notificationEnum}\` and \`${CHED.qaSlug}\` too). Add every error
   message that applies to THIS page's fields, verbatim, \`confidence: "legacy"\` with the \`file:line\`.
   Keep any \`confirmed\` message already there.
4. **Mandatoriness** — from \`PartOne.java\` (and Commodities/CommodityComplement/etc.) find which of
   this page's fields carry the ${CHED.name} \`@NotNull\` validation group (named for
   ${CHED.notificationEnum}). Set \`required\` accordingly, tag the field's requiredness evidence
   \`legacy\` with the \`file:line\`. Where legacy mandatoriness is a policy the rebuild might revisit,
   say so in \`notes\`.
5. **Missed fields** — the template will show controls (conditional type branches, optional inputs)
   that no trace rendered. ADD them, \`confidence: "legacy"\`, cited.
6. **Discrepancies** — if the template's copy differs from a \`confirmed\` rendered value already in
   the spec, KEEP the rendered value, keep it \`confirmed\`, and record the disagreement in
   \`discrepancies\` (a conflict for Reconcile). Rendered reality wins; the divergence is a finding.

Do NOT downgrade or delete anything. You are ADDING legacy-sourced evidence and firming up
requiredness. Rewrite the complete, enriched page spec back to \`${ABS}/pages/${slug}.json\` (Write
tool, same path). Write BEFORE returning. Return the receipt.
`, { schema: LEGACY_RESULT_SCHEMA, phase: 'Legacy', label: `legacy:${slug}` })
))

const goodLegacy = legacyResults.filter(Boolean)
const msgsAdded = goodLegacy.reduce((n, r) => n + (r.validationMessagesAdded ?? 0), 0)
const fieldsAdded = goodLegacy.reduce((n, r) => n + (r.fieldsAdded ?? 0), 0)
const discrepancies = goodLegacy.flatMap(r => r.discrepancies ?? [])
log(`Legacy enrichment: ${goodLegacy.length}/${slugList.length} specs, +${msgsAdded} validation messages, +${fieldsAdded} missed fields, ${discrepancies.length} discrepancies`)
if (goodLegacy.length === 0) throw new Error('Legacy enrichment produced nothing — aborting.')

// ---------------------------------------------------------------------------
// Re-synthesise. These prompts intentionally differ from the main run's (they cite the new inputs)
// so they run fresh rather than colliding with any cache.
// ---------------------------------------------------------------------------

phase('Reconcile')

const RECONCILE_SCHEMA = {
  type: 'object',
  required: ['pages', 'conflicts'],
  properties: {
    pages: { type: 'integer' },
    fields: { type: 'integer' },
    confidenceCounts: { type: 'string', description: 'confirmed / legacy / inferred / gap across all fields AND validation messages' },
    conflicts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'topic', 'ruling'],
        properties: {
          id: { type: 'string' },
          topic: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
          detail: { type: 'string' },
          ruling: { type: 'string' },
          needsHuman: { type: 'boolean' },
        },
      },
    },
    modelGaps: { type: 'array', items: { type: 'string' } },
    consequentialDecisions: { type: 'array', items: { type: 'string' } },
  },
}

const reconciled = await agent(`
Regenerate the canonical journey spec + conflict register from the ENRICHED page specs. Same
method as the journey-builder skill's reconciler, now with two new evidence sources folded in.

${GUARD_RAILS}

${CONFIDENCE}

## Inputs
- Enriched page specs: \`${ABS}/pages/*.json\` (\`ls ${TILDE}/pages/\`, Read each). These now carry
  DoA-observed fields AND legacy-sourced validation copy + mandatoriness.
- Authorization rules: \`${ABS}/authorization-rules.md\` — the delegated-authority ownership/visibility
  model. Fold these into the spec as journey-level behaviours/requirements.
- The previous spec + conflicts (for continuity of \`c-NNN\` ids): \`${ABS}/journey-spec.json\`,
  \`${ABS}/conflicts.json\`.

## Task
1. Merge every enriched page spec into \`${ABS}/journey-spec.json\` (Write tool). Preserve the shape
   the previous spec used (pages[], fields[] with confidence/provenance/conflicts, journey-level
   behaviours). ADD an \`authorization\` section from authorization-rules.md.
2. Precedence for the same fact: confirmed (rendered) > legacy (IPAFFS source) > inferred (tests).
   Record EVERY disagreement as a conflict (\`c-NNN\`, continuing the existing numbering) with a
   ruling; \`needsHuman: true\` only where precedence cannot settle it. The legacy-enrichment
   discrepancies and the DoA contradictions are your main new conflict sources.
3. Write \`${ABS}/conflicts.json\` and rewrite \`${ABS}/SPEC-GATE.md\` (the human review artefact):
   page + field counts, the FULL confidence breakdown across fields AND validation messages (the
   headline improvement — quantify how far validation coverage moved from 8/155), the conflict
   register (needsHuman first), the modelGap list, all openQuestions deduped, the GOV.UK component
   inventory + non-standard patterns, the delegated-authority model summary, and your 5 most
   consequential decisions. Surface the weak parts at the top.

Return the structured object.
`, { schema: RECONCILE_SCHEMA, phase: 'Reconcile', label: 'reconcile:spec' })

if (!reconciled) throw new Error('Reconcile returned nothing (agent died). Resume to continue.')
const conflicts = reconciled.conflicts ?? []
const needsHuman = conflicts.filter(c => c?.needsHuman)
log(`Reconciled: ${reconciled.pages} pages, ${reconciled.fields} fields`)
log(`Confidence: ${reconciled.confidenceCounts}`)
log(`Conflicts: ${conflicts.length} (${needsHuman.length} need a human)`)

phase('Model')

const MODEL_SCHEMA = {
  type: 'object',
  required: ['wrote'],
  properties: {
    wrote: { type: 'boolean' },
    fields: { type: 'integer' },
    housePatternsFollowed: { type: 'array', items: { type: 'string' } },
    persistence: { type: 'string' },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
}

const model = await agent(`
Regenerate the target data model from the enriched spec. Built like \`trade-imports-animals\`
(journey → JSON object → Mongo), NOT like IPAFFS.

${GUARD_RAILS}

${CONFIDENCE}

## Inputs
- \`${ABS}/journey-spec.json\` — the enriched canonical spec (now includes DoA fields, legacy
  mandatoriness, and an authorization section).
- \`${ABS}/authorization-rules.md\` — the delegated-authority ownership/visibility model. The model
  must now carry ownership (createdFor / assignedOrg / on-behalf-of) — this was absent before.
- \`${ABS}/integrations.md\` — reference-data + integration points (unchanged; still valid).
- House style: \`~/git/defra/trade-imports-animals-workspace/repos/trade-imports-animals-frontend\`
  and \`.../repos/trade-imports-animals-backend\` (\`find\` IS allowlisted under the workspace; also
  \`ls -R\` / \`grep -rn\` / Read). Mirror how they shape + persist the notification document.

## Task
Derive the model from what the journey COLLECTS (the enriched page specs), typed and plain-English,
persisted to Mongo in the house style. Add the ownership/on-behalf-of fields the DoA surface
requires. Every field in every page spec must land somewhere; nothing IPAFFS-shaped. Produce a
\`fieldMap\` table (page → field → model path). Write the full model to \`${ABS}/target-model.md\`
(Write tool). Return the receipt.
`, { schema: MODEL_SCHEMA, phase: 'Model', label: 'model:target' })

if (!model) throw new Error('Model returned nothing (agent died). Resume to continue.')
log(`Model regenerated: ${model.fields ?? '?'} fields`)

phase('Backlog')

const BACKLOG_SCHEMA = {
  type: 'object',
  required: ['increments'],
  properties: {
    milestones: { type: 'integer' },
    increments: { type: 'integer' },
    bornBlocked: { type: 'array', items: { type: 'string' } },
    wrote: { type: 'boolean' },
  },
}

const backlog = await agent(`
Regenerate the ordered, buildable backlog from the enriched spec + model. Built like
\`trade-imports-animals\`: journey → JSON → Mongo. Keep it simple; first pass persists to Mongo.

${GUARD_RAILS}

## READING THESE FILES — avoid the #1 stall

Every input below is shown in the \`~/\` form ON PURPOSE. To inspect a file:
- **Preferred:** the **Read tool**, which takes the absolute form — swap the prefix
  \`~/git/defra/trade-imports-animals-workspace\` → \`/Users/samfarrington/git/defra/trade-imports-animals\`.
  The Read tool does NOT trigger any hook.
- **For a jq/grep query in Bash:** use the \`~/\` path EXACTLY as written below.
- **NEVER put \`/Users/\` in a Bash command** (jq, cat, ls, grep included) — it prompts the user every
  time and stalls this run. Before running any Bash line, check it contains no \`/Users/\`.

## Inputs (Bash-safe \`~/\` paths — use the Read tool for the absolute form)
- \`${TILDE}/journey-spec.json\`, \`${TILDE}/conflicts.json\`, \`${TILDE}/target-model.md\`,
  \`${TILDE}/integrations.md\`, \`${TILDE}/authorization-rules.md\`.

## Rules (adopted from journey-builder)
- One increment per page in journey order; scaffolding + persistence first; reference data + the
  commodity collection sequenced explicitly; variants (CSV, Article 72, CUC, cloning) + the DoA
  delegated-authority journey in a later milestone.
- \`status: "blocked"\` + \`gate: "sam"\` for any increment behind a \`needsHuman\` conflict, a modelGap,
  or a \`gap\`-confidence field/page — state the question, never author the ruling.
- Post-submission (inspector/PHSI/decisions) stays OUT of scope; note the exclusion.
- ACs concrete + testable, citing verbatim copy and the GOV.UK components from the spec. Now that
  validation copy is enriched, per-page validation ACs should cite the real error messages.
- A dedicated increment for the delegated-authority ownership/visibility model (from
  authorization-rules.md), born blocked on the "is DoA in scope?" question.

Write \`${ABS}/backlog.json\` and \`${ABS}/backlog.md\`. Return the receipt.
`, { schema: BACKLOG_SCHEMA, phase: 'Backlog', label: 'backlog:generate' })

if (!backlog) throw new Error('Backlog returned nothing (agent died). Resume to continue.')
log(`Backlog: ${backlog.increments} increments, ${backlog.milestones} milestones, ${(backlog.bornBlocked ?? []).length} born blocked`)

phase('Critic')

const CRITIC_SCHEMA = {
  type: 'object',
  required: ['gaps', 'coverageAssessment'],
  properties: {
    coverageAssessment: { type: 'string' },
    validationCoverage: { type: 'string', description: 'how far validation-message coverage moved after legacy enrichment' },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['gap', 'severity'],
        properties: {
          gap: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          nextAction: { type: 'string' },
        },
      },
    },
    questionsForHumans: { type: 'array', items: { type: 'string' } },
    methodCritique: { type: 'string' },
  },
}

const critic = await agent(`
Completeness critic over the ENRICHED spec. Everything is built. Find what is still missing; be
honest about what even the enriched method cannot know.

${GUARD_RAILS}

${CONFIDENCE}

## READING THESE FILES — avoid the #1 stall

Every path below is the Bash-safe \`~/\` form. To inspect a file:
- **Preferred:** the **Read tool**, which takes the absolute form — swap the prefix
  \`~/git/defra/trade-imports-animals-workspace\` → \`/Users/samfarrington/git/defra/trade-imports-animals\`.
  The Read tool triggers no hook.
- **For a jq/grep query in Bash:** use the \`~/\` path EXACTLY as written.
- **NEVER put \`/Users/\` in a Bash command** (jq, cat, ls, grep included) — it prompts the user every
  time and stalls the run. Check every Bash line for \`/Users/\` before running it.

## Inputs (Bash-safe \`~/\` paths — use the Read tool for the absolute form)
- \`${TILDE}/journey-spec.json\`, \`${TILDE}/backlog.json\`, \`${TILDE}/target-model.md\`,
  \`${TILDE}/authorization-rules.md\`, \`${TILDE}/integrations.md\`.
- Cross-check the page inventory against \`${QA_TILDE}/tests/accessibility/${CHED.qaSlug}-accessibility-tests.spec.ts\`
  and \`${QA_TILDE}/workflows/notification/${CHED.qaSlug}-workflows.ts\` (\`grep -rn\` / \`cat\` / Read).

## Ask
1. Now that the DoA traces are folded in, is the page inventory complete against the a11y walk +
   workflow? Any page or branch still missing?
2. **Validation coverage** — after legacy enrichment, count validation messages by confidence
   (confirmed/legacy/inferred/gap). Quantify the improvement from the previous 8-confirmed baseline,
   and name pages still lacking any validation evidence.
3. Confidence honesty across all fields — the confirmed/legacy/inferred/gap split, with numbers.
4. Backlog fidelity: every page → an increment; every model field → a page.
5. **Method critique** — with legacy source now authorised, what is STILL structurally invisible?
   (Business rules with no UI and no message key: Article 72 eligibility, risk categorisation, HMI
   auto-completion, CUC trigger, split generation, control-point↔BCP filtering. These live in
   backend logic, not templates or messages — name them as the residual human/policy questions.)

Write \`${ABS}/completeness-critique.md\` (Write tool). Return the structured object.
`, { schema: CRITIC_SCHEMA, phase: 'Critic', label: 'critic:completeness' })

const blockers = (critic?.gaps ?? []).filter(g => g.severity === 'blocker')
log(`Critic: ${(critic?.gaps ?? []).length} gaps (${blockers.length} blockers)`)

return {
  doa: { mined: goodDoa.length, pagesUpdated: doaMerge?.pagesUpdated ?? [], pagesCreated: doaMerge?.pagesCreated ?? [], authRules: doaMerge?.authorizationRulesWritten ?? 0 },
  legacy: { specsEnriched: goodLegacy.length, validationMessagesAdded: msgsAdded, missedFieldsAdded: fieldsAdded, discrepancies: discrepancies.length },
  spec: { pages: reconciled.pages, fields: reconciled.fields, confidence: reconciled.confidenceCounts, conflicts: conflicts.length, conflictsNeedingHuman: needsHuman.map(c => `${c.id}: ${c.topic}`) },
  backlog: { increments: backlog.increments, milestones: backlog.milestones, bornBlocked: backlog.bornBlocked ?? [] },
  gaps: { total: (critic?.gaps ?? []).length, blockers: blockers.map(g => g.gap) },
  validationCoverage: critic?.validationCoverage ?? 'unreported',
  questionsForHumans: critic?.questionsForHumans ?? [],
  gateArtefact: `${ABS}/SPEC-GATE.md`,
  newArtefacts: [`${ABS}/authorization-rules.md`, `${ABS}/doa-findings/*.json`],
}

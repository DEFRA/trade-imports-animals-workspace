export const meta = {
  name: 'trace-to-requirements',
  description: 'Mine Playwright traces + tests + legacy code into a CHED journey spec, requirements and backlog (chedType via args)',
  whenToUse: 'Deriving requirements for a rewrite from an existing app\'s Playwright trace corpus. Pass args:{chedType:"ched-a"|"ched-d"|"ched-p"|"ched-pp"} — defaults to ched-pp.',
  phases: [
    { title: 'Index', detail: 'identify + classify every trace in the corpus' },
    { title: 'Extract', detail: 'per-trace action timeline (the journey story)' },
    { title: 'Inventory', detail: 'dedup actions into a distinct page inventory' },
    { title: 'Comb', detail: 'fine-tooth per-page DOM mining — copy, fields, govuk components, structure' },
    { title: 'Corroborate', detail: 'per-page cross-check against the tests' },
    { title: 'Verify', detail: 'adversarial refutation of every page claim' },
    { title: 'Reconcile', detail: 'canonical journey-spec.json + conflicts.json + spec gate' },
    { title: 'Integrations', detail: 'external systems + reference data, from trace network logs' },
    { title: 'Model', detail: 'derive the target JSON object, trade-imports-animals style' },
    { title: 'Backlog', detail: 'ordered increments' },
    { title: 'Critic', detail: 'completeness sweep — what is missing' },
  ],
}

// ---------------------------------------------------------------------------
// CHED-type config. The tool is parameterised by args.chedType so the same
// pipeline mines CHED-A / CHED-D / CHED-P / CHED-PP. Only CHED-PP has been run
// end-to-end (the proven reference); A/D/P are wired but UNVERIFIED until run —
// run one as a canary before trusting it (see README). Each type differs in:
// what it imports, the legacy notification-type enum, where its IPAFFS templates
// live, its Dynamics/SOAP client, its trace-selection filter (the ched-p/ched-pp
// substring trap is the sharp edge), and its variant set.
// ---------------------------------------------------------------------------
const CHED_CONFIG = {
  'ched-pp': {
    name: 'CHED-PP',
    what: 'plants and plant products (the Common Health Entry Document for Plants; high-risk plants)',
    qaSlug: 'ched-pp',
    notificationEnum: 'CHEDPP',
    ipaffsViews: 'CHED-PP has NO dedicated views/importer/ subdir — its templates are top-level *Chedpp.html (e.g. commodityDetailsBulkChedpp.html, declarationChedpp) plus the shared default templates gated by {{#if isChedpp}}.',
    dynamicsHint: 'clients/services/DynamicsPlantsClient.ts hits OData entity trd_plantsimportnotifications filtered on trd_chedppreference; SOAP at resources/soap-search/ched-pp-soap-certificate-request.xml.',
    filterGuidance: "Match case-insensitively on 'ched-pp' or 'chedpp'. THE TRAP: a substring search for 'ched-p' ALSO matches 'ched-pp', but NOT the reverse — searching 'ched-pp' is safe and never matches CHED-P. So use 'ched-pp'/'chedpp' as the include term and NEVER use 'ched-p' as a filter. Traces live under notification/ched-pp/, smoke/smoke-ched-pp-*, accessibility/ched-pp-*, and shared specs with a '> CHED-PP >' segment in the title — all in scope; do NOT restrict to the notification/ched-pp/ directory.",
    variants: 'CSV bulk upload, cloning, copy-as-new, CUC billing, Article 72 low-risk, split consignment, DoA delegated authority',
  },
  'ched-a': {
    name: 'CHED-A',
    what: 'live animals (the Common Health Entry Document for Animals)',
    qaSlug: 'ched-a',
    notificationEnum: 'CVEDA',
    ipaffsViews: 'CHED-A templates are under views/importer/cheda/ plus the shared default templates gated by a CHED-A conditional.',
    dynamicsHint: 'find the CHED-A Dynamics/SOAP client under clients/ (a live-animals entity); confirm the entity name from the client source rather than assuming.',
    filterGuidance: "Match case-insensitively on 'ched-a' or 'cheda'. No substring-overlap trap with the other types. Traces live under notification/ched-a/, smoke/smoke-ched-a-*, accessibility/ched-a-*, and shared specs with a '> CHED-A >' title segment. Live-animal journeys also carry registered-equidae surface (horse passport/microchip/name).",
    variants: 'live-animal + unit identifiers, registered equidae, CSV, cloning, split consignment, DoA',
  },
  'ched-p': {
    name: 'CHED-P',
    what: 'products of animal origin, germinal products and animal by-products (POAO)',
    qaSlug: 'ched-p',
    notificationEnum: 'CVEDP',
    ipaffsViews: 'CHED-P templates are under views/importer/chedp/ plus the shared default templates.',
    dynamicsHint: 'find the CHED-P Dynamics/SOAP client under clients/ (a POAO entity); confirm the entity name from the client source.',
    filterGuidance: "CRITICAL TRAP: match 'ched-p'/'chedp' BUT a substring search for 'ched-p' ALSO matches 'ched-pp' (plants) — a DIFFERENT, out-of-scope type. A title is CHED-P iff it contains 'ched-p'/'chedp' AND does NOT contain 'ched-pp'/'chedpp'. Directory notification/ched-p/ is distinct from notification/ched-pp/. State your exact boundary rule and how many you excluded for matching ched-pp.",
    variants: 'CSV, cloning, copy-as-new, split consignment, DoA',
  },
  'ched-d': {
    name: 'CHED-D',
    what: 'high-risk food and feed of non-animal origin (HRFNAO)',
    qaSlug: 'ched-d',
    notificationEnum: 'CED',
    ipaffsViews: 'CHED-D templates are under views/importer/chedd/ plus the shared default templates.',
    dynamicsHint: 'find the CHED-D Dynamics/SOAP client under clients/; confirm the entity name from the client source.',
    filterGuidance: "Match case-insensitively on 'ched-d' or 'chedd'. No substring-overlap trap. Traces live under notification/ched-d/, smoke/smoke-ched-d-*, accessibility/ched-d-*, and shared specs with a '> CHED-D >' title segment.",
    variants: 'CSV, cloning, copy-as-new, split consignment, DoA',
  },
  // IUU is NOT a stock CHED type. Fish/fishery products are filed on IPAFFS UNDER CHED-P
  // (legacy enum CVEDP); the new service splits them into a standalone IUU journey. There is
  // no dedicated trace, slug or config — the ENTIRE fish trace surface is ONE trace
  // (ched-p-notification.spec.ts:206, hash db2d277c…). So this is the fish DELTA on top of
  // CHED-P: a tiny trace fan-out, and most substance comes from the legacy/DoA pass reading
  // the catch-certificate + IUU-declaration templates. qaSlug is 'ched-p' (its traces live in
  // the CHED-P corpus). Legacy specifics below confirmed against ipaffs-frontend-notification.
  'iuu': {
    name: 'IUU',
    what: 'illegal, unreported and unregulated fishing — fishery products IPAFFS files as CHED-P (fish) but the new service splits into a standalone IUU journey (catch certificate + IUU declaration)',
    qaSlug: 'ched-p',                 // no slug of its own; IUU traces live in the CHED-P corpus
    notificationEnum: 'CVEDP',        // CONFIRMED: IPAFFS files fish as CHED-P — cvedp_certificate.html, review_page_view_cvedp_*, CommodityDetailsChedp
    ipaffsViews: 'IUU is the FISH slice of CHED-P. CHED-P templates live under views/importer/chedp/; the catch-certificate + species surface is a set of TOP-LEVEL templates under views/importer/: catchCertificates.html, addCatchCertificateDetails.html, manageCatchCertificates.html, removeCatchCertificateDetails.html, catchCertificateExemption.html, confirmExemptSpecies.html, plus the cvedp certificate partials under views/partials/certificate/cvedp/ and cvedp_certificate.html. All in ipaffs-frontend-notification/service/src/views/.',
    dynamicsHint: 'same CHED-P (POAO) Dynamics/SOAP client as ched-p; the fish/catch-certificate certificate surface is cvedp_certificate.html + views/partials/certificate/cvedp/. Confirm the entity + any catch-certificate fields from the client source during the legacy pass.',
    filterGuidance: "IUU has NO title slug. At INDEX time select the CHED-P fish surface: the one title-marked fish trace (ched-p-notification.spec.ts:206, hash db2d277c…) — match 'Fish' inside a CHED-P title (title contains 'ched-p'/'chedp' AND NOT 'ched-pp'/'chedpp'). This selects EXACTLY ~1 trace; that is EXPECTED and CORRECT — do NOT widen to all of CHED-P and do NOT return zero. During Extract/Comb, if a fish CN code (HS chapter 03) or a catch-certificate page appears in another ched-p trace, fold that trace in as IUU and note it.",
    variants: 'catch certificate, IUU declaration, fish species / CN chapter 03',
  },
}

// args may arrive as a real object OR (Workflow-tool footgun) as a JSON string —
// tolerate both so a stringified `{chedType:...}` doesn't silently default to ched-pp.
const parsedArgs = typeof args === 'string'
  ? (() => { try { return JSON.parse(args) } catch { return {} } })()
  : args
const CHED_TYPE = (parsedArgs && typeof parsedArgs === 'object' && parsedArgs.chedType) ? parsedArgs.chedType : 'ched-pp'
const CHED = CHED_CONFIG[CHED_TYPE]
if (!CHED) throw new Error(`Unknown chedType "${CHED_TYPE}" — expected one of: ${Object.keys(CHED_CONFIG).join(', ')}`)
log(`Mining requirements for ${CHED.name} — ${CHED.what}`)

// ---------------------------------------------------------------------------
// Two path constants, per CHED type. ABS for Read/Write TOOLS; TILDE for Bash.
// Never let ABS near a Bash example or every subagent triggers a permission prompt.
// Outputs land in the (gitignored) workarea; curated deliverables get copied to
// workareas/shared/trace-requirements/<type>/ for the review handoff.
// ---------------------------------------------------------------------------
const ABS = `/Users/samfarrington/git/defra/trade-imports-animals/workareas/trace-requirements/${CHED_TYPE}`
const TILDE = `~/git/defra/trade-imports-animals-workspace/workareas/trace-requirements/${CHED_TYPE}`
const DATA_TILDE = '~/git/defra/trade-imports-animals-workspace/ipaffs-playwright-traces/playwright-report/data'
const QA_TILDE = '~/git/defra/ipaffs/ipaffs-qa-automation'
const PW = 'npx --package @playwright/test@1.61.1 playwright trace'

const GUARD_RAILS = `
## GUARD RAILS — non-negotiable, this environment has strict permission hooks

Violating these spams the user with permission prompts or hard-fails. Read twice.

**Paths — the two-spelling rule. Read this twice; getting it wrong HANGS THE RUN.**

The workarea has **two spellings of the same directory**. They are the same place on disk:

| Surface | Spelling to use |
|---|---|
| **Bash commands** (every single one) | \`${TILDE}\` |
| **Read / Write / Edit TOOL calls only** | \`${ABS}\` |

- A literal \`/Users/...\` path **inside a Bash command** triggers a permission prompt EVERY time.
  If the user is not watching, your command blocks indefinitely and stalls the whole workflow.
  This includes \`jq\`, \`cat\`, \`ls\`, \`grep\`, \`head\` — every command, no exceptions.
- **This prompt contains \`/Users/...\` paths** because they are needed for Write-tool calls. Do NOT
  copy those into a Bash command. When you need the same file in Bash, swap the prefix for the
  \`~/...\` twin above.
- Self-check before every Bash call: **if the command contains the characters \`/Users/\`, it is
  wrong.** Rewrite it with \`~/\` and only then run it.
- Example of the same file, both ways:
  - Bash: \`jq -e '.steps | length' ${TILDE}/journeys/<hash>.json\`
  - Read tool: \`${ABS}/journeys/<hash>.json\`

**One command per Bash call:**
- \`;\` is permitted and is how you scope a directory: \`cd <dir>; <cmd>\` is fine and is
  REQUIRED for the trace CLI (see below). Pipes (\`|\`) are fine.
- Do not append \`echo $?\` — the exit code is already in the tool result.

**NEVER emit the characters \`&&\` — not anywhere, for any reason. This will hang the run.**
- A permission hook greps the raw command string for \`&&\` and stops to ask the user. It is NOT
  quote-aware, so it fires even when the \`&&\` is *inside a quoted expression* and is not shell
  chaining at all. \`awk 'NR>=10 && NR<=20' f\` and \`jq 'select(.a && .b)'\` both trigger it.
  If the user is not watching, your command blocks indefinitely and the whole workflow stalls.
- So: no \`&&\` as a shell operator, AND no \`&&\` inside awk/jq/grep expressions.
- **To print a line range, do NOT use awk.** Use: \`head -n <end> <file> | tail -n +<start>\`
  (e.g. lines 1430-1756: \`head -n 1756 f.txt | tail -n +1430\`). Both are allowlisted for any
  path and involve no \`&&\` and no quoting.
- For multiple conditions in jq, chain filters with \`|\` instead: \`jq '.[] | select(.a) | select(.b)'\`.
- For grep, run two greps in a pipe rather than one expression with \`&&\`.

**Prefer these commands — they are allowlisted for ANY path and never prompt:**
\`grep\`, \`ls\`, \`cat\`, \`head\`, \`tail\`, \`wc\`, \`sort\`, \`uniq\`, \`jq\`, \`file\`, \`basename\`, \`dirname\`.
Reach for \`head\`/\`tail\`/\`grep\` first. **Avoid \`awk\` and \`sed\` entirely** — they are allowlisted
only when the file argument is a path under \`~/git/defra/trade-imports-animals-workspace/*\`, so a
relative filename (\`awk '...' requests.txt\`) does NOT match the allowlist and will prompt even
without an \`&&\`. There is nothing awk gives you here that \`head\`/\`tail\`/\`grep\`/\`sort\`/\`uniq\` cannot.

**Write output to a file, then Read it.** For anything long (\`trace actions\`, \`trace requests\`),
redirect to a file in your own working directory and use the Read tool with an absolute path,
rather than paging it through many Bash calls:
\`cd <yourdir>; <cmd> > actions.txt\` then Read \`<ABS path>/actions.txt\`.
The Read tool takes \`offset\`/\`limit\` for large files — that is the cheapest way to page.

**Denied outright — do not attempt, do not try to work around:**
- \`node\`, \`node -e\`, \`python\`, \`python3\`, \`perl\`, \`ruby\`, \`bash <file>\`, \`sh\`, \`eval\`, \`exec\`
- \`curl\`, \`wget\`, \`chmod\`, \`rm -rf <glob>\`, \`npm install -g\`
- A path-invoked executable (\`./x.sh\`, \`~/x.js\`) must be COMMITTED and CLEAN at git HEAD.
  A script you just wrote CANNOT be executed. Do not write one and try to run it.
- If you need a scripting language, you cannot have one. Use grep/sort/uniq/jq/awk and the
  Read/Write tools instead. This is a hard constraint — design around it, don't fight it.

**Tools, not Bash, for search:**
- Do NOT use the Grep or Glob TOOLS (not allowlisted — they prompt). Use \`grep -rn\` via Bash.
- \`find\` is allowlisted ONLY under \`~/git/defra/trade-imports-animals-workspace/*\`. Outside that
  (e.g. anywhere under \`~/git/defra/ipaffs/\`) use \`ls -R\` / \`grep -rn\` instead of \`find\`.
- \`npx\` is allowed. Always use the scoped package form shown below — bare unscoped names are squatted.

**If a command prompts or hangs, do not retry it verbatim and do not try to sneak around the
guard.** Re-read the rules above, find the sanctioned alternative, and use that instead.

**Secrets:** trace \`fill\` values can contain plaintext credentials. If a value looks like a
password/token/secret, write \`[REDACTED]\` instead of the value. Never copy a credential into
your output.
`.trim()

const TRACE_CLI = `
## Using the Playwright trace CLI

The extractor is first-party: \`${PW} <subcommand>\`.

**CRITICAL — it is stateful and cwd-scoped.** \`trace open\` extracts into a \`.playwright-cli/\`
directory **relative to the current working directory**, and opening a new trace REPLACES the
previously opened one. Parallel agents sharing a cwd will clobber each other.

Therefore you MUST work in your own private directory. Every trace command looks like:

\`\`\`bash
cd ${TILDE}/work/<your-unique-slug>; ${PW} open ${DATA_TILDE}/<hash>.zip
\`\`\`

\`cd <dir>; <cmd>\` in ONE Bash call (semicolon, not \`&&\`). Create the dir first with
\`mkdir -p ${TILDE}/work/<your-unique-slug>\`.

**Subcommands:**
- \`open <trace.zip>\` — extract + print metadata. Prints \`Title:\` = "<spec file>:<line> › <describe> › <test>".
- \`actions\` — the ordered action timeline. Shows \`Navigate to "<url>"\`, \`Click\`/\`Check\`/\`Fill "<value>"\`/
  \`Select option\` plus the locator with its accessible name. THIS IS THE JOURNEY STORY.
  Flags: \`--grep <pattern>\`, \`--errors-only\`.
- \`action <id>\` — params, result, log, source location, and which snapshot phases exist.
- \`snapshot <id>\` — accessibility snapshot of the DOM at that action (default). This yields the
  page title, headings, and every form control with its exact accessible name. Flags: \`--name before|input|after\`.
- \`snapshot <id> -- eval "<js>"\` — run JS against the frozen DOM. Use for detail the a11y tree omits:
  - \`${PW} snapshot 11 -- eval "document.body.outerHTML" --filename=page.html\`
  - \`${PW} snapshot 11 -- eval "document.querySelector('h1').textContent"\`
- \`requests\` / \`request <id>\` — network. \`console\`, \`errors\`, \`attachments\`.
- \`close\` — clean up extracted data when done.

Output is human-readable text, NOT JSON — there is no \`--json\` flag on any subcommand. Read it and
transcribe into JSON yourself using the Write tool.
`.trim()

const CORPUS_FACTS = `
## What you are looking at (established facts — do not re-derive)

- **The app**: IPAFFS, DEFRA's legacy Import of Products, Animals, Food and Feed service. GOV.UK
  Design System frontend (hapi + Handlebars).
- **The journey**: ${CHED.name} — the pre-notification for importing **${CHED.what}**. One of four
  CHED types (CHED-A live animals, CHED-P products of animal origin, CHED-D high-risk food/feed,
  CHED-PP plants). **Only ${CHED.name} matters here** — do not mine the other three.
- **Why**: ${CHED.name} is being rebuilt as a NEW, simple CDP-based app. It must gather the SAME
  information but must NOT copy IPAFFS's architecture.
- **The corpus**: 383 Playwright traces under \`${DATA_TILDE}/\`, hash-named, covering ALL CHED types.
  Each trace is self-identifying — \`trace open\` prints the spec file + test title, so you select the
  ${CHED.name} subset by title. (For reference, the CHED-PP subset was ~65 traces; yours will differ.)
- **This run was recorded with \`trace: on\`** — i.e. traces for ALL tests, not just failures.
  (The committed \`playwright.config.ts:43\` says \`on-first-retry\`, but that was overridden for this
  run; confirmed by the corpus itself — **345 of 383 traces have zero errors**.) So this is a
  **representative, mostly-passing corpus**: normal happy-path journeys, not a pile of broken runs.
  Trust it as evidence of how the app actually behaves.
- The **38 traces that DO have errors** are disproportionately valuable — they are where real
  validation messages and error states rendered. Mine them hard for error copy.
- **Traces are still a LOWER BOUND on requirements** — they only cover what was exercised. A page or
  field never exercised leaves no trace. Uncovered surface is a FINDING, not an absence of
  requirement. This is why we corroborate against templates and page objects.
`.trim()

const CONFIDENCE = `
## Confidence taxonomy — tag EVERY claim

- \`confirmed\` — directly observed in a trace snapshot or action (rendered reality). Cite the trace
  hash + action id.
- \`inferred\` — deduced from test code, page objects, or legacy source but NOT observed in a trace.
  Cite \`file_path:line\`.
- \`gap\` — we believe this exists but have no evidence either way; a question for a human.

A requirement with no citation is not a requirement. Never invent copy, labels or validation text —
if you did not see it, mark it \`gap\` and say so.
`.trim()

// ---------------------------------------------------------------------------

const INDEX_SCHEMA = {
  type: 'object',
  required: ['traces'],
  properties: {
    traces: {
      type: 'array',
      items: {
        type: 'object',
        required: ['hash', 'title', 'specFile', 'actions', 'relevance'],
        properties: {
          hash: { type: 'string' },
          title: { type: 'string' },
          specFile: { type: 'string' },
          testName: { type: 'string' },
          actions: { type: 'integer' },
          pages: { type: 'integer' },
          errors: { type: 'integer' },
          durationSeconds: { type: 'number' },
          relevance: {
            type: 'string',
            enum: ['core-journey', 'validation', 'variant', 'post-submission', 'peripheral'],
            description: 'core-journey = creates a notification end to end; validation = exercises error states; variant = CSV/clone/copy/billing/low-risk/split; post-submission = inspector/decision side; peripheral = touches this CHED type only incidentally',
          },
          rationale: { type: 'string' },
        },
      },
    },
  },
}

phase('Index')
log(`Wave 1 — indexing the ${CHED.name} trace corpus`)

const index = await agent(`
You are indexing a Playwright trace corpus so later waves can mine it for requirements.

${GUARD_RAILS}

${CORPUS_FACTS}

${TRACE_CLI}

## Your task

A raw index has already been built for all 383 traces and is at:
\`${TILDE}/trace-index.raw.txt\`

Its format repeats this 6-line block per trace:
\`\`\`
=== <hash>.zip
  Title:        <specFile>:<line> › <describe> › <test name>
  Duration:     40.6s
  Actions:      105
  Pages:        9
  Errors:       0
\`\`\`

1. Read it (use the Read TOOL on \`${ABS}/trace-index.raw.txt\`, or \`grep\`/\`head\` via Bash).
2. Select ONLY traces relevant to **${CHED.name}** — ${CHED.what}.

   **How to draw the ${CHED.name} boundary (this is the sharp edge — get it exactly right):**
   ${CHED.filterGuidance}

   Traces appear in the dedicated \`notification/${CHED.qaSlug}/\` directory AND elsewhere —
   \`smoke/smoke-${CHED.qaSlug}-*\`, \`accessibility/${CHED.qaSlug}-*\`, and shared specs (document
   upload, visibility, etc.) whose test-name segment names the type. Include ALL of them; do not
   restrict to the \`notification/${CHED.qaSlug}/\` directory or you will miss much of the corpus.
   Compare full path segments, not raw substrings, when the type slug is a prefix of another.
   State in your rationale how many you selected from each source, how you drew the boundary, and
   (if applicable) how many you EXCLUDED for matching a longer, different type slug.
3. For each selected trace, classify \`relevance\` per the schema enum and give a one-line rationale.
   Use the spec file path and test name as your evidence — do NOT open the traces (that is the next wave).
4. Sort so \`core-journey\` traces come first, then \`validation\`, then \`variant\`.

Also write your full result as JSON to \`${ABS}/trace-index.json\` using the Write tool.

Return the structured object.
`, { schema: INDEX_SCHEMA, phase: 'Index', label: `index:${CHED_TYPE}` })

const traces = (index?.traces ?? []).filter(Boolean)
log(`Indexed ${traces.length} ${CHED.name} traces`)

const byRelevance = {}
for (const t of traces) byRelevance[t.relevance] = (byRelevance[t.relevance] ?? 0) + 1
log(`Relevance mix: ${JSON.stringify(byRelevance)}`)

// Mine the richest traces first. Action count is a decent proxy for journey coverage.
const RANK = { 'core-journey': 0, validation: 1, variant: 2, 'post-submission': 3, peripheral: 4 }
const mineable = traces
  .filter(t => t.relevance !== 'peripheral')
  .sort((a, b) => (RANK[a.relevance] - RANK[b.relevance]) || (b.actions - a.actions))

log(`Extracting action timelines from ${mineable.length} traces`)

const JOURNEY_SCHEMA = {
  type: 'object',
  required: ['hash', 'steps'],
  properties: {
    hash: { type: 'string' },
    title: { type: 'string' },
    outcome: { type: 'string', description: 'What the test actually did end-to-end, one sentence' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['actionId', 'kind'],
        properties: {
          actionId: { type: 'integer' },
          kind: { type: 'string', description: 'navigate | click | check | fill | select | assert | other' },
          url: { type: 'string' },
          locator: { type: 'string', description: 'verbatim locator incl. accessible name' },
          value: { type: 'string', description: 'literal value typed/selected. [REDACTED] if credential-like.' },
          pageGuess: { type: 'string', description: 'best-guess page name this action happened on' },
        },
      },
    },
    pagesVisited: {
      type: 'array',
      description: 'ordered distinct pages, deduped',
      items: {
        type: 'object',
        required: ['pageGuess'],
        properties: {
          pageGuess: { type: 'string' },
          url: { type: 'string' },
          firstActionId: { type: 'integer' },
          lastActionId: { type: 'integer' },
        },
      },
    },
  },
}

phase('Extract')

const journeys = await parallel(mineable.map((t, i) => () =>
  agent(`
You are extracting the action timeline from ONE Playwright trace. This is the raw journey story.

${GUARD_RAILS}

${CORPUS_FACTS}

${TRACE_CLI}

## Your trace

- hash: \`${t.hash}\`
- title: \`${t.title}\`
- relevance: \`${t.relevance}\`
- expected actions: ~${t.actions}

## Your private working directory

\`${TILDE}/work/x${i}\` — create it with \`mkdir -p\` first. Work ONLY there. Do not use another
agent's directory; do not use the workarea root.

## Steps

1. \`mkdir -p ${TILDE}/work/x${i}\`
2. \`cd ${TILDE}/work/x${i}; ${PW} open ${DATA_TILDE}/${t.hash}.zip\`
3. \`cd ${TILDE}/work/x${i}; ${PW} actions > actions.txt\`
   Then Read \`${ABS}/work/x${i}/actions.txt\` with the Read tool (use \`offset\`/\`limit\` to page a
   long file — that is far cheaper than repeated Bash calls). **Get ALL of it — do not sample.**
4. Transcribe EVERY action into the schema. Do not summarise, do not skip repetitive ones.
   - Record the literal locator string verbatim, e.g. \`getByRole('radio', { name: 'Live animals' })\`.
     The accessible name inside it IS the on-screen label — it is the single most valuable token here.
   - Record fill/select values literally, e.g. \`Fill "06011010"\` -> value \`06011010\`.
     If a value looks like a password/token, write \`[REDACTED]\`.
   - Ignore pure test-harness noise (\`Before Hooks\`, \`Fixture "context"\`, \`Create context\`,
     \`Create page\`, \`After Hooks\`) — but DO record \`Navigate to\`.
5. Derive \`pagesVisited\`: walk the timeline and group consecutive actions into pages. A new page
   starts at a \`Navigate to\`, or after a \`Save and continue\`/\`Continue\`/\`Submit\` click. Name each
   page from the visible heading if you can infer it, else from the URL path segment.
   Record the first and last action id for each — later waves need an action id to snapshot.
6. Write your full result as JSON to \`${ABS}/journeys/${t.hash}.json\` (Write tool, absolute path).
7. \`cd ${TILDE}/work/x${i}; ${PW} close\`

Return the structured object.
`, { schema: JOURNEY_SCHEMA, phase: 'Extract', label: `extract:${t.relevance}:${t.hash.slice(0, 7)}` })
))

const goodJourneys = journeys.filter(Boolean)
log(`Extracted ${goodJourneys.length}/${mineable.length} journeys`)
if (goodJourneys.length === 0) throw new Error('No journeys extracted — aborting')

const totalSteps = goodJourneys.reduce((n, j) => n + (j.steps?.length ?? 0), 0)
log(`${totalSteps} actions captured across ${goodJourneys.length} traces`)

// Barrier is CORRECT here: the page inventory is a dedup across ALL journeys at once.
phase('Inventory')

const INVENTORY_SCHEMA = {
  type: 'object',
  required: ['pages'],
  properties: {
    journeyOrder: {
      type: 'array',
      description: 'the canonical ordered create journey, page slugs',
      items: { type: 'string' },
    },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        required: ['slug', 'name', 'evidence'],
        properties: {
          slug: { type: 'string', description: 'kebab-case stable id' },
          name: { type: 'string' },
          urlPattern: { type: 'string' },
          order: { type: 'integer', description: 'position in the create journey, 0-based; -1 if not on the linear path' },
          conditional: { type: 'string', description: 'when this page appears, or "always"' },
          evidence: {
            type: 'array',
            description: 'where to snapshot it: which trace + action id',
            items: {
              type: 'object',
              required: ['hash', 'actionId'],
              properties: {
                hash: { type: 'string' },
                actionId: { type: 'integer' },
                note: { type: 'string' },
              },
            },
          },
        },
      },
    },
    notes: { type: 'string' },
  },
}

const inventory = await agent(`
You are building the canonical page inventory for the IPAFFS ${CHED.name} journey by deduplicating
${goodJourneys.length} extracted trace timelines.

${GUARD_RAILS}

${CORPUS_FACTS}

## Input

Per-trace journey JSON files are in \`${ABS}/journeys/\` (one per trace hash). List them with
\`ls ${TILDE}/journeys/\` and read them with the Read tool.

## Corroborating source — use it, it is high quality

The QA automation repo at \`${QA_TILDE}\` encodes the intended journey explicitly:
- \`workflows/notification/${CHED.qaSlug}-workflows.ts\` — the journey orchestration. Its
  create-notification functions walk the pages IN ORDER. This is the best
  statement of intended order that exists.
- \`tests/accessibility/${CHED.qaSlug}-accessibility-tests.spec.ts\` — walks EVERY page in the journey
  and names each one. Excellent ground truth for the page set.
- \`page-objects/notification/*.ts\` — one file per page, exposing that page's fields.

Read those (\`grep -rn\`, \`cat\`, Read tool) and reconcile against the trace evidence. Where the
traces and the specs disagree, TRUST THE TRACES for what rendered, but trust the specs for the
intended order (remember: traces are all from failed/retried runs).

## Your task

1. Merge every trace's \`pagesVisited\` into ONE distinct page set. The same page appears in many
   traces under slightly different guesses — collapse them. Key on URL pattern + heading.
2. Assign each page a stable kebab-case \`slug\` and a human \`name\`.
3. Determine \`order\` — the canonical linear create-journey position. Pages off the linear path
   (hub spokes, error pages, post-submission) get \`-1\` and an explanation in \`conditional\`.
4. Record \`conditional\` — is this page always shown, or only for a variant (CSV upload, Article 72,
   CUC billing, split consignment, DoA agent)?
5. For each page, record \`evidence\`: 1-3 (hash, actionId) pairs pointing at an action that
   happened ON that page. Prefer an action from a \`core-journey\` trace with a high action count.
   **The next wave snapshots exactly these — a wrong actionId wastes a whole agent, so pick
   carefully: choose an actionId in the MIDDLE of the page's action range, not the last one
   (the last is usually the click that navigates AWAY).**
6. Produce \`journeyOrder\` — the ordered list of slugs for the linear create journey.

Write the result to \`${ABS}/page-inventory.json\` (Write tool). Return the structured object.

Be exhaustive. A page you miss here is a page nobody ever writes a requirement for.
`, { schema: INVENTORY_SCHEMA, phase: 'Inventory', label: 'inventory:dedup' })

const allPages = (inventory?.pages ?? []).filter(p => p && p.slug && (p.evidence?.length ?? 0) > 0)

// Post-submission (inspector / PHSI checks / decisions) is a different service and is explicitly
// out of scope for this backlog, so combing those pages burns agents for nothing. Excluded here
// rather than silently — say what was dropped.
const OUT_OF_SCOPE = /^decision-/
const pages = allPages.filter(p => !OUT_OF_SCOPE.test(p.slug))
const skipped = allPages.filter(p => OUT_OF_SCOPE.test(p.slug))

log(`Page inventory: ${allPages.length} distinct pages`)
if (skipped.length) log(`Excluded ${skipped.length} post-submission pages (out of scope): ${skipped.map(p => p.slug).join(', ')}`)
log(`Combing ${pages.length} in-scope pages`)
log(`Journey order: ${(inventory?.journeyOrder ?? []).join(' -> ')}`)
if (pages.length === 0) throw new Error('Empty page inventory — aborting')

// ---------------------------------------------------------------------------
// The fine-tooth comb. Per page: Comb -> Corroborate -> Verify, pipelined so a
// page reaches Verify as soon as ITS comb+corroborate are done. No barrier.
// ---------------------------------------------------------------------------

const PAGE_SPEC_SCHEMA = {
  type: 'object',
  required: ['slug', 'fields', 'confidence'],
  properties: {
    slug: { type: 'string' },
    name: { type: 'string' },
    url: { type: 'string' },
    pageTitle: { type: 'string', description: 'verbatim <title>' },
    caption: { type: 'string', description: 'GOV.UK section caption above the H1, verbatim' },
    heading: { type: 'string', description: 'verbatim H1' },
    bodyCopy: { type: 'array', items: { type: 'string' }, description: 'verbatim paragraphs/inset/warning text in main' },
    backLink: { type: 'string' },
    continueLabel: { type: 'string', description: 'verbatim label of the primary button' },
    secondaryActions: { type: 'array', items: { type: 'string' } },
    layout: {
      type: 'string',
      description: 'GOV.UK grid layout, from the govuk-grid-* classes, e.g. "govuk-grid-row > govuk-grid-column-two-thirds"',
    },
    structure: {
      type: 'array',
      description: 'ordered outline of the main content region — the page skeleton, top to bottom',
      items: {
        type: 'object',
        required: ['element'],
        properties: {
          element: { type: 'string', description: 'e.g. "caption", "h1", "paragraph", "radios", "button", "summary-list", "table", "details"' },
          text: { type: 'string', description: 'verbatim text, truncated to ~120 chars if long' },
          govukComponent: { type: 'string' },
        },
      },
    },
    govukComponents: {
      type: 'array',
      description: 'every GOV.UK Design System component used on this page, identified by its govuk-* class',
      items: {
        type: 'object',
        required: ['component', 'evidence'],
        properties: {
          component: { type: 'string', description: 'Design System name, e.g. "Radios", "Date input", "Select", "Error summary", "Summary list", "Task list", "Inset text", "Warning text", "Details", "Accordion", "Table", "Character count", "File upload", "Button", "Back link", "Panel", "Notification banner"' },
          govukClass: { type: 'string', description: 'the root class observed, e.g. "govuk-radios"' },
          modifiers: { type: 'array', items: { type: 'string' }, description: 'e.g. "govuk-radios--inline", "govuk-button--secondary", "govuk-heading-xl"' },
          count: { type: 'integer' },
          usage: { type: 'string', description: 'what it is used for on this page' },
          evidence: { type: 'string' },
        },
      },
    },
    nonStandardPatterns: {
      type: 'array',
      description: 'anything NOT from the GOV.UK Design System — custom classes, bespoke widgets, third-party libs (e.g. accessible-autocomplete), IPAFFS-specific markup, or a govuk component used in a non-standard way. This directly informs whether the new app can stay inside the govuk-frontend toolbox.',
      items: {
        type: 'object',
        required: ['pattern', 'concern'],
        properties: {
          pattern: { type: 'string', description: 'the class/markup observed' },
          whatItDoes: { type: 'string' },
          concern: { type: 'string', description: 'why it is non-standard and what it implies for the rebuild' },
          govukAlternative: { type: 'string', description: 'the standard Design System component that could replace it, if one exists' },
          evidence: { type: 'string' },
        },
      },
    },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        required: ['label', 'control', 'confidence'],
        properties: {
          name: { type: 'string', description: 'the HTML name/id attribute if observable' },
          label: { type: 'string', description: 'verbatim visible label' },
          hint: { type: 'string', description: 'verbatim hint text' },
          control: { type: 'string', description: 'text | number | radio | checkbox | select | date | file | textarea | autocomplete' },
          required: { type: 'boolean' },
          options: {
            type: 'array',
            description: 'EVERY option, verbatim. For a select, all of them.',
            items: { type: 'string' },
          },
          optionsTruncated: { type: 'boolean', description: 'true if you capped a very long list' },
          optionCount: { type: 'integer' },
          observedValues: { type: 'array', items: { type: 'string' }, description: 'values actually entered in traces' },
          conditionalOn: { type: 'string', description: 'shown only when...' },
          confidence: { type: 'string', enum: ['confirmed', 'inferred', 'gap'] },
          evidence: { type: 'string', description: 'trace hash + action id, or file_path:line' },
        },
      },
    },
    validationMessages: {
      type: 'array',
      items: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', description: 'verbatim error text' },
          field: { type: 'string' },
          trigger: { type: 'string' },
          confidence: { type: 'string', enum: ['confirmed', 'inferred', 'gap'] },
          evidence: { type: 'string' },
        },
      },
    },
    confidence: { type: 'string', enum: ['confirmed', 'inferred', 'gap'] },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
}

// PAGE_SPEC_SCHEMA above is deliberately NOT passed as an agent output `schema`. It is large,
// and an oversized output schema is rejected by the safety classifier ("output schema too large
// to classify safely") — which silently killed all 52 Comb agents on the first run. It was never
// needed as a schema anyway: the page spec's home is the FILE on disk, not the return value.
// So it is handed to the agent as documentation of the file shape, and the agent returns only a
// small receipt that the parent uses for accounting.
const PAGE_SPEC_SHAPE = JSON.stringify(PAGE_SPEC_SCHEMA, null, 2)

const COMB_RESULT_SCHEMA = {
  type: 'object',
  required: ['slug', 'wrote', 'fieldCount', 'confidence'],
  properties: {
    slug: { type: 'string' },
    wrote: { type: 'boolean', description: 'true only if you actually wrote the page spec file' },
    heading: { type: 'string', description: 'the verbatim H1 you observed — proves you were on the right page' },
    fieldCount: { type: 'integer' },
    componentCount: { type: 'integer', description: 'distinct GOV.UK components identified' },
    nonStandardCount: { type: 'integer', description: 'non-govuk patterns found (0 is a fine and useful answer)' },
    validationMessageCount: { type: 'integer' },
    confidence: { type: 'string', enum: ['confirmed', 'inferred', 'gap'] },
    evidenceWasWrong: { type: 'boolean', description: 'true if the evidence pointer landed on a different page and you had to find your own action id' },
    notes: { type: 'string', description: 'anything the parent needs to know — surprises, gaps, wrong pointers' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['slug', 'verdict', 'corrections'],
  properties: {
    slug: { type: 'string' },
    verdict: { type: 'string', enum: ['sound', 'corrected', 'unsound'] },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'problem', 'fix'],
        properties: {
          claim: { type: 'string' },
          problem: { type: 'string', description: 'invented copy? wrong confidence tag? missing field? uncited?' },
          fix: { type: 'string' },
        },
      },
    },
    missedFields: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
}

phase('Comb')

const pageResults = await pipeline(
  pages,

  // Stage 1 — COMB: mine the rendered DOM for every last detail.
  (p, _orig, i) => agent(`
You are mining ONE page of the IPAFFS ${CHED.name} journey down to the last detail, from real DOM
snapshots captured in Playwright traces. This is a fine-tooth-comb job. Missing a field here
means the rebuilt app silently loses it.

${GUARD_RAILS}

${CORPUS_FACTS}

${TRACE_CLI}

${CONFIDENCE}

## Your page

- slug: \`${p.slug}\`
- name: \`${p.name}\`
- url pattern: \`${p.urlPattern ?? 'unknown'}\`
- journey position: ${p.order}
- conditional: ${p.conditional ?? 'always'}

## Evidence to snapshot (trace hash + action id)

${(p.evidence ?? []).map(e => `- trace \`${e.hash}\`, action \`${e.actionId}\`${e.note ? ` — ${e.note}` : ''}`).join('\n')}

## Your private working directory

\`${TILDE}/work/p${i}\` — \`mkdir -p\` it first. Work ONLY there.

## Method

For EACH evidence pair:

1. \`mkdir -p ${TILDE}/work/p${i}\`
2. \`cd ${TILDE}/work/p${i}; ${PW} open ${DATA_TILDE}/<hash>.zip\`
3. \`cd ${TILDE}/work/p${i}; ${PW} action <actionId>\` — confirms the action and lists available
   snapshot phases. **Sanity-check you are on the right page.** If the action turns out to be on a
   different page than \`${p.name}\`, do not give up: run \`${PW} actions\`, find an action that IS on
   your page (match on the locator's accessible name / the navigate URL), and use that id instead.
   Say in \`openQuestions\` that the evidence pointer was wrong.
4. \`cd ${TILDE}/work/p${i}; ${PW} snapshot <actionId> --name before\` — the accessibility tree.
   This gives you: Page Title, headings, and every control with its accessible name. Read ALL of it.
5. Then go deeper than the a11y tree with \`eval\`. The a11y tree omits hint text, \`name\` attributes,
   full \`<select>\` option lists and hidden error summaries. Run these (one Bash call each):
   - \`cd ${TILDE}/work/p${i}; ${PW} snapshot <actionId> -- eval "document.querySelector('main').innerText"\`
     — all visible text incl. hints and captions.
   - \`cd ${TILDE}/work/p${i}; ${PW} snapshot <actionId> -- eval "Array.from(document.querySelectorAll('input,select,textarea')).map(e=>e.tagName+'|'+e.type+'|'+e.name+'|'+e.id+'|'+(e.required||false)).join('\\n')"\`
     — the real control inventory incl. name/id/required.
   - \`cd ${TILDE}/work/p${i}; ${PW} snapshot <actionId> -- eval "Array.from(document.querySelectorAll('select')).map(s=>s.name+' :: '+s.options.length+' :: '+Array.from(s.options).slice(0,40).map(o=>o.value+'='+o.text).join(' | ')).join('\\n\\n')"\`
     — select options. If a list is huge (countries, commodity codes, BCPs), record the count, the
     first ~20 verbatim, set \`optionsTruncated: true\`, and note that it is reference data (the new
     app will source it from a reference-data service, not hardcode it).
   - \`cd ${TILDE}/work/p${i}; ${PW} snapshot <actionId> -- eval "document.querySelector('.govuk-error-summary')?.innerText || 'none'"\`
     — validation errors, if this snapshot caught an error state.
   - \`cd ${TILDE}/work/p${i}; ${PW} snapshot <actionId> -- eval "Array.from(document.querySelectorAll('.govuk-hint')).map(e=>e.id+' :: '+e.innerText).join('\\n')"\`
     — hint text.

6. **PAGE STRUCTURE AND GOV.UK COMPONENTS — do not skip this.** The accessibility tree does NOT
   show which Design System components are used. You must go to the HTML classes for that. The
   new app will be built with govuk-frontend, so knowing exactly which components each page uses
   — and where IPAFFS went outside the toolbox — is directly load-bearing.

   These evals are verified to work; run them (one Bash call each):
   - **Component inventory** — every class used in main:
     \`cd ${TILDE}/work/p${i}; ${PW} snapshot <actionId> -- eval "Array.from(new Set(Array.from(document.querySelectorAll('main [class]')).flatMap(e=>Array.from(e.classList)))).sort().join('\\n')"\`
     A real page returns e.g. \`govuk-button, govuk-caption-xl, govuk-fieldset, govuk-fieldset__legend,
     govuk-form-group, govuk-grid-column-full, govuk-grid-row, govuk-heading-xl, govuk-label,
     govuk-radios, govuk-radios__input, govuk-radios__item, govuk-radios__label\`.
     Map root classes to Design System components: \`govuk-radios\` -> Radios, \`govuk-date-input\` ->
     Date input, \`govuk-summary-list\` -> Summary list, \`govuk-task-list\` -> Task list,
     \`govuk-error-summary\` -> Error summary, \`govuk-inset-text\` -> Inset text,
     \`govuk-warning-text\` -> Warning text, \`govuk-details\` -> Details, \`govuk-accordion\` -> Accordion,
     \`govuk-character-count\` -> Character count, \`govuk-panel\` -> Panel,
     \`govuk-notification-banner\` -> Notification banner, and so on.
     Record modifiers too (\`govuk-radios--inline\`, \`govuk-button--secondary\`, \`govuk-!-width-one-half\`)
     — they are part of the design intent.
   - **Non-standard markup** — anything NOT prefixed \`govuk-\`:
     \`cd ${TILDE}/work/p${i}; ${PW} snapshot <actionId> -- eval "Array.from(new Set(Array.from(document.querySelectorAll('main [class]')).flatMap(e=>Array.from(e.classList)).filter(c=>!c.startsWith('govuk-')))).sort().join('\\n')"\`
     **This is a high-value output.** Custom classes, IPAFFS-specific widgets, third-party libraries
     (\`autocomplete__*\` from accessible-autocomplete is the likely one), jQuery plugins, bespoke
     tables/grids. For each, say what it does, why it is non-standard, and whether a standard
     Design System component could replace it in the new app. If a page is 100% \`govuk-*\`, say so
     explicitly — that is a good and useful finding.
   - **Layout** — read the \`govuk-grid-*\` classes from the inventory above (e.g.
     \`govuk-grid-column-two-thirds\` vs \`-full\`) and record it in \`layout\`.
   - **Structure outline** — the page skeleton in order:
     \`cd ${TILDE}/work/p${i}; ${PW} snapshot <actionId> -- eval "Array.from(document.querySelectorAll('main h1,main h2,main h3,main p,main label,main legend,main .govuk-caption-xl,main .govuk-caption-l,main .govuk-caption-m,main button,main .govuk-button,main .govuk-inset-text,main .govuk-warning-text,main .govuk-details,main .govuk-summary-list,main table')).map(e=>e.tagName+'.'+(e.className||'-')+' :: '+(e.innerText||'').trim().slice(0,120).replace(/\\n/g,' / ')).join('\\n')"\`
     Transcribe into \`structure\` — this is what a developer needs to rebuild the page.

7. If any of the above is ambiguous, get the raw HTML and read it directly:
   \`cd ${TILDE}/work/p${i}; ${PW} snapshot <actionId> -- eval "document.querySelector('main').outerHTML" --filename=main.html\`
   then Read \`${ABS}/work/p${i}/main.html\` with the Read tool. Do this whenever the class inventory
   surprises you — the HTML is the ground truth for structure.

   Budget: do not burn more than ~20 Bash calls on this page. If an eval errors, adjust and retry.

8. \`cd ${TILDE}/work/p${i}; ${PW} close\` when done.

## Rules

- **Verbatim or nothing.** Copy labels, hints, headings and error text EXACTLY as rendered —
  including capitalisation and any trailing punctuation. Do not tidy GOV.UK copy. Do not paraphrase.
  If you did not see it, do not write it: mark \`gap\`.
- Capture EVERY control, including ones no test ever touched. The a11y tree shows them all.
- \`observedValues\` = values actually typed in traces (from the extracted journeys, if useful).
- Skip page furniture (cookie banner, GOV.UK header, Beta banner, footer, skip link, the
  "Michael Scott | Address book | Manage account | Sign out" account bar). Those are platform
  chrome, not requirements. DO capture the section caption, H1, back link and primary button.
- Set the page-level \`confidence\` to the WEAKEST of your field confidences.

## YOUR DELIVERABLE IS THE FILE — this is the important bit

Write the full page spec to \`${ABS}/pages/${p.slug}.json\` using the **Write tool**. That file is
the deliverable and the ONLY place the detail lives. Everything downstream reads it. If you do not
write it, your work is lost and the page is silently missing from the whole exercise.

The file must be a single JSON object conforming to this JSON Schema:

\`\`\`json
${PAGE_SPEC_SHAPE}
\`\`\`

Then **return only a short receipt** matching your (small) output schema — counts, the verbatim H1,
and any notes. Do NOT try to return the whole spec; it lives in the file.

Write the file BEFORE you return.
`, { schema: COMB_RESULT_SCHEMA, phase: 'Comb', label: `comb:${p.slug}` }),

  // Stage 2 — CORROBORATE: triangulate against tests + legacy code.
  (spec, p) => {
    if (!spec) return null
    return agent(`
You are corroborating a trace-derived page spec against the two OTHER sources of truth, and
filling its gaps.

${GUARD_RAILS}

${CORPUS_FACTS}

${CONFIDENCE}

## The page spec to corroborate

Read it: \`${ABS}/pages/${p.slug}.json\` (Read tool).
Page: \`${p.name}\` (slug \`${p.slug}\`), journey position ${p.order}.

## SCOPE — where requirements may come from

Requirements are derived from **the rendered frontend (traces)** and **the tests**. Those are the
only two admissible sources.

**Do NOT read the IPAFFS application source** — not the Handlebars templates, not the route
handlers, not the Java model, not \`ValidationMessages.properties\`. It is out of scope for
requirements gathering, and inferring requirements from it is exactly what we are avoiding.
(A separate wave handles integration points; that is not your job.)

So: your second source is the **QA automation repo only** — the tests that drove these traces.

## Source 2 — the QA automation repo (\`${QA_TILDE}\`)

Use \`grep -rn\` / \`cat\` / Read tool. NOT the Grep tool; NOT \`find\` (not allowlisted outside the workspace).
- \`page-objects/notification/*.ts\` — find THE page object for this page. It names the fields the
  tests drive, with their locators. Cite \`file_path:line\`.
- \`workflows/notification/${CHED.qaSlug}-workflows.ts\` — how this page is filled in, in journey context,
  and any conditional logic around it. The notification-config interface + \`DEFAULT_CONFIG\`
  near the top is a de-facto payload for the whole journey, and its optional fields tell you which
  parts of the page are variant-only.
- \`types/*.ts\` — the domain vocabulary (\`commodity-code.ts\`, \`country.ts\`, \`package-type.ts\`,
  \`quantity-type.ts\`, \`document-type.ts\`, \`bcp.ts\`, \`commodity-class.ts\`, \`eppo-code.ts\`).
  These are real values the tests use.
- \`tests/notification/${CHED.qaSlug}/*.spec.ts\` — what behaviour is asserted about this page. Assertions
  are requirements stated by a human: an \`expect\` on a message or a status is a rule.
- \`tests/accessibility/${CHED.qaSlug}-accessibility-tests.spec.ts\` — names every page in journey order.

## Your task

1. For every field in the spec, find its counterpart in the page object / workflow config. Firm up
   \`required\`, \`options\`, \`conditionalOn\`, and \`observedValues\`.
2. **Find fields and behaviours the traces MISSED.** A page object may expose a control no trace in
   our corpus ever rendered (a variant-only branch). A test may assert a rule we never saw fire.
   ADD these with \`confidence: "inferred"\` and a \`file_path:line\` citation. This is the most
   valuable thing you do — traces are a lower bound, and this is how we honestly raise it.
3. **Validation messages**: mark \`confirmed\` only where a trace actually rendered the message. If a
   test asserts an error message string, that is \`inferred\` — cite the spec line. If we have
   neither, it is a \`gap\`. Do not go hunting in the legacy source to fill these in; an honest
   \`gap\` is the correct answer and becomes a question for a human.
4. Do NOT downgrade or overwrite anything marked \`confirmed\` with trace evidence. Rendered reality
   wins. If a test's expectation and the rendered trace disagree, keep the trace value, keep
   \`confirmed\`, and record the discrepancy in \`openQuestions\` — that disagreement is a finding.
5. Add \`openQuestions\` for anything genuinely ambiguous — a human will answer these.

## YOUR DELIVERABLE IS THE FILE

Rewrite the enriched spec back to \`${ABS}/pages/${p.slug}.json\` (Write tool, same path, complete
file, same JSON Schema it already conforms to — read the existing file to see the shape). Preserve
everything already there unless you are correcting it; you are ENRICHING, not replacing.

Then **return only a short receipt** matching your (small) output schema. Do not return the spec
itself. Write the file BEFORE you return.
`, { schema: COMB_RESULT_SCHEMA, phase: 'Corroborate', label: `corrob:${p.slug}` })
  },

  // Stage 3 — VERIFY: adversarial. Try to break the spec.
  (spec, p, idx) => {
    if (!spec) return null
    return agent(`
You are an adversarial reviewer. Your job is to REFUTE a page spec, not to approve it.
Assume it is wrong until you have checked it against the raw evidence yourself.

${GUARD_RAILS}

${CORPUS_FACTS}

${TRACE_CLI}

${CONFIDENCE}

## Target

\`${ABS}/pages/${p.slug}.json\` — read it (Read tool).
Page \`${p.name}\`. Evidence pointers:
${(p.evidence ?? []).map(e => `- trace \`${e.hash}\`, action \`${e.actionId}\``).join('\n')}

## Your private working directory

\`${TILDE}/work/v${idx}\` — \`mkdir -p\` it first. Work ONLY there.

## Hunt for these specific failure modes

1. **Invented copy** — a label, hint, heading or error message marked \`confirmed\` that does NOT
   appear in the actual snapshot. Re-open the trace and check the exact strings. This is the worst
   and most likely failure: an LLM tidying GOV.UK copy ("Save and continue" -> "Continue",
   sentence-casing a label, dropping a trailing full stop). Diff character by character.
2. **Confidence inflation** — \`confirmed\` on something only found in source code (should be
   \`inferred\`), or \`inferred\` on something that is really a \`gap\` (no evidence at all).
3. **Uncited claims** — any field or message with no \`evidence\`. Those are inadmissible.
4. **Missed controls** — re-run the control inventory eval yourself and diff against the spec's
   field list. Anything present in the DOM but absent from the spec is a \`missedField\`.
5. **Wrong page** — does the snapshot's H1 actually match the spec's \`heading\`? If the evidence
   pointer landed on a different page, the whole spec may be about the wrong thing. Say so loudly.
6. **Fabricated option lists** — if \`options\` are listed, verify a sample against the DOM.

Re-derive independently. Verify with at least:
- \`cd ${TILDE}/work/v${idx}; ${PW} open ${DATA_TILDE}/<hash>.zip\`
- \`cd ${TILDE}/work/v${idx}; ${PW} snapshot <actionId> --name before\`
- \`cd ${TILDE}/work/v${idx}; ${PW} snapshot <actionId> -- eval "document.querySelector('main').innerText"\`
- \`cd ${TILDE}/work/v${idx}; ${PW} snapshot <actionId> -- eval "Array.from(document.querySelectorAll('input,select,textarea')).map(e=>e.tagName+'|'+e.type+'|'+e.name).join('\\n')"\`

Default to \`corrected\` if you find real problems, \`unsound\` if the spec is about the wrong page or
is mostly fabricated, \`sound\` ONLY if you genuinely could not fault it. Being unable to find a
problem is a valid outcome — do not invent corrections to seem useful.

**Apply your corrections**: rewrite the corrected spec back to \`${ABS}/pages/${p.slug}.json\`
(Write tool, complete file). Then return your verdict object describing what you changed.
`, { schema: VERDICT_SCHEMA, phase: 'Verify', label: `verify:${p.slug}` })
  },
)

const verdicts = pageResults.filter(Boolean)
const unsound = verdicts.filter(v => v.verdict === 'unsound')
const corrected = verdicts.filter(v => v.verdict === 'corrected')
const totalCorrections = verdicts.reduce((n, v) => n + (v.corrections?.length ?? 0), 0)
log(`Verified ${verdicts.length}/${pages.length} pages — ${unsound.length} unsound, ${corrected.length} corrected, ${totalCorrections} corrections applied`)
if (unsound.length) log(`UNSOUND pages needing human eyes: ${unsound.map(v => v.slug).join(', ')}`)

// HARD GATE. On the first run every Comb agent was killed by the classifier, pages/ stayed empty,
// and the workflow sailed on to produce a model and a 50-increment backlog built on nothing —
// a confident-looking deliverable with no evidence under it. That must never happen silently:
// downstream waves are worthless without page specs, so fail loudly instead of fabricating.
if (verdicts.length === 0) {
  throw new Error(
    'Comb/Verify produced ZERO page specs — pages/ is empty. Refusing to build a model or backlog ' +
    'from no evidence. Check the Comb failures (a classifier rejection or a bad evidence pointer ' +
    'kills the whole wave silently).',
  )
}
if (verdicts.length < pages.length / 2) {
  log(`WARNING: only ${verdicts.length} of ${pages.length} pages produced a spec — the journey spec ` +
      `will be substantially incomplete. Treat everything downstream as provisional.`)
}

// ---------------------------------------------------------------------------

phase('Reconcile')

const RECONCILE_SCHEMA = {
  type: 'object',
  required: ['pages', 'conflicts'],
  properties: {
    pages: { type: 'integer' },
    obligations: { type: 'integer', description: 'total distinct fields across the journey' },
    conflicts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'topic', 'sources', 'detail', 'ruling'],
        properties: {
          id: { type: 'string', description: 'c-001, c-002, ...' },
          topic: { type: 'string' },
          pageSlug: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' }, description: 'which sources disagree: rendered-trace | test-assertion | page-object | workflow-config' },
          detail: { type: 'string', description: 'what each source says, verbatim where possible' },
          ruling: { type: 'string', description: 'the precedence winner adopted into the spec' },
          needsHuman: { type: 'boolean', description: 'true if precedence cannot honestly settle it' },
        },
      },
    },
    modelGaps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['marker', 'detail'],
        properties: {
          marker: { type: 'string', description: 'short kebab-case id, e.g. cross-page-conditionality' },
          detail: { type: 'string' },
          affectedPages: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    confidenceCounts: { type: 'string', description: 'confirmed / inferred / gap counts across all fields' },
    consequentialDecisions: { type: 'array', items: { type: 'string' }, description: 'your 5 most consequential mapping decisions' },
  },
}

const reconciled = await agent(`
Merge the verified per-page specs into ONE canonical machine-readable journey spec, plus a conflict
register. This mirrors the workspace's \`journey-builder\` skill: a canonical
\`journey-spec.json\` + \`conflicts.json\`, reviewed at a spec gate.

${GUARD_RAILS}

${CORPUS_FACTS}

${CONFIDENCE}

## Inputs

- \`${ABS}/pages/*.json\` — the verified per-page specs (\`ls ${TILDE}/pages/\`, Read each). ALL of them.
- \`${ABS}/page-inventory.json\` — canonical journey order.

## Ground rules (adopted from journey-builder)

**Precedence when sources disagree — declare it, apply it, never silently:**
1. **rendered-trace** — what the app actually displayed. Wins on copy, labels, options, structure,
   components. Rendered reality beats everything.
2. **test-assertion** — an \`expect(...)\` in a spec. A human wrote that rule down deliberately.
   Wins on *intent* where the traces are silent.
3. **page-object / workflow-config** — reveals a control exists and what values get used, but is
   the weakest evidence of intent.

**EVERY disagreement gets a conflict entry** — recorded, never blocking. Pick the precedence winner,
adopt it into the spec, and reference the conflict id from the affected field
(\`"conflicts": ["c-001"]\`). Number them \`c-001\` upward. A conflict is not a failure; it is the
audit trail of a decision. Set \`needsHuman: true\` only where precedence genuinely cannot settle it.

**Provenance on every field.** Each field carries the sources that evidenced it, not just one.

**Do not force-fit.** If something cannot be expressed cleanly in the model (a field conditional on
a value collected on a *different* page; a "at least one of these" rule across siblings; a
repeating group inside a repeating group), model it best-effort AND mark it with a \`modelGap\`
marker naming the problem. Marking a gap is correct behaviour; inventing a mechanism is not.

## Your task

1. Merge every page spec into \`journey-spec.json\` with this shape:
   - \`journey\`: id, name, description
   - \`sources\`: what was mined (trace corpus size, test repo), and the precedence order
   - \`pages[]\`: slug, name, order, url, conditional, layout, caption, heading, bodyCopy,
     backLink, continueLabel, structure[], govukComponents[], nonStandardPatterns[],
     fields[], validationMessages[], confidence, conflicts[], provenance[]
   - \`fields\` carry: name, label, hint, control, required, options, optionCount,
     optionsTruncated, observedValues, conditionalOn, confidence, provenance[], conflicts[],
     modelGap (optional)
   - \`conflicts\`: the register (also written separately)
   - \`modelGaps\`: the markers
2. Write \`${ABS}/journey-spec.json\` and \`${ABS}/conflicts.json\` (Write tool).
3. **Deduplicate across pages.** The same logical field may appear on several pages (a summary/CYA
   page restates everything). Do not invent a second obligation for a restatement — link it.
4. Count fields by confidence and report the numbers honestly in \`confidenceCounts\`.
5. Write \`${ABS}/SPEC-GATE.md\` — the human review artefact. It must contain:
   - page count, field count, and the confidence breakdown (the honest numbers)
   - the full conflict register as a table, with the ruling for each, \`needsHuman\` ones FIRST
   - the modelGap list
   - every \`openQuestion\` gathered from the page specs, deduplicated
   - the GOV.UK component inventory across the journey, and every \`nonStandardPattern\` found
   - your 5 most consequential mapping decisions
   This is what Sam reads to accept or reject the spec. Make it skimmable and honest — surface the
   weak parts at the top, not buried.

Return the structured object.
`, { schema: RECONCILE_SCHEMA, phase: 'Reconcile', label: 'reconcile:spec' })

// Same hard-gate rule as Comb, one layer down: agent() returns null on a terminal error (session
// limit, API drop). Without this the run "succeeds" and reports zeros, which reads as "nothing
// found" rather than "the wave never ran". Fail loudly — the page specs on disk are safe and a
// resume replays every cached agent, so throwing costs nothing but a re-invoke.
if (!reconciled) throw new Error('Reconcile wave returned nothing (agent died — likely session limit or API drop). Page specs are on disk; resume this run to continue.')

const conflicts = reconciled?.conflicts ?? []
const needsHuman = conflicts.filter(c => c?.needsHuman)
log(`Spec reconciled: ${reconciled?.pages ?? 0} pages, ${reconciled?.obligations ?? 0} fields`)
log(`Conflicts: ${conflicts.length} (${needsHuman.length} need a human ruling)`)
log(`Model gaps: ${(reconciled?.modelGaps ?? []).length}`)
log(`Confidence: ${reconciled?.confidenceCounts ?? 'unreported'}`)

phase('Integrations')

const INTEGRATIONS_SCHEMA = {
  type: 'object',
  required: ['integrations'],
  properties: {
    integrations: {
      type: 'array',
      items: {
        type: 'object',
        required: ['system', 'purpose', 'confidence'],
        properties: {
          system: { type: 'string', description: 'the external system, e.g. "Reference data", "Commodity code lookup", "Dynamics", "GVMS", "File upload / antivirus scanning", "Trade Platform (SOAP)", "Notify", "Defra ID / auth"' },
          purpose: { type: 'string', description: 'what the journey needs it for, in plain English' },
          usedByPages: { type: 'array', items: { type: 'string' }, description: 'page slugs that depend on it' },
          shape: { type: 'string', description: 'what the call looks like: protocol (REST/SOAP/OData/queue), method + path, and the request/response shape' },
          exampleRequest: { type: 'string' },
          exampleResponse: { type: 'string' },
          direction: { type: 'string', enum: ['inbound', 'outbound', 'both'] },
          neededForFirstPass: { type: 'boolean', description: 'is this needed for a first-pass journey that builds JSON and persists to Mongo?' },
          firstPassApproach: { type: 'string', description: 'if not needed: stub it, hardcode it, or defer it — and say which' },
          confidence: { type: 'string', enum: ['confirmed', 'inferred', 'gap'] },
          evidence: { type: 'string' },
        },
      },
    },
    referenceDataSources: {
      type: 'array',
      description: 'each reference-data list the journey needs, and where it comes from',
      items: {
        type: 'object',
        required: ['list', 'source'],
        properties: {
          list: { type: 'string', description: 'e.g. countries, commodity codes, EPPO codes, BCPs, package types, quantity types, document types' },
          source: { type: 'string' },
          approximateSize: { type: 'string' },
          usedByPages: { type: 'array', items: { type: 'string' } },
          firstPassApproach: { type: 'string' },
          evidence: { type: 'string' },
        },
      },
    },
    notes: { type: 'string' },
  },
}

const integrations = await agent(`
Map the **integration points** the ${CHED.name} journey depends on: what other systems it talks to,
and what those calls actually look like. This is the ONE wave that is allowed to read application code.

${GUARD_RAILS}

${CORPUS_FACTS}

${CONFIDENCE}

## Why this exists

Everything else in this exercise gathers requirements from the rendered frontend. But a journey does
not stand alone — it looks up commodity codes, resolves countries and border control posts, uploads
documents, and eventually hands the notification onward. The new app needs to know what those
touchpoints are and what shape they take. That is what you are producing.

## Your sources — all three are in scope for THIS wave

1. **The traces themselves** (strongest evidence — this is what actually happened on the wire):
   ${TRACE_CLI}

   Work in \`${TILDE}/work/integ\` (\`mkdir -p\` it first).
   Pick 3-5 rich \`core-journey\` traces from \`${ABS}/trace-index.json\` (highest action counts).
   For each:
   - \`cd ${TILDE}/work/integ; ${PW} open ${DATA_TILDE}/<hash>.zip\`
   - \`cd ${TILDE}/work/integ; ${PW} requests > requests.txt\` — the full network log. This is gold:
     every backend call the journey made, with method, status and URL. Read the file with the Read
     tool (use \`offset\`/\`limit\` to page it) rather than slicing it with shell commands.
   - Better, let the CLI filter for you rather than post-processing:
     \`${PW} requests --grep "api"\`, \`--grep "reference"\`, \`--grep "commodit"\`, \`--method POST\`.
   - To drop static assets, pipe through a single \`grep -v\`:
     \`cd ${TILDE}/work/integ; ${PW} requests | grep -v -E '\\.(js|css|png|svg|woff2?|ico|gif|jpg|map)'\`
     (one expression, one pipe, no \`&&\`).
   - \`cd ${TILDE}/work/integ; ${PW} request <id>\` — headers and body for a specific call. Use this
     to capture real request/response shapes for \`exampleRequest\`/\`exampleResponse\`.
   - Ignore static assets (js/css/png/fonts) and telemetry. You want the data calls.
   - \`cd ${TILDE}/work/integ; ${PW} close\` when done.

2. **The QA automation repo** (\`${QA_TILDE}\`) — it integrates with the same systems to verify:
   - \`clients/\` — REST/OData/SOAP clients the tests use. For ${CHED.name}: ${CHED.dynamicsHint}
   - \`resources/soap-search/\` — real SOAP envelopes (find the one for this CHED type).
   - \`workflows/dynamics/\` — how downstream verification works.

3. **The IPAFFS application code** (\`~/git/defra/ipaffs\`) — **for integration points ONLY**.
   \`grep -rn\` for outbound HTTP clients, base URLs, service names, queue/topic names.
   Likely: \`ipaffs-frontend-notification/service/src/integration/\`,
   \`ipaffs-commoditycode-microservice\`, \`ipaffs-countries-microservice\`,
   \`ipaffs-referencedata-microservice\`, \`ipaffs-file-upload-microservice\`,
   \`ipaffs-antivirus-stub-microservice\`, \`ipaffs-gvms-microservice\`, \`ipaffs-notify-microservice\`.
   Use \`ls -R\` / \`grep -rn\` (NOT \`find\`, NOT the Grep tool).

   **Strictly scoped**: you are documenting *what the journey talks to and what the call looks like*.
   You are NOT reviewing, critiquing or cataloguing IPAFFS's internal architecture. Do not comment on
   how many services there are or how they are structured. Stay on the boundary.

## Your task

1. Identify every external system the ${CHED.name} create journey depends on. For each: purpose, which
   pages need it, the call shape, and a real example if you can capture one from a trace.
2. Enumerate the **reference-data lists** the journey needs (countries, commodity codes, EPPO codes,
   BCPs, control points, package types, quantity types, document types), their rough size, and where
   each comes from. The Comb wave recorded option counts — cross-check \`${ABS}/pages/*.json\`.
3. For each, decide \`neededForFirstPass\`. The first pass is a journey that builds a JSON object and
   persists it to Mongo — so most integrations can be stubbed or hardcoded initially. Be concrete
   about which, and say what the stub looks like.
4. Tag confidence honestly. A call you saw in a trace's network log is \`confirmed\`. A client you
   found in code but never saw fire is \`inferred\`. A system you suspect but cannot evidence is a \`gap\`.

Write your report to \`${ABS}/integrations.md\` (Write tool) — a table of integrations, a table of
reference-data sources, and the captured request/response examples. Return the structured object.
`, { schema: INTEGRATIONS_SCHEMA, phase: 'Integrations', label: 'integrations:map' })

if (!integrations) throw new Error('Integrations wave returned nothing (agent died). Resume this run to continue — Model and Backlog both read integrations.md.')

const firstPassIntegrations = (integrations?.integrations ?? []).filter(x => x?.neededForFirstPass)
log(`Integrations: ${(integrations?.integrations ?? []).length} systems, ${firstPassIntegrations.length} needed for first pass`)
log(`Reference-data lists: ${(integrations?.referenceDataSources ?? []).length}`)

phase('Model')

const MODEL_SCHEMA = {
  type: 'object',
  required: ['model', 'rationale'],
  properties: {
    model: { type: 'string', description: 'the proposed target JSON shape, as annotated JSON/TS' },
    rationale: { type: 'string' },
    housePatternsFollowed: {
      type: 'array',
      description: 'how this mirrors trade-imports-animals frontend/backend, with file_path:line citations',
      items: { type: 'string' },
    },
    persistence: { type: 'string', description: 'Mongo collection, document identity, draft save/resume' },
    fieldMap: { type: 'string', description: 'markdown table: page -> field -> target model path' },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
}

const model = await agent(`
Design the target data model for the NEW ${CHED.name} app: the JSON object the journey builds up.

${GUARD_RAILS}

${CORPUS_FACTS}

${CONFIDENCE}

## Inputs

- Verified per-page specs: \`${ABS}/pages/*.json\` (\`ls ${TILDE}/pages/\`, then Read each).
  **These are your primary source. The model is derived from what the FRONTEND collects.**
- Page inventory + journey order: \`${ABS}/page-inventory.json\`.
- Integration points: \`${ABS}/integrations.md\`.

## The brief — what we are building

A new CDP app whose shape follows the **existing \`trade-imports-animals\` service in this
workspace**: a journey that builds up a JSON object and persists it to **MongoDB**. Keep it simple.
No microservice sprawl, no indirection layers. Simple as that, for now.

**Study the house style before designing anything** — this is the pattern to follow:
- \`~/git/defra/trade-imports-animals-workspace/repos/trade-imports-animals-frontend\` — the
  journey/session/page structure and how it posts to the backend.
- \`~/git/defra/trade-imports-animals-workspace/repos/trade-imports-animals-backend\` — the
  notification model and how it persists to Mongo.
Use \`ls -R\`, \`grep -rn\` and the Read tool. \`find\` IS allowlisted under the workspace path.
Mirror how these two already do it: naming, nesting, how the document is shaped and stored.
Do not invent a novel architecture — match the neighbours.

## Scope — do not read the legacy IPAFFS source

The model is derived from **what the rendered journey collects** (the verified page specs). Do not
open the IPAFFS Java model, templates or handlers. \`${ABS}/integrations.md\` is the only
code-derived input you get, and it is only about external systems.

You are gathering **requirements**, not writing a critique. IPAFFS's internal design is not your
concern, not your input, and must not drive a single design decision. Do not produce a list of
legacy sins. "Avoid what IPAFFS did" is not a design principle here — **"build it like
\`trade-imports-animals\`" is**.

The only question that matters: **what information does the journey collect, and what is the
simplest honest JSON document that holds it?** Design forward from the pages.

## Your task

1. Derive the target model from the **verified page specs** — what the frontend actually collects.
   Every field in every page spec must land somewhere in the model, and nothing else should.
2. Use plain, typed JSON in the house style: real numbers for weights/counts, real booleans, ISO
   dates, arrays for collections, nested objects for addresses/parties. Plain-English names.
3. Model the commodity/goods list properly — it is usually the heart of the journey. Each line item
   has a commodity code, packages, quantity and net weight, plus per-item attributes that vary by
   CHED type (plants: genus/species + EPPO code, variety/class; live animals: species + per-animal
   identifiers; POAO/food: as the pages show). Work out the right shape from the pages that collect
   it for ${CHED.name} — do not assume; read the page specs.
4. Reference data (countries, commodity codes, BCPs, package types, EPPO codes) should be
   referenced by code, not stored as free text. Cross-reference \`${ABS}/integrations.md\` for where
   each list comes from.
5. Say how the document is persisted to Mongo in the house style — collection, document identity,
   and how a part-complete journey is saved and resumed (the journey is long; drafts matter).
6. Produce \`fieldMap\` — a markdown table mapping every page field to its target model path, so the
   team can prove nothing was lost between the old journey and the new model.
7. Flag genuine open questions rather than inventing answers.

Write the model to \`${ABS}/target-model.md\` (Write tool) with the JSON/TS shape in a fenced block,
the fieldMap table, and the rationale. Return the structured object.
`, { schema: MODEL_SCHEMA, phase: 'Model', label: 'model:target' })

// ---------------------------------------------------------------------------

phase('Backlog')

const BACKLOG_SCHEMA = {
  type: 'object',
  required: ['increments'],
  properties: {
    milestones: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'goal'],
        properties: { id: { type: 'string' }, name: { type: 'string' }, goal: { type: 'string' } },
      },
    },
    increments: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'milestone', 'acceptanceCriteria'],
        properties: {
          id: { type: 'string', description: 'inc-NNN' },
          title: { type: 'string' },
          milestone: { type: 'string' },
          kind: { type: 'string', description: 'scaffold | add-page | add-collection | add-model | add-validation | add-reference-data | add-integration-stub | add-persistence | spike' },
          pageSlug: { type: 'string' },
          dependsOn: { type: 'array', items: { type: 'string' } },
          acceptanceCriteria: { type: 'array', items: { type: 'string' } },
          sizeGuess: { type: 'string', enum: ['S', 'M', 'L'] },
          status: { type: 'string', enum: ['todo', 'blocked'], description: 'born blocked if it has an unresolved gate, else todo' },
          gate: { type: 'string', description: 'sam if a human must decide before this can start, else omit' },
          conflicts: { type: 'array', items: { type: 'string' }, description: 'conflict ids (c-NNN) this increment depends on' },
          modelGap: { type: 'string' },
          openQuestion: { type: 'string' },
        },
      },
    },
    sequencingNotes: { type: 'string' },
  },
}

const backlog = await agent(`
Turn the verified ${CHED.name} journey spec into an ordered, buildable backlog for the NEW CDP app.

${GUARD_RAILS}

${CORPUS_FACTS}

## Inputs

- **Canonical spec**: \`${ABS}/journey-spec.json\` — the single source of truth. Read it FIRST.
- Conflict register: \`${ABS}/conflicts.json\`
- Spec gate summary: \`${ABS}/SPEC-GATE.md\`
- Target data model: \`${ABS}/target-model.md\`
- Integrations + reference data: \`${ABS}/integrations.md\`

## The brief

A new CDP-based app, built like \`trade-imports-animals\`: a journey that builds up a JSON object
and persists it to **Mongo**. Keep it simple. Get the journey and the data right first.

## Increment tracking (adopted from the journey-builder skill)

- Every increment has a \`status\`: \`todo\`, or \`blocked\` if it is **born blocked** behind a gate.
- An increment is **born blocked** with \`gate: "sam"\` when it depends on:
  - a conflict with \`needsHuman: true\` (reference the \`c-NNN\` id in \`conflicts\`),
  - a \`modelGap\` marker (reference it in \`modelGap\`),
  - or a field/page whose spec confidence is \`gap\`.
  State the question in \`openQuestion\`. A human rules on it before the increment starts —
  **never author the ruling yourself.**
- **Model-extension increments come BEFORE the first page that needs them**, and are born blocked.
- \`dependsOn\` must make the order genuinely executable — an increment is runnable only when all
  its deps are done and it is not blocked.
- Be idempotent-friendly: ids are stable (\`inc-001\`...) so a regenerated backlog can preserve
  statuses.

## Rules

1. **One increment per page**, in canonical journey order, each independently verifiable.
2. Scaffolding first (project skeleton, the JSON document + file persistence, the journey spine,
   the task-list hub if the journey has one), then pages in order.
3. Reference data (countries, commodity codes, BCPs, package types, EPPO codes) gets its own
   increments — do not bury a 200-option list inside a page increment.
4. The **commodity collection** is the hard part (repeating items, per-commodity attributes, the
   add-another loop). Break it into several increments and sequence them explicitly.
5. Variants (CSV bulk upload, Article 72 low-risk, CUC billing, split consignment, DoA agent) are
   NOT first pass. Put them in a later milestone and say so.
6. Post-submission (inspector, PHSI checks, decisions) is OUT of scope — a different service.
   If any page spec covers it, exclude it and note the exclusion.
7. **Acceptance criteria must be concrete and testable**, citing the verified copy from the spec —
   e.g. "the H1 reads exactly 'What are you importing?'", "the radio options are exactly [...]",
   "the page uses the GOV.UK Radios component (\`govuk-radios\`) in a \`govuk-fieldset\` with a
   \`govuk-caption-xl\`". Pull the real strings and the real components from \`journey-spec.json\`.
   Vague ACs are useless.
8. Size honestly (S/M/L). Set \`dependsOn\` properly so the order is executable.

Write the backlog to \`${ABS}/backlog.json\` (Write tool) AND a readable \`${ABS}/backlog.md\`
(milestones as headings, increments as a table with ACs beneath, blocked ones clearly marked with
their open question). Return the structured object.
`, { schema: BACKLOG_SCHEMA, phase: 'Backlog', label: 'backlog:generate' })

// ---------------------------------------------------------------------------

phase('Critic')

const CRITIC_SCHEMA = {
  type: 'object',
  required: ['gaps', 'coverageAssessment'],
  properties: {
    coverageAssessment: { type: 'string' },
    tracesCoverage: { type: 'string', description: 'what the trace corpus did and did not exercise' },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['gap', 'severity', 'nextAction'],
        properties: {
          gap: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          evidence: { type: 'string' },
          nextAction: { type: 'string' },
        },
      },
    },
    questionsForHumans: { type: 'array', items: { type: 'string' } },
    methodCritique: { type: 'string', description: 'honest critique of the trace-mining method itself' },
  },
}

const critic = await agent(`
You are the completeness critic. Everything above has been built. Your job is to find what is
MISSING and to be honest about what this method could not know. Do not summarise the work — attack it.

${GUARD_RAILS}

${CORPUS_FACTS}

${CONFIDENCE}

## Inputs

- \`${ABS}/trace-index.json\` — the corpus and how each trace was classified
- \`${ABS}/page-inventory.json\` — the pages we found
- \`${ABS}/pages/*.json\` — the verified per-page specs
- \`${ABS}/target-model.md\` — the proposed model
- \`${ABS}/backlog.json\` / \`.md\` — the backlog

## Ask these questions

1. **Uncovered journey surface.** The traces cover only what the test suite exercised. Cross-check
   the page inventory against the TESTS (not the IPAFFS source — out of scope):
   - \`${QA_TILDE}/tests/accessibility/${CHED.qaSlug}-accessibility-tests.spec.ts\` — it names EVERY page in
     the journey. Any page named there but absent from our inventory is a **blocker** gap.
   - \`${QA_TILDE}/workflows/notification/${CHED.qaSlug}-workflows.ts\` — the full intended journey, incl.
     the conditional branches (\`isCSVUpload\`, \`isCuc\`, Article 72, DoA agent) and the early-exit
     hooks. Any branch the traces never took is a gap — name it.
   - \`${QA_TILDE}/page-objects/notification/*.ts\` — controls the page objects expose that never
     appear in any page spec.
   Use \`grep -rn\` / \`cat\` / Read. NOT \`find\`, NOT the Grep tool.
2. **Confidence honesty.** Count fields by confidence across all page specs. What proportion is
   \`confirmed\` vs \`inferred\` vs \`gap\`? Is the spec's overall confidence overstated? Give the
   actual numbers.
3. **Validation coverage.** Only 38 of 383 traces contain errors, so error states are thinly
   evidenced. How many validation messages are \`confirmed\` vs \`inferred\` vs \`gap\`? Which pages have
   NO validation evidence at all? This is likely the weakest part of the whole spec — quantify it.
4. **Backlog fidelity.** Does every verified page have an increment? Does every model field trace
   to a page? Anything orphaned?
5. **Integration completeness.** Does \`${ABS}/integrations.md\` cover every page that needs a lookup?
   Any page whose options came from somewhere unaccounted for?
6. **Method critique.** Be blunt about the limits of deriving requirements from the rendered
   frontend: what classes of requirement are *structurally invisible* to this method? (Think:
   business rules with no UI, server-side validation never triggered, why a field exists at all,
   authorisation rules, performance, anything data-dependent the test data never hit, and any rule
   that only fires for data shapes the suite never used.) This is the most valuable section — an
   honest account of what a trace CANNOT tell you, and therefore what still needs a human or a
   policy source. Note that we deliberately did NOT mine the legacy source for requirements, so
   anything only knowable from there is by definition a gap here — list what you think falls in
   that bucket.

Write your report to \`${ABS}/completeness-critique.md\` (Write tool). Return the structured object.
`, { schema: CRITIC_SCHEMA, phase: 'Critic', label: 'critic:completeness' })

const blockers = (critic?.gaps ?? []).filter(g => g.severity === 'blocker')
log(`Critic: ${(critic?.gaps ?? []).length} gaps (${blockers.length} blockers)`)

if (!model) throw new Error('Model wave returned nothing (agent died). Resume this run to continue.')
if (!backlog) throw new Error('Backlog wave returned nothing (agent died). Resume this run to continue.')

const bornBlocked = (backlog?.increments ?? []).filter(x => x?.status === 'blocked')

return {
  corpus: { indexed: traces.length, mined: goodJourneys.length, actionsCaptured: totalSteps },
  pages: { found: pages.length, verified: verdicts.length, unsound: unsound.map(v => v.slug), correctionsApplied: totalCorrections },
  journeyOrder: inventory?.journeyOrder ?? [],
  spec: {
    fields: reconciled?.obligations ?? 0,
    confidence: reconciled?.confidenceCounts ?? 'unreported',
    conflicts: conflicts.length,
    conflictsNeedingHuman: needsHuman.map(c => `${c.id}: ${c.topic}`),
    modelGaps: (reconciled?.modelGaps ?? []).map(g => g.marker),
  },
  integrations: {
    systems: (integrations?.integrations ?? []).length,
    neededForFirstPass: firstPassIntegrations.map(x => x.system),
    referenceDataLists: (integrations?.referenceDataSources ?? []).length,
  },
  backlog: {
    increments: backlog?.increments?.length ?? 0,
    milestones: backlog?.milestones?.length ?? 0,
    bornBlocked: bornBlocked.map(x => `${x.id}: ${x.openQuestion ?? x.title}`),
  },
  gaps: { total: (critic?.gaps ?? []).length, blockers: blockers.map(g => g.gap) },
  questionsForHumans: critic?.questionsForHumans ?? [],
  gateArtefact: `${ABS}/SPEC-GATE.md`,
  artefacts: [
    `${ABS}/trace-index.json`,
    `${ABS}/journeys/*.json`,
    `${ABS}/page-inventory.json`,
    `${ABS}/pages/*.json`,
    `${ABS}/journey-spec.json`,
    `${ABS}/conflicts.json`,
    `${ABS}/SPEC-GATE.md`,
    `${ABS}/integrations.md`,
    `${ABS}/target-model.md`,
    `${ABS}/backlog.json`,
    `${ABS}/backlog.md`,
    `${ABS}/completeness-critique.md`,
  ],
}

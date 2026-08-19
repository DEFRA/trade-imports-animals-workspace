//
// Merge fresh parity findings into a live increment backlog after the prototype drifts, without
// losing the human overlay (status, decisions, notes, gate). Thin CLI over parity-lib.reconcile —
// all the logic is in the pure core; this reads files, renders, writes and sets the exit code.
//
// See RECONCILE-PLAN.md for the contract. Run via the npm script (node is not on the allowlist):
//
//   npm --prefix workareas/shared/dr21-parity/compare run reconcile -- EUDPA-328
//   npm --prefix workareas/shared/dr21-parity/compare run reconcile -- EUDPA-328 --json
//   npm --prefix workareas/shared/dr21-parity/compare run reconcile -- EUDPA-328 --write
//
const fs = require('fs')
const path = require('path')
const { reconcile } = require('./parity-lib')

const WORKSPACE = path.join(process.env.HOME, 'git/defra/trade-imports-animals-workspace')

function parseArgs (argv) {
  const opts = { write: false, json: false, acceptMatch: {}, rejectMatch: [], now: null, corpus: null, findings: null, backlog: null, runId: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (/^EUDPA-/.test(a)) opts.runId = a
    else if (a === '--write') opts.write = true
    else if (a === '--json') opts.json = true
    else if (a === '--findings') opts.findings = argv[++i]
    else if (a === '--backlog') opts.backlog = argv[++i]
    else if (a === '--now') opts.now = argv[++i]
    else if (a === '--corpus') opts.corpus = argv[++i]
    else if (a === '--accept-match') { const [k, id] = String(argv[++i] || '').split('='); if (k && id) opts.acceptMatch[k] = id }
    else if (a === '--reject-match') { const k = argv[++i]; if (k) opts.rejectMatch.push(k) }
    else { throw new Error(`Unknown arg: ${a}`) }
  }
  return opts
}

function readJson (p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (err) {
    throw new Error(`cannot read ${p}: ${err.message}`)
  }
}

function renderHuman (report, { write, wrote }) {
  const L = []
  const c = report.counts
  L.push(`DR2.1 parity — reconcile (${write ? (wrote ? 'WROTE' : 'REFUSED') : 'DRY RUN'})`)
  L.push(`  runId          ${report.runId}${report.target ? `   target ${report.target}` : ''}`)
  L.push(`  live backlog   ${report.corpus.existing} increments`)
  L.push(`  fresh findings ${report.corpus.fresh}`)
  L.push('')
  L.push(`  carry        ${c.carry}   citations refreshed, state preserved`)
  L.push(`  resolved     ${c.resolved}`)
  L.push(`  obsolete     ${c.obsolete}`)
  L.push(`  new          ${c.new}   → verification queue`)
  L.push(`  suppressed   ${c.suppressed}`)
  L.push(`  needsHuman   ${c.needsHuman}${c.needsHuman ? '   ⚠ blocks --write' : ''}`)

  const drift = report.buckets.carry.filter((x) => x.changes.length)
  if (drift.length) {
    L.push('')
    L.push(`── carry — citation drift (${drift.length} of ${c.carry}) ──`)
    for (const x of drift) for (const ch of x.changes) L.push(`  ${x.id}  ${ch.field}  ${ch.from} → ${ch.to}`)
  }
  if (report.buckets.obsolete.length) {
    L.push('')
    L.push('── obsolete ──')
    for (const x of report.buckets.obsolete) L.push(`  ${x.id}  gap gone from prototype → obsolete (recorded)`)
  }
  if (report.buckets.new.length) {
    L.push('')
    L.push('── new → verification queue ──')
    for (const x of report.buckets.new) L.push(`  ${x.id}  ${x.milestone}  ${x.status}${x.gate ? ` (gate: ${x.gate})` : ''}  ${x.title}`)
  }
  if (report.buckets.suppressed.length) {
    L.push('')
    L.push('── suppressed — matched a tombstone, NOT re-raised ──')
    for (const x of report.buckets.suppressed) L.push(`  ${x.id}  (${x.status})  differ re-found this gap; kept per prior ruling`)
  }
  if (report.buckets.needsHuman.length) {
    L.push('')
    L.push('── needsHuman ⚠ — resolve before --write ──')
    for (const x of report.buckets.needsHuman) {
      if (x.reason === 'fuzzy') L.push(`  fuzzy   "${x.title}"  best match ${x.candidate} (score ${x.score})`)
      else if (x.reason === 'inprogress-gap-vanished') L.push(`  inprogress ${x.id}  gap vanished while a build is in progress — decide by hand`)
      else L.push(`  ${x.reason}   key ${x.key}${x.title ? `  "${x.title}"` : ''}`)
    }
    L.push('  resolve:  --accept-match <key>=<incId>   (a move onto that increment)')
    L.push('            --reject-match <key>            (genuinely new → mint)')
  }
  if (report.graph.warnings.length) {
    L.push('')
    L.push('── graph warnings (reported, not applied) ──')
    for (const w of report.graph.warnings) L.push(`  ${w.existing} arguably should dependsOn ${w.shouldDependOn} (screen ${w.screen})`)
  }
  return L.join('\n')
}

function main () {
  let opts
  try {
    opts = parseArgs(process.argv.slice(2))
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
  if (!opts.runId) {
    console.error('Usage: reconcile.js EUDPA-X [--findings p] [--backlog p] [--write] [--json] [--accept-match k=id] [--reject-match k] [--now iso] [--corpus label]')
    process.exit(1)
  }

  // Default findings = the differ's verified findings, which live one level up in dr21-parity/
  // (the same file build-increments.js consumes), not in compare/.
  const findingsPath = opts.findings || path.join(__dirname, '..', 'backlog.json')
  const backlogPath = opts.backlog || path.join(WORKSPACE, 'workareas/journey-builder', opts.runId, 'backlog.json')

  let existingBacklog
  let freshRaw
  try {
    existingBacklog = readJson(backlogPath)
    freshRaw = readJson(findingsPath)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
  const freshFindings = Array.isArray(freshRaw) ? freshRaw : (freshRaw.survived || [])

  const { report, merged, writable } = reconcile({
    existingBacklog,
    freshFindings,
    now: opts.now || new Date().toISOString(),
    overrides: { acceptMatch: opts.acceptMatch, rejectMatch: opts.rejectMatch },
    corpus: opts.corpus
  })

  let wrote = false
  if (opts.write && writable) {
    fs.writeFileSync(backlogPath, `${JSON.stringify(merged, null, 2)}\n`)
    wrote = true
  }

  if (opts.json) console.log(JSON.stringify(report, null, 2))
  else console.log(renderHuman(report, { write: opts.write, wrote }))

  if (opts.write && !writable) {
    if (!opts.json) console.error('\n--write refused: needsHuman items present. Resolve them and re-run.')
    process.exit(2)
  }
  process.exit(report.counts.needsHuman > 0 ? 2 : 0)
}

main()

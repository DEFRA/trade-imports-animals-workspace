//
// Turns the verified parity findings into the canonical increment backlog the build loop
// consumes: workareas/journey-builder/EUDPA-328/backlog.json.
//
// The loop tooling (next-increment.sh, backlog-set-status.sh, backlog-counts.sh) keys on
// id / dependsOn / status only, so the extra fields carried here — evidence, domain, screens,
// key — ride along for the implementor and for reconcile without affecting the loop. Same
// arrangement EUDPA-288 used for its hand-authored retrofit backlog.
//
// The increment-shaping logic lives in parity-lib.js so this generator and reconcile.js mint
// increments through one code path — two copies would drift, which is the failure mode the whole
// corpus is built to avoid.
//
// NB: this is a full-from-scratch regeneration that renumbers inc-nnn and drops the human
// overlay (status, decisions, notes). Once a backlog has been worked, refresh it with
// reconcile.js, not this. OUT_DIR is intentionally left as-is.
//
const fs = require('fs')
const path = require('path')
const { orderFindings, findingToIncrement, chainDependsOn } = require('./parity-lib')

const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(process.env.HOME, 'git/defra/trade-imports-animals/workareas/journey-builder/EUDPA-328')

const findings = JSON.parse(fs.readFileSync(path.join(ROOT, 'backlog.json'), 'utf8'))

function main () {
  const ordered = orderFindings(findings.survived)
  const increments = ordered.map((finding, i) => findingToIncrement(finding, `inc-${String(i + 1).padStart(3, '0')}`))
  chainDependsOn(increments)

  const backlog = {
    run_id: 'EUDPA-328',
    note: [
      'Derived from the verified DR2.1 parity findings (workareas/shared/dr21-parity/backlog.json),',
      'NOT from backlog-generate.sh — that derives page increments from a journey spec, which is the',
      'wrong shape here. Consumed unchanged by next-increment.sh, backlog-set-status.sh and',
      'backlog-counts.sh: the loop tooling keys on id/dependsOn/status only.',
      '',
      'IMPORTANT: verify-increment.sh does NOT apply. It targets the PROTOTYPE',
      '(prototypes/standalone/live-animals, npm run test:prototype). These increments target the REAL',
      'frontend at src/server/app, so the implementor is the `frontend-change` skill, which runs its',
      'own verification ladder and stops after one increment. Invoke it with the increment type as its',
      'mode: add-field / add-page / add-section / add-collection / obligation change / flow change.',
      '',
      'M0 is cross-cutting chrome that touches every page — do it before the per-page work or every',
      'page gets revisited twice. M1 is buildable now. M2 is born blocked on a design ruling',
      '(gate: sam); M3 is born blocked on backend work (gate: backend). Clearing a gate is a status',
      'flip from blocked to todo — nothing needs regenerating.',
      '',
      'dependsOn chains per screen in type order (page before section before field before copy).',
      'Increments on different screens are independent.',
      '',
      'Capture refs: frontend main@32f6106c, prototype 7da4f70. Human-readable view: BACKLOG.md and',
      'backlog-page.html in workareas/shared/dr21-parity/.'
    ].join('\n'),
    increments
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(path.join(OUT_DIR, 'backlog.json'), `${JSON.stringify(backlog, null, 2)}\n`)

  const byStatus = {}
  const byMilestone = {}
  const byDomain = {}
  for (const inc of increments) {
    byStatus[inc.status] = (byStatus[inc.status] || 0) + 1
    byMilestone[inc.milestone] = (byMilestone[inc.milestone] || 0) + 1
    byDomain[inc.domain] = (byDomain[inc.domain] || 0) + 1
  }

  console.log(`wrote ${increments.length} increments to workareas/journey-builder/EUDPA-328/backlog.json\n`)
  console.log('by status:')
  for (const [k, v] of Object.entries(byStatus)) console.log(`  ${k.padEnd(12)} ${v}`)
  console.log('\nby milestone:')
  for (const k of Object.keys(byMilestone).sort()) console.log(`  ${k.padEnd(12)} ${byMilestone[k]}`)
  console.log('\nby domain:')
  for (const [k, v] of Object.entries(byDomain).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(20)} ${v}`)
}

main()

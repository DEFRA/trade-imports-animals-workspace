//
// Turns the verified parity findings into the canonical increment backlog the build
// loop consumes: workareas/journey-builder/EUDPA-328/backlog.json.
//
// The loop tooling (next-increment.sh, backlog-set-status.sh, backlog-counts.sh) keys
// on id / dependsOn / status only, so the extra fields carried here — evidence, domain,
// screens — ride along for the implementor without affecting the loop. Same arrangement
// EUDPA-288 used for its hand-authored retrofit backlog.
//
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(process.env.HOME, 'git/defra/trade-imports-animals/workareas/journey-builder/EUDPA-328')

const findings = JSON.parse(fs.readFileSync(path.join(ROOT, 'backlog.json'), 'utf8'))

// Within one screen the work has a real order: the page must exist before it can carry
// a section, a section before a field, and copy last. Across screens the increments are
// independent, so the loop can be re-parallelised later without re-deriving this.
const TYPE_ORDER = [
  'add-page',
  'add-section',
  'add-collection',
  'add-field',
  'obligation-change',
  'flow-change',
  'copy-change'
]

// Matched against the title and screen names only — never the detail, which is full of
// source paths like `template.njk` that false-match the templates domain.
const DOMAIN_RULES = [
  { domain: 'germinal-products', test: /germinal/i },
  { domain: 'templates', test: /\btemplates?\b(?!\.njk)|dr21-view-template|dr21-create-template|dr21-dashboard-templates/i },
  { domain: 'addresses', test: /address|consignee|consignor|importer|place-of-|roles-and-addresses|permanent-address/i },
  { domain: 'transport', test: /transport|arrival|transit|port-of-/i },
  { domain: 'commodities', test: /commodit|consignment-details|identification|what-are-you-importing|additional-animal/i },
  { domain: 'documents', test: /document|upload/i },
  { domain: 'dashboard', test: /dashboard|notification-list/i },
  { domain: 'spine', test: /hub|review|declaration|submitted|delete|cancel-amend|confirmation/i }
]

const BAND_TO_MILESTONE = {
  'frontend-only': 'M1',
  'needs-design-decision': 'M2',
  'needs-backend': 'M3'
}

const BAND_TO_GATE = {
  'frontend-only': null,
  'needs-design-decision': 'sam',
  'needs-backend': 'backend'
}

// A gated increment is born blocked so the loop never pops it. Nothing is lost: the
// backlog stays a complete picture of the gap, and clearing a gate is a status flip.
const BAND_TO_STATUS = {
  'frontend-only': 'todo',
  'needs-design-decision': 'blocked',
  'needs-backend': 'blocked'
}

const isServiceWide = (f) =>
  /service-wide|every page|every paired screen|whole service|across the whole/i.test(
    `${f.title} ${f.detail || ''}`
  )

function domainOf (finding) {
  const haystack = `${finding.title} ${(finding.screens || []).join(' ')}`
  const hit = DOMAIN_RULES.find((rule) => rule.test.test(haystack))
  return hit ? hit.domain : 'general'
}

function typeRank (type) {
  const i = TYPE_ORDER.indexOf(type)
  return i === -1 ? TYPE_ORDER.length : i
}

function main () {
  const ordered = [...findings.survived].sort((a, b) => {
    const aWide = isServiceWide(a)
    const bWide = isServiceWide(b)
    // Cross-cutting chrome lands first — it touches every page, so doing it after the
    // per-page work would mean revisiting each page twice.
    if (aWide !== bWide) return aWide ? -1 : 1
    const aM = aWide ? 'M0' : BAND_TO_MILESTONE[a.band]
    const bM = bWide ? 'M0' : BAND_TO_MILESTONE[b.band]
    return aM.localeCompare(bM) || typeRank(a.incrementType) - typeRank(b.incrementType) || a.title.localeCompare(b.title)
  })

  const increments = ordered.map((finding, i) => {
    const wide = isServiceWide(finding)
    return {
      id: `inc-${String(i + 1).padStart(3, '0')}`,
      type: finding.incrementType,
      milestone: wide ? 'M0' : BAND_TO_MILESTONE[finding.band],
      domain: domainOf(finding),
      title: finding.title,
      detail: [
        finding.detail,
        finding.correction ? `CORRECTED DURING VERIFICATION: ${finding.correction}` : null,
        finding.falsifiedBy ? `FALSIFIED BY: ${finding.falsifiedBy}` : null
      ].filter(Boolean).join('\n\n'),
      screens: finding.screens || [],
      evidence: {
        frontend: finding.frontendEvidence,
        prototype: finding.prototypeEvidence
      },
      confidence: finding.confidence,
      band: finding.band,
      gate: BAND_TO_GATE[finding.band],
      dependsOn: [],
      status: BAND_TO_STATUS[finding.band],
      commit: null,
      failure_reason: null
    }
  })

  // Chain per screen in type order. Using the already-sorted list means the chain is
  // total and acyclic: an increment can only ever depend on one that precedes it.
  const lastOnScreen = new Map()
  for (const inc of increments) {
    const deps = new Set()
    for (const screen of inc.screens.length ? inc.screens : [`__${inc.domain}`]) {
      const previous = lastOnScreen.get(screen)
      if (previous) deps.add(previous)
    }
    inc.dependsOn = [...deps]
    for (const screen of inc.screens.length ? inc.screens : [`__${inc.domain}`]) {
      lastOnScreen.set(screen, inc.id)
    }
  }

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

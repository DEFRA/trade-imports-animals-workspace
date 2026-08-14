//
// Phase 5 — turns the verified findings into a banded, ordered backlog.
//
// Ordering is by dependency, not by size: a page has to exist before a field can be
// added to it, and an obligation change can invalidate a flow change made before it.
// Within a band the order is add-page, add-section, add-collection, add-field,
// obligation-change, flow-change, copy-change.
//
const fs = require('fs')
const path = require('path')

const INPUT = process.argv[2]
const OUT = path.join(__dirname, '..')

const INCREMENT_ORDER = [
  'add-page',
  'add-section',
  'add-collection',
  'add-field',
  'obligation-change',
  'flow-change',
  'copy-change'
]

const BAND_ORDER = ['frontend-only', 'needs-design-decision', 'needs-backend']

// Work already underway elsewhere. Tagged rather than dropped, so the backlog stays a
// complete picture of the gap while nobody builds the same thing twice.
const IN_FLIGHT = [
  {
    match: 'typeahead',
    note: 'Already in progress on `feature/EUDPA-124-port-of-entry-type-ahead` (3 commits ahead of main at capture time). Do not schedule as new work — confirm the branch covers it.'
  }
]

const inFlightNote = (finding) => {
  const hit = IN_FLIGHT.find((f) => finding.title.toLowerCase().includes(f.match))
  return hit ? hit.note : null
}

const BAND_TITLE = {
  'frontend-only': 'Frontend-only — buildable now',
  'needs-design-decision': 'Needs a design decision first',
  'needs-backend': 'Needs backend work first'
}

function main () {
  const payload = JSON.parse(fs.readFileSync(INPUT, 'utf8'))
  const { survived = [], refuted = [], discarded = [] } = payload.result || payload

  const byBand = new Map(BAND_ORDER.map((b) => [b, []]))
  const unknownBand = []

  for (const finding of survived) {
    const bucket = byBand.get(finding.band)
    if (bucket) bucket.push(finding)
    else unknownBand.push(finding)
  }

  const rank = (f) => {
    const i = INCREMENT_ORDER.indexOf(f.incrementType)
    return i === -1 ? INCREMENT_ORDER.length : i
  }
  const confidenceRank = { high: 0, medium: 1, low: 2 }

  for (const bucket of byBand.values()) {
    bucket.sort((a, b) =>
      rank(a) - rank(b) ||
      (confidenceRank[a.confidence] ?? 3) - (confidenceRank[b.confidence] ?? 3) ||
      a.title.localeCompare(b.title)
    )
  }

  const lines = []
  lines.push('# EUDPA-328 — DR2.1 parity backlog')
  lines.push('')
  lines.push('Generated from the verified findings. Every item was raised from a captured')
  lines.push('artefact, carries file:line evidence on both sides, and survived an independent')
  lines.push('verifier whose instruction was to refute it.')
  lines.push('')
  lines.push('Capture refs: frontend `main` at `32f6106c`, prototype at `7da4f70`.')
  lines.push('')
  lines.push(`**${survived.length} items** across ${BAND_ORDER.length} bands. ${refuted.length} finding(s) refuted and dropped — listed at the foot.`)
  lines.push('')

  lines.push('## Summary')
  lines.push('')
  lines.push('| Band | Items | Increment types |')
  lines.push('|---|---|---|')
  for (const band of BAND_ORDER) {
    const items = byBand.get(band)
    const types = [...new Set(items.map((i) => i.incrementType))]
      .sort((a, b) => INCREMENT_ORDER.indexOf(a) - INCREMENT_ORDER.indexOf(b))
    lines.push(`| ${BAND_TITLE[band]} | ${items.length} | ${types.join(', ') || '—'} |`)
  }
  if (unknownBand.length) lines.push(`| _unbanded_ | ${unknownBand.length} | — |`)
  lines.push('')

  for (const band of BAND_ORDER) {
    const items = byBand.get(band)
    if (!items.length) continue

    lines.push(`## ${BAND_TITLE[band]}`)
    lines.push('')

    let currentType = null
    let n = 0
    for (const item of items) {
      if (item.incrementType !== currentType) {
        currentType = item.incrementType
        lines.push(`### ${currentType}`)
        lines.push('')
      }
      n += 1
      lines.push(`**${n}. ${item.title}**`)
      lines.push('')
      if (item.detail) {
        lines.push(item.detail)
        lines.push('')
      }
      if (item.correction) {
        lines.push(`> **Corrected by verification:** ${item.correction}`)
        lines.push('')
      }
      const flight = inFlightNote(item)
      if (flight) {
        lines.push(`> **Already in progress:** ${flight}`)
        lines.push('')
      }
      lines.push(`- Screens: ${(item.screens || []).join(', ') || '—'}`)
      lines.push(`- Frontend: \`${item.frontendEvidence}\``)
      lines.push(`- Prototype: \`${item.prototypeEvidence}\``)
      lines.push(`- Confidence: ${item.confidence}`)
      if (item.falsifiedBy) lines.push(`- Falsified by: ${item.falsifiedBy}`)
      lines.push('')
    }
  }

  if (unknownBand.length) {
    lines.push('## Unbanded')
    lines.push('')
    for (const item of unknownBand) lines.push(`- ${item.title} (band: ${item.band})`)
    lines.push('')
  }

  lines.push('## Dropped by verification')
  lines.push('')
  if (!refuted.length) {
    lines.push('None.')
  } else {
    for (const item of refuted) {
      lines.push(`- **${item.title}**`)
      lines.push(`  - ${item.reason}`)
    }
  }
  lines.push('')

  if (discarded.length) {
    lines.push('## Deltas deliberately not raised')
    lines.push('')
    lines.push('Recorded so the decision is visible rather than implicit.')
    lines.push('')
    for (const d of discarded) lines.push(`- ${d}`)
    lines.push('')
  }

  fs.writeFileSync(path.join(OUT, 'BACKLOG.md'), `${lines.join('\n')}\n`)
  fs.writeFileSync(
    path.join(OUT, 'backlog.json'),
    `${JSON.stringify({ survived, refuted, discarded }, null, 2)}\n`
  )

  console.log(`backlog: ${survived.length} items, ${refuted.length} refuted, ${discarded.length} discarded`)
  for (const band of BAND_ORDER) console.log(`  ${band.padEnd(24)} ${byBand.get(band).length}`)
  if (unknownBand.length) console.log(`  ${'(unbanded)'.padEnd(24)} ${unknownBand.length}`)

  const byType = {}
  for (const f of survived) byType[f.incrementType] = (byType[f.incrementType] || 0) + 1
  console.log('\nby increment type:')
  for (const t of INCREMENT_ORDER) if (byType[t]) console.log(`  ${t.padEnd(20)} ${byType[t]}`)

  const lowConfidence = survived.filter((f) => f.confidence === 'low')
  if (lowConfidence.length) {
    console.log(`\nlow confidence (${lowConfidence.length}):`)
    for (const f of lowConfidence) console.log(`  - ${f.title.slice(0, 100)}`)
  }

  const unverified = survived.filter((f) => f.verification === 'not verified')
  if (unverified.length) console.log(`\nWARNING: ${unverified.length} findings were never verified`)
}

main()

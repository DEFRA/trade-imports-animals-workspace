//
// Behaviour tests for the reconcile core. `node --test` (npm test) — no dependencies.
//
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { reconcile, keysForFindings } = require('./parity-lib')

const NOW = '2026-08-19T00:00:00Z'

// A live canonical increment (human overlay present where it matters).
const inc = (over) => ({
  id: 'inc-000',
  type: 'add-field',
  milestone: 'M1',
  domain: 'd',
  title: 'x',
  detail: 'x',
  screens: ['s'],
  evidence: { frontend: 'f/x.js:1-1', prototype: 'p/x.html:1-1' },
  confidence: 'high',
  band: 'frontend-only',
  gate: null,
  dependsOn: [],
  status: 'todo',
  commit: null,
  failure_reason: null,
  ...over
})

// A fresh raw finding from the differ.
const fnd = (over) => ({
  title: 'x',
  screens: ['s'],
  frontendEvidence: 'f/x.js:1-1',
  prototypeEvidence: 'p/x.html:1-1',
  incrementType: 'add-field',
  band: 'frontend-only',
  confidence: 'high',
  detail: 'x',
  ...over
})

function bigFixture () {
  const existing = {
    run_id: 'EUDPA-TEST',
    target: 't',
    note: 'n',
    increments: [
      inc({ id: 'inc-001', type: 'add-section', screens: ['s1'], evidence: { frontend: 'f/1.js:10-20', prototype: 'p/1.html:5-9' }, title: 'Section one on screen one' }),
      inc({ id: 'inc-002', type: 'add-field', screens: ['s2'], evidence: { frontend: 'f/2.js:1-2', prototype: 'p/2.html:3-4' }, status: 'blocked', band: 'needs-design-decision', gate: 'sam', decision: { ruling: 'defer', note: 'later', ruledAt: '2026-01-01T00:00:00Z' }, notes: [{ note: 'pre-existing', at: '2026-01-01T00:00:00Z' }], title: 'Field two on screen two' }),
      inc({ id: 'inc-003', type: 'add-field', screens: ['s3'], evidence: { frontend: 'f/3.js:1-1', prototype: 'p/3.html:1-1' }, status: 'done', title: 'Done thing on screen three' }),
      inc({ id: 'inc-004', type: 'add-section', screens: ['s4'], evidence: { frontend: 'f/4.js:1-1', prototype: 'p/4.html:1-1' }, status: 'blocked', band: 'needs-backend', gate: 'backend', title: 'Backend section screen four' }),
      inc({ id: 'inc-005', type: 'add-field', screens: ['s5'], evidence: { frontend: 'f/5.js:1-1', prototype: 'p/5.html:1-1' }, status: 'dropped', decision: { ruling: 'reject', note: 'defect', ruledAt: '2026-01-01T00:00:00Z' }, title: 'Rejected field screen five' }),
      inc({ id: 'inc-006', type: 'add-field', screens: ['s6'], evidence: { frontend: 'f/6.js:1-1', prototype: 'p/6.html:1-1' }, status: 'inprogress', title: 'In progress field screen six' }),
      inc({ id: 'inc-007', type: 'add-section', screens: ['s7'], evidence: { frontend: 'f/7.js:1-5', prototype: 'p/7.html:1-9' }, status: 'todo', band: 'frontend-only', title: 'The frontend hub shows only the party name in a summary row' })
    ]
  }
  const freshFindings = [
    fnd({ screens: ['s1'], incrementType: 'add-section', frontendEvidence: 'f/1.js:10-20', prototypeEvidence: 'p/1.html:12-18', title: 'Section one on screen one' }), // carry inc-001 (drift)
    fnd({ screens: ['s2'], incrementType: 'add-field', frontendEvidence: 'f/2.js:1-2', prototypeEvidence: 'p/2.html:3-4', band: 'needs-design-decision', title: 'Field two on screen two' }), // carry inc-002 (no drift)
    fnd({ screens: ['s5'], incrementType: 'add-field', frontendEvidence: 'f/5.js:2-3', prototypeEvidence: 'p/5.html:2-3', title: 'Rejected field screen five' }), // suppressed (inc-005 dropped)
    fnd({ screens: ['s7'], incrementType: 'add-section', frontendEvidence: 'f/7.js:1-5', prototypeEvidence: 'p/7-RENAMED.html:1-9', band: 'frontend-only', title: 'The frontend hub shows only the party name in a summary row' }), // fuzzy → needsHuman
    fnd({ screens: ['s8'], incrementType: 'add-field', frontendEvidence: 'f/8.js:1-2', prototypeEvidence: 'p/8.html:1-2', title: 'A brand new gap nobody has ever seen before' }) // new
  ]
  return { existing, freshFindings }
}

test('buckets: carry / resolved / obsolete / suppressed / new / needsHuman', () => {
  const { existing, freshFindings } = bigFixture()
  const { report } = reconcile({ existingBacklog: existing, freshFindings, now: NOW })
  assert.deepEqual(report.counts, { carry: 2, resolved: 1, obsolete: 1, new: 1, suppressed: 1, needsHuman: 2 })

  assert.deepEqual(report.buckets.carry.map((x) => x.id), ['inc-001', 'inc-002'])
  assert.deepEqual(report.buckets.resolved.map((x) => x.id), ['inc-003'])
  assert.deepEqual(report.buckets.obsolete.map((x) => x.id), ['inc-004'])
  assert.deepEqual(report.buckets.suppressed.map((x) => x.id), ['inc-005'])

  const fuzzy = report.buckets.needsHuman.find((x) => x.reason === 'fuzzy')
  assert.equal(fuzzy.candidate, 'inc-007')
  assert.equal(fuzzy.score, 1)
  assert.ok(report.buckets.needsHuman.some((x) => x.reason === 'inprogress-gap-vanished' && x.id === 'inc-006'))
})

test('carry refreshes only drifted citations and appends a timestamped note', () => {
  const { existing, freshFindings } = bigFixture()
  const { merged } = reconcile({ existingBacklog: existing, freshFindings, now: NOW })
  const byId = Object.fromEntries(merged.increments.map((i) => [i.id, i]))

  // inc-001: prototype lines moved → refreshed + one note stamped at NOW.
  assert.equal(byId['inc-001'].evidence.prototype, 'p/1.html:12-18')
  assert.equal(byId['inc-001'].evidence.frontend, 'f/1.js:10-20')
  assert.equal(byId['inc-001'].notes.length, 1)
  assert.equal(byId['inc-001'].notes[0].at, NOW)
  assert.match(byId['inc-001'].notes[0].note, /citation refreshed/)
})

test('carry never overwrites the human overlay (decision, status, notes, gate)', () => {
  const { existing, freshFindings } = bigFixture()
  const { merged } = reconcile({ existingBacklog: existing, freshFindings, now: NOW })
  const two = merged.increments.find((i) => i.id === 'inc-002')
  assert.equal(two.status, 'blocked')
  assert.equal(two.gate, 'sam')
  assert.deepEqual(two.decision, { ruling: 'defer', note: 'later', ruledAt: '2026-01-01T00:00:00Z' })
  assert.equal(two.notes.length, 1)                 // no new note — evidence did not drift
  assert.equal(two.notes[0].note, 'pre-existing')
  assert.equal(two.evidence.prototype, 'p/2.html:3-4')
})

test('a re-found dropped finding is suppressed, not re-raised', () => {
  const { existing, freshFindings } = bigFixture()
  const { report, merged } = reconcile({ existingBacklog: existing, freshFindings, now: NOW })
  const five = merged.increments.find((i) => i.id === 'inc-005')
  assert.equal(five.status, 'dropped')                                  // tombstone intact
  assert.equal(merged.increments.filter((i) => i.screens[0] === 's5').length, 1) // not duplicated
  assert.ok(report.buckets.suppressed.some((x) => x.id === 'inc-005'))
})

test('obsolete flips a vanished non-built gap and records why', () => {
  const { existing, freshFindings } = bigFixture()
  const { merged } = reconcile({ existingBacklog: existing, freshFindings, now: NOW })
  const four = merged.increments.find((i) => i.id === 'inc-004')
  assert.equal(four.status, 'obsolete')
  assert.equal(four.notes.length, 1)
  assert.match(four.notes[0].note, /no longer present/)
})

test('new increments get append-only ids and are shaped like the originals', () => {
  const { existing, freshFindings } = bigFixture()
  const { report, merged } = reconcile({ existingBacklog: existing, freshFindings, now: NOW })
  assert.deepEqual(report.buckets.new.map((x) => x.id), ['inc-008']) // max(7)+1
  const eight = merged.increments.find((i) => i.id === 'inc-008')
  assert.equal(eight.title, 'A brand new gap nobody has ever seen before')
  assert.equal(eight.status, 'todo')
  assert.equal(eight.key, keysForFindings(freshFindings)[4])
  assert.equal(merged.increments.length, 8)
})

test('writable is false while any needsHuman remains', () => {
  const { existing, freshFindings } = bigFixture()
  const { writable } = reconcile({ existingBacklog: existing, freshFindings, now: NOW })
  assert.equal(writable, false)
})

test('deterministic: identical inputs (reused objects) → identical output', () => {
  const { existing, freshFindings } = bigFixture()
  const a = reconcile({ existingBacklog: existing, freshFindings, now: NOW })
  const b = reconcile({ existingBacklog: existing, freshFindings, now: NOW })
  assert.equal(JSON.stringify(a.report), JSON.stringify(b.report))
  assert.equal(JSON.stringify(a.merged), JSON.stringify(b.merged))
})

test('--accept-match resolves a fuzzy item as a move onto the named increment', () => {
  const existing = { run_id: 'r', target: 't', note: 'n', increments: [
    inc({ id: 'inc-007', type: 'add-section', screens: ['s7'], evidence: { frontend: 'f/7.js:1-5', prototype: 'p/7.html:1-9' }, title: 'The frontend hub shows only the party name in a summary row' })
  ] }
  const rename = fnd({ screens: ['s7'], incrementType: 'add-section', frontendEvidence: 'f/7.js:1-5', prototypeEvidence: 'p/7-RENAMED.html:1-9', title: 'The frontend hub shows only the party name in a summary row' })
  // A user reads the key off the dry-run report, then resolves it.
  const dry = reconcile({ existingBacklog: existing, freshFindings: [rename], now: NOW })
  const fuzzyKey = dry.report.buckets.needsHuman.find((x) => x.reason === 'fuzzy').key
  const { report, merged, writable } = reconcile({
    existingBacklog: existing,
    freshFindings: [rename],
    now: NOW,
    overrides: { acceptMatch: { [fuzzyKey]: 'inc-007' } }
  })
  assert.equal(writable, true)
  assert.equal(report.counts.carry, 1)
  assert.equal(report.counts.needsHuman, 0)
  const seven = merged.increments.find((i) => i.id === 'inc-007')
  assert.equal(seven.evidence.prototype, 'p/7-RENAMED.html:1-9') // citation moved to the renamed file
  assert.equal(seven.status, 'todo')                             // still the same gap
  assert.equal(merged.increments.length, 1)                      // no new increment minted
})

test('--reject-match mints a new increment and lets the old one go obsolete', () => {
  const existing = { run_id: 'r', target: 't', note: 'n', increments: [
    inc({ id: 'inc-007', type: 'add-section', screens: ['s7'], evidence: { frontend: 'f/7.js:1-5', prototype: 'p/7.html:1-9' }, title: 'The frontend hub shows only the party name in a summary row' })
  ] }
  const rename = fnd({ screens: ['s7'], incrementType: 'add-section', frontendEvidence: 'f/7.js:1-5', prototypeEvidence: 'p/7-RENAMED.html:1-9', title: 'The frontend hub shows only the party name in a summary row' })
  const dry = reconcile({ existingBacklog: existing, freshFindings: [rename], now: NOW })
  const fuzzyKey = dry.report.buckets.needsHuman.find((x) => x.reason === 'fuzzy').key
  const { report, merged, writable } = reconcile({
    existingBacklog: existing,
    freshFindings: [rename],
    now: NOW,
    overrides: { rejectMatch: [fuzzyKey] }
  })
  assert.equal(writable, true)
  assert.deepEqual(report.counts, { carry: 0, resolved: 0, obsolete: 1, new: 1, suppressed: 0, needsHuman: 0 })
  assert.ok(merged.increments.find((i) => i.id === 'inc-008'))            // minted
  assert.equal(merged.increments.find((i) => i.id === 'inc-007').status, 'obsolete') // old one released
})

test('a clean carry + new merge is writable', () => {
  const existing = { run_id: 'r', target: 't', note: 'n', increments: [
    inc({ id: 'inc-001', type: 'add-section', screens: ['s1'], evidence: { frontend: 'f/1.js:10-20', prototype: 'p/1.html:5-9' }, title: 'Section one' })
  ] }
  const freshFindings = [
    fnd({ screens: ['s1'], incrementType: 'add-section', frontendEvidence: 'f/1.js:10-20', prototypeEvidence: 'p/1.html:12-18', title: 'Section one' }),
    fnd({ screens: ['s9'], incrementType: 'add-field', frontendEvidence: 'f/9.js:1-2', prototypeEvidence: 'p/9.html:1-2', title: 'An unrelated new gap on another screen entirely' })
  ]
  const { writable, report, merged } = reconcile({ existingBacklog: existing, freshFindings, now: NOW })
  assert.equal(writable, true)
  assert.equal(report.counts.carry, 1)
  assert.equal(report.counts.new, 1)
  assert.deepEqual(merged.increments.map((i) => i.id).sort(), ['inc-001', 'inc-002'])
})

//
// Unit tests for the pure helpers. `node --test` (npm test) — no dependencies.
//
const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  keyOfFinding,
  keyOfIncrement,
  computeKey,
  keysForFindings,
  keysForIncrements,
  findingToIncrement,
  diceCoefficient,
  chainDependsOn,
  orderFindings,
  stripLines
} = require('./parity-lib')

const finding = (over = {}) => ({
  title: 'A gap',
  screens: ['fe-x', 'dr21-x'],
  frontendEvidence: 'repos/f/ctrl.js:10-20',
  prototypeEvidence: 'proto/x.html:5-9',
  incrementType: 'add-section',
  band: 'frontend-only',
  confidence: 'high',
  detail: 'D',
  ...over
})

test('stripLines drops a trailing single line or line range', () => {
  assert.equal(stripLines('a/b.js:10-20'), 'a/b.js')
  assert.equal(stripLines('a/b.js:10'), 'a/b.js')
  assert.equal(stripLines('a/b.js'), 'a/b.js')
  assert.equal(stripLines('a/b.js:10-20:extra'), 'a/b.js:10-20:extra') // only a real trailing ref
})

test('key is stable across citation drift (same paths, moved lines)', () => {
  const a = keyOfFinding(finding({ prototypeEvidence: 'proto/x.html:5-9' }))
  const b = keyOfFinding(finding({ prototypeEvidence: 'proto/x.html:57-118' }))
  assert.equal(a, b)
})

test('key changes when a path, type or screen set changes', () => {
  const base = keyOfFinding(finding())
  assert.notEqual(base, keyOfFinding(finding({ prototypeEvidence: 'proto/RENAMED.html:5-9' })))
  assert.notEqual(base, keyOfFinding(finding({ incrementType: 'add-field' })))
  assert.notEqual(base, keyOfFinding(finding({ screens: ['fe-x', 'dr21-y'] })))
})

test('key is independent of screen order', () => {
  const a = keyOfFinding(finding({ screens: ['fe-x', 'dr21-x'] }))
  const b = keyOfFinding(finding({ screens: ['dr21-x', 'fe-x'] }))
  assert.equal(a, b)
})

test('keyOfIncrement and keyOfFinding agree for the same content', () => {
  const f = finding()
  const inc = findingToIncrement(f, 'inc-001')
  assert.equal(keyOfIncrement(inc), keyOfFinding(f))
})

test('computeKey is a 12-char hex string', () => {
  assert.match(computeKey({ screens: ['a'], type: 't', frontendEvidence: 'x', prototypeEvidence: 'y' }), /^[0-9a-f]{12}$/)
})

test('findingToIncrement maps band → milestone/gate/status and composes detail', () => {
  const inc = findingToIncrement(finding({ band: 'needs-design-decision', detail: 'D', correction: 'C', falsifiedBy: 'F' }), 'inc-042')
  assert.equal(inc.id, 'inc-042')
  assert.equal(inc.milestone, 'M2')
  assert.equal(inc.gate, 'sam')
  assert.equal(inc.status, 'blocked')
  assert.equal(inc.detail, 'D\n\nCORRECTED DURING VERIFICATION: C\n\nFALSIFIED BY: F')
  assert.equal(inc.commit, null)
  assert.ok(inc.key)
})

test('findingToIncrement: frontend-only → M1/todo/no gate', () => {
  const inc = findingToIncrement(finding({ band: 'frontend-only' }), 'inc-001')
  assert.equal(inc.milestone, 'M1')
  assert.equal(inc.gate, null)
  assert.equal(inc.status, 'todo')
})

test('diceCoefficient: identical is 1, unrelated is low', () => {
  assert.equal(diceCoefficient('the frontend hub shows the party name', 'the frontend hub shows the party name'), 1)
  assert.ok(diceCoefficient('the frontend hub shows the party name', 'a completely different sentence about ports') < 0.5)
})

test('orderFindings puts service-wide chrome first', () => {
  const wide = finding({ title: 'Every page must carry a phase banner', band: 'needs-design-decision' })
  const narrow = finding({ title: 'One field on one page', band: 'frontend-only' })
  const ordered = orderFindings([narrow, wide])
  assert.equal(ordered[0].title, wide.title)
})

test('chainDependsOn (full) chains per screen in type order', () => {
  const incs = [
    findingToIncrement(finding({ incrementType: 'add-page', screens: ['s1'], title: 'page' }), 'inc-001'),
    findingToIncrement(finding({ incrementType: 'add-field', screens: ['s1'], title: 'field' }), 'inc-002'),
    findingToIncrement(finding({ incrementType: 'add-field', screens: ['s2'], title: 'other' }), 'inc-003')
  ]
  chainDependsOn(incs)
  const byId = Object.fromEntries(incs.map((i) => [i.id, i]))
  assert.deepEqual(byId['inc-001'].dependsOn, [])          // page first on s1
  assert.deepEqual(byId['inc-002'].dependsOn, ['inc-001']) // field after page on s1
  assert.deepEqual(byId['inc-003'].dependsOn, [])          // independent screen
})

test('chainDependsOn (only=new) preserves existing deps and warns on inversion', () => {
  const existingField = { id: 'inc-005', type: 'add-field', milestone: 'M1', domain: 'd', screens: ['s1'], dependsOn: ['inc-002'] }
  const newPage = { id: 'inc-098', type: 'add-page', milestone: 'M1', domain: 'd', screens: ['s1'], dependsOn: [] }
  const { warnings } = chainDependsOn([existingField, newPage], { only: new Set(['inc-098']) })
  assert.deepEqual(existingField.dependsOn, ['inc-002'])   // untouched
  assert.deepEqual(newPage.dependsOn, [])                  // page has no prior on s1
  assert.equal(warnings.length, 1)
  assert.deepEqual(warnings[0], { existing: 'inc-005', shouldDependOn: 'inc-098', screen: 's1' })
})

test('chainDependsOn (only=new): new field depends on an existing page, no warning', () => {
  const existingPage = { id: 'inc-003', type: 'add-page', milestone: 'M1', domain: 'd', screens: ['s2'], dependsOn: [] }
  const newField = { id: 'inc-099', type: 'add-field', milestone: 'M1', domain: 'd', screens: ['s2'], dependsOn: [] }
  const { warnings } = chainDependsOn([existingPage, newField], { only: new Set(['inc-099']) })
  assert.deepEqual(newField.dependsOn, ['inc-003'])
  assert.equal(warnings.length, 0)
})

// Two distinct findings on the same screens/type citing the same files at different lines — the
// real dashboard "At a glance" vs tabs collision. They must get distinct keys, not collide.
const coLocated = [
  finding({ title: 'At a glance cards', screens: ['dr21-dashboard'], frontendEvidence: 'f/dash.njk:27-35', prototypeEvidence: 'p/dash.html:65-83' }),
  finding({ title: 'Notification tabs', screens: ['dr21-dashboard'], frontendEvidence: 'f/dash.njk:59-83', prototypeEvidence: 'p/dash.html:215-227' })
]

test('keysForFindings disambiguates co-located findings by line order', () => {
  const [a, b] = keysForFindings(coLocated)
  assert.notEqual(a, b)
})

test('co-located ordinals are stable across citation drift', () => {
  const drifted = [
    finding({ title: 'At a glance cards', screens: ['dr21-dashboard'], frontendEvidence: 'f/dash.njk:31-39', prototypeEvidence: 'p/dash.html:69-87' }),
    finding({ title: 'Notification tabs', screens: ['dr21-dashboard'], frontendEvidence: 'f/dash.njk:63-87', prototypeEvidence: 'p/dash.html:219-231' })
  ]
  assert.deepEqual(keysForFindings(coLocated), keysForFindings(drifted))
})

test('finding keys and increment keys agree for the same co-located corpus', () => {
  const incs = coLocated.map((f, i) => findingToIncrement(f, `inc-00${i + 1}`))
  assert.deepEqual(keysForFindings(coLocated), keysForIncrements(incs))
})

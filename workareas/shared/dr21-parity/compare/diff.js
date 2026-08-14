//
// Mechanical differ for two page models in the shared schema.
//
// It finds every concrete delta between a frontend screen and its prototype
// counterpart, so a Phase 3 reviewer spends their judgement on what a difference
// MEANS rather than on spotting it. It deliberately makes no judgement itself: it
// reports, it does not rank, and it never decides that a difference is unimportant.
//
// `url` is excluded by design. Frontend models are recovered from trace snapshots
// whose location is the trace viewer's, so the field is not comparable across sides.
//
const fs = require('fs')
const path = require('path')

const norm = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value)

function scalarDeltas (a, b, keys) {
  const out = []
  for (const key of keys) {
    const left = norm(a[key])
    const right = norm(b[key])
    if (left !== right) out.push({ kind: 'scalar', field: key, frontend: left ?? null, prototype: right ?? null })
  }
  return out
}

// Compares two lists of plain strings as sets plus an order check, so a reordering
// is reported as a reorder rather than as a wholesale replacement.
function listDeltas (a = [], b = [], field) {
  const left = a.map(norm).filter(Boolean)
  const right = b.map(norm).filter(Boolean)
  const leftSet = new Set(left)
  const rightSet = new Set(right)

  const out = []
  const onlyFrontend = left.filter((v) => !rightSet.has(v))
  const onlyPrototype = right.filter((v) => !leftSet.has(v))

  if (onlyFrontend.length) out.push({ kind: 'only-frontend', field, values: onlyFrontend })
  if (onlyPrototype.length) out.push({ kind: 'only-prototype', field, values: onlyPrototype })

  if (!onlyFrontend.length && !onlyPrototype.length) {
    const shared = left.filter((v) => rightSet.has(v))
    const sharedRight = right.filter((v) => leftSet.has(v))
    if (shared.join('|') !== sharedRight.join('|')) {
      out.push({ kind: 'reordered', field, frontend: shared, prototype: sharedRight })
    }
  }
  return out
}

// `allFields` walks the whole page, so it also catches controls outside a <form>.
// Fall back to form-scoped fields only for models captured before that key existed.
const fieldsOf = (model) => model.allFields || (model.forms || []).flatMap((form) => form.fields || [])
const buttonsOf = (model) => (model.forms || []).flatMap((form) => form.buttons || [])

const optionLabels = (field) => (field.options || []).map((o) => norm(o.label)).filter(Boolean)

// Fields are matched by name — the one identifier both codebases genuinely share.
// An unnamed control (rare, usually a search box) falls back to its label.
const fieldKey = (field) => field.name || `unnamed:${norm(field.label) || field.kind}`

function fieldDeltas (a, b) {
  const left = new Map(fieldsOf(a).map((f) => [fieldKey(f), f]))
  const right = new Map(fieldsOf(b).map((f) => [fieldKey(f), f]))
  const out = []

  for (const [key, field] of left) {
    if (!right.has(key)) {
      out.push({ kind: 'field-only-frontend', name: key, controlKind: field.kind, label: norm(field.label) })
    }
  }
  for (const [key, field] of right) {
    if (!left.has(key)) {
      out.push({ kind: 'field-only-prototype', name: key, controlKind: field.kind, label: norm(field.label) })
    }
  }

  for (const [key, lf] of left) {
    const rf = right.get(key)
    if (!rf) continue

    const changed = []
    for (const attr of ['kind', 'label', 'hint', 'legend', 'autocomplete', 'inputmode']) {
      if (norm(lf[attr]) !== norm(rf[attr])) {
        changed.push({ attr, frontend: norm(lf[attr]) ?? null, prototype: norm(rf[attr]) ?? null })
      }
    }

    const lo = optionLabels(lf)
    const ro = optionLabels(rf)
    if (lo.join('|') !== ro.join('|')) {
      const roSet = new Set(ro)
      const loSet = new Set(lo)
      changed.push({
        attr: 'options',
        onlyFrontend: lo.filter((v) => !roSet.has(v)),
        onlyPrototype: ro.filter((v) => !loSet.has(v)),
        frontendCount: lo.length,
        prototypeCount: ro.length
      })
    }

    if (changed.length) out.push({ kind: 'field-changed', name: key, changes: changed })
  }

  // Field order is a real UX difference, so report it once the sets agree.
  const sharedLeft = [...left.keys()].filter((k) => right.has(k))
  const sharedRight = [...right.keys()].filter((k) => left.has(k))
  if (sharedLeft.join('|') !== sharedRight.join('|')) {
    out.push({ kind: 'field-order', frontend: sharedLeft, prototype: sharedRight })
  }

  return out
}

// Compare the concept, not the component. `summaryRows` and `taskItems` capture both
// the govuk-frontend markup and the prototype's bespoke app-* equivalents, so a screen
// built from different macros no longer reads as a screen missing the content.
function summaryRowDeltas (a, b) {
  const rows = (model) =>
    (model.summaryRows || []).map((row) => norm(row.key)).filter(Boolean)
  return listDeltas(rows(a), rows(b), 'summaryRows')
}

function taskDeltas (a, b) {
  const tasks = (model) => (model.taskItems || []).map((item) => norm(item.title)).filter(Boolean)
  return listDeltas(tasks(a), tasks(b), 'taskItems')
}

function tableDeltas (a, b) {
  const heads = (model) => (model.tables || []).flatMap((t) => (t.head || []).map(norm))
  return listDeltas(heads(a), heads(b), 'tableHeadings')
}

function diff (frontend, prototype) {
  const deltas = [
    ...scalarDeltas(frontend, prototype, ['h1', 'caption', 'backLink', 'phaseBanner']),
    ...listDeltas(
      (frontend.headings || []).map((h) => `${h.level} ${norm(h.text)}`),
      (prototype.headings || []).map((h) => `${h.level} ${norm(h.text)}`),
      'headings'
    ),
    ...fieldDeltas(frontend, prototype),
    ...listDeltas(buttonsOf(frontend).map((b) => norm(b.text)), buttonsOf(prototype).map((b) => norm(b.text)), 'buttons'),
    ...listDeltas(
      (frontend.links || []).map((l) => norm(l.text)),
      (prototype.links || []).map((l) => norm(l.text)),
      'links'
    ),
    ...listDeltas(
      (frontend.serviceNav || []).map((l) => norm(l.text)),
      (prototype.serviceNav || []).map((l) => norm(l.text)),
      'serviceNav'
    ),
    ...summaryRowDeltas(frontend, prototype),
    ...taskDeltas(frontend, prototype),
    ...tableDeltas(frontend, prototype),
    ...listDeltas(frontend.insetText, prototype.insetText, 'insetText'),
    ...listDeltas(frontend.warningText, prototype.warningText, 'warningText'),
    ...listDeltas(
      (frontend.details || []).map((d) => norm(d.summary)),
      (prototype.details || []).map((d) => norm(d.summary)),
      'detailsSummaries'
    ),
    ...listDeltas(
      (frontend.tags || []).map((t) => norm(t.text)),
      (prototype.tags || []).map((t) => norm(t.text)),
      'tags'
    ),
    ...listDeltas(frontend.paragraphs, prototype.paragraphs, 'paragraphs')
  ]

  return deltas
}

function main () {
  const [fePath, protoPath, outPath] = process.argv.slice(2)
  if (!fePath || !protoPath) {
    console.error('usage: node diff.js <frontend-model.json> <prototype-model.json> [out.json]')
    process.exit(2)
  }

  const frontend = JSON.parse(fs.readFileSync(fePath, 'utf8'))
  const prototype = JSON.parse(fs.readFileSync(protoPath, 'utf8'))
  const deltas = diff(frontend, prototype)

  const result = {
    frontend: path.basename(fePath, '.json'),
    prototype: path.basename(protoPath, '.json'),
    frontendH1: frontend.h1,
    prototypeH1: prototype.h1,
    deltaCount: deltas.length,
    deltas
  }

  const json = `${JSON.stringify(result, null, 2)}\n`
  if (outPath) fs.writeFileSync(outPath, json)
  else console.log(json)
}

if (require.main === module) main()

module.exports = { diff }

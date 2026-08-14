//
// Runs the mechanical differ across every paired screen and writes one delta file
// per pair, plus a summary ordered by delta count.
//
// This is the input to Phase 3, not its output. A delta is a fact; whether it matters,
// and what increment it implies, is the reviewer's call.
//
const fs = require('fs')
const path = require('path')
const { diff } = require('./diff')
const { pairs, onlyFrontend, onlyPrototype } = require('./pairs')

const FE = path.join(__dirname, '..', 'fe-miner', 'capture', 'model')
const PROTO = path.join(__dirname, '..', 'harness', 'capture', 'model')
const OUT = path.join(__dirname, 'deltas')

const load = (dir, name) => {
  const file = path.join(dir, `${name}.json`)
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
}

function main () {
  fs.mkdirSync(OUT, { recursive: true })

  const summary = []
  const missing = []

  for (const pair of pairs) {
    const frontend = load(FE, pair.frontend)
    const prototype = load(PROTO, pair.prototype)

    if (!frontend || !prototype) {
      missing.push({
        ...pair,
        missing: [!frontend && pair.frontend, !prototype && pair.prototype].filter(Boolean)
      })
      continue
    }

    const deltas = diff(frontend, prototype)
    const record = {
      ...pair,
      frontendH1: frontend.h1,
      prototypeH1: prototype.h1,
      deltaCount: deltas.length,
      deltas
    }

    const name = `${pair.frontend}__${pair.prototype}`
    fs.writeFileSync(path.join(OUT, `${name}.json`), `${JSON.stringify(record, null, 2)}\n`)

    summary.push({
      pair: name,
      frontendH1: frontend.h1,
      prototypeH1: prototype.h1,
      headingMatches: frontend.h1 === prototype.h1,
      deltaCount: deltas.length
    })
  }

  summary.sort((a, b) => b.deltaCount - a.deltaCount)

  const report = {
    pairsCompared: summary.length,
    pairsMissingAModel: missing,
    totalDeltas: summary.reduce((n, s) => n + s.deltaCount, 0),
    onlyFrontendCount: onlyFrontend.length,
    onlyPrototypeCount: onlyPrototype.length,
    summary
  }
  fs.writeFileSync(path.join(OUT, '_summary.json'), `${JSON.stringify(report, null, 2)}\n`)

  console.log(`compared ${summary.length} pairs, ${report.totalDeltas} deltas total`)
  if (missing.length) {
    console.log(`\nmissing a model (not compared):`)
    for (const m of missing) console.log(`  ${m.frontend} <-> ${m.prototype}  missing: ${m.missing.join(', ')}`)
  }
  console.log(`\nmost-changed pairs:`)
  for (const s of summary.slice(0, 12)) {
    const flag = s.headingMatches ? ' ' : '!'
    console.log(`  ${String(s.deltaCount).padStart(3)} ${flag} ${s.pair}`)
  }
  console.log(`\nunpaired: ${onlyFrontend.length} frontend-only, ${onlyPrototype.length} prototype-only screens`)
}

main()

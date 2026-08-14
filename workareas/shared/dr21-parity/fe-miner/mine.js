//
// Mines the real frontend's Playwright traces into page models, using the same
// extractor the prototype cartographer uses. The frontend needs no capture harness
// of its own: its `features` suite already renders every page, so the models are
// recovered from the traces that suite produces.
//
// Pass 1 indexes every trace by its title (`trace open` prints it back), which is
// the only reliable join between a hash-named trace directory and the screen it
// shows. Pass 2 dumps the frozen DOM for each targeted screen and extracts a model.
//
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { JSDOM } = require('jsdom')

const { EXTRACTOR } = require('../harness/e2e/page-model')
const TARGETS = require('./targets')

const FRONTEND = path.join(
  process.env.HOME,
  'git/defra/trade-imports-animals/repos/trade-imports-animals-frontend'
)
const PLAYWRIGHT = path.join(FRONTEND, 'node_modules/.bin/playwright')
const RESULTS = path.join(FRONTEND, 'test-results')
const OUT = path.join(__dirname, 'capture')

// `trace open` extracts to .playwright-cli/ relative to cwd, so every run of this
// script is pinned here rather than wherever npm was invoked from.
const CWD = __dirname

function trace (...args) {
  return execFileSync(PLAYWRIGHT, ['trace', ...args], {
    cwd: CWD,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe']
  })
}

function titleOf (zip) {
  const out = trace('open', zip)
  const line = out.split('\n').find((l) => l.trim().startsWith('Title:'))
  return line ? line.replace(/^\s*Title:\s*/, '').trim() : null
}

// Action ids run in source order and the trailing "After Hooks" block has no page,
// so the last id before it is the settled end-state of the page under test.
function candidateActionIds () {
  const out = trace('actions')
  const ids = []
  for (const line of out.split('\n')) {
    if (/^\s*\d+\.\s/.test(line)) {
      const id = Number(line.trim().split('.')[0])
      const isTeardown = /After Hooks|Fixture "|Close context/.test(line)
      if (!isTeardown) ids.push(id)
    }
  }
  return ids.reverse()
}

function dumpDom (name) {
  const rel = path.join('capture', 'html', `${name}.html`)
  for (const id of candidateActionIds().slice(0, 12)) {
    try {
      trace('snapshot', String(id), '--', 'eval', 'document.documentElement.outerHTML', `--filename=${rel}`)
      const file = path.join(__dirname, rel)
      if (fs.existsSync(file) && fs.statSync(file).size > 0) return { id, file }
    } catch {
      // Hook and fixture actions have no associated page; walk back to one that does.
    }
  }
  return null
}

// `trace snapshot -- eval --filename` writes the JSON-serialised result, so a DOM
// dump arrives as a quoted string literal with every attribute quote escaped.
// Feeding that straight to jsdom parses `class=\"x\"` as junk: tag selectors still
// work, every class selector silently returns nothing, and the model comes out
// plausible but hollow. Decode before parsing.
function readDom (file) {
  const raw = fs.readFileSync(file, 'utf8')
  return raw.trimStart().startsWith('"') ? JSON.parse(raw) : raw
}

function extract (html, name) {
  // `runScripts: 'outside-only'` gives the window a real script realm, so
  // window.eval sees document/location. Building the function in Node's scope
  // instead (new window.Function) leaves `document` undefined inside the extractor.
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
  const { window } = dom
  if (!window.CSS) window.CSS = {}
  if (typeof window.CSS.escape !== 'function') {
    window.CSS.escape = (value) => String(value).replace(/([^\w-])/g, '\\$1')
  }
  const model = window.eval(`(${EXTRACTOR.toString()})()`)
  // The frozen snapshot is served from the trace viewer, so its own location is not
  // the application URL. Keep the screen name as the stable identity instead.
  model.url = name
  dom.window.close()
  return model
}

function main () {
  for (const sub of ['model', 'html']) fs.mkdirSync(path.join(OUT, sub), { recursive: true })

  const remaining = new Map(TARGETS.map((t) => [t.name, t]))
  const done = []
  const failed = []

  // Dumping a DOM means opening a trace, which is the slow part. A dump already on
  // disk is reused, so a re-run after an extractor fix costs seconds not minutes.
  for (const target of [...remaining.values()]) {
    const cached = path.join(OUT, 'html', `${target.name}.html`)
    if (!fs.existsSync(cached) || fs.statSync(cached).size === 0) continue
    try {
      const model = extract(readDom(cached), target.name)
      if (!model.h1) continue
      fs.writeFileSync(path.join(OUT, 'model', `${target.name}.json`), `${JSON.stringify(model, null, 2)}\n`)
      done.push({ name: target.name, h1: model.h1, action: 'cached-dom' })
      remaining.delete(target.name)
      console.log(`  ${target.name}  h1="${model.h1}"  (cached DOM)`)
    } catch (error) {
      failed.push({ name: target.name, reason: `cached DOM: ${error.message}` })
    }
  }

  const dirs = remaining.size
    ? fs.readdirSync(RESULTS).filter((d) => fs.existsSync(path.join(RESULTS, d, 'trace.zip')))
    : []
  if (dirs.length) console.log(`indexing ${dirs.length} traces for ${remaining.size} remaining screens`)

  for (const dir of dirs) {
    if (remaining.size === 0) break
    const zip = path.join(RESULTS, dir, 'trace.zip')

    let title
    try {
      title = titleOf(zip)
    } catch {
      continue
    }
    if (!title) continue

    const hit = [...remaining.values()].find((t) => title.includes(t.match))
    if (!hit) continue
    remaining.delete(hit.name)

    const dumped = dumpDom(hit.name)
    if (!dumped) {
      failed.push({ name: hit.name, reason: 'no action with an associated page', title })
      continue
    }

    try {
      const model = extract(readDom(dumped.file), hit.name)
      if (!model.h1) {
        failed.push({ name: hit.name, reason: 'extracted model has no h1', title })
        continue
      }
      fs.writeFileSync(
        path.join(OUT, 'model', `${hit.name}.json`),
        `${JSON.stringify(model, null, 2)}\n`
      )
      done.push({ name: hit.name, h1: model.h1, action: dumped.id })
      console.log(`  ${hit.name}  h1="${model.h1}"`)
    } catch (error) {
      failed.push({ name: hit.name, reason: error.message, title })
    }
  }

  try {
    trace('close')
  } catch {
    // Nothing extracted; nothing to clean up.
  }

  const unmatched = [...remaining.keys()]
  const report = { captured: done, failed, unmatched }
  fs.writeFileSync(path.join(OUT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)

  console.log(`\ncaptured ${done.length}/${TARGETS.length}`)
  if (failed.length) console.log(`failed:    ${failed.map((f) => f.name).join(', ')}`)
  if (unmatched.length) console.log(`unmatched: ${unmatched.join(', ')}`)
}

main()

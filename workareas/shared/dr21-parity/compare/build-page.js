//
// Renders the verified backlog as a browsable page. The backlog is operated rather
// than read start-to-finish — you arrive wanting the items you could schedule this
// week — so the page leads with counts and filters, not prose.
//
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

// Read the canonical increment backlog, not the raw findings — so the page and the
// build loop name the same things. Someone reading the page can say "inc-042" and
// next-increment.sh knows exactly which one they mean.
const CANONICAL = path.join(
  process.env.HOME,
  'git/defra/trade-imports-animals/workareas/journey-builder/EUDPA-328/backlog.json'
)
const canonical = JSON.parse(fs.readFileSync(CANONICAL, 'utf8'))
const findings = JSON.parse(fs.readFileSync(path.join(ROOT, 'backlog.json'), 'utf8'))
const data = { survived: canonical.increments, refuted: findings.refuted }

const BANDS = [
  { id: 'frontend-only', label: 'Buildable now', blurb: 'No dependencies. These can be scheduled today.' },
  { id: 'needs-design-decision', label: 'Needs a decision', blurb: 'Blocked on a ruling, not on code.' },
  { id: 'needs-backend', label: 'Needs backend', blurb: 'Blocked on API or persistence changes.' }
]

const TYPES = [
  'add-page', 'add-section', 'add-collection', 'add-field',
  'obligation-change', 'flow-change', 'copy-change'
]

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const IN_FLIGHT = (title) =>
  title.toLowerCase().includes('typeahead')
    ? 'Already in progress on feature/EUDPA-124-port-of-entry-type-ahead. Confirm the branch covers it before scheduling.'
    : null

const rank = (f) => {
  const i = TYPES.indexOf(f.type)
  return i === -1 ? TYPES.length : i
}

// The detail carries the verifier's correction and the falsifier as trailing labelled
// blocks. Split them back out so each gets its own treatment on the page.
function splitDetail (detail) {
  const text = detail || ''
  const parts = { body: text, correction: null, falsifier: null }
  const falsifierAt = text.indexOf('FALSIFIED BY:')
  if (falsifierAt !== -1) {
    parts.falsifier = text.slice(falsifierAt + 'FALSIFIED BY:'.length).trim()
    parts.body = text.slice(0, falsifierAt).trim()
  }
  const correctionAt = parts.body.indexOf('CORRECTED DURING VERIFICATION:')
  if (correctionAt !== -1) {
    parts.correction = parts.body.slice(correctionAt + 'CORRECTED DURING VERIFICATION:'.length).trim()
    parts.body = parts.body.slice(0, correctionAt).trim()
  }
  return parts
}

function itemCard (item) {
  const flight = IN_FLIGHT(item.title)
  const { body, correction, falsifier } = splitDetail(item.detail)
  return `
      <article class="item" data-band="${esc(item.band)}" data-type="${esc(item.type)}" data-domain="${esc(item.domain)}">
        <header class="item__head">
          <span class="item__n">${esc(item.id)}</span>
          <h3 class="item__title">${esc(item.title)}</h3>
        </header>
        <div class="item__meta">
          <span class="chip chip--type">${esc(item.type)}</span>
          <span class="chip">${esc(item.domain)}</span>
          <span class="chip">${esc(item.milestone)}</span>
          <span class="chip chip--conf chip--conf-${esc(item.confidence)}">${esc(item.confidence)} confidence</span>
          ${item.gate ? `<span class="chip chip--gate">blocked · ${esc(item.gate)}</span>` : ''}
        </div>
        ${body ? `<p class="item__detail">${esc(body)}</p>` : ''}
        ${correction ? `<p class="note note--corrected"><span class="note__label">Corrected by verification</span>${esc(correction)}</p>` : ''}
        ${flight ? `<p class="note note--flight"><span class="note__label">Already in progress</span>${esc(flight)}</p>` : ''}
        <dl class="evidence">
          <dt>Frontend</dt><dd><code>${esc(item.evidence.frontend)}</code></dd>
          <dt>Prototype</dt><dd><code>${esc(item.evidence.prototype)}</code></dd>
          ${item.screens && item.screens.length ? `<dt>Screens</dt><dd>${item.screens.map((s) => `<code>${esc(s)}</code>`).join(' ')}</dd>` : ''}
          ${item.dependsOn && item.dependsOn.length ? `<dt>Depends on</dt><dd>${item.dependsOn.map((d) => `<code>${esc(d)}</code>`).join(' ')}</dd>` : ''}
          ${falsifier ? `<dt>Falsified by</dt><dd class="evidence__falsifier">${esc(falsifier)}</dd>` : ''}
        </dl>
      </article>`
}

function bandSection (band) {
  const items = data.survived
    .filter((f) => f.band === band.id)
    .sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title))

  return `
    <section class="band" id="${esc(band.id)}" data-band-section="${esc(band.id)}">
      <div class="band__head">
        <h2 class="band__title"><span class="band__dot band__dot--${esc(band.id)}"></span>${esc(band.label)}</h2>
        <p class="band__blurb">${esc(band.blurb)}</p>
        <span class="band__count">${items.length}</span>
      </div>
      <div class="band__items">${items.map((item) => itemCard(item)).join('')}</div>
    </section>`
}

const counts = Object.fromEntries(
  BANDS.map((b) => [b.id, data.survived.filter((f) => f.band === b.id).length])
)

const typeCounts = TYPES.map((t) => ({
  type: t,
  n: data.survived.filter((f) => f.type === t).length
})).filter((t) => t.n)

const domainCounts = [...new Set(data.survived.map((f) => f.domain))]
  .map((d) => ({ domain: d, n: data.survived.filter((f) => f.domain === d).length }))
  .sort((a, b) => b.n - a.n)

const html = `<title>DR2.1 Parity Backlog</title>
<style>
  :root {
    --ground: #f6f7f5;
    --surface: #ffffff;
    --surface-sunk: #eef0ed;
    --ink: #191d1b;
    --ink-muted: #5c6560;
    --ink-faint: #838d87;
    --rule: #dee3de;
    --accent: #1f5f4e;
    --band-frontend-only: #2e6b3e;
    --band-needs-design-decision: #8a5a12;
    --band-needs-backend: #34518c;
    --shadow: 0 1px 2px rgba(25, 29, 27, .05), 0 8px 24px -16px rgba(25, 29, 27, .28);

    --display: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    --body: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #101311;
      --surface: #171b19;
      --surface-sunk: #1e2320;
      --ink: #e8ede9;
      --ink-muted: #9aa49d;
      --ink-faint: #78827b;
      --rule: #272d29;
      --accent: #6fbfa6;
      --band-frontend-only: #6aae76;
      --band-needs-design-decision: #d2a052;
      --band-needs-backend: #7d9ada;
      --shadow: 0 1px 2px rgba(0, 0, 0, .4), 0 8px 24px -16px rgba(0, 0, 0, .8);
    }
  }

  :root[data-theme="dark"] {
    --ground: #101311;
    --surface: #171b19;
    --surface-sunk: #1e2320;
    --ink: #e8ede9;
    --ink-muted: #9aa49d;
    --ink-faint: #78827b;
    --rule: #272d29;
    --accent: #6fbfa6;
    --band-frontend-only: #6aae76;
    --band-needs-design-decision: #d2a052;
    --band-needs-backend: #7d9ada;
    --shadow: 0 1px 2px rgba(0, 0, 0, .4), 0 8px 24px -16px rgba(0, 0, 0, .8);
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: var(--body);
    font-size: 16px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  .wrap {
    max-width: 62rem;
    margin: 0 auto;
    padding: clamp(2rem, 5vw, 4.5rem) clamp(1rem, 4vw, 2.5rem) 6rem;
    display: flex;
    flex-direction: column;
    gap: 2.75rem;
  }

  .masthead { display: flex; flex-direction: column; gap: .9rem; }

  .eyebrow {
    font-family: var(--mono);
    font-size: .75rem;
    letter-spacing: .09em;
    text-transform: uppercase;
    color: var(--accent);
  }

  h1 {
    font-family: var(--display);
    font-size: clamp(2.1rem, 5vw, 3.1rem);
    line-height: 1.08;
    font-weight: 600;
    letter-spacing: -.015em;
    margin: 0;
    text-wrap: balance;
  }

  .standfirst {
    margin: 0;
    max-width: 46rem;
    font-size: 1.075rem;
    color: var(--ink-muted);
  }

  .refs {
    font-family: var(--mono);
    font-size: .78rem;
    color: var(--ink-faint);
    display: flex;
    flex-wrap: wrap;
    gap: .35rem 1.25rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 1px;
    background: var(--rule);
    border: 1px solid var(--rule);
    border-radius: 3px;
    overflow: hidden;
  }

  .stat { background: var(--surface); padding: 1.15rem 1.25rem; display: flex; flex-direction: column; gap: .3rem; }
  .stat__n { font-family: var(--display); font-size: 2.15rem; line-height: 1; font-variant-numeric: tabular-nums; }
  .stat__label { font-size: .82rem; color: var(--ink-muted); }
  .stat--frontend-only .stat__n { color: var(--band-frontend-only); }
  .stat--needs-design-decision .stat__n { color: var(--band-needs-design-decision); }
  .stat--needs-backend .stat__n { color: var(--band-needs-backend); }

  .method { border-left: 2px solid var(--accent); padding: .1rem 0 .1rem 1.15rem; display: flex; flex-direction: column; gap: .6rem; }
  .method p { margin: 0; color: var(--ink-muted); font-size: .95rem; max-width: 48rem; }
  .method strong { color: var(--ink); font-weight: 600; }

  .controls { display: flex; flex-direction: column; gap: .75rem; position: sticky; top: 0; background: var(--ground); padding: .9rem 0; z-index: 5; border-bottom: 1px solid var(--rule); }
  .controls__row { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
  .controls__label { font-family: var(--mono); font-size: .7rem; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-faint); margin-right: .35rem; }

  .filter {
    font: inherit;
    font-size: .84rem;
    padding: .3rem .7rem;
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: var(--surface);
    color: var(--ink-muted);
    cursor: pointer;
  }
  .filter:hover { border-color: var(--ink-faint); color: var(--ink); }
  .filter:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .filter[aria-pressed="true"] { background: var(--ink); color: var(--ground); border-color: var(--ink); }

  .band { display: flex; flex-direction: column; gap: 1.1rem; scroll-margin-top: 6rem; }
  .band__head { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: .2rem 1rem; padding-bottom: .5rem; border-bottom: 1px solid var(--rule); }
  .band__title { font-family: var(--display); font-size: 1.65rem; font-weight: 600; margin: 0; display: flex; align-items: center; gap: .6rem; }
  .band__dot { width: .6rem; height: .6rem; border-radius: 50%; flex: none; }
  .band__dot--frontend-only { background: var(--band-frontend-only); }
  .band__dot--needs-design-decision { background: var(--band-needs-design-decision); }
  .band__dot--needs-backend { background: var(--band-needs-backend); }
  .band__blurb { grid-column: 1; margin: 0; color: var(--ink-muted); font-size: .95rem; }
  .band__count { grid-row: 1 / span 2; font-family: var(--display); font-size: 2rem; color: var(--ink-faint); font-variant-numeric: tabular-nums; }

  .band__items { display: flex; flex-direction: column; gap: .9rem; }

  .item { background: var(--surface); border: 1px solid var(--rule); border-radius: 3px; padding: 1.15rem 1.3rem; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: .7rem; }
  .item__head { display: flex; gap: .8rem; align-items: baseline; }
  .item__n { font-family: var(--mono); font-size: .8rem; color: var(--ink-faint); font-variant-numeric: tabular-nums; flex: none; padding-top: .15rem; }
  .item__title { margin: 0; font-size: 1.03rem; font-weight: 600; line-height: 1.4; text-wrap: pretty; }
  .item__meta { display: flex; flex-wrap: wrap; gap: .4rem; padding-left: 1.85rem; }
  .item__detail { margin: 0; padding-left: 1.85rem; color: var(--ink-muted); font-size: .93rem; }

  .chip { font-family: var(--mono); font-size: .7rem; letter-spacing: .04em; padding: .16rem .5rem; border-radius: 2px; background: var(--surface-sunk); color: var(--ink-muted); }
  .chip--conf-high { color: var(--band-frontend-only); }
  .chip--conf-medium { color: var(--band-needs-design-decision); }
  .chip--gate { color: var(--band-needs-backend); border: 1px solid currentColor; background: transparent; }

  .note { margin: 0 0 0 1.85rem; font-size: .9rem; padding: .7rem .85rem; border-radius: 2px; background: var(--surface-sunk); color: var(--ink-muted); }
  .note__label { display: block; font-family: var(--mono); font-size: .68rem; letter-spacing: .07em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: .25rem; }
  .note--flight { border-left: 2px solid var(--band-needs-design-decision); }

  .evidence { margin: 0 0 0 1.85rem; display: grid; grid-template-columns: max-content 1fr; gap: .25rem .9rem; font-size: .84rem; }
  .evidence dt { font-family: var(--mono); font-size: .7rem; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-faint); padding-top: .12rem; }
  .evidence dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
  .evidence code { font-family: var(--mono); font-size: .8rem; color: var(--ink); }
  .evidence__falsifier { color: var(--ink-muted); font-style: italic; }

  .closing { display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid var(--rule); padding-top: 2rem; }
  .closing h2 { font-family: var(--display); font-size: 1.35rem; margin: 0; font-weight: 600; }
  .closing p { margin: 0; color: var(--ink-muted); font-size: .95rem; max-width: 48rem; }
  .dropped { background: var(--surface-sunk); border-radius: 3px; padding: 1rem 1.15rem; font-size: .9rem; color: var(--ink-muted); }
  .dropped strong { color: var(--ink); font-weight: 600; display: block; margin-bottom: .3rem; }

  .empty { display: none; color: var(--ink-muted); font-style: italic; padding: 1rem 0; }
  .band[hidden] { display: none; }

  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
</style>

<div class="wrap">
  <header class="masthead">
    <span class="eyebrow">EUDPA-328 · Design release 2.1</span>
    <h1>What the frontend is missing</h1>
    <p class="standfirst">
      Every difference between the live-animals frontend and the designer prototype, found by
      capturing both as Playwright traces, mining them into comparable page models, and diffing
      them. Each item below carries evidence on both sides and survived a verifier whose
      instruction was to refute it.
    </p>
    <div class="refs">
      <span>frontend main@32f6106c</span>
      <span>prototype 7da4f70</span>
      <span>103 page models</span>
      <span>468 mechanical deltas</span>
    </div>
  </header>

  <div class="stats">
    <div class="stat"><span class="stat__n">${data.survived.length}</span><span class="stat__label">verified items</span></div>
    ${BANDS.map((b) => `<div class="stat stat--${b.id}"><span class="stat__n">${counts[b.id]}</span><span class="stat__label">${esc(b.label.toLowerCase())}</span></div>`).join('')}
  </div>

  <div class="method">
    <p><strong>93 differences were deliberately not raised</strong>, each with a recorded reason, so the judgement is visible rather than implicit.</p>
    <p><strong>60 of these ${data.survived.length} items were corrected</strong> during verification — scope narrowed or claims amended against the source. One finding was refuted outright and dropped.</p>
    <p><strong>This page is a view, not the source.</strong> The backlog itself is
    <code>workareas/journey-builder/EUDPA-328/backlog.json</code>, in the shape the build loop already
    consumes — <code>next-increment.sh EUDPA-328 --claim</code> pops the next runnable item, and each
    <code>inc-nnn</code> below is the id it returns. The implementor is the <code>frontend-change</code>
    skill, invoked with the item's type as its mode.</p>
  </div>

  <div class="controls">
    <div class="controls__row">
      <span class="controls__label">Band</span>
      <button class="filter" data-filter-band="all" aria-pressed="true">All</button>
      ${BANDS.map((b) => `<button class="filter" data-filter-band="${b.id}" aria-pressed="false">${esc(b.label)}</button>`).join('')}
    </div>
    <div class="controls__row">
      <span class="controls__label">Type</span>
      <button class="filter" data-filter-type="all" aria-pressed="true">All</button>
      ${typeCounts.map((t) => `<button class="filter" data-filter-type="${t.type}" aria-pressed="false">${esc(t.type)} <span aria-hidden="true">·</span> ${t.n}</button>`).join('')}
    </div>
    <div class="controls__row">
      <span class="controls__label">Domain</span>
      <button class="filter" data-filter-domain="all" aria-pressed="true">All</button>
      ${domainCounts.map((d) => `<button class="filter" data-filter-domain="${d.domain}" aria-pressed="false">${esc(d.domain)} <span aria-hidden="true">·</span> ${d.n}</button>`).join('')}
    </div>
  </div>

  <main id="bands">
    ${BANDS.map(bandSection).join('')}
    <p class="empty" id="empty">No items match that combination.</p>
  </main>

  <footer class="closing">
    <h2>Refuted and dropped</h2>
    <div class="dropped">
      <strong>${esc(data.refuted[0] ? data.refuted[0].title : 'None')}</strong>
      ${esc(data.refuted[0] ? data.refuted[0].reason : '')}
    </div>
    <p>
      The prototype side of this corpus is reproducible: the DR2.1 walker lives in the workspace
      and re-captures all 70 screens in under three minutes, so the comparison can be refreshed
      whenever the designers move.
    </p>
  </footer>
</div>

<script>
  (function () {
    var band = 'all'
    var type = 'all'
    var domain = 'all'

    function apply () {
      var visibleTotal = 0

      document.querySelectorAll('[data-band-section]').forEach(function (section) {
        var items = section.querySelectorAll('.item')
        var shown = 0

        items.forEach(function (item) {
          var bandOk = band === 'all' || item.dataset.band === band
          var typeOk = type === 'all' || item.dataset.type === type
          var domainOk = domain === 'all' || item.dataset.domain === domain
          var visible = bandOk && typeOk && domainOk
          item.hidden = !visible
          if (visible) shown++
        })

        section.hidden = shown === 0
        section.querySelector('.band__count').textContent = shown
        visibleTotal += shown
      })

      document.getElementById('empty').style.display = visibleTotal === 0 ? 'block' : 'none'
    }

    function wire (attr, set) {
      var buttons = document.querySelectorAll('[' + attr + ']')
      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          buttons.forEach(function (other) { other.setAttribute('aria-pressed', String(other === button)) })
          set(button.getAttribute(attr))
          apply()
        })
      })
    }

    wire('data-filter-band', function (value) { band = value })
    wire('data-filter-type', function (value) { type = value })
    wire('data-filter-domain', function (value) { domain = value })
  })()
</script>
`

fs.writeFileSync(path.join(ROOT, 'backlog-page.html'), html)
console.log(`wrote backlog-page.html — ${data.survived.length} items`)

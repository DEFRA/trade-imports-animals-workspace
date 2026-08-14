//
// Runs the extractor over one dumped DOM and prints the real error, so an
// extraction failure inside the mining loop is diagnosable rather than swallowed.
//
const fs = require('fs')
const path = require('path')
const { JSDOM } = require('jsdom')
const { EXTRACTOR } = require('../harness/e2e/page-model')

const file = process.argv[2] || path.join(__dirname, 'capture/html/fe-additional-details.html')
const html = fs.readFileSync(file, 'utf8')

const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
const { window } = dom

if (!window.CSS) window.CSS = {}
if (typeof window.CSS.escape !== 'function') {
  window.CSS.escape = (value) => String(value).replace(/([^\w-])/g, '\\$1')
}

console.log('has main:', !!window.document.querySelector('main'))
console.log('has h1:  ', window.document.querySelector('h1')?.textContent?.trim())
console.log('CSS.escape:', typeof window.CSS.escape)

const model = window.eval(`(${EXTRACTOR.toString()})()`)
console.log('h1 from model:', JSON.stringify(model.h1))
console.log('forms:', (model.forms || []).length, 'headings:', (model.headings || []).length)

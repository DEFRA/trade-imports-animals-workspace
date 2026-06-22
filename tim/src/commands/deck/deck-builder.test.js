import { describe, test, expect } from 'vitest'
import { execa } from 'execa'
import { readFileSync, statSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildDeck } from './deck-builder.js'
import { renderResult } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const cliPath = join(here, '..', '..', 'cli.js')
const specPath = join(here, '__fixtures__', 'deck-spec.json')
const fixtureSpec = JSON.parse(readFileSync(specPath, 'utf8'))

const tempOut = () =>
  join(mkdtempSync(join(tmpdir(), 'tim-deck-')), 'deck.pptx')

// A .pptx is a zip; each slide is a distinct slideN.xml part under
// ppt/slides/. The same path string recurs across zip headers and the
// content-types manifest, so count distinct filenames, not raw hits.
const countSlideParts = (pptxBytes) => {
  const text = pptxBytes.toString('latin1')
  const matches = text.match(/ppt\/slides\/slide\d+\.xml/g) ?? []
  return new Set(matches).size
}

describe('buildDeck', () => {
  test('reports one slide per section plus a title and summary slide', async () => {
    const out = tempOut()

    const result = await buildDeck(fixtureSpec, out)

    // title + 4 sections + summary
    expect(result.slideCount).toBe(6)
    expect(result.outputPath).toBe(out)
    expect(result.format).toBe('pptx')
  })

  test('writes a non-empty .pptx file to the output path', async () => {
    const out = tempOut()

    await buildDeck(fixtureSpec, out)

    expect(statSync(out).size).toBeGreaterThan(0)
  })

  test('the written .pptx contains a slide part for every slide', async () => {
    const out = tempOut()

    const result = await buildDeck(fixtureSpec, out)

    const bytes = readFileSync(out)
    expect(countSlideParts(bytes)).toBe(result.slideCount)
  })

  test('builds a deck when the summary has no closing line', async () => {
    const out = tempOut()
    const { closing, ...summaryWithoutClosing } = fixtureSpec.summary
    const spec = { ...fixtureSpec, summary: summaryWithoutClosing }

    const result = await buildDeck(spec, out)

    expect(result.slideCount).toBe(6)
    expect(statSync(out).size).toBeGreaterThan(0)
  })
})

describe('renderResult', () => {
  test('reports the slide count, the path, and the Google Slides hint', () => {
    const text = renderResult({ outputPath: '/tmp/deck.pptx', slideCount: 6 })

    expect(text).toContain('Built 6 slides.')
    expect(text).toContain('Saved to /tmp/deck.pptx')
    expect(text).toContain(
      'Upload deck.pptx to Google Drive and open with Google Slides to edit.'
    )
  })
})

describe('tim deck generate (CLI)', () => {
  test('emits a JSON envelope with outputPath, slideCount, and format', async () => {
    const out = tempOut()

    const { stdout, exitCode } = await execa(
      'node',
      [cliPath, 'deck', 'generate', specPath, '--out', out, '--json'],
      { reject: false }
    )

    expect(exitCode).toBe(0)
    const payload = JSON.parse(stdout.trim())
    expect(payload.ok).toBe(true)
    expect(payload.schema_version).toBe(1)
    expect(payload.result).toMatchObject({
      outputPath: out,
      slideCount: 6,
      format: 'pptx'
    })
    expect(statSync(out).size).toBeGreaterThan(0)
  })

  test('fails with a NOT_FOUND error when the spec does not exist', async () => {
    const out = tempOut()

    const { stdout, exitCode } = await execa(
      'node',
      [
        cliPath,
        'deck',
        'generate',
        '/tmp/does-not-exist-spec.json',
        '--out',
        out,
        '--json'
      ],
      { reject: false }
    )

    expect(exitCode).not.toBe(0)
    const payload = JSON.parse(stdout.trim())
    expect(payload.ok).toBe(false)
    expect(payload.errors[0].code).toBe('NOT_FOUND')
  })
})

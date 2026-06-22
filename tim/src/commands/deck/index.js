import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { OK, USAGE, ERROR } from '../../constants/exitCodes.js'
import { TimError, isTimError } from '../../errors.js'
import { buildDeck } from './deck-builder.js'

const SCHEMA_VERSION = 1

const emit = (text) => process.stdout.write(`${text}\n`)
const emitError = (text) => process.stderr.write(`${text}\n`)

const readSpec = (specPath) => {
  let raw
  try {
    raw = readFileSync(specPath, 'utf8')
  } catch {
    throw new TimError('NOT_FOUND', `Cannot find a deck spec at ${specPath}.`)
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new TimError('PARSE', `Cannot read ${specPath} as JSON.`)
  }
}

export const renderResult = ({ outputPath, slideCount }) =>
  [
    `Built ${slideCount} slides.`,
    `Saved to ${outputPath}`,
    'Upload deck.pptx to Google Drive and open with Google Slides to edit.'
  ].join('\n')

const makeGenerateAction = ({ timVersion }) =>
  async function generateAction(spec, options) {
    const globalOpts = this.optsWithGlobals()
    try {
      if (!options.out) {
        throw new TimError('USAGE', 'Set an output path with --out <path>.')
      }
      const specPath = resolve(spec)
      const outPath = resolve(options.out)
      const result = await buildDeck(readSpec(specPath), outPath)
      if (globalOpts.json) {
        emit(
          JSON.stringify({
            ok: true,
            schema_version: SCHEMA_VERSION,
            tim_version: timVersion,
            result,
            errors: [],
            metadata: { ranAt: new Date().toISOString() }
          })
        )
      } else {
        emit(renderResult(result))
      }
      process.exit(OK)
    } catch (error) {
      if (isTimError(error) && globalOpts.json) {
        emit(
          JSON.stringify({
            ok: false,
            schema_version: SCHEMA_VERSION,
            tim_version: timVersion,
            result: null,
            errors: [{ code: error.code, message: error.message }]
          })
        )
      } else {
        emitError(error.message ?? String(error))
      }
      process.exit(isTimError(error) && error.code === 'USAGE' ? USAGE : ERROR)
    }
  }

export const register = (program, { timVersion }) => {
  const deck = program
    .command('deck')
    .description('Build slide decks from a deck-spec.json')

  deck
    .command('generate <spec>')
    .description('Turn a deck-spec.json into a .pptx slide deck')
    .requiredOption('--out <path>', 'Path to write the .pptx file to')
    .addHelpText(
      'after',
      '\nExample:\n  tim deck generate ./deck-spec.json --out ./deck.pptx --json'
    )
    .action(makeGenerateAction({ timVersion }))
}

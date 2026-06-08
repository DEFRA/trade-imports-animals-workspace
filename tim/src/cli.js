#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Command, Option } from 'commander'
import { z } from 'zod'
import { register as registerWorkspaceStatus } from './commands/workspace/status.js'

const SCHEMA_VERSION = 1

const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'))

const helloOutputSchema = z.object({
  ok: z.literal(true),
  schema_version: z.literal(SCHEMA_VERSION),
  tim_version: z.string(),
  message: z.string()
})

const helloPayload = () => ({
  ok: true,
  schema_version: SCHEMA_VERSION,
  tim_version: pkg.version,
  message: 'Hello from tim'
})

const writeLine = (text) => process.stdout.write(`${text}\n`)

const emitHelloJson = () =>
  writeLine(JSON.stringify(helloOutputSchema.parse(helloPayload())))

const emitHelloText = () => writeLine('Hello from tim')

const addGlobalOptions = (program) => {
  program
    .option(
      '--json',
      'Emit one structured JSON line on stdout (suppresses Ink)'
    )
    .option('--no-ui', 'Plain text on stdout (suppresses Ink)')
    .option('--verbose', 'Emit structured logs to stderr')
    .addOption(
      new Option('--workspace <path>', 'Override the resolved workspace root')
    )
  return program
}

export const buildProgram = () => {
  const program = new Command()
  program
    .name('tim')
    .description(
      'Trade Imports CLI — dual-runs alongside the bash tooling in ../tools/'
    )
    .version(pkg.version)

  addGlobalOptions(program)

  program
    .command('hello')
    .description('Print a hello message — used for smoke testing')
    .action(function helloAction() {
      const { json } = this.optsWithGlobals()
      if (json) emitHelloJson()
      else emitHelloText()
    })

  const workspace = program
    .command('workspace')
    .description('Commands that operate across every repo in the workspace')

  registerWorkspaceStatus(workspace, { timVersion: pkg.version })

  return program
}

const invokedAsBin =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (invokedAsBin) {
  buildProgram().parse(process.argv)
}

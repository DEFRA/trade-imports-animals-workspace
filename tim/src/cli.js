#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Command } from 'commander'
import { z } from 'zod'

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

export const buildProgram = () => {
  const program = new Command()
  program
    .name('tim')
    .description(
      'Trade Imports CLI — dual-runs alongside the bash tooling in ../tools/'
    )
    .version(pkg.version)

  program
    .command('hello')
    .description('Print a hello message — used for smoke testing')
    .option('--json', 'Emit a structured JSON line instead of plain text')
    .action((opts) => (opts.json ? emitHelloJson() : emitHelloText()))

  return program
}

const invokedAsBin =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (invokedAsBin) {
  buildProgram().parse(process.argv)
}

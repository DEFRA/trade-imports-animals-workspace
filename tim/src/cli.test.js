import { describe, test, expect } from 'vitest'
import { execa } from 'execa'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const cliPath = join(here, 'cli.js')

const runTim = (args) => execa('node', [cliPath, ...args], { reject: false })

describe('tim CLI', () => {
  test('--version prints a semver string', async () => {
    const { stdout, exitCode } = await runTim(['--version'])
    expect(exitCode).toBe(0)
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/)
  })

  test('hello prints a friendly greeting in text mode', async () => {
    const { stdout, exitCode } = await runTim(['hello'])
    expect(exitCode).toBe(0)
    expect(stdout.trim()).toBe('Hello from tim')
  })

  test('hello --json emits one structured line with schema_version, tim_version, and the message', async () => {
    const { stdout, exitCode } = await runTim(['hello', '--json'])
    expect(exitCode).toBe(0)
    const payload = JSON.parse(stdout.trim())
    expect(payload).toEqual({
      ok: true,
      schema_version: 1,
      tim_version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
      message: 'Hello from tim'
    })
  })

  test('an unknown command exits non-zero', async () => {
    const { exitCode } = await runTim(['nope-this-does-not-exist'])
    expect(exitCode).not.toBe(0)
  })
})

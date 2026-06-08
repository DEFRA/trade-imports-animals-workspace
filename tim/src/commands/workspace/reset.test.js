import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { execa } from 'execa'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { REPOS } from '../../constants/repos.js'

const here = dirname(fileURLToPath(import.meta.url))
const cliPath = join(here, '..', '..', 'cli.js')

let workspace

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'tim-reset-'))
  writeFileSync(join(workspace, 'Makefile'), 'all:\n')
  mkdirSync(join(workspace, 'repos'))
})

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true })
})

describe('tim workspace reset CLI', () => {
  test('refuses to run without --yes in --json mode and exits USER_ABORT (4)', async () => {
    const { stdout, exitCode } = await execa(
      'node',
      [cliPath, 'workspace', 'reset', '--workspace', workspace, '--json'],
      { reject: false }
    )
    expect(exitCode).toBe(4)
    const payload = JSON.parse(stdout.trim())
    expect(payload.ok).toBe(false)
    expect(payload.errors[0].code).toBe('USER_ABORT')
  })

  test('with --yes on an empty workspace, reports every repo as skipped', async () => {
    const { stdout, exitCode } = await execa(
      'node',
      [
        cliPath,
        'workspace',
        'reset',
        '--workspace',
        workspace,
        '--yes',
        '--json'
      ],
      { reject: false }
    )
    expect(exitCode).toBe(0)
    const payload = JSON.parse(stdout.trim())
    expect(payload.ok).toBe(true)
    expect(payload.result).toHaveLength(REPOS.length)
    for (const entry of payload.result) {
      expect(entry.label).toContain('(not cloned, skipping)')
    }
  })
})

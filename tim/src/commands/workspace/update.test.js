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
  workspace = mkdtempSync(join(tmpdir(), 'tim-update-'))
  writeFileSync(join(workspace, 'Makefile'), 'all:\n')
  mkdirSync(join(workspace, 'repos'))
})

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true })
})

describe('tim workspace update CLI', () => {
  test('reports every repo as skipped when none are cloned', async () => {
    const { stdout, exitCode } = await execa(
      'node',
      [cliPath, 'workspace', 'update', '--workspace', workspace, '--json'],
      { reject: false }
    )
    expect(exitCode).toBe(0)
    const payload = JSON.parse(stdout.trim())
    expect(payload.ok).toBe(true)
    expect(payload.result).toHaveLength(REPOS.length)
    for (const entry of payload.result) {
      expect(entry.label).toContain('(not cloned, skipping)')
    }
  }, 30_000)
})

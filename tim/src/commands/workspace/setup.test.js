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

const fakeClone = (repo) => {
  const dir = join(workspace, 'repos', repo, '.git')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'HEAD'), 'ref: refs/heads/main\n')
}

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'tim-setup-'))
  writeFileSync(join(workspace, 'Makefile'), 'all:\n')
  mkdirSync(join(workspace, 'repos'))
})

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true })
})

describe('tim workspace setup CLI', () => {
  test('reports every repo as already-cloned when all are present', async () => {
    for (const repo of REPOS) fakeClone(repo)

    const { stdout, exitCode } = await execa(
      'node',
      [cliPath, 'workspace', 'setup', '--workspace', workspace, '--json'],
      { reject: false }
    )
    expect(exitCode).toBe(0)
    const payload = JSON.parse(stdout.trim())
    expect(payload.ok).toBe(true)
    expect(payload.result.every((r) => r.ok)).toBe(true)
    expect(payload.result).toHaveLength(REPOS.length)
  }, 30_000)
})

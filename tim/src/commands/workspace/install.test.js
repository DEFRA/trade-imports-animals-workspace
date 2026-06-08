import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { execa } from 'execa'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const cliPath = join(here, '..', '..', 'cli.js')

let workspace

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'tim-install-'))
  writeFileSync(join(workspace, 'Makefile'), 'all:\n')
  mkdirSync(join(workspace, 'repos'))
})

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true })
})

const seedNpmPkg = (repo) => {
  const dir = join(workspace, 'repos', repo)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: repo, version: '0.0.0' })
  )
  writeFileSync(
    join(dir, 'package-lock.json'),
    JSON.stringify({
      name: repo,
      version: '0.0.0',
      lockfileVersion: 3,
      requires: true,
      packages: { '': { name: repo, version: '0.0.0' } }
    })
  )
}

describe('tim workspace install CLI', () => {
  test('completes successfully across the seeded Node.js repos', async () => {
    seedNpmPkg('trade-imports-animals-frontend')
    seedNpmPkg('trade-imports-animals-admin')

    const { stdout, exitCode } = await execa(
      'node',
      [
        cliPath,
        'workspace',
        'install',
        '--workspace',
        workspace,
        '--node-only',
        '--json'
      ],
      { reject: false }
    )
    expect(exitCode).toBe(0)
    const payload = JSON.parse(stdout.trim())
    expect(payload.ok).toBe(true)
    const frontend = payload.result.find(
      (r) => r.repo === 'trade-imports-animals-frontend'
    )
    expect(frontend.ok).toBe(true)
    expect(frontend.exitCode).toBe(0)
  }, 60_000)

  test('exits 5 (PARTIAL_FAILURE) and reports the failing repo when npm ci fails', async () => {
    seedNpmPkg('trade-imports-animals-frontend')
    rmSync(
      join(
        workspace,
        'repos',
        'trade-imports-animals-frontend',
        'package-lock.json'
      )
    )

    const { stdout, exitCode } = await execa(
      'node',
      [
        cliPath,
        'workspace',
        'install',
        '--workspace',
        workspace,
        '--node-only',
        '--json'
      ],
      { reject: false }
    )
    expect(exitCode).toBe(5)
    const payload = JSON.parse(stdout.trim())
    expect(payload.ok).toBe(false)
    const frontend = payload.result.find(
      (r) => r.repo === 'trade-imports-animals-frontend'
    )
    expect(frontend.ok).toBe(false)
    expect(frontend.exitCode).not.toBe(0)
  }, 60_000)

  test('skips repos that are not cloned', async () => {
    seedNpmPkg('trade-imports-animals-frontend')

    const { stdout, exitCode } = await execa(
      'node',
      [
        cliPath,
        'workspace',
        'install',
        '--workspace',
        workspace,
        '--node-only',
        '--json'
      ],
      { reject: false }
    )
    expect(exitCode).toBe(0)
    const payload = JSON.parse(stdout.trim())
    expect(payload.result).toHaveLength(1)
    expect(payload.result[0].repo).toBe('trade-imports-animals-frontend')
  }, 60_000)
})

import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { execa } from 'execa'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const cliPath = join(here, '..', 'cli.js')

let workspace

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'tim-start-'))
  writeFileSync(join(workspace, 'Makefile'), 'all:\n')
  mkdirSync(join(workspace, 'repos'))
})

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true })
})

const seedNodeRepo = (repo, scripts) => {
  const dir = join(workspace, 'repos', repo)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: repo, version: '0.0.0', scripts })
  )
}

describe('tim start CLI', () => {
  test('frontend runs `npm run dev` in the frontend repo and exits 0', async () => {
    seedNodeRepo('trade-imports-animals-frontend', {
      dev: 'node -e "process.exit(0)"'
    })
    const { exitCode } = await execa(
      'node',
      [cliPath, 'start', 'frontend', '--workspace', workspace],
      { reject: false }
    )
    expect(exitCode).toBe(0)
  }, 30_000)

  test('admin sets PORT=3001 and runs `npm run dev` in admin', async () => {
    // Script exits 0 only if PORT=3001 is in the environment
    seedNodeRepo('trade-imports-animals-admin', {
      dev: 'node -e "process.exit(process.env.PORT === \\"3001\\" ? 0 : 1)"'
    })
    const { exitCode } = await execa(
      'node',
      [cliPath, 'start', 'admin', '--workspace', workspace],
      { reject: false }
    )
    expect(exitCode).toBe(0)
  }, 30_000)

  test('refuses when the service repo is not cloned', async () => {
    const { stderr, exitCode } = await execa(
      'node',
      [cliPath, 'start', 'frontend', '--workspace', workspace],
      { reject: false }
    )
    expect(exitCode).not.toBe(0)
    expect(stderr).toMatch(/not cloned/)
  })
})

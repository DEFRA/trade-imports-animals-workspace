import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { execa } from 'execa'
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  chmodSync,
  rmSync
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const cliPath = join(here, '..', '..', 'cli.js')

let workspace

const writeStackScript = (name, body) => {
  const path = join(workspace, 'scripts', 'stack', name)
  writeFileSync(path, `#!/usr/bin/env bash\n${body}\n`)
  chmodSync(path, 0o755)
  return path
}

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'tim-docker-'))
  writeFileSync(join(workspace, 'Makefile'), 'all:\n')
  mkdirSync(join(workspace, 'repos'))
  mkdirSync(join(workspace, 'scripts', 'stack'), { recursive: true })
})

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true })
})

describe('tim docker subcommands', () => {
  test('up runs scripts/stack/run-stack.sh and exits 0 on success', async () => {
    writeStackScript('run-stack.sh', 'exit 0')
    const { exitCode } = await execa(
      'node',
      [cliPath, 'docker', 'up', '--workspace', workspace],
      { reject: false }
    )
    expect(exitCode).toBe(0)
  })

  test('dev passes -d to run-stack.sh', async () => {
    // Script exits with non-zero unless it receives "-d" as the first arg
    writeStackScript('run-stack.sh', '[ "$1" = "-d" ] && exit 0 || exit 1')
    const { exitCode } = await execa(
      'node',
      [cliPath, 'docker', 'dev', '--workspace', workspace],
      { reject: false }
    )
    expect(exitCode).toBe(0)
  })

  test('down runs scripts/stack/stop-stack.sh', async () => {
    writeStackScript('stop-stack.sh', 'exit 0')
    const { exitCode } = await execa(
      'node',
      [cliPath, 'docker', 'down', '--workspace', workspace],
      { reject: false }
    )
    expect(exitCode).toBe(0)
  })

  test('bounce-backend runs scripts/stack/bounce-backend.sh', async () => {
    writeStackScript('bounce-backend.sh', 'exit 0')
    const { exitCode } = await execa(
      'node',
      [cliPath, 'docker', 'bounce-backend', '--workspace', workspace],
      { reject: false }
    )
    expect(exitCode).toBe(0)
  })

  test('propagates a non-zero exit code from the script', async () => {
    writeStackScript('run-stack.sh', 'exit 5')
    const { exitCode } = await execa(
      'node',
      [cliPath, 'docker', 'up', '--workspace', workspace, '--json'],
      { reject: false }
    )
    expect(exitCode).toBe(1)
  })

  test('exits 2 with USAGE when scripts/stack/ is missing the script', async () => {
    // No script written
    const { stdout, exitCode } = await execa(
      'node',
      [cliPath, 'docker', 'restart', '--workspace', workspace, '--json'],
      { reject: false }
    )
    expect(exitCode).toBe(2)
    const payload = JSON.parse(stdout.trim())
    expect(payload.ok).toBe(false)
    expect(payload.errors[0].code).toBe('USAGE')
  })
})

import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  chmodSync,
  rmSync
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { stackScriptPath, runStackScript } from './stack.js'

let workspace

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'tim-stack-'))
  mkdirSync(join(workspace, 'scripts', 'stack'), { recursive: true })
})

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true })
})

const writeStackScript = (name, body) => {
  const path = join(workspace, 'scripts', 'stack', name)
  writeFileSync(path, `#!/usr/bin/env bash\n${body}\n`)
  chmodSync(path, 0o755)
  return path
}

describe('stackScriptPath', () => {
  test('returns the absolute path to an existing script', () => {
    writeStackScript('run-stack.sh', 'echo hi')
    expect(stackScriptPath(workspace, 'run-stack.sh')).toBe(
      join(workspace, 'scripts', 'stack', 'run-stack.sh')
    )
  })

  test('throws TimError(USAGE) when the script is missing', () => {
    expect(() => stackScriptPath(workspace, 'no-such.sh')).toThrowError(
      /Cannot find no-such.sh/
    )
  })
})

describe('runStackScript', () => {
  test('runs the script and returns its exit code', async () => {
    writeStackScript('run-stack.sh', 'exit 0')
    const result = await runStackScript({
      workspaceRoot: workspace,
      script: 'run-stack.sh'
    })
    expect(result.exitCode).toBe(0)
  })

  test('propagates a non-zero exit code from the script', async () => {
    writeStackScript('run-stack.sh', 'exit 7')
    const result = await runStackScript({
      workspaceRoot: workspace,
      script: 'run-stack.sh'
    })
    expect(result.exitCode).toBe(7)
  })

  test('passes args through to the script and surfaces them via the exit code', async () => {
    // Script exits with the number of args it received
    writeStackScript('run-stack.sh', 'exit $#')
    const result = await runStackScript({
      workspaceRoot: workspace,
      script: 'run-stack.sh',
      args: ['-d', '-e', 'backend']
    })
    expect(result.exitCode).toBe(3)
  })
})

import { describe, test, expect } from 'vitest'
import { run, runStreamed } from './exec.js'
import { TimError } from '../errors.js'

describe('run', () => {
  test('captures stdout from a successful command', async () => {
    const result = await run('node', ['-e', "process.stdout.write('hello')"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toBe('hello')
    expect(result.stderr).toBe('')
  })

  test('captures stderr separately', async () => {
    const result = await run('node', ['-e', "process.stderr.write('oops')"])
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBe('oops')
    expect(result.stdout).toBe('')
  })

  test('resolves with non-zero exitCode instead of throwing', async () => {
    const result = await run('node', ['-e', 'process.exit(7)'])
    expect(result.exitCode).toBe(7)
  })

  test('records a non-negative durationMs', async () => {
    const result = await run('node', ['-e', '0'])
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  test('throws TimError(MISSING_DEP) when the executable is not found', async () => {
    await expect(
      run('a-definitely-not-installed-binary-xyz', [])
    ).rejects.toMatchObject({
      name: 'TimError',
      code: 'MISSING_DEP'
    })
  })

  test('passes through cwd via opts', async () => {
    const result = await run(
      'node',
      ['-e', 'process.stdout.write(process.cwd())'],
      {
        cwd: '/tmp'
      }
    )
    expect(result.stdout).toMatch(/tmp$/)
  })
})

describe('runStreamed', () => {
  test('returns the child exit code', async () => {
    const result = await runStreamed('node', ['-e', 'process.exit(3)'])
    expect(result.exitCode).toBe(3)
  })

  test('throws TimError(MISSING_DEP) when the executable is not found', async () => {
    await expect(
      runStreamed('a-definitely-not-installed-binary-xyz', [])
    ).rejects.toBeInstanceOf(TimError)
  })
})

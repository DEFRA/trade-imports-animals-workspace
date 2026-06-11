import { describe, test, expect } from 'vitest'
import {
  renderTaskText,
  renderTaskJson,
  lastLines,
  toResultRecord
} from './_task-output.js'

describe('toResultRecord', () => {
  test('returns a record with the task labels and exec exit code', () => {
    const task = { repo: 'frontend', label: 'frontend — npm ci' }
    const record = toResultRecord(task, {
      exitCode: 0,
      stderr: 'a\nb\nc',
      stdout: 'noise'
    })
    expect(record).toEqual({
      repo: 'frontend',
      label: 'frontend — npm ci',
      exitCode: 0,
      stderrTail: 'a\nb\nc'
    })
  })

  test('falls back to stdout when stderr is empty and stderrSource is stderr-or-stdout', () => {
    const task = { repo: 'admin', label: 'admin — npm test' }
    const record = toResultRecord(
      task,
      { exitCode: 1, stderr: '', stdout: 'log line' },
      { stderrSource: 'stderr-or-stdout' }
    )
    expect(record.stderrTail).toBe('log line')
  })

  test('keeps stderr when both stderr and stdout are present', () => {
    const task = { repo: 'admin', label: 'admin — npm test' }
    const record = toResultRecord(
      task,
      { exitCode: 1, stderr: 'real error', stdout: 'log line' },
      { stderrSource: 'stderr-or-stdout' }
    )
    expect(record.stderrTail).toBe('real error')
  })
})

describe('lastLines', () => {
  test('returns the last N lines from a multi-line string', () => {
    const text = ['a', 'b', 'c', 'd', 'e'].join('\n')
    expect(lastLines(text, 2)).toBe('d\ne')
  })

  test('returns the whole string when there are fewer lines than N', () => {
    expect(lastLines('only line', 5)).toBe('only line')
  })

  test('handles empty input safely', () => {
    expect(lastLines('', 3)).toBe('')
  })
})

describe('renderTaskText', () => {
  test('marks a successful task with done and duration', () => {
    expect(
      renderTaskText([{ ok: true, label: 'a — npm ci', durationMs: 42 }])
    ).toContain('a — npm ci — done (42ms)')
  })

  test('marks a failed task with exit code and indented stderr tail', () => {
    const text = renderTaskText([
      {
        ok: false,
        label: 'b — npm ci',
        durationMs: 7,
        exitCode: 1,
        stderrTail: 'oh\nno'
      }
    ])
    expect(text).toContain('b — npm ci — FAILED (exit 1, 7ms)')
    expect(text).toContain('    oh')
    expect(text).toContain('    no')
  })

  test('falls back to item.label / item.repo when top-level fields are missing', () => {
    expect(
      renderTaskText([{ ok: true, item: { label: 'fallback' }, durationMs: 1 }])
    ).toContain('fallback — done')
  })
})

describe('renderTaskJson', () => {
  test('reports ok: true and one entry per result when all succeeded', () => {
    const payload = JSON.parse(
      renderTaskJson(
        [
          { ok: true, repo: 'a', label: 'a', durationMs: 1, exitCode: 0 },
          { ok: true, repo: 'b', label: 'b', durationMs: 2, exitCode: 0 }
        ],
        '1.2.3'
      )
    )
    expect(payload).toMatchObject({
      ok: true,
      schema_version: 1,
      tim_version: '1.2.3'
    })
    expect(payload.result).toHaveLength(2)
  })

  test('reports ok: false when any result failed', () => {
    const payload = JSON.parse(
      renderTaskJson(
        [
          { ok: true, repo: 'a', durationMs: 1 },
          { ok: false, repo: 'b', durationMs: 1, exitCode: 2 }
        ],
        '0.0.0'
      )
    )
    expect(payload.ok).toBe(false)
  })
})

import { describe, test, expect } from 'vitest'
import { renderTaskText, renderTaskJson, lastLines } from './_task-output.js'

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

import { describe, test, expect } from 'vitest'
import { renderRuns, renderStatus } from './index.js'

describe('renderRuns', () => {
  test('returns "(no runs)" for an empty list', () => {
    expect(renderRuns([])).toBe('(no runs)')
  })

  test('formats one line per run with status/conclusion, branch, short SHA and URL', () => {
    const text = renderRuns([
      {
        id: 1,
        name: 'check-pr',
        headBranch: 'feat/x',
        headSha: 'abcdef1234567',
        status: 'completed',
        conclusion: 'success',
        url: 'https://example/runs/1'
      }
    ])
    expect(text).toContain('[completed/success]')
    expect(text).toContain('check-pr')
    expect(text).toContain('branch=feat/x')
    expect(text).toContain('sha=abcdef1')
    expect(text).toContain('https://example/runs/1')
  })

  test('marks an unknown conclusion as ? rather than omitting it', () => {
    const text = renderRuns([
      {
        id: 1,
        name: 'check-pr',
        headBranch: 'main',
        headSha: 'abc1234',
        status: 'in_progress',
        conclusion: null,
        url: 'u'
      }
    ])
    expect(text).toContain('[in_progress/?]')
  })
})

describe('renderStatus', () => {
  test('includes id, status, conclusion and URL', () => {
    const text = renderStatus({
      id: 7,
      status: 'completed',
      conclusion: 'failure',
      url: 'https://example/runs/7'
    })
    expect(text).toContain('Run 7: completed (failure)')
    expect(text).toContain('https://example/runs/7')
  })

  test('omits the conclusion suffix when null', () => {
    const text = renderStatus({
      id: 7,
      status: 'in_progress',
      conclusion: null,
      url: 'u'
    })
    expect(text).toContain('Run 7: in_progress\n')
    expect(text).not.toContain('null')
  })
})

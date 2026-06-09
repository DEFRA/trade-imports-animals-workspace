import { describe, test, expect } from 'vitest'
import { parseBranch } from './status.js'

describe('parseBranch', () => {
  test('extracts branch from a clean tracking line', () => {
    expect(parseBranch('## main...origin/main')).toEqual({
      branch: 'main',
      upstream: 'origin/main',
      ahead: 0,
      behind: 0
    })
  })

  test('extracts ahead and behind counts', () => {
    expect(parseBranch('## main...origin/main [ahead 2, behind 5]')).toEqual({
      branch: 'main',
      upstream: 'origin/main',
      ahead: 2,
      behind: 5
    })
  })

  test('handles a local-only branch with no upstream', () => {
    expect(parseBranch('## feat/x')).toEqual({
      branch: 'feat/x',
      upstream: null,
      ahead: 0,
      behind: 0
    })
  })

  test('returns nulls for an unparseable line', () => {
    expect(parseBranch('garbage')).toEqual({
      branch: null,
      upstream: null,
      ahead: 0,
      behind: 0
    })
  })
})

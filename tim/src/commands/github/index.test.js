import { describe, test, expect } from 'vitest'
import { renderPrs, renderPr, renderDiff } from './index.js'

describe('renderPrs', () => {
  test('returns "(no PRs)" for an empty list', () => {
    expect(renderPrs([])).toBe('(no PRs)')
  })

  test('formats one line per PR with state, repo, number, title and URL', () => {
    const text = renderPrs([
      {
        repo: 'trade-imports-animals-frontend',
        number: 42,
        title: 'Add X',
        state: 'open',
        url: 'https://github.com/DEFRA/trade-imports-animals-frontend/pull/42'
      }
    ])
    expect(text).toContain('[open]')
    expect(text).toContain('trade-imports-animals-frontend #42')
    expect(text).toContain('Add X')
    expect(text).toContain(
      'https://github.com/DEFRA/trade-imports-animals-frontend/pull/42'
    )
  })
})

describe('renderPr', () => {
  test('formats a single PR with all key fields', () => {
    const text = renderPr({
      repo: 'frontend',
      number: 42,
      title: 'Add X',
      state: 'open',
      url: 'https://x/y',
      author: 'sam',
      body: 'why'
    })
    expect(text).toContain('frontend #42  Add X')
    expect(text).toContain('State:   open')
    expect(text).toContain('Author:  sam')
    expect(text).toContain('URL:     https://x/y')
    expect(text).toContain('why')
  })
})

describe('renderDiff', () => {
  test('passes the diff through unchanged so output is byte-exact', () => {
    const diff = 'diff --git a/x b/x\n+1\n-1\n'
    expect(renderDiff(diff)).toBe(diff)
  })
})

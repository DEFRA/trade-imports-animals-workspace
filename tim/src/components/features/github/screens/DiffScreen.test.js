import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import DiffScreen from './DiffScreen.js'

describe('DiffScreen', () => {
  test('renders the title and diff body', () => {
    const diff = 'diff --git a/x b/x\n+hello\n-world'
    const { lastFrame } = render(
      createElement(DiffScreen, {
        repo: 'trade-imports-animals-frontend',
        number: 42,
        diff,
        onReturn: () => {}
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('Diff — trade-imports-animals-frontend#42')
    expect(frame).toContain('+hello')
    expect(frame).toContain('-world')
    expect(frame).toContain('Press Enter to return')
  })

  test('shows a fallback when the diff is empty', () => {
    const { lastFrame } = render(
      createElement(DiffScreen, {
        repo: 'trade-imports-animals-frontend',
        number: 42,
        diff: '   \n  ',
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toContain('(no diff content)')
  })

  test('truncates diffs longer than 80 lines and reports the overflow', () => {
    const lines = Array.from({ length: 130 }, (_, idx) => `line-${idx + 1}`)
    const diff = lines.join('\n')
    const { lastFrame } = render(
      createElement(DiffScreen, {
        repo: 'trade-imports-animals-frontend',
        number: 42,
        diff,
        onReturn: () => {}
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('line-1')
    expect(frame).toContain('line-80')
    expect(frame).not.toContain('line-81')
    expect(frame).toContain('…(50 more lines)')
  })
})

import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import PrDetailsScreen from './PrDetailsScreen.js'

const samplePr = {
  repo: 'trade-imports-animals-frontend',
  number: 42,
  title: 'Add origin page',
  state: 'open',
  url: 'https://github.com/DEFRA/trade-imports-animals-frontend/pull/42',
  author: 'sam',
  body: 'Implements the origin page.'
}

describe('PrDetailsScreen', () => {
  test('renders the PR header, fields and body', () => {
    const { lastFrame } = render(
      createElement(PrDetailsScreen, { pr: samplePr, onReturn: () => {} })
    )

    const frame = lastFrame()
    expect(frame).toContain('#42 Add origin page')
    expect(frame).toContain('[open]')
    expect(frame).toContain('repo:')
    expect(frame).toContain('trade-imports-animals-frontend')
    expect(frame).toContain('author:')
    expect(frame).toContain('sam')
    expect(frame).toContain('url:')
    expect(frame).toContain(samplePr.url)
    expect(frame).toContain('Implements the origin page.')
    expect(frame).toContain('Press Enter to return')
  })

  test('shows a fallback when the body is blank', () => {
    const { lastFrame } = render(
      createElement(PrDetailsScreen, {
        pr: { ...samplePr, body: '   ' },
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toContain('(no description)')
  })

  test('renders unknown states in the warn tone (no crash)', () => {
    const { lastFrame } = render(
      createElement(PrDetailsScreen, {
        pr: { ...samplePr, state: 'draft' },
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toContain('[draft]')
  })
})

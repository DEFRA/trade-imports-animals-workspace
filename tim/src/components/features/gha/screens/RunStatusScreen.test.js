import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import RunStatusScreen from './RunStatusScreen.js'

describe('RunStatusScreen', () => {
  test('renders run id, repo, status and conclusion', () => {
    const run = {
      id: 12345,
      status: 'completed',
      conclusion: 'success',
      url: 'https://github.com/DEFRA/trade-imports-animals-frontend/actions/runs/12345'
    }

    const { lastFrame } = render(
      createElement(RunStatusScreen, {
        repo: 'trade-imports-animals-frontend',
        run
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('Run #12345')
    expect(frame).toContain('trade-imports-animals-frontend')
    expect(frame).toContain('Status:')
    expect(frame).toContain('completed')
    expect(frame).toContain('Conclusion:')
    expect(frame).toContain('success')
    expect(frame).toContain(run.url)
  })

  test('renders an em-dash when the conclusion is null', () => {
    const run = {
      id: 7,
      status: 'in_progress',
      conclusion: null,
      url: 'https://example.test/runs/7'
    }

    const { lastFrame } = render(
      createElement(RunStatusScreen, { repo: 'some-repo', run })
    )

    expect(lastFrame()).toContain('Conclusion: —')
  })

  test('shows the return-to-menu prompt only when onReturn is provided', () => {
    const run = { id: 1, status: 'completed', conclusion: 'success', url: '' }

    const withoutReturn = render(
      createElement(RunStatusScreen, { repo: 'r', run })
    )
    expect(withoutReturn.lastFrame()).not.toMatch(/Press Enter to go back/i)

    const withReturn = render(
      createElement(RunStatusScreen, { repo: 'r', run, onReturn: () => {} })
    )
    expect(withReturn.lastFrame()).toMatch(/Press Enter to go back/i)
  })
})

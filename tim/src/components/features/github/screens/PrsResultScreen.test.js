import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import PrsResultScreen from './PrsResultScreen.js'

const prs = [
  {
    repo: 'trade-imports-animals-frontend',
    number: 42,
    title: 'Add origin page',
    url: 'https://github.com/DEFRA/trade-imports-animals-frontend/pull/42',
    state: 'open'
  },
  {
    repo: 'trade-imports-animals-backend',
    number: 17,
    title: 'Persist origin',
    url: 'https://github.com/DEFRA/trade-imports-animals-backend/pull/17',
    state: 'closed'
  }
]

describe('PrsResultScreen', () => {
  test('renders the ticket id, every PR row and the count', () => {
    const { lastFrame } = render(
      createElement(PrsResultScreen, {
        ticketId: 'EUDPA-200',
        prs,
        onReturn: () => {}
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('EUDPA-200')
    expect(frame).toContain('#42')
    expect(frame).toContain('Add origin page')
    expect(frame).toContain('trade-imports-animals-frontend')
    expect(frame).toContain('#17')
    expect(frame).toContain('Persist origin')
    expect(frame).toMatch(/2 pull request/i)
  })

  test('shows a friendly message when no PRs are found', () => {
    const { lastFrame } = render(
      createElement(PrsResultScreen, {
        ticketId: 'EUDPA-999',
        prs: [],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toMatch(/No pull requests/i)
  })

  test('pressing Enter calls onReturn', async () => {
    let returned = false
    const { stdin } = render(
      createElement(PrsResultScreen, {
        ticketId: 'EUDPA-200',
        prs,
        onReturn: () => {
          returned = true
        }
      })
    )

    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(returned).toBe(true)
  })
})

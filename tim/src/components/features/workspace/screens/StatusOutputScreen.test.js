import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import StatusOutputScreen from './StatusOutputScreen.js'

const cloned = {
  repo: 'trade-imports-animals-frontend',
  cloned: true,
  branch: 'main',
  upstream: 'origin/main',
  ahead: 2,
  behind: 0,
  dirty: 3,
  raw: ''
}

const notCloned = {
  repo: 'trade-imports-animals-backend',
  cloned: false,
  branch: null,
  ahead: 0,
  behind: 0,
  dirty: 0,
  raw: ''
}

const detached = {
  repo: 'trade-imports-stub',
  cloned: true,
  branch: null,
  upstream: null,
  ahead: 0,
  behind: 0,
  dirty: 0,
  raw: ''
}

describe('StatusOutputScreen', () => {
  test('renders every repo name and surfaces branch, ahead and dirty counts', () => {
    const { lastFrame } = render(
      createElement(StatusOutputScreen, {
        statuses: [cloned, notCloned],
        onReturn: () => {}
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('trade-imports-animals-frontend')
    expect(frame).toContain('main')
    expect(frame).toContain('2 ahead')
    expect(frame).toContain('3 changed')
    expect(frame).toContain('trade-imports-animals-backend')
    expect(frame).toContain('Not cloned')
  })

  test('shows a clean message when there is nothing ahead, behind or changed', () => {
    const { lastFrame } = render(
      createElement(StatusOutputScreen, {
        statuses: [{ ...cloned, ahead: 0, dirty: 0 }],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toMatch(/Up to date|Clean/i)
  })

  test('handles a cloned repo that is in a detached or unknown branch state', () => {
    const { lastFrame } = render(
      createElement(StatusOutputScreen, {
        statuses: [detached],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toContain('trade-imports-stub')
    expect(lastFrame()).toMatch(/Detached|No branch/i)
  })

  test('surfaces behind-by-N counts in the branch summary', () => {
    const { lastFrame } = render(
      createElement(StatusOutputScreen, {
        statuses: [{ ...cloned, ahead: 0, behind: 4, dirty: 0 }],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toContain('4 behind')
  })

  test('omits the press Enter prompt when no onReturn handler is provided', () => {
    const { lastFrame } = render(
      createElement(StatusOutputScreen, { statuses: [notCloned] })
    )

    expect(lastFrame()).not.toMatch(/Press Enter/i)
  })

  test('renders the press Enter prompt and calls onReturn on submit', async () => {
    let returned = false
    const { stdin, lastFrame } = render(
      createElement(StatusOutputScreen, {
        statuses: [notCloned],
        onReturn: () => {
          returned = true
        }
      })
    )

    expect(lastFrame()).toMatch(/Press Enter/i)
    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(returned).toBe(true)
  })
})

import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import PageResultScreen from './PageResultScreen.js'

const page = {
  id: '12345',
  title: 'Trade Imports Workspace Setup',
  version: 7,
  body: '<p>Welcome to the workspace.</p>'
}

describe('PageResultScreen', () => {
  test('renders the page title, id and version', () => {
    const { lastFrame } = render(
      createElement(PageResultScreen, { page, onReturn: () => {} })
    )

    const frame = lastFrame()
    expect(frame).toContain('Trade Imports Workspace Setup')
    expect(frame).toContain('12345')
    expect(frame).toContain('7')
  })

  test('renders a body preview when one is available', () => {
    const { lastFrame } = render(
      createElement(PageResultScreen, { page, onReturn: () => {} })
    )

    expect(lastFrame()).toMatch(/Welcome to the workspace/i)
  })

  test('handles a page with no body gracefully', () => {
    const { lastFrame } = render(
      createElement(PageResultScreen, {
        page: { id: '1', title: 'Empty', version: 1 },
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toContain('Empty')
    expect(lastFrame()).toMatch(/no body|empty/i)
  })

  test('pressing Enter calls onReturn', async () => {
    let returned = false
    const { stdin } = render(
      createElement(PageResultScreen, {
        page,
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

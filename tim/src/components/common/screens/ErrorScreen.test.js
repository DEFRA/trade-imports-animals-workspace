import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import ErrorScreen from './ErrorScreen.js'

describe('ErrorScreen', () => {
  test('renders the error message', () => {
    const { lastFrame } = render(
      createElement(ErrorScreen, { error: "Can't reach GitHub" })
    )

    expect(lastFrame()).toContain("Can't reach GitHub")
  })

  test('prompts the user to press Enter when onReturn is provided', () => {
    const { lastFrame } = render(
      createElement(ErrorScreen, { error: 'Boom', onReturn: () => {} })
    )

    expect(lastFrame()).toMatch(/Press Enter/i)
  })

  test('omits the return prompt when no onReturn handler is provided', () => {
    const { lastFrame } = render(createElement(ErrorScreen, { error: 'Boom' }))

    expect(lastFrame()).not.toMatch(/Press Enter/i)
  })

  test('renders an empty error string without throwing when error is null', () => {
    const { lastFrame } = render(createElement(ErrorScreen, { error: null }))

    expect(lastFrame()).toContain('Error:')
  })

  test('pressing Enter invokes onReturn', async () => {
    let returned = false
    const { stdin } = render(
      createElement(ErrorScreen, {
        error: 'Boom',
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

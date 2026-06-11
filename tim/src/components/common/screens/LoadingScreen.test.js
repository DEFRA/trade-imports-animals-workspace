import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import LoadingScreen from './LoadingScreen.js'

describe('LoadingScreen', () => {
  test('renders the provided message', () => {
    const { lastFrame } = render(
      createElement(LoadingScreen, { message: 'Loading repos…' })
    )

    expect(lastFrame()).toContain('Loading repos…')
  })

  test('falls back to a plain default when no message is supplied', () => {
    const { lastFrame } = render(createElement(LoadingScreen))

    expect(lastFrame()).toContain('Loading')
  })
})

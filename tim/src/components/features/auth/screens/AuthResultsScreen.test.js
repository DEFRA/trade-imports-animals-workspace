import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import AuthResultsScreen from './AuthResultsScreen.js'

const ok = {
  service: 'github',
  ok: true,
  user: { login: 'sam', name: 'Sam Farrington' }
}

const failed = {
  service: 'jira',
  ok: false,
  error: { code: 'AUTH', message: 'Set JIRA_USER and JIRA_TOKEN.' }
}

describe('AuthResultsScreen', () => {
  test('renders the title and one row per service', () => {
    const { lastFrame } = render(
      createElement(AuthResultsScreen, {
        results: [ok, failed],
        onReturn: () => {}
      })
    )

    const frame = lastFrame()
    expect(frame).toMatch(/Auth/i)
    expect(frame).toContain('github')
    expect(frame).toContain('jira')
  })

  test('shows the user identifier on successful rows', () => {
    const { lastFrame } = render(
      createElement(AuthResultsScreen, { results: [ok], onReturn: () => {} })
    )

    expect(lastFrame()).toMatch(/Sam Farrington|sam/)
    expect(lastFrame()).toMatch(/signed in|ok/i)
  })

  test('shows the error code and message on failed rows', () => {
    const { lastFrame } = render(
      createElement(AuthResultsScreen, {
        results: [failed],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toContain('AUTH')
    expect(lastFrame()).toContain('Set JIRA_USER')
  })

  test('falls back to login or username when no display name is available', () => {
    const { lastFrame } = render(
      createElement(AuthResultsScreen, {
        results: [{ service: 'github', ok: true, user: { login: 'sam' } }],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toContain('sam')
  })

  test('renders the press Enter prompt and calls onReturn on submit', async () => {
    let returned = false
    const { stdin } = render(
      createElement(AuthResultsScreen, {
        results: [ok],
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

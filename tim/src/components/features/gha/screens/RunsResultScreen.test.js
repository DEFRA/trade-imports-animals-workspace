import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import RunsResultScreen from './RunsResultScreen.js'

const runs = [
  {
    id: 99,
    name: 'ci',
    headBranch: 'main',
    headSha: 'abc1234',
    status: 'completed',
    conclusion: 'success',
    url: 'https://github.com/x/y/actions/runs/99',
    createdAt: '2026-06-08T10:00:00Z'
  },
  {
    id: 100,
    name: 'lint',
    headBranch: 'feat/foo',
    headSha: 'def5678',
    status: 'completed',
    conclusion: 'failure',
    url: 'https://github.com/x/y/actions/runs/100',
    createdAt: '2026-06-08T10:05:00Z'
  }
]

describe('RunsResultScreen', () => {
  test('renders the repo and one row per run with id and conclusion', () => {
    const { lastFrame } = render(
      createElement(RunsResultScreen, {
        repo: 'trade-imports-animals-frontend',
        runs,
        onReturn: () => {}
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('trade-imports-animals-frontend')
    expect(frame).toContain('#99')
    expect(frame).toContain('#100')
    expect(frame).toContain('success')
    expect(frame).toContain('failure')
    expect(frame).toContain('main')
    expect(frame).toContain('feat/foo')
  })

  test('shows a message when no runs were returned', () => {
    const { lastFrame } = render(
      createElement(RunsResultScreen, {
        repo: 'trade-imports-animals-frontend',
        runs: [],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toMatch(/No runs/i)
  })

  test('pressing Enter calls onReturn', async () => {
    let returned = false
    const { stdin } = render(
      createElement(RunsResultScreen, {
        repo: 'trade-imports-animals-frontend',
        runs,
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

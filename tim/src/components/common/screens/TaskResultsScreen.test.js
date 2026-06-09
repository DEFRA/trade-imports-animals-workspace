import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import TaskResultsScreen from './TaskResultsScreen.js'

const okResult = {
  repo: 'trade-imports-animals-frontend',
  label: 'trade-imports-animals-frontend — npm ci',
  ok: true,
  exitCode: 0,
  durationMs: 1234,
  stderrTail: null
}

const failedResult = {
  repo: 'trade-imports-animals-backend',
  label: 'trade-imports-animals-backend — mvn install -DskipTests',
  ok: false,
  exitCode: 1,
  durationMs: 4567,
  stderrTail: 'Compilation failure: missing semicolon'
}

const removedResult = {
  repo: 'trade-imports-animals-admin',
  removed: true,
  ok: true
}

describe('TaskResultsScreen', () => {
  test('renders the title and a row per result with the repo label', () => {
    const { lastFrame } = render(
      createElement(TaskResultsScreen, {
        title: 'Install',
        results: [okResult, failedResult],
        onReturn: () => {}
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('Install')
    expect(frame).toContain('trade-imports-animals-frontend')
    expect(frame).toContain('trade-imports-animals-backend')
  })

  test('marks successful tasks as done and shows the elapsed time', () => {
    const { lastFrame } = render(
      createElement(TaskResultsScreen, {
        title: 'Install',
        results: [okResult],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toMatch(/done/i)
    expect(lastFrame()).toContain('1234ms')
  })

  test('marks failed tasks and surfaces the stderr tail', () => {
    const { lastFrame } = render(
      createElement(TaskResultsScreen, {
        title: 'Install',
        results: [failedResult],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toMatch(/failed/i)
    expect(lastFrame()).toContain('exit 1')
    expect(lastFrame()).toContain('Compilation failure')
  })

  test('shows a summary line stating how many tasks passed and failed', () => {
    const { lastFrame } = render(
      createElement(TaskResultsScreen, {
        title: 'Install',
        results: [okResult, failedResult],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toMatch(/1 passed/i)
    expect(lastFrame()).toMatch(/1 failed/i)
  })

  test('handles a sync result without exitCode or durationMs (eg clean)', () => {
    const { lastFrame } = render(
      createElement(TaskResultsScreen, {
        title: 'Clean',
        results: [removedResult],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toContain('trade-imports-animals-admin')
    expect(lastFrame()).toMatch(/done/i)
  })

  test('renders the press Enter prompt and calls onReturn on submit', async () => {
    let returned = false
    const { stdin } = render(
      createElement(TaskResultsScreen, {
        title: 'Install',
        results: [okResult],
        onReturn: () => {
          returned = true
        }
      })
    )

    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(returned).toBe(true)
  })

  test('handles an empty results list with a friendly "nothing to do" message', () => {
    const { lastFrame } = render(
      createElement(TaskResultsScreen, {
        title: 'Lint',
        results: [],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toMatch(/Nothing to run/i)
  })
})

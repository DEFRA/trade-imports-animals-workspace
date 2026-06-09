import { describe, test, expect, vi } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import ParallelProgressScreen from './ParallelProgressScreen.js'

const makeDeferred = () => {
  let resolveFn
  const promise = new Promise((resolve) => {
    resolveFn = resolve
  })
  return { promise, resolve: resolveFn }
}

const collectingRunner = ({ events }) => {
  return async ({ tasks, onTaskStart, onTaskComplete }) => {
    for (const task of tasks) {
      onTaskStart(task.id)
      events.push({ kind: 'start', id: task.id })
    }
    await Promise.all(
      tasks.map(async (task) => {
        const result = await task.run()
        onTaskComplete(task.id, result)
        events.push({ kind: 'complete', id: task.id, result })
      })
    )
  }
}

describe('ParallelProgressScreen', () => {
  test('shows a running row per task before any task settles', async () => {
    const frontendGate = makeDeferred()
    const tasks = [
      {
        id: 'frontend',
        repo: 'frontend',
        label: 'frontend — npm ci',
        run: () => frontendGate.promise
      }
    ]
    const events = []
    const { lastFrame } = render(
      createElement(ParallelProgressScreen, {
        title: 'Install',
        tasks,
        onReturn: () => {},
        runner: collectingRunner({ events })
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toContain('frontend — npm ci'))
    expect(lastFrame()).not.toMatch(/passed/)

    frontendGate.resolve({
      repo: 'frontend',
      label: 'frontend — npm ci',
      ok: true,
      exitCode: 0,
      durationMs: 123,
      stderrTail: null
    })

    await vi.waitFor(() => expect(lastFrame()).toMatch(/done/i))
    expect(lastFrame()).toContain('123ms')
    expect(lastFrame()).toMatch(/1 passed, 0 failed/i)
  })

  test('flips each row to a tick or cross as it completes', async () => {
    const tasks = [
      {
        id: 'frontend',
        repo: 'frontend',
        label: 'frontend — npm ci',
        run: async () => ({
          repo: 'frontend',
          label: 'frontend — npm ci',
          ok: true,
          exitCode: 0,
          durationMs: 12,
          stderrTail: null
        })
      },
      {
        id: 'backend',
        repo: 'backend',
        label: 'backend — mvn install',
        run: async () => ({
          repo: 'backend',
          label: 'backend — mvn install',
          ok: false,
          exitCode: 1,
          durationMs: 99,
          stderrTail: 'BUILD FAILURE'
        })
      }
    ]
    const { lastFrame } = render(
      createElement(ParallelProgressScreen, {
        title: 'Install',
        tasks,
        onReturn: () => {},
        runner: collectingRunner({ events: [] })
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/1 passed, 1 failed/i))
    const frame = lastFrame()
    expect(frame).toContain('frontend — npm ci')
    expect(frame).toContain('backend — mvn install')
    expect(frame).toMatch(/failed/i)
    expect(frame).toContain('exit 1')
    expect(frame).toContain('BUILD FAILURE')
  })

  test('prompts the user to press Enter and calls onReturn on submit', async () => {
    let returned = false
    const tasks = [
      {
        id: 'frontend',
        repo: 'frontend',
        label: 'frontend — npm ci',
        run: async () => ({
          repo: 'frontend',
          label: 'frontend — npm ci',
          ok: true,
          exitCode: 0,
          durationMs: 12,
          stderrTail: null
        })
      }
    ]
    const { lastFrame, stdin } = render(
      createElement(ParallelProgressScreen, {
        title: 'Install',
        tasks,
        onReturn: () => {
          returned = true
        },
        runner: collectingRunner({ events: [] })
      })
    )

    await vi.waitFor(() =>
      expect(lastFrame()).toMatch(/Press Enter to return/i)
    )
    await new Promise((resolve) => setTimeout(resolve, 20))
    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(returned).toBe(true)
  })

  test('shows a friendly nothing to run message for an empty task list', () => {
    const { lastFrame } = render(
      createElement(ParallelProgressScreen, {
        title: 'Lint',
        tasks: [],
        onReturn: () => {},
        runner: collectingRunner({ events: [] })
      })
    )

    expect(lastFrame()).toMatch(/Nothing to run/i)
  })

  test('marks a thrown task run as failed with the error message', async () => {
    const tasks = [
      {
        id: 'frontend',
        repo: 'frontend',
        label: 'frontend — npm ci',
        run: async () => {
          throw new Error('npm exploded')
        }
      }
    ]
    const { lastFrame } = render(
      createElement(ParallelProgressScreen, {
        title: 'Install',
        tasks,
        onReturn: () => {}
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/failed/i))
    expect(lastFrame()).toContain('npm exploded')
  })
})

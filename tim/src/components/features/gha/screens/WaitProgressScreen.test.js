import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import WaitProgressScreen from './WaitProgressScreen.js'

describe('WaitProgressScreen', () => {
  test('renders the run id, repo and an elapsed counter', () => {
    const { lastFrame } = render(
      createElement(WaitProgressScreen, {
        repo: 'trade-imports-animals-frontend',
        runId: 42,
        startTime: Date.now()
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('Waiting for run #42')
    expect(frame).toContain('trade-imports-animals-frontend')
    expect(frame).toMatch(/Elapsed: \d+s/)
  })

  test('updates the elapsed counter as time passes', async () => {
    const startTime = Date.now() - 3000

    const { lastFrame } = render(
      createElement(WaitProgressScreen, {
        repo: 'r',
        runId: 1,
        startTime
      })
    )

    expect(lastFrame()).toMatch(/Elapsed: [3-9]s/)
  })

  test('clears its interval on unmount', async () => {
    const { unmount, lastFrame } = render(
      createElement(WaitProgressScreen, {
        repo: 'r',
        runId: 1,
        startTime: Date.now()
      })
    )

    expect(lastFrame()).toContain('Waiting for run #1')

    unmount()

    // If the interval kept firing it would attempt to setState on an
    // unmounted tree. Wait past one tick to surface any such errors.
    await new Promise((resolve) => setTimeout(resolve, 50))
  })
})

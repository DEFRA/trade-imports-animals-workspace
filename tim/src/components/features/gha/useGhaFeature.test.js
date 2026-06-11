import { describe, test, expect, vi } from 'vitest'
import { createElement, useState, useEffect } from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { SCREENS } from '../../../constants/menuConfig.js'
import LoadingScreen from '../../common/screens/LoadingScreen.js'
import { useGhaFeature } from './useGhaFeature.js'

const Harness = ({ listRuns, getRunStatus, onReturn = () => {} }) => {
  const [screen, setScreen] = useState(SCREENS.GHA_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')

  const feature = useGhaFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: onReturn,
    listRuns,
    getRunStatus
  })

  if (screen === SCREENS.LOADING) {
    return createElement(LoadingScreen, { message: loadingMessage })
  }
  if (screen === SCREENS.ERROR) {
    return createElement(Text, null, `error:${screenData.error}`)
  }
  const route = feature.routes[screen]
  if (!route) return createElement(Text, null, `unknown:${screen}`)
  const props =
    typeof route.props === 'function' ? route.props(screenData) : route.props
  return createElement(route.component, props)
}

const RunActionHarness = ({
  listRuns,
  getRunStatus,
  waitForRun,
  action,
  onReturn = () => {}
}) => {
  const [screen, setScreen] = useState(SCREENS.GHA_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')
  const feature = useGhaFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: onReturn,
    listRuns,
    getRunStatus,
    waitForRun
  })
  useEffect(() => {
    const { items, onSelect } = feature.routes[SCREENS.GHA_MENU].props
    const item = items.find((i) => i.value === action)
    onSelect(item)
  }, [])
  if (screen === SCREENS.LOADING) {
    return createElement(LoadingScreen, { message: loadingMessage })
  }
  if (screen === SCREENS.ERROR) {
    return createElement(Text, null, `error:${screenData.error}`)
  }
  const route = feature.routes[screen]
  if (!route) return createElement(Text, null, `unknown:${screen}`)
  const props =
    typeof route.props === 'function' ? route.props(screenData) : route.props
  return createElement(route.component, props)
}

describe('useGhaFeature', () => {
  test('opens on a submenu with Recent-runs, Status, Wait and Back options', () => {
    const { lastFrame } = render(
      createElement(Harness, { listRuns: async () => [] })
    )

    const frame = lastFrame()
    expect(frame).toMatch(/GitHub Actions/i)
    expect(frame).toMatch(/Recent workflow runs/i)
    expect(frame).toMatch(/Status of a single run/i)
    expect(frame).toMatch(/Wait for a run to finish/i)
    expect(frame).toContain('Back')
  })

  test('submitting a repo name fetches recent runs and renders them', async () => {
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
      }
    ]
    const listRuns = async (repo) => {
      expect(repo).toBe('trade-imports-animals-frontend')
      return runs
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { listRuns, action: 'runs' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/Repo name/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toContain('#99'))
    expect(lastFrame()).toContain('success')
  })

  test('a failed lookup surfaces the error', async () => {
    const listRuns = async () => {
      throw new Error('listWorkflowRuns(foo): not found.')
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { listRuns, action: 'runs' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/Repo name/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('foo')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:.*not found/i))
  })

  test('submitting "repo runId" fetches the run status and renders it', async () => {
    const captured = []
    const getRunStatus = async (...args) => {
      captured.push(args)
      return {
        id: 42,
        status: 'completed',
        conclusion: 'success',
        url: 'https://github.com/x/y/actions/runs/42'
      }
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { getRunStatus, action: 'status' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo runId/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 42')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toContain('Run #42'))
    expect(captured[0]).toEqual(['trade-imports-animals-frontend', 42])
    expect(lastFrame()).toContain('success')
  })

  test('an unparseable input surfaces a plain-English error', async () => {
    const captured = []
    const getRunStatus = async (...args) => {
      captured.push(args)
      return {}
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { getRunStatus, action: 'status' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo runId/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('foo')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() =>
      expect(lastFrame()).toMatch(/error:.*repo and a run id/i)
    )
    expect(captured).toEqual([])
  })

  test('a non-Error throw from listRuns falls back to String(error)', async () => {
    const listRuns = async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'runs kaboom'
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { listRuns, action: 'runs' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/Repo name/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('foo')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:runs kaboom/))
  })

  test('a non-Error throw from getRunStatus falls back to String(error)', async () => {
    const getRunStatus = async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'status kaboom'
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { getRunStatus, action: 'status' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo runId/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 7')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:status kaboom/))
  })

  test('a failed status lookup surfaces the client error', async () => {
    const getRunStatus = async () => {
      throw new Error('getRunStatus(repo, 7): not found.')
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { getRunStatus, action: 'status' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo runId/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 7')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:.*not found/i))
  })

  test('waiting on a run shows the progress screen then the final status', async () => {
    const captured = []
    const waitForRun = async (...args) => {
      captured.push(args)
      return {
        id: 99,
        status: 'completed',
        conclusion: 'success',
        url: 'https://github.com/x/y/actions/runs/99'
      }
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { waitForRun, action: 'wait' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo runId/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 99')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toContain('Run #99'))
    expect(captured[0]).toEqual(['trade-imports-animals-frontend', 99])
    expect(lastFrame()).toContain('success')
  })

  test('an unparseable wait input surfaces a plain-English error', async () => {
    const captured = []
    const waitForRun = async (...args) => {
      captured.push(args)
      return {}
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { waitForRun, action: 'wait' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo runId/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('foo')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() =>
      expect(lastFrame()).toMatch(/error:.*repo and a run id/i)
    )
    expect(captured).toEqual([])
  })

  test('a non-Error throw from waitForRun falls back to String(error)', async () => {
    const waitForRun = async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'wait kaboom'
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { waitForRun, action: 'wait' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo runId/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 7')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:wait kaboom/))
  })
})

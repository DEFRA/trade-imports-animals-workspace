import { describe, test, expect, vi } from 'vitest'
import { createElement, useState, useEffect } from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { SCREENS } from '../../../constants/menuConfig.js'
import LoadingScreen from '../../common/screens/LoadingScreen.js'
import { useGhaFeature } from './useGhaFeature.js'

const Harness = ({ listRuns, onReturn = () => {} }) => {
  const [screen, setScreen] = useState(SCREENS.GHA_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')

  const feature = useGhaFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: onReturn,
    listRuns
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

const RunActionHarness = ({ listRuns, action, onReturn = () => {} }) => {
  const [screen, setScreen] = useState(SCREENS.GHA_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')
  const feature = useGhaFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: onReturn,
    listRuns
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
  test('opens on a submenu with a Recent-runs option and Back', () => {
    const { lastFrame } = render(
      createElement(Harness, { listRuns: async () => [] })
    )

    const frame = lastFrame()
    expect(frame).toMatch(/GitHub Actions/i)
    expect(frame).toMatch(/Recent workflow runs/i)
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
})

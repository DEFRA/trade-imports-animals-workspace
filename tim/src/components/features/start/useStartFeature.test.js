import { describe, test, expect, vi } from 'vitest'
import { createElement, useState, useEffect } from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { SCREENS } from '../../../constants/menuConfig.js'
import LoadingScreen from '../../common/screens/LoadingScreen.js'
import { useStartFeature } from './useStartFeature.js'

const Harness = ({ launchService, workspaceRoot, onReturn = () => {} }) => {
  const [screen, setScreen] = useState(SCREENS.START_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')

  const feature = useStartFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: onReturn,
    workspaceRoot,
    launchService
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
  launchService,
  workspaceRoot,
  action,
  onReturn = () => {}
}) => {
  const [screen, setScreen] = useState(SCREENS.START_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')
  const feature = useStartFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: onReturn,
    workspaceRoot,
    launchService
  })
  useEffect(() => {
    const { items, onSelect } = feature.routes[SCREENS.START_MENU].props
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

describe('useStartFeature', () => {
  test('opens on a submenu listing every service and Back', () => {
    const { lastFrame } = render(
      createElement(Harness, {
        launchService: async () => {},
        workspaceRoot: '/fake/workspace'
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('Start')
    expect(frame).toContain('Frontend')
    expect(frame).toContain('Backend')
    expect(frame).toContain('Admin')
    expect(frame).toContain('Back')
  })

  test('selecting Frontend launches the frontend service with the workspace root', async () => {
    const captured = []
    const launchService = async (spec) => {
      captured.push(spec)
    }

    render(
      createElement(RunActionHarness, {
        launchService,
        workspaceRoot: '/fake/workspace',
        action: 'frontend'
      })
    )

    await vi.waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0]).toEqual({
      workspaceRoot: '/fake/workspace',
      service: 'frontend'
    })
  })

  test('selecting Backend launches the backend service', async () => {
    const captured = []
    render(
      createElement(RunActionHarness, {
        launchService: async (spec) => captured.push(spec),
        workspaceRoot: '/fake/workspace',
        action: 'backend'
      })
    )

    await vi.waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].service).toBe('backend')
  })

  test('selecting Admin launches the admin service', async () => {
    const captured = []
    render(
      createElement(RunActionHarness, {
        launchService: async (spec) => captured.push(spec),
        workspaceRoot: '/fake/workspace',
        action: 'admin'
      })
    )

    await vi.waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].service).toBe('admin')
  })

  test('selecting Back returns to the main menu', async () => {
    let returned = false
    const BackHarness = () => {
      const [, setScreen] = useState(SCREENS.START_MENU)
      const [, setScreenData] = useState({})
      const [, setLoadingMessage] = useState('')
      const feature = useStartFeature({
        setScreen,
        setScreenData,
        setLoadingMessage,
        navigateToMain: () => {
          returned = true
        },
        workspaceRoot: '/fake',
        launchService: async () => {}
      })
      const { items, onSelect } = feature.routes[SCREENS.START_MENU].props
      onSelect(items.find((i) => i.value === 'back'))
      return null
    }
    render(createElement(BackHarness))

    await vi.waitFor(() => expect(returned).toBe(true))
  })

  test('a launch failure (eg missing repo) surfaces on the error screen', async () => {
    const launchService = async () => {
      throw new Error('trade-imports-animals-frontend is not cloned.')
    }
    const { lastFrame } = render(
      createElement(RunActionHarness, {
        launchService,
        workspaceRoot: '/fake',
        action: 'frontend'
      })
    )

    await vi.waitFor(
      () => expect(lastFrame()).toMatch(/error:.*not cloned/i),
      { timeout: 5000 }
    )
  })
})

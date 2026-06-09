import { describe, test, expect, vi } from 'vitest'
import { createElement, useState } from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { SCREENS } from '../../../constants/menuConfig.js'
import { useMainMenuFeature } from './useMainMenuFeature.js'

const Harness = ({ workspace, auth, onExit = () => {} }) => {
  const [screen, setScreen] = useState(SCREENS.MAIN)
  const [screenData, setScreenData] = useState({})
  const feature = useMainMenuFeature({
    setScreen,
    setScreenData,
    workspace,
    auth,
    exit: onExit
  })

  if (screen === SCREENS.ERROR) {
    return createElement(Text, null, `error:${screenData.error}`)
  }
  if (screen === SCREENS.WORKSPACE_MENU) {
    return createElement(Text, null, 'workspace-menu')
  }
  if (screen === SCREENS.LOADING) {
    return createElement(Text, null, 'loading')
  }
  const route = feature.routes[screen]
  if (!route) return createElement(Text, null, `unknown:${screen}`)
  const props =
    typeof route.props === 'function' ? route.props(screenData) : route.props
  return createElement(route.component, props)
}

const stubWorkspace = (onSelect) => ({
  routes: {},
  handleMainMenuSelect: onSelect
})

const stubAuth = (onSelect) => ({
  routes: {},
  handleMainMenuSelect: onSelect
})

describe('useMainMenuFeature', () => {
  test('lists every top-level command group on the main menu', () => {
    const { lastFrame } = render(
      createElement(Harness, {
        workspace: stubWorkspace(() => {}),
        auth: stubAuth(() => {})
      })
    )

    const frame = lastFrame()
    for (const label of [
      'Workspace',
      'Docker',
      'Start',
      'Auth',
      'Jira',
      'GitHub',
      'Confluence',
      'GitHub Actions',
      'Quit'
    ]) {
      expect(frame).toContain(label)
    }
  })

  test('selecting Workspace hands control to the workspace feature', async () => {
    let workspaceOpened = false
    const { stdin } = render(
      createElement(Harness, {
        workspace: stubWorkspace(() => {
          workspaceOpened = true
        }),
        auth: stubAuth(() => {})
      })
    )

    stdin.write('\r')
    await vi.waitFor(() => expect(workspaceOpened).toBe(true))
  })

  test('selecting Auth hands control to the auth feature', async () => {
    let authOpened = false
    const AuthHarness = ({ onAuth }) => {
      const [screen, setScreen] = useState(SCREENS.MAIN)
      const [, setScreenData] = useState({})
      const feature = useMainMenuFeature({
        setScreen,
        setScreenData,
        workspace: stubWorkspace(() => {}),
        auth: stubAuth(onAuth),
        exit: () => {}
      })
      const route = feature.routes[screen]
      const props =
        typeof route.props === 'function' ? route.props({}) : route.props
      const { items, onSelect } = props
      const authItem = items.find((item) => item.value === 'auth')
      expect(authItem).toBeDefined()
      onSelect(authItem)
      return null
    }

    render(
      createElement(AuthHarness, {
        onAuth: () => {
          authOpened = true
        }
      })
    )

    await vi.waitFor(() => expect(authOpened).toBe(true))
  })

  test('selecting Quit calls the exit handler', async () => {
    let exited = false
    const QuitHarness = ({ onExit }) => {
      const feature = useMainMenuFeature({
        setScreen: () => {},
        setScreenData: () => {},
        workspace: stubWorkspace(() => {}),
        auth: stubAuth(() => {}),
        exit: onExit
      })
      const { items, onSelect } = feature.routes[SCREENS.MAIN].props
      const quitItem = items.find((item) => item.value === 'quit')
      expect(quitItem).toBeDefined()
      onSelect(quitItem)
      return null
    }

    render(
      createElement(QuitHarness, {
        onExit: () => {
          exited = true
        }
      })
    )

    await vi.waitFor(() => expect(exited).toBe(true))
  })

  test('an unknown menu value is a silent no-op (no error, no screen change)', () => {
    let errorRaised = false
    const NoOpHarness = () => {
      const feature = useMainMenuFeature({
        setScreen: () => {
          errorRaised = true
        },
        setScreenData: () => {
          errorRaised = true
        },
        workspace: stubWorkspace(() => {}),
        auth: stubAuth(() => {}),
        exit: () => {}
      })
      const { onSelect } = feature.routes[SCREENS.MAIN].props
      onSelect({ label: 'Mystery', value: 'mystery' })
      return null
    }
    render(createElement(NoOpHarness))

    expect(errorRaised).toBe(false)
  })

  test('selecting an unimplemented feature surfaces a coming-soon error', async () => {
    const DOWN = String.fromCharCode(27) + '[B'
    const { stdin, lastFrame } = render(
      createElement(Harness, {
        workspace: stubWorkspace(() => {}),
        auth: stubAuth(() => {})
      })
    )

    stdin.write(DOWN)
    await new Promise((resolve) => setTimeout(resolve, 20))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:.*Docker/i))
  })
})

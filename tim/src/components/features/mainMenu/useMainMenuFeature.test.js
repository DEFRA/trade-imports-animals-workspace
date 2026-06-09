import { describe, test, expect, vi } from 'vitest'
import { createElement, useState } from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { SCREENS } from '../../../constants/menuConfig.js'
import { useMainMenuFeature } from './useMainMenuFeature.js'

const stubFeature = (onSelect) => ({
  routes: {},
  handleMainMenuSelect: onSelect
})

const Harness = ({
  workspace,
  auth,
  jira = stubFeature(() => {}),
  github = stubFeature(() => {}),
  confluence = stubFeature(() => {}),
  gha = stubFeature(() => {}),
  onExit = () => {}
}) => {
  const [screen, setScreen] = useState(SCREENS.MAIN)
  const [screenData, setScreenData] = useState({})
  const feature = useMainMenuFeature({
    setScreen,
    setScreenData,
    workspace,
    auth,
    jira,
    github,
    confluence,
    gha,
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

const stubWorkspace = (onSelect) => stubFeature(onSelect)

const stubAuth = (onSelect) => stubFeature(onSelect)

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
        jira: stubFeature(() => {}),
        github: stubFeature(() => {}),
        confluence: stubFeature(() => {}),
        gha: stubFeature(() => {}),
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
        jira: stubFeature(() => {}),
        github: stubFeature(() => {}),
        confluence: stubFeature(() => {}),
        gha: stubFeature(() => {}),
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

  test('selecting Jira hands control to the jira feature', async () => {
    let jiraOpened = false
    const JiraHarness = () => {
      const feature = useMainMenuFeature({
        setScreen: () => {},
        setScreenData: () => {},
        workspace: stubWorkspace(() => {}),
        auth: stubAuth(() => {}),
        jira: stubFeature(() => {
          jiraOpened = true
        }),
        github: stubFeature(() => {}),
        confluence: stubFeature(() => {}),
        gha: stubFeature(() => {}),
        exit: () => {}
      })
      const { items, onSelect } = feature.routes[SCREENS.MAIN].props
      const item = items.find((i) => i.value === 'jira')
      onSelect(item)
      return null
    }
    render(createElement(JiraHarness))
    await vi.waitFor(() => expect(jiraOpened).toBe(true))
  })

  test('selecting GitHub hands control to the github feature', async () => {
    let githubOpened = false
    const GhHarness = () => {
      const feature = useMainMenuFeature({
        setScreen: () => {},
        setScreenData: () => {},
        workspace: stubWorkspace(() => {}),
        auth: stubAuth(() => {}),
        jira: stubFeature(() => {}),
        github: stubFeature(() => {
          githubOpened = true
        }),
        confluence: stubFeature(() => {}),
        gha: stubFeature(() => {}),
        exit: () => {}
      })
      const { items, onSelect } = feature.routes[SCREENS.MAIN].props
      onSelect(items.find((i) => i.value === 'github'))
      return null
    }
    render(createElement(GhHarness))
    await vi.waitFor(() => expect(githubOpened).toBe(true))
  })

  test('selecting Confluence hands control to the confluence feature', async () => {
    let opened = false
    const CHarness = () => {
      const feature = useMainMenuFeature({
        setScreen: () => {},
        setScreenData: () => {},
        workspace: stubWorkspace(() => {}),
        auth: stubAuth(() => {}),
        jira: stubFeature(() => {}),
        github: stubFeature(() => {}),
        confluence: stubFeature(() => {
          opened = true
        }),
        gha: stubFeature(() => {}),
        exit: () => {}
      })
      const { items, onSelect } = feature.routes[SCREENS.MAIN].props
      onSelect(items.find((i) => i.value === 'confluence'))
      return null
    }
    render(createElement(CHarness))
    await vi.waitFor(() => expect(opened).toBe(true))
  })

  test('selecting GitHub Actions hands control to the gha feature', async () => {
    let opened = false
    const GhaHarness = () => {
      const feature = useMainMenuFeature({
        setScreen: () => {},
        setScreenData: () => {},
        workspace: stubWorkspace(() => {}),
        auth: stubAuth(() => {}),
        jira: stubFeature(() => {}),
        github: stubFeature(() => {}),
        confluence: stubFeature(() => {}),
        gha: stubFeature(() => {
          opened = true
        }),
        exit: () => {}
      })
      const { items, onSelect } = feature.routes[SCREENS.MAIN].props
      onSelect(items.find((i) => i.value === 'gha'))
      return null
    }
    render(createElement(GhaHarness))
    await vi.waitFor(() => expect(opened).toBe(true))
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
        jira: stubFeature(() => {}),
        github: stubFeature(() => {}),
        confluence: stubFeature(() => {}),
        gha: stubFeature(() => {}),
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

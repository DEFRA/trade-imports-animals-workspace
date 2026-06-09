import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest'
import { createElement, useState } from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SCREENS } from '../../../constants/menuConfig.js'
import LoadingScreen from '../../common/screens/LoadingScreen.js'
import { useWorkspaceFeature } from './useWorkspaceFeature.js'

const createFakeWorkspace = async () => {
  const root = await mkdtemp(join(tmpdir(), 'tim-ws-'))
  await mkdir(join(root, 'repos'))
  await writeFile(join(root, 'Makefile'), '# fake workspace\n')
  return root
}

const Harness = ({ workspaceRoot, onReturn = () => {} }) => {
  const [screen, setScreen] = useState(SCREENS.WORKSPACE_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')

  const navigateToMain = () => onReturn()

  const feature = useWorkspaceFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain,
    workspaceRoot
  })

  if (screen === SCREENS.LOADING) {
    return createElement(LoadingScreen, { message: loadingMessage })
  }

  const route = feature.routes[screen]
  if (!route) return createElement(Text, null, `unknown:${screen}`)
  const props =
    typeof route.props === 'function' ? route.props(screenData) : route.props
  return createElement(route.component, props)
}

let fakeRoot

beforeAll(async () => {
  fakeRoot = await createFakeWorkspace()
})

afterAll(async () => {
  await rm(fakeRoot, { recursive: true, force: true })
})

const ProbeStatusOutputRoute = ({ workspaceRoot, onProbe }) => {
  const [, setScreen] = useState(SCREENS.WORKSPACE_STATUS_OUTPUT)
  const [, setScreenData] = useState({})
  const [, setLoadingMessage] = useState('')
  const feature = useWorkspaceFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: () => {},
    workspaceRoot
  })
  const route = feature.routes[SCREENS.WORKSPACE_STATUS_OUTPUT]
  onProbe(route.props({}))
  return null
}

describe('useWorkspaceFeature', () => {
  test('status-output route falls back to an empty list when no statuses are present in screenData', () => {
    let probedProps
    render(
      createElement(ProbeStatusOutputRoute, {
        workspaceRoot: '/tmp/anything',
        onProbe: (props) => {
          probedProps = props
        }
      })
    )

    expect(probedProps).toEqual({
      statuses: [],
      onReturn: expect.any(Function)
    })
  })

  test('opens on the workspace menu with Status and Back options', () => {
    const { lastFrame } = render(
      createElement(Harness, { workspaceRoot: fakeRoot })
    )

    const frame = lastFrame()
    expect(frame).toContain('Workspace')
    expect(frame).toContain('Status')
    expect(frame).toContain('Back')
  })

  test('selecting Back returns the user to the main menu', async () => {
    let returnedToMain = false
    const { stdin } = render(
      createElement(Harness, {
        workspaceRoot: fakeRoot,
        onReturn: () => {
          returnedToMain = true
        }
      })
    )

    stdin.write('[B')
    await new Promise((resolve) => setTimeout(resolve, 30))
    stdin.write('\r')
    await vi.waitFor(() => expect(returnedToMain).toBe(true))
  })

  test('selecting Status renders the status output for every repo', async () => {
    const { stdin, lastFrame } = render(
      createElement(Harness, { workspaceRoot: fakeRoot })
    )

    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toContain('Workspace status'))
    const frame = lastFrame()
    expect(frame).toContain('trade-imports-animals-frontend')
    expect(frame).toContain('trade-imports-animals-backend')
    expect(frame).toContain('Not cloned')
  })

  test('selecting Status when the workspace is invalid surfaces an error screen', async () => {
    let capturedError
    const ErrorHarness = ({ workspaceRoot }) => {
      const [screen, setScreen] = useState(SCREENS.WORKSPACE_MENU)
      const [screenData, setScreenData] = useState({})
      const [, setLoadingMessage] = useState('')
      const feature = useWorkspaceFeature({
        setScreen,
        setScreenData,
        setLoadingMessage,
        navigateToMain: () => {},
        workspaceRoot
      })
      if (screen === SCREENS.ERROR) {
        capturedError = screenData.error
        return createElement(Text, null, `error:${screenData.error}`)
      }
      const route = feature.routes[screen]
      const props =
        typeof route.props === 'function'
          ? route.props(screenData)
          : route.props
      return createElement(route.component, props)
    }

    const bogusRoot = join(tmpdir(), 'tim-not-a-workspace-' + Date.now())
    const { stdin } = render(
      createElement(ErrorHarness, { workspaceRoot: bogusRoot })
    )

    stdin.write('\r')
    await vi.waitFor(() => expect(capturedError).toBeTruthy())
    expect(capturedError).toMatch(/workspace/i)
  })
})

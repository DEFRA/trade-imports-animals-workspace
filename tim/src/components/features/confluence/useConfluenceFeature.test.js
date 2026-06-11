import { describe, test, expect, vi } from 'vitest'
import { createElement, useState, useEffect } from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { SCREENS } from '../../../constants/menuConfig.js'
import LoadingScreen from '../../common/screens/LoadingScreen.js'
import { useConfluenceFeature } from './useConfluenceFeature.js'

const Harness = ({ getPage, onReturn = () => {} }) => {
  const [screen, setScreen] = useState(SCREENS.CONFLUENCE_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')

  const feature = useConfluenceFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: onReturn,
    getPage
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

const RunActionHarness = ({ getPage, action, onReturn = () => {} }) => {
  const [screen, setScreen] = useState(SCREENS.CONFLUENCE_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')
  const feature = useConfluenceFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: onReturn,
    getPage
  })
  useEffect(() => {
    const { items, onSelect } = feature.routes[SCREENS.CONFLUENCE_MENU].props
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

describe('useConfluenceFeature', () => {
  test('opens on a submenu with a Page-lookup option and Back', () => {
    const { lastFrame } = render(
      createElement(Harness, { getPage: async () => ({}) })
    )

    const frame = lastFrame()
    expect(frame).toContain('Confluence')
    expect(frame).toMatch(/Look up a page/i)
    expect(frame).toContain('Back')
  })

  test('submitting a page id fetches and renders the page', async () => {
    const page = {
      id: '12345',
      title: 'Workspace Setup',
      version: 3,
      body: '<p>Step 1</p>'
    }
    const getPage = async (id) => {
      expect(id).toBe('12345')
      return page
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { getPage, action: 'page' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/Page id/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('12345')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toContain('Workspace Setup'))
    expect(lastFrame()).toContain('Step 1')
  })

  test('a non-Error throw falls back to String(error)', async () => {
    const getPage = async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'confluence kaboom'
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { getPage, action: 'page' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/Page id/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('99')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() =>
      expect(lastFrame()).toMatch(/error:confluence kaboom/)
    )
  })

  test('a failed lookup surfaces the error', async () => {
    const getPage = async () => {
      throw new Error('getPage(9): not found.')
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, { getPage, action: 'page' })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/Page id/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('9')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:.*not found/i))
  })
})

import { describe, test, expect, vi } from 'vitest'
import { createElement, useState, useEffect } from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { SCREENS } from '../../../constants/menuConfig.js'
import LoadingScreen from '../../common/screens/LoadingScreen.js'
import { useGithubFeature } from './useGithubFeature.js'

const Harness = ({
  findPrsForTicket,
  getPr,
  getPrDiff,
  onReturn = () => {}
}) => {
  const [screen, setScreen] = useState(SCREENS.GITHUB_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')

  const feature = useGithubFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: onReturn,
    findPrsForTicket,
    getPr,
    getPrDiff
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
  findPrsForTicket,
  getPr,
  getPrDiff,
  action,
  onReturn = () => {}
}) => {
  const [screen, setScreen] = useState(SCREENS.GITHUB_MENU)
  const [screenData, setScreenData] = useState({})
  const [loadingMessage, setLoadingMessage] = useState('')
  const feature = useGithubFeature({
    setScreen,
    setScreenData,
    setLoadingMessage,
    navigateToMain: onReturn,
    findPrsForTicket,
    getPr,
    getPrDiff
  })
  useEffect(() => {
    const { items, onSelect } = feature.routes[SCREENS.GITHUB_MENU].props
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

describe('useGithubFeature', () => {
  test('opens on a submenu listing every GitHub action', () => {
    const { lastFrame } = render(
      createElement(Harness, { findPrsForTicket: async () => [] })
    )

    const frame = lastFrame()
    expect(frame).toContain('GitHub')
    expect(frame).toMatch(/Find pull requests/i)
    expect(frame).toMatch(/Open a single PR/i)
    expect(frame).toMatch(/Show a PR diff/i)
    expect(frame).toContain('Back')
  })

  test('submitting a ticket id fetches PRs and renders the result', async () => {
    const prs = [
      {
        repo: 'trade-imports-animals-frontend',
        number: 42,
        title: 'Add origin page',
        url: 'https://github.com/x',
        state: 'open'
      }
    ]
    const findPrsForTicket = async (id) => {
      expect(id).toBe('EUDPA-200')
      return prs
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket,
        action: 'prs'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/Ticket id/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('EUDPA-200')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() =>
      expect(lastFrame()).toContain('Pull requests for EUDPA-200')
    )
    expect(lastFrame()).toContain('Add origin page')
    expect(lastFrame()).toContain('#42')
  })

  test('a failed lookup surfaces the error', async () => {
    const findPrsForTicket = async () => {
      throw new Error('GitHub rate limit hit.')
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket,
        action: 'prs'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/Ticket id/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('EUDPA-9')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:.*rate limit/i))
  })

  test('submitting "repo number" loads a single PR and renders the details', async () => {
    const captured = []
    const getPr = async (...args) => {
      captured.push(args)
      return {
        repo: 'trade-imports-animals-frontend',
        number: 42,
        title: 'Add origin page',
        state: 'open',
        url: 'https://github.com/DEFRA/trade-imports-animals-frontend/pull/42',
        author: 'sam',
        body: 'Implements the origin page.'
      }
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket: async () => [],
        getPr,
        action: 'pr'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo number/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 42')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toContain('#42 Add origin page'))
    expect(lastFrame()).toContain('Implements the origin page.')
    expect(captured[0]).toEqual(['trade-imports-animals-frontend', 42])
  })

  test('a malformed PR input surfaces a plain-English parse error', async () => {
    const captured = []
    const getPr = async (...args) => {
      captured.push(args)
      return {}
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket: async () => [],
        getPr,
        action: 'pr'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo number/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('foo')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() =>
      expect(lastFrame()).toMatch(/error:.*repo and a PR number/i)
    )
    expect(captured).toEqual([])
  })

  test('a failed single-PR lookup surfaces the client error', async () => {
    const getPr = async () => {
      throw new Error('GitHub returned 404.')
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket: async () => [],
        getPr,
        action: 'pr'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo number/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 9999')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:.*404/i))
  })

  test('submitting "repo number" loads a PR diff and renders it', async () => {
    const captured = []
    const getPrDiff = async (...args) => {
      captured.push(args)
      return 'diff --git a/x b/x\n+hello\n-world'
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket: async () => [],
        getPrDiff,
        action: 'diff'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo number/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 42')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() =>
      expect(lastFrame()).toContain('Diff — trade-imports-animals-frontend#42')
    )
    expect(lastFrame()).toContain('+hello')
    expect(captured[0]).toEqual(['trade-imports-animals-frontend', 42])
  })

  test('a malformed diff input surfaces a plain-English parse error', async () => {
    const captured = []
    const getPrDiff = async (...args) => {
      captured.push(args)
      return ''
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket: async () => [],
        getPrDiff,
        action: 'diff'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo number/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('foo')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() =>
      expect(lastFrame()).toMatch(/error:.*repo and a PR number/i)
    )
    expect(captured).toEqual([])
  })

  test('a failed diff lookup surfaces the client error', async () => {
    const getPrDiff = async () => {
      throw new Error('GitHub rate limit hit.')
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket: async () => [],
        getPrDiff,
        action: 'diff'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo number/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 9999')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:.*rate limit/i))
  })

  test('a non-Error throw from findPrsForTicket falls back to String(error)', async () => {
    const findPrsForTicket = async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'prs kaboom'
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket,
        action: 'prs'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/Ticket id/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('EUDPA-9')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:prs kaboom/))
  })

  test('a non-Error throw from getPr falls back to String(error)', async () => {
    const getPr = async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'pr kaboom'
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket: async () => [],
        getPr,
        action: 'pr'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo number/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 1')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:pr kaboom/))
  })

  test('a non-Error throw from getPrDiff falls back to String(error)', async () => {
    const getPrDiff = async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'diff kaboom'
    }

    const { stdin, lastFrame } = render(
      createElement(RunActionHarness, {
        findPrsForTicket: async () => [],
        getPrDiff,
        action: 'diff'
      })
    )

    await vi.waitFor(() => expect(lastFrame()).toMatch(/repo number/i))
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('trade-imports-animals-frontend 1')
    await new Promise((resolve) => setTimeout(resolve, 50))
    stdin.write('\r')

    await vi.waitFor(() => expect(lastFrame()).toMatch(/error:diff kaboom/))
  })

  test('selecting Back returns to the main menu', async () => {
    let returned = false
    const BackHarness = () => {
      const [, setScreen] = useState(SCREENS.GITHUB_MENU)
      const [, setScreenData] = useState({})
      const [, setLoadingMessage] = useState('')
      const feature = useGithubFeature({
        setScreen,
        setScreenData,
        setLoadingMessage,
        navigateToMain: () => {
          returned = true
        },
        findPrsForTicket: async () => []
      })
      const { items, onSelect } = feature.routes[SCREENS.GITHUB_MENU].props
      const back = items.find((i) => i.value === 'back')
      onSelect(back)
      return null
    }
    render(createElement(BackHarness))

    await vi.waitFor(() => expect(returned).toBe(true))
  })
})

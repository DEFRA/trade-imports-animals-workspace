import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import MenuScreen from './MenuScreen.js'

const items = [
  { label: 'Status', value: 'status' },
  { label: 'Install', value: 'install' }
]

describe('MenuScreen', () => {
  test('renders the title and every item label in order', () => {
    const { lastFrame } = render(
      createElement(MenuScreen, {
        title: 'Workspace',
        items,
        onSelect: () => {}
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('Workspace')
    const statusIndex = frame.indexOf('Status')
    const installIndex = frame.indexOf('Install')
    expect(statusIndex).toBeGreaterThan(-1)
    expect(installIndex).toBeGreaterThan(statusIndex)
  })

  test('renders the subtitle when provided', () => {
    const { lastFrame } = render(
      createElement(MenuScreen, {
        title: 'Workspace',
        subtitle: 'Choose an action',
        items,
        onSelect: () => {}
      })
    )

    expect(lastFrame()).toContain('Choose an action')
  })

  test('selecting an item invokes onSelect with the matching item', async () => {
    let selected = null
    const { stdin } = render(
      createElement(MenuScreen, {
        title: 'Workspace',
        items,
        onSelect: (item) => {
          selected = item
        }
      })
    )

    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(selected).toEqual({ label: 'Status', value: 'status' })
  })
})

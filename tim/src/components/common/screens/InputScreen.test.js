import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import InputScreen from './InputScreen.js'

describe('InputScreen', () => {
  test('renders the title, subtitle and the prompt label', () => {
    const { lastFrame } = render(
      createElement(InputScreen, {
        title: 'Jira',
        subtitle: 'Look up a Jira ticket',
        label: 'Ticket id',
        onSubmit: () => {},
        onCancel: () => {}
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('Jira')
    expect(frame).toContain('Look up a Jira ticket')
    expect(frame).toContain('Ticket id')
  })

  test('typing then pressing Enter calls onSubmit with the trimmed value', async () => {
    let submitted = null
    const { stdin } = render(
      createElement(InputScreen, {
        title: 'Jira',
        label: 'Ticket id',
        onSubmit: (value) => {
          submitted = value
        },
        onCancel: () => {}
      })
    )

    stdin.write('EUDPA-200')
    await new Promise((resolve) => setTimeout(resolve, 20))
    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(submitted).toBe('EUDPA-200')
  })

  test('pressing Enter with no input calls onCancel', async () => {
    let cancelled = false
    let submitted = null
    const { stdin } = render(
      createElement(InputScreen, {
        title: 'Jira',
        label: 'Ticket id',
        onSubmit: (value) => {
          submitted = value
        },
        onCancel: () => {
          cancelled = true
        }
      })
    )

    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(cancelled).toBe(true)
    expect(submitted).toBe(null)
  })

  test('whitespace-only input is treated as empty and cancels', async () => {
    let cancelled = false
    const { stdin } = render(
      createElement(InputScreen, {
        title: 'Jira',
        label: 'Ticket id',
        onSubmit: () => {},
        onCancel: () => {
          cancelled = true
        }
      })
    )

    stdin.write('   ')
    await new Promise((resolve) => setTimeout(resolve, 20))
    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(cancelled).toBe(true)
  })

  test('shows the help line so the user knows blank input cancels', () => {
    const { lastFrame } = render(
      createElement(InputScreen, {
        title: 'Jira',
        label: 'Ticket id',
        onSubmit: () => {},
        onCancel: () => {}
      })
    )

    expect(lastFrame()).toMatch(/Enter to submit/i)
    expect(lastFrame()).toMatch(/leave blank/i)
  })
})

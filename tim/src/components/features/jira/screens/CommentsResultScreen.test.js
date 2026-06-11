import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { render } from 'ink-testing-library'
import CommentsResultScreen from './CommentsResultScreen.js'

const comments = [
  {
    id: '1',
    author: 'Sam',
    createdAt: '2026-06-09T10:00:00.000+0000',
    body: 'Started work on this.'
  },
  {
    id: '2',
    author: 'Alex',
    createdAt: '2026-06-09T11:30:00.000+0000',
    body: 'Reviewed the plan.'
  }
]

describe('CommentsResultScreen', () => {
  test('renders the ticket id, every comment and the count', () => {
    const { lastFrame } = render(
      createElement(CommentsResultScreen, {
        ticketId: 'EUDPA-200',
        comments,
        onReturn: () => {}
      })
    )

    const frame = lastFrame()
    expect(frame).toContain('Comments on EUDPA-200')
    expect(frame).toContain('Sam')
    expect(frame).toContain('Started work on this.')
    expect(frame).toContain('Alex')
    expect(frame).toContain('Reviewed the plan.')
    expect(frame).toMatch(/2 comments total/i)
  })

  test('shows a friendly message when no comments are found', () => {
    const { lastFrame } = render(
      createElement(CommentsResultScreen, {
        ticketId: 'EUDPA-999',
        comments: [],
        onReturn: () => {}
      })
    )

    expect(lastFrame()).toContain('No comments on EUDPA-999.')
  })

  test('pressing Enter calls onReturn', async () => {
    let returned = false
    const { stdin } = render(
      createElement(CommentsResultScreen, {
        ticketId: 'EUDPA-200',
        comments,
        onReturn: () => {
          returned = true
        }
      })
    )

    stdin.write('\r')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(returned).toBe(true)
  })
})

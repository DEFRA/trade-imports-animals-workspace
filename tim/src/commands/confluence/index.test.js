import { describe, test, expect } from 'vitest'
import { renderPage } from './index.js'

describe('renderPage', () => {
  test('includes title, id, version and body', () => {
    const text = renderPage({
      id: '123',
      title: 'My Page',
      version: 7,
      body: '<p>hello</p>'
    })
    expect(text).toContain('My Page  (id: 123, version 7)')
    expect(text).toContain('<p>hello</p>')
  })

  test('marks empty bodies explicitly so the user can tell empty from missing fetch', () => {
    const text = renderPage({ id: '1', title: 't', version: 1, body: '' })
    expect(text).toContain('(empty body)')
  })
})

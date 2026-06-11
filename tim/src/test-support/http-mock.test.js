import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { installHttpMocks, closeHttpMocks } from './http-mock.js'

let mockPool

beforeEach(() => {
  ;({ mockPool } = installHttpMocks())
})

afterEach(() => {
  closeHttpMocks()
})

describe('installHttpMocks', () => {
  test('intercepts a GET and returns the staged body', async () => {
    mockPool('https://example.invalid')
      .get('/hello')
      .reply(200, { greeting: 'hi' })

    const response = await fetch('https://example.invalid/hello')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ greeting: 'hi' })
  })

  test('rejects real network calls so tests cannot accidentally hit the wire', async () => {
    await expect(fetch('https://nope.invalid/x')).rejects.toThrow()
  })

  test('replays distinct status codes — useful for error-path tests', async () => {
    mockPool('https://example.invalid')
      .get('/oops')
      .reply(429, { message: 'rate limited' })

    const response = await fetch('https://example.invalid/oops')
    expect(response.status).toBe(429)
  })
})

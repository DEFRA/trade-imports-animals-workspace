import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { installHttpMocks, closeHttpMocks } from '../test-support/http-mock.js'
import { createConfluenceClient } from './confluence-client.js'

const BASE = 'https://example.atlassian.net'
let mockPool

beforeEach(() => {
  ;({ mockPool } = installHttpMocks())
})

afterEach(() => {
  closeHttpMocks()
})

describe('createConfluenceClient', () => {
  test('throws TimError(AUTH) when credentials are missing', () => {
    expect(() =>
      createConfluenceClient({ user: null, token: 't', baseUrl: BASE })
    ).toThrowError(/JIRA_USER/)
  })

  test('throws TimError(USAGE) when JIRA_BASE_URL is missing', () => {
    expect(() =>
      createConfluenceClient({ user: 'u', token: 't', baseUrl: null })
    ).toThrowError(/JIRA_BASE_URL/)
  })
})

describe('whoami', () => {
  test('returns the display name from /wiki/rest/api/user/current', async () => {
    mockPool(BASE)
      .get('/wiki/rest/api/user/current')
      .reply(200, {
        username: 'sam',
        profile: { displayName: 'Sam Farrington' }
      })

    const client = createConfluenceClient({
      user: 'u',
      token: 't',
      baseUrl: BASE
    })
    expect(await client.whoami()).toEqual({
      user: 'sam',
      displayName: 'Sam Farrington'
    })
  })

  test('maps 401 to TimError(AUTH)', async () => {
    mockPool(BASE).get('/wiki/rest/api/user/current').reply(401, {})
    const client = createConfluenceClient({
      user: 'u',
      token: 't',
      baseUrl: BASE
    })
    await expect(client.whoami()).rejects.toMatchObject({ code: 'AUTH' })
  })
})

describe('getPage', () => {
  test('returns the parsed page with body.storage value and version', async () => {
    mockPool(BASE)
      .get('/wiki/rest/api/content/123')
      .query({ expand: 'body.storage,version' })
      .reply(200, {
        id: '123',
        title: 'Page',
        version: { number: 7 },
        body: { storage: { value: '<p>hi</p>' } }
      })

    const client = createConfluenceClient({
      user: 'u',
      token: 't',
      baseUrl: BASE
    })
    expect(await client.getPage('123')).toEqual({
      id: '123',
      title: 'Page',
      version: 7,
      body: '<p>hi</p>'
    })
  })

  test('maps 404 to TimError(NOT_FOUND)', async () => {
    mockPool(BASE)
      .get('/wiki/rest/api/content/nope')
      .query({ expand: 'body.storage,version' })
      .reply(404, {})
    const client = createConfluenceClient({
      user: 'u',
      token: 't',
      baseUrl: BASE
    })
    await expect(client.getPage('nope')).rejects.toMatchObject({
      code: 'NOT_FOUND'
    })
  })
})

describe('error mapping', () => {
  test('maps 429 to TimError(RATE_LIMIT)', async () => {
    mockPool(BASE).get('/wiki/rest/api/user/current').reply(429, {})
    const client = createConfluenceClient({
      user: 'u',
      token: 't',
      baseUrl: BASE
    })
    await expect(client.whoami()).rejects.toMatchObject({
      name: 'TimError',
      code: 'RATE_LIMIT'
    })
  })

  test('maps 500 to TimError(NETWORK) with the status code in the message', async () => {
    mockPool(BASE).get('/wiki/rest/api/user/current').reply(500, {})
    const client = createConfluenceClient({
      user: 'u',
      token: 't',
      baseUrl: BASE
    })
    await expect(client.whoami()).rejects.toMatchObject({
      name: 'TimError',
      code: 'NETWORK',
      message: expect.stringContaining('500')
    })
  })

  test('maps a fetch failure (no response) to TimError(NETWORK)', async () => {
    mockPool(BASE)
      .get('/wiki/rest/api/user/current')
      .replyWithError({ message: 'connection reset' })
    const client = createConfluenceClient({
      user: 'u',
      token: 't',
      baseUrl: BASE
    })
    await expect(client.whoami()).rejects.toMatchObject({
      name: 'TimError',
      code: 'NETWORK'
    })
  })

  test('maps an invalid JSON response body to TimError(PARSE)', async () => {
    mockPool(BASE)
      .get('/wiki/rest/api/user/current')
      .reply(200, 'not really json', {
        'content-type': 'application/json'
      })
    const client = createConfluenceClient({
      user: 'u',
      token: 't',
      baseUrl: BASE
    })
    await expect(client.whoami()).rejects.toMatchObject({
      name: 'TimError',
      code: 'PARSE'
    })
  })
})

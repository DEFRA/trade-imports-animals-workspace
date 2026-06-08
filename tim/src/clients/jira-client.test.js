import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { installHttpMocks, closeHttpMocks } from '../test-support/http-mock.js'
import { createJiraClient } from './jira-client.js'

const BASE = 'https://example.atlassian.net'
let mockPool

beforeEach(() => {
  ;({ mockPool } = installHttpMocks())
})

afterEach(() => {
  closeHttpMocks()
})

describe('createJiraClient', () => {
  test('throws TimError(AUTH) when JIRA_USER or JIRA_TOKEN is missing', () => {
    expect(() =>
      createJiraClient({ user: null, token: 't', baseUrl: BASE })
    ).toThrowError(/JIRA_USER/)
    expect(() =>
      createJiraClient({ user: 'u', token: null, baseUrl: BASE })
    ).toThrowError(/JIRA_TOKEN/)
  })

  test('throws TimError(USAGE) when JIRA_BASE_URL is missing', () => {
    expect(() =>
      createJiraClient({ user: 'u', token: 't', baseUrl: null })
    ).toThrowError(/JIRA_BASE_URL/)
  })
})

describe('whoami', () => {
  test('returns the display name and account identifier', async () => {
    mockPool(BASE)
      .get('/rest/api/2/myself')
      .reply(200, { name: 'sam', displayName: 'Sam Farrington' })

    const client = createJiraClient({ user: 'u', token: 't', baseUrl: BASE })
    expect(await client.whoami()).toEqual({
      user: 'sam',
      displayName: 'Sam Farrington'
    })
  })

  test('maps 401 to TimError(AUTH)', async () => {
    mockPool(BASE).get('/rest/api/2/myself').reply(401, {})
    const client = createJiraClient({ user: 'u', token: 't', baseUrl: BASE })
    await expect(client.whoami()).rejects.toMatchObject({
      name: 'TimError',
      code: 'AUTH'
    })
  })
})

describe('getTicket', () => {
  test('returns the parsed ticket shape', async () => {
    mockPool(BASE)
      .get('/rest/api/2/issue/EUDPA-200')
      .reply(200, {
        key: 'EUDPA-200',
        fields: {
          summary: 'Build the CLI',
          status: { name: 'In Progress' },
          issuetype: { name: 'Story' },
          assignee: { displayName: 'Sam' },
          priority: { name: 'High' },
          description: 'do it'
        }
      })

    const ticket = await createJiraClient({
      user: 'u',
      token: 't',
      baseUrl: BASE
    }).getTicket('EUDPA-200')

    expect(ticket).toEqual({
      id: 'EUDPA-200',
      summary: 'Build the CLI',
      status: 'In Progress',
      type: 'Story',
      assignee: 'Sam',
      priority: 'High',
      description: 'do it'
    })
  })

  test('maps 404 to TimError(NOT_FOUND)', async () => {
    mockPool(BASE).get('/rest/api/2/issue/EUDPA-NOPE').reply(404, {})
    const client = createJiraClient({ user: 'u', token: 't', baseUrl: BASE })
    await expect(client.getTicket('EUDPA-NOPE')).rejects.toMatchObject({
      code: 'NOT_FOUND'
    })
  })
})

describe('getComments', () => {
  test('returns the parsed comments list', async () => {
    mockPool(BASE)
      .get('/rest/api/2/issue/EUDPA-200/comment')
      .reply(200, {
        comments: [
          {
            id: '1',
            author: { displayName: 'Sam' },
            created: '2026-06-08T10:00:00.000Z',
            body: 'first'
          }
        ]
      })

    const client = createJiraClient({ user: 'u', token: 't', baseUrl: BASE })
    expect(await client.getComments('EUDPA-200')).toEqual([
      {
        id: '1',
        author: 'Sam',
        createdAt: '2026-06-08T10:00:00.000Z',
        body: 'first'
      }
    ])
  })
})

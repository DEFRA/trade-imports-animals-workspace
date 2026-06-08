import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { installHttpMocks, closeHttpMocks } from '../test-support/http-mock.js'
import { createGithubClient } from './github-client.js'

const ORIGIN = 'https://api.github.com'

let mockPool

beforeEach(() => {
  ;({ mockPool } = installHttpMocks())
})

afterEach(() => {
  closeHttpMocks()
})

describe('createGithubClient', () => {
  test('throws TimError(AUTH) when no token is provided and GITHUB_TOKEN is unset', () => {
    const prev = process.env.GITHUB_TOKEN
    delete process.env.GITHUB_TOKEN
    try {
      expect(() => createGithubClient()).toThrowError(/Set GITHUB_TOKEN/)
    } finally {
      if (prev !== undefined) process.env.GITHUB_TOKEN = prev
    }
  })
})

describe('whoami', () => {
  test('returns the authenticated login and name', async () => {
    mockPool(ORIGIN)
      .get('/user')
      .reply(200, { login: 'sam', name: 'Sam Farrington' })
    const client = createGithubClient({ token: 't' })
    expect(await client.whoami()).toEqual({
      login: 'sam',
      name: 'Sam Farrington'
    })
  })

  test('maps a 401 to TimError(AUTH)', async () => {
    mockPool(ORIGIN).get('/user').reply(401, { message: 'Bad credentials' })
    const client = createGithubClient({ token: 't' })
    await expect(client.whoami()).rejects.toMatchObject({
      name: 'TimError',
      code: 'AUTH'
    })
  })
})

describe('findPrsForTicket', () => {
  test('returns parsed PRs for the given ticket id', async () => {
    mockPool(ORIGIN)
      .get('/search/issues')
      .query({ q: 'EUDPA-200 is:pr org:DEFRA', per_page: 100 })
      .reply(200, {
        items: [
          {
            number: 42,
            title: 'Add X',
            state: 'open',
            html_url:
              'https://github.com/DEFRA/trade-imports-animals-frontend/pull/42'
          }
        ]
      })

    const prs = await createGithubClient({ token: 't' }).findPrsForTicket(
      'EUDPA-200'
    )

    expect(prs).toEqual([
      {
        repo: 'trade-imports-animals-frontend',
        number: 42,
        title: 'Add X',
        url: 'https://github.com/DEFRA/trade-imports-animals-frontend/pull/42',
        state: 'open'
      }
    ])
  })
})

describe('getPr', () => {
  test('returns the parsed PR record for repo + number', async () => {
    mockPool(ORIGIN)
      .get('/repos/DEFRA/trade-imports-animals-frontend/pulls/42')
      .reply(200, {
        number: 42,
        title: 'Add X',
        state: 'open',
        html_url:
          'https://github.com/DEFRA/trade-imports-animals-frontend/pull/42',
        user: { login: 'sam' },
        body: 'description'
      })

    const pr = await createGithubClient({ token: 't' }).getPr(
      'trade-imports-animals-frontend',
      42
    )

    expect(pr).toEqual({
      repo: 'trade-imports-animals-frontend',
      number: 42,
      title: 'Add X',
      state: 'open',
      url: 'https://github.com/DEFRA/trade-imports-animals-frontend/pull/42',
      author: 'sam',
      body: 'description'
    })
  })

  test('maps 404 to TimError(NOT_FOUND)', async () => {
    mockPool(ORIGIN)
      .get('/repos/DEFRA/trade-imports-animals-frontend/pulls/999')
      .reply(404, { message: 'Not Found' })

    await expect(
      createGithubClient({ token: 't' }).getPr(
        'trade-imports-animals-frontend',
        999
      )
    ).rejects.toMatchObject({ name: 'TimError', code: 'NOT_FOUND' })
  })
})

describe('listWorkflowRuns', () => {
  test('returns parsed workflow runs filtered by branch', async () => {
    mockPool(ORIGIN)
      .get('/repos/DEFRA/trade-imports-animals-frontend/actions/runs')
      .query({ branch: 'feat/x', per_page: 5 })
      .reply(200, {
        workflow_runs: [
          {
            id: 99,
            name: 'check-pr',
            head_branch: 'feat/x',
            head_sha: 'abc123',
            status: 'completed',
            conclusion: 'success',
            html_url:
              'https://github.com/DEFRA/trade-imports-animals-frontend/actions/runs/99',
            created_at: '2026-06-08T10:00:00Z'
          }
        ]
      })

    const runs = await createGithubClient({ token: 't' }).listWorkflowRuns(
      'trade-imports-animals-frontend',
      { branch: 'feat/x', limit: 5 }
    )

    expect(runs).toEqual([
      {
        id: 99,
        name: 'check-pr',
        headBranch: 'feat/x',
        headSha: 'abc123',
        status: 'completed',
        conclusion: 'success',
        url: 'https://github.com/DEFRA/trade-imports-animals-frontend/actions/runs/99',
        createdAt: '2026-06-08T10:00:00Z'
      }
    ])
  })
})

describe('getRunStatus', () => {
  test('returns the status and conclusion of a single run', async () => {
    mockPool(ORIGIN)
      .get('/repos/DEFRA/trade-imports-animals-frontend/actions/runs/99')
      .reply(200, {
        id: 99,
        status: 'in_progress',
        conclusion: null,
        html_url:
          'https://github.com/DEFRA/trade-imports-animals-frontend/actions/runs/99'
      })

    const status = await createGithubClient({ token: 't' }).getRunStatus(
      'trade-imports-animals-frontend',
      99
    )

    expect(status).toEqual({
      id: 99,
      status: 'in_progress',
      conclusion: null,
      url: 'https://github.com/DEFRA/trade-imports-animals-frontend/actions/runs/99'
    })
  })
})

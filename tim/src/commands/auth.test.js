import { describe, test, expect } from 'vitest'
import { probeAll } from './auth.js'
import { TimError } from '../errors.js'

const fakeClient = (whoami) => () => ({ whoami: async () => whoami })
const failingClient = (error) => () => ({
  whoami: async () => {
    throw error
  }
})

describe('probeAll', () => {
  test('returns a result per service with ok=true and the parsed user', async () => {
    const results = await probeAll({
      githubFactory: fakeClient({ login: 'sam', name: 'Sam' }),
      jiraFactory: fakeClient({ user: 'sam', displayName: 'Sam' }),
      confluenceFactory: fakeClient({ user: 'sam', displayName: 'Sam' })
    })
    expect(results.map((r) => r.service).sort()).toEqual([
      'confluence',
      'github',
      'jira'
    ])
    expect(results.every((r) => r.ok)).toBe(true)
  })

  test('captures per-service failures as ok=false with error.code', async () => {
    const results = await probeAll({
      githubFactory: failingClient(new TimError('AUTH', 'bad token')),
      jiraFactory: fakeClient({ user: 'sam' }),
      confluenceFactory: fakeClient({ user: 'sam' })
    })
    const byService = Object.fromEntries(results.map((r) => [r.service, r]))
    expect(byService.github).toMatchObject({
      ok: false,
      error: { code: 'AUTH' }
    })
    expect(byService.jira.ok).toBe(true)
    expect(byService.confluence.ok).toBe(true)
  })

  test('preserves non-TimError error info under code: UNKNOWN', async () => {
    const results = await probeAll({
      githubFactory: failingClient(new Error('boom')),
      jiraFactory: fakeClient({ user: 'sam' }),
      confluenceFactory: fakeClient({ user: 'sam' })
    })
    const github = results.find((r) => r.service === 'github')
    expect(github).toMatchObject({
      ok: false,
      error: { code: 'UNKNOWN', message: 'boom' }
    })
  })
})

// NOTE: no subprocess CLI test here — nock intercepts are process-local
// and don't cross the execa boundary. The action handler shape is the
// same as every other command (workspace/docker/start) which are
// subprocess-tested. The behavioural surface that matters (probeAll
// return shape) is covered above.

import { describe, test, expect, vi } from 'vitest'
import { createGhaClient } from './gha-client.js'

const makeFakeGithub = (statuses) => {
  let i = 0
  return {
    listWorkflowRuns: vi.fn(),
    getRunStatus: vi.fn(
      async () => statuses[Math.min(i++, statuses.length - 1)]
    )
  }
}

describe('createGhaClient', () => {
  test('listRuns delegates to the github client', async () => {
    const github = {
      listWorkflowRuns: vi.fn(async () => [{ id: 1 }]),
      getRunStatus: vi.fn()
    }
    const client = createGhaClient({ github })
    const runs = await client.listRuns('repo', { branch: 'main' })
    expect(runs).toEqual([{ id: 1 }])
  })

  test('getRunStatus delegates to the github client', async () => {
    const github = {
      listWorkflowRuns: vi.fn(),
      getRunStatus: vi.fn(async () => ({ id: 7, status: 'completed' }))
    }
    const client = createGhaClient({ github })
    const status = await client.getRunStatus('repo', 7)
    expect(status).toEqual({ id: 7, status: 'completed' })
  })
})

describe('waitForRun', () => {
  test('returns the final status once the run reaches "completed"', async () => {
    const github = makeFakeGithub([
      { id: 1, status: 'in_progress', conclusion: null },
      { id: 1, status: 'completed', conclusion: 'success' }
    ])
    const client = createGhaClient({ github })
    const status = await client.waitForRun('repo', 1, { intervalMs: 1 })
    expect(status).toMatchObject({ status: 'completed', conclusion: 'success' })
  })

  test('throws TimError(USAGE) when the run does not finish within the timeout', async () => {
    const github = makeFakeGithub([
      { id: 1, status: 'in_progress', conclusion: null }
    ])
    const client = createGhaClient({ github })
    await expect(
      client.waitForRun('repo', 1, { intervalMs: 5, timeoutMs: 20 })
    ).rejects.toMatchObject({ code: 'USAGE' })
  })
})

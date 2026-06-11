import { setTimeout as delay } from 'node:timers/promises'
import { createGithubClient } from './github-client.js'

const TERMINAL_STATUSES = new Set(['completed', 'cancelled', 'skipped'])

/**
 * GitHub Actions client — thin façade over github-client that exposes the
 * methods relevant to workflow runs (status, list, wait-for-completion).
 *
 * @param {object} [opts]
 * @param {string} [opts.token]
 * @param {string} [opts.org]
 * @param {object} [opts.github] - For tests: an alternative github-client instance
 * @returns {object}
 */
export const createGhaClient = ({ token, org, github } = {}) => {
  const gh = github ?? createGithubClient({ token, org })
  return {
    listRuns: (repo, opts) => gh.listWorkflowRuns(repo, opts),
    getRunStatus: (repo, runId) => gh.getRunStatus(repo, runId),
    /**
     * Poll a run until it reaches a terminal status or the timeout elapses.
     * Returns the final status. Throws TimError(USAGE) on timeout.
     */
    waitForRun: async (
      repo,
      runId,
      { intervalMs = 5_000, timeoutMs = 600_000 } = {}
    ) => {
      const deadline = performance.now() + timeoutMs
      while (true) {
        const status = await gh.getRunStatus(repo, runId)
        if (TERMINAL_STATUSES.has(status.status)) return status
        if (performance.now() >= deadline) {
          const { TimError } = await import('../errors.js')
          throw new TimError(
            'USAGE',
            `Run ${runId} did not reach a terminal status within ${timeoutMs}ms (last status: ${status.status}).`
          )
        }
        await delay(intervalMs)
      }
    }
  }
}

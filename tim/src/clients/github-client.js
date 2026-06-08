import { Octokit } from '@octokit/rest'
import { TimError } from '../errors.js'

const DEFAULT_ORG = 'DEFRA'

const mapError = (error, action) => {
  const status = error?.status ?? error?.response?.status
  if (status === 401) {
    return new TimError(
      'AUTH',
      'GitHub rejected the token. Refresh with `gh auth login` or set GITHUB_TOKEN.',
      error
    )
  }
  if (status === 404) {
    return new TimError('NOT_FOUND', `${action}: not found.`, error)
  }
  if (status === 403 && /rate limit/i.test(error?.message ?? '')) {
    return new TimError(
      'RATE_LIMIT',
      `${action}: GitHub rate limit hit.`,
      error
    )
  }
  if (status >= 400) {
    return new TimError(
      'NETWORK',
      `${action}: GitHub returned ${status}.`,
      error
    )
  }
  return new TimError(
    'UNKNOWN',
    `${action}: ${error?.message ?? 'unknown error'}.`,
    error
  )
}

const parseRepoFullName = (htmlUrl) => {
  const match = htmlUrl?.match(
    /github\.com\/([^/]+)\/([^/]+)\/(?:pull|issues)\//
  )
  return match ? { owner: match[1], repo: match[2] } : null
}

/**
 * Create a GitHub client. Token comes from the explicit `token` option,
 * falling back to GITHUB_TOKEN. Callers that need a `gh auth token`
 * fallback should do it before calling this factory.
 *
 * @param {object} [opts]
 * @param {string} [opts.token]
 * @param {string} [opts.org]
 * @returns {object} client with whoami / findPrsForTicket / getPr / getPrDiff
 *   / listWorkflowRuns / getRunLogs / getRunStatus methods
 * @throws {TimError} AUTH when no token is provided
 */
export const createGithubClient = ({
  token = process.env.GITHUB_TOKEN,
  org = DEFAULT_ORG
} = {}) => {
  if (!token) {
    throw new TimError(
      'AUTH',
      'Set GITHUB_TOKEN, or sign in with `gh auth login` and try again.'
    )
  }
  const octokit = new Octokit({ auth: token })

  const wrap = async (action, fn) => {
    try {
      return await fn()
    } catch (error) {
      throw mapError(error, action)
    }
  }

  return {
    whoami: () =>
      wrap('whoami', async () => {
        const { data } = await octokit.users.getAuthenticated()
        return { login: data.login, name: data.name }
      }),

    findPrsForTicket: (ticketId) =>
      wrap(`findPrsForTicket(${ticketId})`, async () => {
        const q = `${ticketId} is:pr org:${org}`
        const { data } = await octokit.search.issuesAndPullRequests({
          q,
          per_page: 100
        })
        return data.items.map((item) => {
          const repoInfo = parseRepoFullName(item.html_url)
          return {
            repo: repoInfo?.repo ?? null,
            number: item.number,
            title: item.title,
            url: item.html_url,
            state: item.state
          }
        })
      }),

    getPr: (repo, number) =>
      wrap(`getPr(${repo}, ${number})`, async () => {
        const { data } = await octokit.pulls.get({
          owner: org,
          repo,
          pull_number: number
        })
        return {
          repo,
          number: data.number,
          title: data.title,
          state: data.state,
          url: data.html_url,
          author: data.user?.login ?? null,
          body: data.body ?? ''
        }
      }),

    getPrDiff: (repo, number) =>
      wrap(`getPrDiff(${repo}, ${number})`, async () => {
        const { data } = await octokit.pulls.get({
          owner: org,
          repo,
          pull_number: number,
          mediaType: { format: 'diff' }
        })
        return typeof data === 'string' ? data : String(data ?? '')
      }),

    listWorkflowRuns: (repo, { branch, workflow, limit = 20 } = {}) =>
      wrap(`listWorkflowRuns(${repo})`, async () => {
        const params = {
          owner: org,
          repo,
          per_page: limit
        }
        if (branch) params.branch = branch
        const callee = workflow
          ? () =>
              octokit.actions.listWorkflowRuns({
                ...params,
                workflow_id: workflow
              })
          : () => octokit.actions.listWorkflowRunsForRepo(params)
        const { data } = await callee()
        return data.workflow_runs.map((r) => ({
          id: r.id,
          name: r.name,
          headBranch: r.head_branch,
          headSha: r.head_sha,
          status: r.status,
          conclusion: r.conclusion,
          url: r.html_url,
          createdAt: r.created_at
        }))
      }),

    getRunStatus: (repo, runId) =>
      wrap(`getRunStatus(${repo}, ${runId})`, async () => {
        const { data } = await octokit.actions.getWorkflowRun({
          owner: org,
          repo,
          run_id: runId
        })
        return {
          id: data.id,
          status: data.status,
          conclusion: data.conclusion,
          url: data.html_url
        }
      })
  }
}

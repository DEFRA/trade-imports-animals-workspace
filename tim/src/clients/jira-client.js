import { TimError } from '../errors.js'

const mapStatus = (status, action) => {
  if (status === 401 || status === 403) {
    return new TimError(
      'AUTH',
      `${action}: Jira rejected the credentials. Check JIRA_USER and JIRA_TOKEN.`
    )
  }
  if (status === 404) return new TimError('NOT_FOUND', `${action}: not found.`)
  if (status === 429) {
    return new TimError('RATE_LIMIT', `${action}: rate limited.`)
  }
  if (status >= 400) {
    return new TimError('NETWORK', `${action}: Jira returned ${status}.`)
  }
  return null
}

const authHeader = (user, token) =>
  `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`

/**
 * Create a Jira REST client. Reads JIRA_USER + JIRA_TOKEN + JIRA_BASE_URL
 * from env by default — matches the contract used by ../tools/jira/auth.sh.
 *
 * @param {object} [opts]
 * @param {string} [opts.user]
 * @param {string} [opts.token]
 * @param {string} [opts.baseUrl]
 * @returns {object} client with whoami / getTicket / getComments
 * @throws {TimError} AUTH when credentials are missing
 */
export const createJiraClient = ({
  user = process.env.JIRA_USER,
  token = process.env.JIRA_TOKEN,
  baseUrl = process.env.JIRA_BASE_URL
} = {}) => {
  if (!user || !token) {
    throw new TimError(
      'AUTH',
      'Set JIRA_USER and JIRA_TOKEN to authenticate with Jira.'
    )
  }
  if (!baseUrl) {
    throw new TimError(
      'USAGE',
      'Set JIRA_BASE_URL to point at the Atlassian instance.'
    )
  }
  const normalisedBase = baseUrl.replace(/\/+$/, '')

  const get = async (path, action) => {
    const url = `${normalisedBase}${path}`
    let response
    try {
      response = await fetch(url, {
        headers: {
          Authorization: authHeader(user, token),
          Accept: 'application/json'
        }
      })
    } catch (error) {
      throw new TimError('NETWORK', `${action}: ${error.message}`, error)
    }
    const mapped = mapStatus(response.status, action)
    if (mapped) throw mapped
    try {
      return await response.json()
    } catch (error) {
      throw new TimError('PARSE', `${action}: invalid JSON response.`, error)
    }
  }

  return {
    whoami: async () => {
      const data = await get('/rest/api/2/myself', 'whoami')
      return {
        user: data.name ?? data.accountId,
        displayName: data.displayName
      }
    },

    getTicket: async (id) => {
      const data = await get(
        `/rest/api/2/issue/${encodeURIComponent(id)}`,
        `getTicket(${id})`
      )
      return {
        id: data.key,
        summary: data.fields?.summary ?? '',
        status: data.fields?.status?.name ?? null,
        type: data.fields?.issuetype?.name ?? null,
        assignee: data.fields?.assignee?.displayName ?? null,
        priority: data.fields?.priority?.name ?? null,
        description: data.fields?.description ?? ''
      }
    },

    getComments: async (id) => {
      const data = await get(
        `/rest/api/2/issue/${encodeURIComponent(id)}/comment`,
        `getComments(${id})`
      )
      return (data.comments ?? []).map((c) => ({
        id: c.id,
        author: c.author?.displayName ?? null,
        createdAt: c.created,
        body: c.body
      }))
    }
  }
}

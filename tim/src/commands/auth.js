import { createGithubClient } from '../clients/github-client.js'
import { createJiraClient } from '../clients/jira-client.js'
import { createConfluenceClient } from '../clients/confluence-client.js'
import { run as runProcess } from '../exec/exec.js'
import { OK, ERROR, MISSING_DEP } from '../constants/exitCodes.js'
import { isTimError } from '../errors.js'

const SCHEMA_VERSION = 1

/**
 * Resolve a GitHub token: explicit env var first, otherwise fall back to
 * one `gh auth token` shell-out. Returns null if neither is available.
 */
export const resolveGithubToken = async (env = process.env) => {
  if (env.GITHUB_TOKEN) return env.GITHUB_TOKEN
  try {
    const result = await runProcess('gh', ['auth', 'token'])
    if (result.exitCode === 0 && result.stdout.trim())
      {return result.stdout.trim()}
    return null
  } catch (error) {
    if (error?.code === 'MISSING_DEP') return null
    throw error
  }
}

/**
 * Probe each external integration via its client's whoami(). Returns a
 * record per service with the authenticated user or a structured error.
 *
 * Factory overrides are for tests — production callers should rely on
 * the defaults.
 */
export const probeAll = async ({
  githubFactory,
  jiraFactory,
  confluenceFactory
} = {}) => {
  const defaultGithub = async () =>
    createGithubClient({ token: await resolveGithubToken() })

  const services = [
    { label: 'github', factory: githubFactory ?? defaultGithub },
    { label: 'jira', factory: jiraFactory ?? (() => createJiraClient()) },
    {
      label: 'confluence',
      factory: confluenceFactory ?? (() => createConfluenceClient())
    }
  ]

  return Promise.all(
    services.map(async ({ label, factory }) => {
      try {
        const client = await factory()
        const who = await client.whoami()
        return { service: label, ok: true, user: who }
      } catch (error) {
        return {
          service: label,
          ok: false,
          error: {
            code: error.code ?? 'UNKNOWN',
            message: error.message ?? String(error)
          }
        }
      }
    })
  )
}

const renderText = (results) =>
  results
    .map((r) =>
      r.ok
        ? `${r.service}: OK — ${r.user.displayName ?? r.user.name ?? r.user.login ?? r.user.user ?? '(unknown user)'}`
        : `${r.service}: FAILED — ${r.error.code}: ${r.error.message}`
    )
    .join('\n')

const renderJson = (results, timVersion) =>
  JSON.stringify({
    ok: results.every((r) => r.ok),
    schema_version: SCHEMA_VERSION,
    tim_version: timVersion,
    result: results.reduce((acc, r) => {
      acc[r.service] = r.ok
        ? { ok: true, user: r.user }
        : { ok: false, error: r.error }
      return acc
    }, {}),
    errors: results
      .filter((r) => !r.ok)
      .map((r) => ({
        code: r.error.code,
        message: `${r.service}: ${r.error.message}`
      })),
    metadata: { ranAt: new Date().toISOString() }
  })

const emit = (text) => process.stdout.write(`${text}\n`)
const emitError = (text) => process.stderr.write(`${text}\n`)

export const register = (program, { timVersion }) => {
  program
    .command('auth')
    .description(
      'Check authentication against GitHub, Jira, and Confluence using the same env vars as ../tools/auth.sh'
    )
    .action(async function authAction() {
      const globalOpts = this.optsWithGlobals()
      try {
        const results = await probeAll()
        if (globalOpts.json) emit(renderJson(results, timVersion))
        else emit(renderText(results))
        const allOk = results.every((r) => r.ok)
        process.exit(allOk ? OK : MISSING_DEP)
      } catch (error) {
        if (isTimError(error) && globalOpts.json) {
          emit(
            JSON.stringify({
              ok: false,
              schema_version: SCHEMA_VERSION,
              tim_version: timVersion,
              result: null,
              errors: [{ code: error.code, message: error.message }]
            })
          )
        } else {
          emitError(error.message ?? String(error))
        }
        process.exit(ERROR)
      }
    })
}

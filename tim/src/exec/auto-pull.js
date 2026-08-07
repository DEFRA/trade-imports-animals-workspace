import { run } from './exec.js'

const SYNC_BRANCH = 'main'
const PULL_TIMEOUT_MS = 10_000

const firstLine = (text = '') =>
  text.split('\n').find((line) => line.trim().length > 0) ?? ''

const gitOutput = async (workspaceRoot, args) => {
  const result = await run('git', ['-C', workspaceRoot, ...args])
  return result.exitCode === 0 ? result.stdout.trim() : null
}

const currentBranch = (workspaceRoot) =>
  gitOutput(workspaceRoot, ['branch', '--show-current'])

const headSha = (workspaceRoot) =>
  gitOutput(workspaceRoot, ['rev-parse', '--short', 'HEAD'])

/**
 * Fast-forward the workspace repo so anyone using tim picks up workspace
 * changes without thinking about it.
 *
 * Deliberately narrow. It only acts on `main`, because merging or rebasing
 * someone's feature branch under them is their call, not the CLI's. It uses
 * `--ff-only`, so it either advances cleanly or does nothing — it can never
 * leave a half-finished merge or a rebase mid-conflict. And it never fails
 * the command that triggered it: a broken network, a missing remote or a
 * diverged branch is reported and stepped over.
 *
 * tim's own modules are all imported before this runs, so a pull that
 * updates tim itself takes effect on the next invocation, not this one.
 *
 * @param {object} args
 * @param {string} args.workspaceRoot
 * @param {(message: string) => void} args.warn - Sink for user-facing notes (stderr; stdout stays reserved for command output)
 * @param {object} [args.env]
 * @returns {Promise<{action: 'disabled'|'skipped-branch'|'up-to-date'|'updated'|'failed', branch?: string, before?: string, after?: string, reason?: string}>}
 */
export const autoPullWorkspace = async ({
  workspaceRoot,
  warn,
  env = process.env
}) => {
  if (env.TIM_NO_AUTO_PULL) return { action: 'disabled' }

  const branch = await currentBranch(workspaceRoot)
  if (branch !== SYNC_BRANCH) return { action: 'skipped-branch', branch }

  const before = await headSha(workspaceRoot)

  let pull
  try {
    pull = await run(
      'git',
      ['-C', workspaceRoot, 'pull', '--ff-only', '--quiet'],
      { timeout: PULL_TIMEOUT_MS }
    )
  } catch (error) {
    const reason = error.message ?? String(error)
    warn(`Could not update the workspace: ${firstLine(reason)}`)
    return { action: 'failed', reason }
  }

  if (pull.exitCode !== 0) {
    const reason = firstLine(pull.stderr) || `git pull exited ${pull.exitCode}`
    warn(`Could not update the workspace: ${reason}`)
    return { action: 'failed', reason }
  }

  const after = await headSha(workspaceRoot)
  if (after === before) return { action: 'up-to-date', before, after }

  warn(`Workspace updated: ${before} → ${after}`)
  return { action: 'updated', before, after }
}

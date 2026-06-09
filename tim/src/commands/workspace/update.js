import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { REPOS, repoPath } from '../../constants/repos.js'
import { run } from '../../exec/exec.js'
import { runAcross } from '../../exec/parallel.js'
import { lastLines, makeTaskAction } from './_task-output.js'

const updateTask = (workspaceRoot, repo) => {
  const dir = repoPath(workspaceRoot, repo)
  const cloned = existsSync(join(dir, '.git'))
  const label = cloned
    ? `${repo} — git pull --rebase`
    : `${repo} — (not cloned, skipping)`
  const task = { id: repo, repo, label }
  task.run = async () => {
    if (!cloned) {
      return {
        repo,
        label,
        exitCode: 0,
        action: 'skipped',
        stderrTail: null
      }
    }
    const result = await run('git', ['-C', dir, 'pull', '--rebase'])
    return {
      repo,
      label,
      exitCode: result.exitCode,
      action: result.exitCode === 0 ? 'pulled' : 'failed',
      stderrTail: lastLines(result.stderr)
    }
  }
  return task
}

export const buildUpdateTasks = (workspaceRoot) =>
  REPOS.map((repo) => updateTask(workspaceRoot, repo))

export const updateAll = (workspaceRoot) =>
  runAcross(buildUpdateTasks(workspaceRoot), (task) => task.run())

export const register = (parent, { timVersion }) => {
  parent
    .command('update')
    .description('Run `git pull --rebase` in every cloned repo')
    .action(makeTaskAction({ runTasks: updateAll, timVersion }))
}

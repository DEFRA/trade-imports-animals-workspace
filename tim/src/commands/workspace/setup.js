import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { REPOS, repoPath, repoUrl, REPOS_DIR } from '../../constants/repos.js'
import { run } from '../../exec/exec.js'
import { runAcross } from '../../exec/parallel.js'
import { lastLines, makeTaskAction } from './_task-output.js'

const cloneTask = (workspaceRoot, repo) => {
  const dir = repoPath(workspaceRoot, repo)
  const alreadyCloned = existsSync(join(dir, '.git'))
  const label = alreadyCloned
    ? `${repo} — already cloned`
    : `${repo} — git clone`
  const task = { id: repo, repo, label }
  task.run = async () => {
    if (alreadyCloned) {
      return {
        repo,
        label,
        exitCode: 0,
        action: 'exists',
        stderrTail: null
      }
    }
    mkdirSync(join(workspaceRoot, REPOS_DIR), { recursive: true })
    const result = await run('git', ['clone', repoUrl(repo), dir])
    return {
      repo,
      label,
      exitCode: result.exitCode,
      action: result.exitCode === 0 ? 'cloned' : 'failed',
      stderrTail: lastLines(result.stderr)
    }
  }
  return task
}

export const buildSetupTasks = (workspaceRoot) =>
  REPOS.map((repo) => cloneTask(workspaceRoot, repo))

export const setupAll = (workspaceRoot) =>
  runAcross(buildSetupTasks(workspaceRoot), (task) => task.run())

export const register = (parent, { timVersion }) => {
  parent
    .command('setup')
    .description('Clone any missing repos from github.com/DEFRA into repos/')
    .action(makeTaskAction({ runTasks: setupAll, timVersion }))
}

import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { REPOS, repoPath, repoUrl, REPOS_DIR } from '../../constants/repos.js'
import { run } from '../../exec/exec.js'
import { runAcross } from '../../exec/parallel.js'
import { lastLines, makeTaskAction } from './_task-output.js'

const cloneIfMissing = async (workspaceRoot, repo) => {
  const dir = repoPath(workspaceRoot, repo)
  if (existsSync(join(dir, '.git'))) {
    return {
      repo,
      label: `${repo} — already cloned`,
      exitCode: 0,
      action: 'exists',
      stderrTail: null
    }
  }
  mkdirSync(join(workspaceRoot, REPOS_DIR), { recursive: true })
  const result = await run('git', ['clone', repoUrl(repo), dir])
  return {
    repo,
    label: `${repo} — git clone`,
    exitCode: result.exitCode,
    action: result.exitCode === 0 ? 'cloned' : 'failed',
    stderrTail: lastLines(result.stderr)
  }
}

export const setupAll = (workspaceRoot) =>
  runAcross(REPOS, (repo) => cloneIfMissing(workspaceRoot, repo))

export const register = (parent, { timVersion }) => {
  parent
    .command('setup')
    .description('Clone any missing repos from github.com/DEFRA into repos/')
    .action(makeTaskAction({ runTasks: setupAll, timVersion }))
}

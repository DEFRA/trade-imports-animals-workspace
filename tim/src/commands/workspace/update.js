import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { REPOS, repoPath } from '../../constants/repos.js'
import { run } from '../../exec/exec.js'
import { runAcross } from '../../exec/parallel.js'
import { lastLines, makeTaskAction } from './_task-output.js'

const updateRepo = async (workspaceRoot, repo) => {
  const dir = repoPath(workspaceRoot, repo)
  if (!existsSync(join(dir, '.git'))) {
    return {
      repo,
      label: `${repo} — (not cloned, skipping)`,
      exitCode: 0,
      action: 'skipped',
      stderrTail: null
    }
  }
  const result = await run('git', ['-C', dir, 'pull', '--rebase'])
  return {
    repo,
    label: `${repo} — git pull --rebase`,
    exitCode: result.exitCode,
    action: result.exitCode === 0 ? 'pulled' : 'failed',
    stderrTail: lastLines(result.stderr)
  }
}

export const updateAll = (workspaceRoot) =>
  runAcross(REPOS, (repo) => updateRepo(workspaceRoot, repo))

export const register = (parent, { timVersion }) => {
  parent
    .command('update')
    .description('Run `git pull --rebase` in every cloned repo')
    .action(makeTaskAction({ runTasks: updateAll, timVersion }))
}

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NODE_REPOS, repoPath } from '../../constants/repos.js'
import { run } from '../../exec/exec.js'
import { runAcross } from '../../exec/parallel.js'
import { lastLines, makeTaskAction } from './_task-output.js'

const hasLintScript = (dir) => {
  const pkgPath = join(dir, 'package.json')
  if (!existsSync(pkgPath)) return false
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    return Boolean(pkg.scripts?.lint)
  } catch {
    return false
  }
}

const buildTasks = (workspaceRoot) => {
  const tasks = []
  for (const repo of NODE_REPOS) {
    const dir = repoPath(workspaceRoot, repo)
    if (!hasLintScript(dir)) continue
    tasks.push({
      repo,
      label: `${repo} — npm run lint`,
      run: () => run('npm', ['--prefix', dir, 'run', 'lint'])
    })
  }
  return tasks
}

export const lintAll = async (workspaceRoot) => {
  const tasks = buildTasks(workspaceRoot)
  return runAcross(tasks, async (task) => {
    const result = await task.run()
    return {
      repo: task.repo,
      label: task.label,
      exitCode: result.exitCode,
      stderrTail: lastLines(result.stderr || result.stdout)
    }
  })
}

export const register = (parent, { timVersion }) => {
  parent
    .command('lint')
    .description('Run lint in every Node.js repo that has a lint script')
    .action(makeTaskAction({ runTasks: lintAll, timVersion }))
}

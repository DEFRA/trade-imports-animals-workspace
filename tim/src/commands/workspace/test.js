import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NODE_REPOS, JAVA_REPOS, repoPath } from '../../constants/repos.js'
import { run } from '../../exec/exec.js'
import { runSerial } from '../../exec/parallel.js'
import { lastLines, makeTaskAction } from './_task-output.js'

const hasTestScript = (dir) => {
  const pkgPath = join(dir, 'package.json')
  if (!existsSync(pkgPath)) return false
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    return Boolean(pkg.scripts?.test)
  } catch {
    return false
  }
}

const buildTasks = (workspaceRoot) => {
  const tasks = []
  for (const repo of NODE_REPOS) {
    const dir = repoPath(workspaceRoot, repo)
    if (!hasTestScript(dir)) continue
    tasks.push({
      repo,
      label: `${repo} — npm test`,
      run: () => run('npm', ['--prefix', dir, 'test'])
    })
  }
  for (const repo of JAVA_REPOS) {
    const dir = repoPath(workspaceRoot, repo)
    const pom = join(dir, 'pom.xml')
    if (!existsSync(pom)) continue
    tasks.push({
      repo,
      label: `${repo} — mvn verify`,
      run: () => run('mvn', ['-f', pom, 'verify'])
    })
  }
  return tasks
}

export const testAll = async (workspaceRoot) => {
  const tasks = buildTasks(workspaceRoot)
  return runSerial(tasks, async (task) => {
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
    .command('test')
    .description(
      'Run tests in every repo that has them (npm test for Node, mvn verify for Java) — serial'
    )
    .action(makeTaskAction({ runTasks: testAll, timVersion }))
}

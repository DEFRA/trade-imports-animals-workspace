import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { NODE_REPOS, JAVA_REPOS, repoPath } from '../../constants/repos.js'
import { run } from '../../exec/exec.js'
import { runAcross } from '../../exec/parallel.js'
import { lastLines, makeTaskAction } from './_task-output.js'

const buildTasks = (
  workspaceRoot,
  { nodeOnly = false, javaOnly = false } = {}
) => {
  const tasks = []
  if (!javaOnly) {
    for (const repo of NODE_REPOS) {
      const dir = repoPath(workspaceRoot, repo)
      if (!existsSync(dir)) continue
      tasks.push({
        repo,
        label: `${repo} — npm ci`,
        run: () => run('npm', ['--prefix', dir, 'ci'])
      })
    }
  }
  if (!nodeOnly) {
    for (const repo of JAVA_REPOS) {
      const dir = repoPath(workspaceRoot, repo)
      if (!existsSync(join(dir, 'pom.xml'))) continue
      tasks.push({
        repo,
        label: `${repo} — mvn install -DskipTests`,
        run: () =>
          run('mvn', ['-f', join(dir, 'pom.xml'), 'install', '-DskipTests'])
      })
    }
  }
  return tasks
}

export const installAll = async (workspaceRoot, opts = {}) => {
  const tasks = buildTasks(workspaceRoot, opts)
  return runAcross(tasks, async (task) => {
    const result = await task.run()
    return {
      repo: task.repo,
      label: task.label,
      exitCode: result.exitCode,
      stderrTail: lastLines(result.stderr)
    }
  })
}

export const register = (parent, { timVersion }) => {
  parent
    .command('install')
    .description(
      'Install dependencies in every repo (npm ci; mvn install -DskipTests)'
    )
    .option('--node-only', 'Skip Java repos')
    .option('--java-only', 'Skip Node.js repos')
    .action(makeTaskAction({ runTasks: installAll, timVersion }))
}

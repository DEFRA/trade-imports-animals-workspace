import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { NODE_REPOS, JAVA_REPOS, repoPath } from '../../constants/repos.js'
import { run } from '../../exec/exec.js'
import { runAcross } from '../../exec/parallel.js'
import { makeTaskAction, toResultRecord } from './_task-output.js'

export const buildInstallTasks = (
  workspaceRoot,
  { nodeOnly = false, javaOnly = false } = {}
) => {
  const tasks = []
  if (!javaOnly) {
    for (const repo of NODE_REPOS) {
      const dir = repoPath(workspaceRoot, repo)
      if (!existsSync(dir)) continue
      const task = { id: repo, repo, label: `${repo} — npm ci` }
      task.run = async () =>
        toResultRecord(task, await run('npm', ['--prefix', dir, 'ci']))
      tasks.push(task)
    }
  }
  if (!nodeOnly) {
    for (const repo of JAVA_REPOS) {
      const dir = repoPath(workspaceRoot, repo)
      if (!existsSync(join(dir, 'pom.xml'))) continue
      const task = {
        id: repo,
        repo,
        label: `${repo} — mvn install -DskipTests`
      }
      task.run = async () =>
        toResultRecord(
          task,
          await run('mvn', [
            '-f',
            join(dir, 'pom.xml'),
            'install',
            '-DskipTests'
          ])
        )
      tasks.push(task)
    }
  }
  return tasks
}

export const installAll = (workspaceRoot, opts = {}) =>
  runAcross(buildInstallTasks(workspaceRoot, opts), (task) => task.run())

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

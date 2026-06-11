import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { REPOS, repoPath } from '../../constants/repos.js'
import { run } from '../../exec/exec.js'
import {
  assertGitSupportsNegativeRefspecs,
  excludeGhPagesFromFetch,
  needsGhPagesExclusion,
  pruneGhPagesObjects
} from '../../exec/git-exclude-gh-pages.js'
import { runAcross } from '../../exec/parallel.js'
import { lastLines, makeTaskAction } from './_task-output.js'

const failure = (repo, label, execResult, action) => ({
  repo,
  label,
  exitCode: execResult.exitCode,
  action,
  stderrTail: lastLines(execResult.stderr)
})

// One-off migration for clones born before the exclusion refspec: pin
// the config, refetch, then gc to drop the already-fetched gh-pages
// packs. Returns null when healthy so the caller can fall through to
// the pull.
const healIfNeeded = async (repo, dir) => {
  if (!(await needsGhPagesExclusion(dir))) return null
  const exclude = await excludeGhPagesFromFetch(dir)
  if (exclude.exitCode !== 0) {
    return failure(
      repo,
      `${repo} — exclude gh-pages`,
      exclude,
      'exclude-failed'
    )
  }
  const fetch = await run('git', ['-C', dir, 'fetch', '--quiet', 'origin'])
  if (fetch.exitCode !== 0) {
    return failure(repo, `${repo} — git fetch`, fetch, 'fetch-failed')
  }
  const prune = await pruneGhPagesObjects(dir)
  if (prune.exitCode !== 0) {
    return failure(repo, `${repo} — git gc`, prune, 'gc-failed')
  }
  return { healed: true }
}

const updateTask = (workspaceRoot, repo) => {
  const dir = repoPath(workspaceRoot, repo)
  const cloned = existsSync(join(dir, '.git'))
  const label = cloned
    ? `${repo} — git pull --rebase`
    : `${repo} — (not cloned, skipping)`
  const task = { id: repo, repo, label }
  task.needsNegativeRefspecs = async () =>
    cloned ? needsGhPagesExclusion(dir) : false
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
    const heal = await healIfNeeded(repo, dir)
    if (heal && !heal.healed) return heal
    const result = await run('git', ['-C', dir, 'pull', '--rebase'])
    return {
      repo,
      label: heal?.healed
        ? `${repo} — gh-pages excluded (one-off heal) + git pull --rebase`
        : label,
      exitCode: result.exitCode,
      action: result.exitCode === 0 ? 'pulled' : 'failed',
      stderrTail: lastLines(result.stderr)
    }
  }
  return task
}

export const buildUpdateTasks = (workspaceRoot) =>
  REPOS.map((repo) => updateTask(workspaceRoot, repo))

export const updateAll = async (workspaceRoot) => {
  const tasks = buildUpdateTasks(workspaceRoot)
  const needs = await Promise.all(
    tasks.map((task) => task.needsNegativeRefspecs())
  )
  if (needs.some(Boolean)) await assertGitSupportsNegativeRefspecs()
  return runAcross(tasks, (task) => task.run())
}

export const register = (parent, { timVersion }) => {
  parent
    .command('update')
    .description(
      'Run `git pull --rebase` in every cloned repo. Clones still fetching gh-pages get the exclusion applied once first.'
    )
    .action(makeTaskAction({ runTasks: updateAll, timVersion }))
}

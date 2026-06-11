import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { REPOS, repoPath, repoUrl, REPOS_DIR } from '../../constants/repos.js'
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
// packs. gc only removes unreachable objects — local branches and
// stashes survive.
const healTask = async (repo, dir) => {
  const exclude = await excludeGhPagesFromFetch(dir)
  if (exclude.exitCode !== 0) {
    return failure(repo, `${repo} — exclude gh-pages`, exclude, 'exclude-failed')
  }
  const fetch = await run('git', ['-C', dir, 'fetch', '--quiet', 'origin'])
  if (fetch.exitCode !== 0) {
    return failure(repo, `${repo} — git fetch`, fetch, 'fetch-failed')
  }
  const prune = await pruneGhPagesObjects(dir)
  if (prune.exitCode !== 0) {
    return failure(repo, `${repo} — git gc`, prune, 'gc-failed')
  }
  return {
    repo,
    label: `${repo} — gh-pages excluded (one-off heal)`,
    exitCode: 0,
    action: 'healed',
    stderrTail: null
  }
}

// git has no "all branches except X" clone flag, so bootstrap is
// clone-narrow then widen behind the exclusion refspec.
const cloneLight = async (repo, label, dir) => {
  const clone = await run('git', [
    'clone',
    '--single-branch',
    repoUrl(repo),
    dir
  ])
  if (clone.exitCode !== 0) {
    return failure(repo, label, clone, 'failed')
  }
  const exclude = await excludeGhPagesFromFetch(dir)
  if (exclude.exitCode !== 0) {
    return failure(repo, `${repo} — exclude gh-pages`, exclude, 'exclude-failed')
  }
  const widen = await run('git', ['-C', dir, 'fetch', '--quiet', 'origin'])
  if (widen.exitCode !== 0) {
    return failure(repo, `${repo} — git fetch`, widen, 'fetch-failed')
  }
  return {
    repo,
    label,
    exitCode: 0,
    action: 'cloned',
    stderrTail: lastLines(clone.stderr)
  }
}

const cloneTask = (workspaceRoot, repo) => {
  const dir = repoPath(workspaceRoot, repo)
  const alreadyCloned = existsSync(join(dir, '.git'))
  const label = alreadyCloned
    ? `${repo} — already cloned`
    : `${repo} — git clone (excluding gh-pages)`
  const task = { id: repo, repo, label }
  task.needsNegativeRefspecs = async () =>
    alreadyCloned ? needsGhPagesExclusion(dir) : true
  task.run = async () => {
    if (alreadyCloned) {
      if (await needsGhPagesExclusion(dir)) return healTask(repo, dir)
      return {
        repo,
        label,
        exitCode: 0,
        action: 'exists',
        stderrTail: null
      }
    }
    mkdirSync(join(workspaceRoot, REPOS_DIR), { recursive: true })
    return cloneLight(repo, label, dir)
  }
  return task
}

export const buildSetupTasks = (workspaceRoot) =>
  REPOS.map((repo) => cloneTask(workspaceRoot, repo))

export const setupAll = async (workspaceRoot) => {
  const tasks = buildSetupTasks(workspaceRoot)
  const needs = await Promise.all(
    tasks.map((task) => task.needsNegativeRefspecs())
  )
  if (needs.some(Boolean)) await assertGitSupportsNegativeRefspecs()
  return runAcross(tasks, (task) => task.run())
}

export const register = (parent, { timVersion }) => {
  parent
    .command('setup')
    .description(
      'Clone any missing repos from github.com/DEFRA into repos/. Clones exclude the gh-pages branch; existing clones get the exclusion applied once.'
    )
    .action(makeTaskAction({ runTasks: setupAll, timVersion }))
}

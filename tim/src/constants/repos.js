import { join } from 'node:path'
import { existsSync, realpathSync } from 'node:fs'

export const REPOS_DIR = 'repos'

export const NODE_REPOS = Object.freeze([
  'trade-imports-animals-frontend',
  'trade-imports-animals-admin',
  'trade-imports-animals-tests',
  'trade-imports-defra-id-stub',
  'trade-imports-ins-frontend'
])

export const JAVA_REPOS = Object.freeze([
  'trade-imports-animals-backend',
  'trade-imports-stub',
  'trade-imports-reference-data',
  'trade-imports-dynamics-gateway',
  'trade-imports-address-book'
])

export const REPOS = Object.freeze([...NODE_REPOS, ...JAVA_REPOS])

// trade-imports-defra-id-stub's unit tests need the env its
// docker:test compose harness provides (ENTRA_*, S3) — its own CI only
// runs `npm run docker:test`, so plain `npm test` is red by design and
// the workspace test loop must skip it.
export const UNIT_TEST_EXEMPT_REPOS = Object.freeze([
  'trade-imports-defra-id-stub'
])

export const repoPath = (workspaceRoot, repoName) =>
  join(workspaceRoot, REPOS_DIR, repoName)

/**
 * Repo path with every symlink resolved. `npm --prefix` walks up from the
 * path it is given, so a path through a symlink lands npm on the wrong
 * package root and it rejects the lockfile. The workspace is mandated to
 * live behind a symlink, so npm invocations must use this, not `repoPath`.
 * Falls back to the plain path when the repo is not cloned yet.
 */
export const realRepoPath = (workspaceRoot, repoName) => {
  const path = repoPath(workspaceRoot, repoName)
  return existsSync(path) ? realpathSync(path) : path
}

export const isNodeRepo = (repoName) => NODE_REPOS.includes(repoName)

export const isJavaRepo = (repoName) => JAVA_REPOS.includes(repoName)

export const GITHUB_ORG = 'DEFRA'

/**
 * Clone URL for a repo. `TIM_GITHUB_BASE_URL` overrides the GitHub
 * prefix so tests can clone from local bare fixtures; read at call
 * time so spawned-CLI tests only need to set the env var.
 */
export const repoUrl = (repoName) =>
  `${process.env.TIM_GITHUB_BASE_URL ?? `https://github.com/${GITHUB_ORG}`}/${repoName}.git`

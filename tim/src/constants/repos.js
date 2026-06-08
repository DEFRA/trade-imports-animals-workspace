import { join } from 'node:path'

export const REPOS_DIR = 'repos'

export const NODE_REPOS = Object.freeze([
  'trade-imports-animals-frontend',
  'trade-imports-animals-admin',
  'trade-imports-animals-tests'
])

export const JAVA_REPOS = Object.freeze([
  'trade-imports-animals-backend',
  'trade-imports-stub',
  'trade-imports-reference-data'
])

export const REPOS = Object.freeze([...NODE_REPOS, ...JAVA_REPOS])

export const repoPath = (workspaceRoot, repoName) =>
  join(workspaceRoot, REPOS_DIR, repoName)

export const isNodeRepo = (repoName) => NODE_REPOS.includes(repoName)

export const isJavaRepo = (repoName) => JAVA_REPOS.includes(repoName)

import { describe, test, expect } from 'vitest'
import {
  REPOS,
  NODE_REPOS,
  JAVA_REPOS,
  REPOS_DIR,
  repoPath,
  isNodeRepo,
  isJavaRepo,
  GITHUB_ORG,
  repoUrl
} from './repos.js'

describe('repo constants', () => {
  test('REPOS_DIR is "repos"', () => {
    expect(REPOS_DIR).toBe('repos')
  })

  test('NODE_REPOS lists the three Node.js repos', () => {
    expect([...NODE_REPOS].sort()).toEqual([
      'trade-imports-animals-admin',
      'trade-imports-animals-frontend',
      'trade-imports-animals-tests'
    ])
  })

  test('JAVA_REPOS lists the three Java repos', () => {
    expect([...JAVA_REPOS].sort()).toEqual([
      'trade-imports-animals-backend',
      'trade-imports-reference-data',
      'trade-imports-stub'
    ])
  })

  test('REPOS is the union of NODE_REPOS and JAVA_REPOS', () => {
    expect([...REPOS].sort()).toEqual([...NODE_REPOS, ...JAVA_REPOS].sort())
  })

  test('NODE_REPOS and JAVA_REPOS do not overlap', () => {
    const overlap = NODE_REPOS.filter((repo) => JAVA_REPOS.includes(repo))
    expect(overlap).toEqual([])
  })

  test('repoPath joins workspaceRoot, repos/, and the repo name', () => {
    expect(repoPath('/ws', 'trade-imports-animals-frontend')).toBe(
      '/ws/repos/trade-imports-animals-frontend'
    )
  })

  test('isNodeRepo identifies Node repos and rejects Java repos', () => {
    expect(isNodeRepo('trade-imports-animals-frontend')).toBe(true)
    expect(isNodeRepo('trade-imports-animals-backend')).toBe(false)
    expect(isNodeRepo('unknown')).toBe(false)
  })

  test('isJavaRepo identifies Java repos and rejects Node repos', () => {
    expect(isJavaRepo('trade-imports-animals-backend')).toBe(true)
    expect(isJavaRepo('trade-imports-animals-frontend')).toBe(false)
    expect(isJavaRepo('unknown')).toBe(false)
  })

  test('NODE_REPOS, JAVA_REPOS, REPOS are immutable', () => {
    expect(() => NODE_REPOS.push('x')).toThrow()
    expect(() => JAVA_REPOS.push('x')).toThrow()
    expect(() => REPOS.push('x')).toThrow()
  })

  test('GITHUB_ORG is DEFRA — matches scripts/setup.sh', () => {
    expect(GITHUB_ORG).toBe('DEFRA')
  })

  test('repoUrl builds the canonical HTTPS clone URL', () => {
    expect(repoUrl('trade-imports-animals-frontend')).toBe(
      'https://github.com/DEFRA/trade-imports-animals-frontend.git'
    )
  })
})

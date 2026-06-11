import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { execa } from 'execa'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  ALL_HEADS_REFSPEC,
  EXCLUDE_GH_PAGES_REFSPEC,
  parseGitVersion,
  supportsNegativeRefspecs,
  assertGitSupportsNegativeRefspecs,
  needsGhPagesExclusion,
  excludeGhPagesFromFetch,
  pruneGhPagesObjects
} from './git-exclude-gh-pages.js'
import { createBareRepo, createFatClone } from '../test-support/git-fixtures.js'

let baseDir

beforeEach(() => {
  baseDir = mkdtempSync(join(tmpdir(), 'tim-git-exclude-'))
})

afterEach(() => {
  rmSync(baseDir, { recursive: true, force: true })
})

const fetchRefspecs = async (dir) => {
  const { stdout } = await execa('git', [
    '-C',
    dir,
    'config',
    '--get-all',
    'remote.origin.fetch'
  ])
  return stdout.split('\n')
}

const initRepoWithOrigin = async () => {
  const dir = join(baseDir, 'repo')
  await execa('git', ['init', '--quiet', dir])
  await execa('git', [
    '-C',
    dir,
    'remote',
    'add',
    'origin',
    'https://example.invalid/repo.git'
  ])
  return dir
}

describe('#parseGitVersion', () => {
  test('parses the Apple git version string', () => {
    expect(parseGitVersion('git version 2.50.1 (Apple Git-155)')).toEqual({
      major: 2,
      minor: 50
    })
  })

  test('parses the plain Linux git version string', () => {
    expect(parseGitVersion('git version 2.39.5')).toEqual({
      major: 2,
      minor: 39
    })
  })

  test('returns null for unrecognisable output', () => {
    expect(parseGitVersion('not git at all')).toBeNull()
    expect(parseGitVersion('')).toBeNull()
    expect(parseGitVersion(undefined)).toBeNull()
  })
})

describe('#supportsNegativeRefspecs', () => {
  test('accepts 2.29 and later, rejects older', () => {
    expect(supportsNegativeRefspecs({ major: 2, minor: 28 })).toBe(false)
    expect(supportsNegativeRefspecs({ major: 2, minor: 29 })).toBe(true)
    expect(supportsNegativeRefspecs({ major: 2, minor: 50 })).toBe(true)
    expect(supportsNegativeRefspecs({ major: 3, minor: 0 })).toBe(true)
  })
})

describe('#assertGitSupportsNegativeRefspecs', () => {
  test('resolves against the system git', async () => {
    await expect(assertGitSupportsNegativeRefspecs()).resolves.toBeUndefined()
  })
})

describe('#excludeGhPagesFromFetch', () => {
  test('pins the fetch refspec to exactly two lines, idempotently', async () => {
    const dir = await initRepoWithOrigin()

    await excludeGhPagesFromFetch(dir)
    expect(await fetchRefspecs(dir)).toEqual([
      ALL_HEADS_REFSPEC,
      EXCLUDE_GH_PAGES_REFSPEC
    ])

    await excludeGhPagesFromFetch(dir)
    expect(await fetchRefspecs(dir)).toEqual([
      ALL_HEADS_REFSPEC,
      EXCLUDE_GH_PAGES_REFSPEC
    ])
  })
})

describe('#needsGhPagesExclusion', () => {
  test('is true for a default-refspec clone, false once excluded', async () => {
    const dir = await initRepoWithOrigin()

    expect(await needsGhPagesExclusion(dir)).toBe(true)

    await excludeGhPagesFromFetch(dir)
    expect(await needsGhPagesExclusion(dir)).toBe(false)
  })

  test('is false when there is no fetch config to read', async () => {
    expect(await needsGhPagesExclusion(join(baseDir, 'missing'))).toBe(false)
  })
})

describe('#pruneGhPagesObjects', () => {
  test('drops unreachable gh-pages objects but keeps local work', async () => {
    const { barePath, shas } = await createBareRepo(baseDir, 'fixture')
    const dir = join(baseDir, 'fat-clone')
    await createFatClone(barePath, dir)
    await execa('git', ['-C', dir, 'branch', 'local-work', shas.feature])

    await excludeGhPagesFromFetch(dir)
    await execa('git', ['-C', dir, 'fetch', '--quiet', 'origin'])
    const result = await pruneGhPagesObjects(dir)

    expect(result.exitCode).toBe(0)
    const ghPagesObject = await execa(
      'git',
      ['-C', dir, 'cat-file', '-e', shas.ghPages],
      { reject: false }
    )
    expect(ghPagesObject.exitCode).not.toBe(0)
    const localObject = await execa('git', [
      '-C',
      dir,
      'cat-file',
      '-e',
      shas.feature
    ])
    expect(localObject.exitCode).toBe(0)
  }, 60_000)
})

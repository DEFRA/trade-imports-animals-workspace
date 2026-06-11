import { existsSync, statSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { TimError } from '../errors.js'

const MARKER_FILES = ['Makefile', '.git', 'docs/best-practices']

const looksLikeWorkspaceRoot = (path) =>
  MARKER_FILES.some((marker) => existsSync(join(path, marker))) &&
  existsSync(join(path, 'repos'))

const walkUp = (start) => {
  let current = resolve(start)
  while (true) {
    if (looksLikeWorkspaceRoot(current)) return current
    const parent = dirname(current)
    if (parent === current) return null
    current = parent
  }
}

const isDirectory = (path) => {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

/**
 * Resolves the workspace root with precedence: explicit option, TIM_WORKSPACE
 * env var, then walking up from cwd looking for the workspace marker files.
 *
 * @param {object} [opts]
 * @param {string} [opts.explicit] - Explicit path passed via --workspace
 * @param {string} [opts.env] - Value of TIM_WORKSPACE env var
 * @param {string} [opts.cwd] - Working directory to walk up from
 * @returns {string} Absolute path to the workspace root
 * @throws {TimError} When no valid workspace root is found
 */
export const resolveWorkspaceRoot = ({
  explicit,
  env = process.env.TIM_WORKSPACE,
  cwd = process.cwd()
} = {}) => {
  const candidate = explicit ?? env
  if (candidate) {
    const resolved = resolve(candidate)
    if (!isDirectory(resolved)) {
      throw new TimError(
        'USAGE',
        `Workspace path ${resolved} is not a directory.`
      )
    }
    if (!looksLikeWorkspaceRoot(resolved)) {
      throw new TimError(
        'USAGE',
        `Workspace path ${resolved} does not look like a trade-imports-animals workspace (missing Makefile, .git or repos/).`
      )
    }
    return resolved
  }
  const found = walkUp(cwd)
  if (!found) {
    throw new TimError(
      'USAGE',
      'Cannot find the workspace root. Run from inside the trade-imports-animals checkout, or set TIM_WORKSPACE.'
    )
  }
  return found
}

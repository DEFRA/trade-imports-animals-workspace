import { resolveWorkspaceRoot } from '../../env/workspace-root.js'
import { OK, USAGE, ERROR, PARTIAL_FAILURE } from '../../constants/exitCodes.js'
import { isTimError } from '../../errors.js'

const SCHEMA_VERSION = 1
const STDERR_TAIL_LINES = 30

export const lastLines = (text = '', n = STDERR_TAIL_LINES) =>
  text.split('\n').slice(-n).join('\n')

/**
 * Convert a raw exec result into the per-task result record used by every
 * workspace verb. `stderrSource` picks which exec stream the tail comes from
 * (some verbs surface stdout because the tool writes errors there).
 *
 * @param {{repo: string, label: string}} task
 * @param {{exitCode: number, stderr?: string, stdout?: string}} execResult
 * @param {{stderrSource?: 'stderr'|'stderr-or-stdout'}} [options]
 * @returns {{repo: string, label: string, exitCode: number, stderrTail: string}}
 */
export const toResultRecord = (task, execResult, { stderrSource } = {}) => {
  const raw =
    stderrSource === 'stderr-or-stdout'
      ? (execResult.stderr ?? '') || (execResult.stdout ?? '')
      : (execResult.stderr ?? '')
  return {
    repo: task.repo,
    label: task.label,
    exitCode: execResult.exitCode,
    stderrTail: lastLines(raw)
  }
}

export const renderTaskText = (results) =>
  results
    .map((r) => {
      const label = r.label ?? r.item?.label ?? r.repo ?? r.item?.repo ?? '?'
      if (r.ok) return `  ${label} — done (${r.durationMs}ms)`
      const tail = r.stderrTail
        ? `\n    ${r.stderrTail.replace(/\n/g, '\n    ')}`
        : ''
      const exitInfo = r.exitCode != null ? `exit ${r.exitCode}, ` : ''
      return `  ${label} — FAILED (${exitInfo}${r.durationMs}ms)${tail}`
    })
    .join('\n')

export const renderTaskJson = (results, timVersion) =>
  JSON.stringify({
    ok: results.every((r) => r.ok),
    schema_version: SCHEMA_VERSION,
    tim_version: timVersion,
    result: results.map((r) => ({
      repo: r.repo ?? r.item?.repo ?? null,
      label: r.label ?? r.item?.label ?? null,
      exitCode: r.exitCode ?? null,
      durationMs: r.durationMs,
      ok: r.ok,
      stderrTail: r.stderrTail ?? null,
      error: r.error ?? null
    })),
    errors: [],
    metadata: { ranAt: new Date().toISOString() }
  })

const emit = (text) => process.stdout.write(`${text}\n`)
const emitError = (text) => process.stderr.write(`${text}\n`)

/**
 * Wrap a "run all tasks across repos" function in the standard CLI action
 * shape — workspace resolution, JSON envelope, partial-failure exit code.
 *
 * @param {object} args
 * @param {(workspaceRoot: string, actionOpts: object) => Promise<Array>} args.runTasks
 * @param {string} args.timVersion
 * @returns {Function} commander action handler (call with `this` bound to the command)
 */
export const makeTaskAction = ({ runTasks, timVersion }) =>
  async function (actionOpts) {
    const globalOpts = this.optsWithGlobals()
    try {
      const workspaceRoot = resolveWorkspaceRoot({
        explicit: globalOpts.workspace
      })
      const results = await runTasks(workspaceRoot, actionOpts ?? {})
      if (globalOpts.json) emit(renderTaskJson(results, timVersion))
      else emit(renderTaskText(results))
      const someFailed = results.some((r) => !r.ok)
      process.exit(someFailed ? PARTIAL_FAILURE : OK)
    } catch (error) {
      if (isTimError(error) && globalOpts.json) {
        emit(
          JSON.stringify({
            ok: false,
            schema_version: SCHEMA_VERSION,
            tim_version: timVersion,
            result: null,
            errors: [{ code: error.code, message: error.message }]
          })
        )
      } else {
        emitError(error.message ?? String(error))
      }
      process.exit(isTimError(error) && error.code === 'USAGE' ? USAGE : ERROR)
    }
  }

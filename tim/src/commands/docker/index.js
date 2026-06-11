import { resolveWorkspaceRoot } from '../../env/workspace-root.js'
import { runStackScript } from '../../exec/stack.js'
import { OK, USAGE, ERROR } from '../../constants/exitCodes.js'
import { isTimError } from '../../errors.js'

const SCHEMA_VERSION = 1

const emit = (text) => process.stdout.write(`${text}\n`)
const emitError = (text) => process.stderr.write(`${text}\n`)

const makeStackAction = ({ script, extraArgs = [], timVersion }) =>
  async function stackAction() {
    const globalOpts = this.optsWithGlobals()
    // Forward any positional / extra args after the command name to the script.
    const passthrough = this.args ?? []
    try {
      const workspaceRoot = resolveWorkspaceRoot({
        explicit: globalOpts.workspace
      })
      const result = await runStackScript({
        workspaceRoot,
        script,
        args: [...extraArgs, ...passthrough]
      })
      if (globalOpts.json) {
        emit(
          JSON.stringify({
            ok: result.exitCode === 0,
            schema_version: SCHEMA_VERSION,
            tim_version: timVersion,
            result: {
              script,
              args: [...extraArgs, ...passthrough],
              exitCode: result.exitCode,
              durationMs: result.durationMs
            },
            errors:
              result.exitCode === 0
                ? []
                : [
                    {
                      code: 'ERROR',
                      message: `${script} exited ${result.exitCode}`
                    }
                  ],
            metadata: { ranAt: new Date().toISOString() }
          })
        )
      }
      process.exit(result.exitCode === 0 ? OK : ERROR)
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

export const register = (program, { timVersion }) => {
  const docker = program
    .command('docker')
    .description(
      'Workspace Docker stack — wraps scripts/stack/ (run-stack.sh, stop-stack.sh, etc.)'
    )

  docker
    .command('up')
    .description('Start the workspace stack from Dockerhub images')
    .allowUnknownOption(true)
    .helpOption(false)
    .action(makeStackAction({ script: 'run-stack.sh', timVersion }))

  docker
    .command('dev')
    .description('Start the stack built from local source (run-stack.sh -d)')
    .allowUnknownOption(true)
    .helpOption(false)
    .action(
      makeStackAction({ script: 'run-stack.sh', extraArgs: ['-d'], timVersion })
    )

  docker
    .command('down')
    .description('Stop the stack and clean up volumes (stop-stack.sh)')
    .allowUnknownOption(true)
    .helpOption(false)
    .action(makeStackAction({ script: 'stop-stack.sh', timVersion }))

  docker
    .command('restart')
    .description('Restart the whole stack (restart-stack.sh)')
    .allowUnknownOption(true)
    .helpOption(false)
    .action(makeStackAction({ script: 'restart-stack.sh', timVersion }))

  docker
    .command('bounce-backend')
    .description('Restart just the backend container (bounce-backend.sh)')
    .allowUnknownOption(true)
    .helpOption(false)
    .action(makeStackAction({ script: 'bounce-backend.sh', timVersion }))

  docker
    .command('bounce-mongo')
    .description('Restart just the mongo container (bounce-mongo.sh)')
    .allowUnknownOption(true)
    .helpOption(false)
    .action(makeStackAction({ script: 'bounce-mongo.sh', timVersion }))
}

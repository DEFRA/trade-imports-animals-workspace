import { createGhaClient } from '../../clients/gha-client.js'
import { resolveGithubToken } from '../auth.js'
import { makeClientAction } from '../_client-action.js'

const buildGhaClient = async () =>
  createGhaClient({ token: await resolveGithubToken() })

export const renderRuns = (runs) => {
  if (runs.length === 0) return '(no runs)'
  return runs
    .map(
      (r) =>
        `[${r.status}/${r.conclusion ?? '?'}] ${r.name}  branch=${r.headBranch}  sha=${r.headSha?.slice(0, 7) ?? '?'}  ${r.url}`
    )
    .join('\n')
}

export const renderStatus = (s) =>
  `Run ${s.id}: ${s.status}${s.conclusion ? ` (${s.conclusion})` : ''}\n${s.url}`

export const register = (program, { timVersion }) => {
  const gha = program
    .command('gha')
    .description('Read GitHub Actions workflow runs')

  gha
    .command('runs <repo>')
    .description('List recent workflow runs for a repo')
    .option('--branch <name>', 'Filter to one branch')
    .option('--workflow <id>', 'Filter to one workflow id or filename')
    .option('--limit <n>', 'Max runs to return', '20')
    .action(
      makeClientAction({
        client: buildGhaClient,
        call: async (c, args) => {
          const [repo] = args
          const opts = args[args.length - 1] ?? {}
          return (await c).listRuns(repo, {
            branch: opts.branch,
            workflow: opts.workflow,
            limit: Number(opts.limit ?? 20)
          })
        },
        renderText: renderRuns,
        timVersion
      })
    )

  gha
    .command('status <repo> <runId>')
    .description('Get the status of a single workflow run')
    .action(
      makeClientAction({
        client: buildGhaClient,
        call: async (c, [repo, runId]) =>
          (await c).getRunStatus(repo, Number(runId)),
        renderText: renderStatus,
        timVersion
      })
    )

  gha
    .command('wait <repo> <runId>')
    .description('Poll a run until it reaches a terminal status')
    .option('--interval <ms>', 'Poll interval in milliseconds', '5000')
    .option('--timeout <ms>', 'Give up after this many milliseconds', '600000')
    .action(
      makeClientAction({
        client: buildGhaClient,
        call: async (c, args) => {
          const [repo, runId] = args
          const opts = args[args.length - 1] ?? {}
          return (await c).waitForRun(repo, Number(runId), {
            intervalMs: Number(opts.interval ?? 5000),
            timeoutMs: Number(opts.timeout ?? 600000)
          })
        },
        renderText: renderStatus,
        timVersion
      })
    )
}

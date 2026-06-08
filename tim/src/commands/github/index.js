import { createGithubClient } from '../../clients/github-client.js'
import { resolveGithubToken } from '../auth.js'
import { makeClientAction } from '../_client-action.js'

const buildGithubClient = async () =>
  createGithubClient({ token: await resolveGithubToken() })

export const renderPrs = (prs) => {
  if (prs.length === 0) return '(no PRs)'
  return prs
    .map(
      (pr) => `[${pr.state}] ${pr.repo} #${pr.number}  ${pr.title}\n  ${pr.url}`
    )
    .join('\n')
}

export const renderPr = (pr) =>
  [
    `${pr.repo} #${pr.number}  ${pr.title}`,
    `State:   ${pr.state}`,
    `Author:  ${pr.author ?? '?'}`,
    `URL:     ${pr.url}`,
    '',
    pr.body?.trim() ?? ''
  ]
    .join('\n')
    .trimEnd()

export const renderDiff = (diff) => diff

export const register = (program, { timVersion }) => {
  const gh = program.command('github').description('Read GitHub PRs and diffs')

  gh.command('prs <ticketId>')
    .description('List PRs across the DEFRA org tagged with the ticket id')
    .action(
      makeClientAction({
        client: buildGithubClient,
        call: async (c, [ticketId]) => (await c).findPrsForTicket(ticketId),
        renderText: renderPrs,
        timVersion
      })
    )

  gh.command('pr <repo> <number>')
    .description('Fetch one PR by repo and number')
    .action(
      makeClientAction({
        client: buildGithubClient,
        call: async (c, [repo, n]) => (await c).getPr(repo, Number(n)),
        renderText: renderPr,
        timVersion
      })
    )

  gh.command('diff <repo> <number>')
    .description('Fetch the diff for one PR')
    .action(
      makeClientAction({
        client: buildGithubClient,
        call: async (c, [repo, n]) => (await c).getPrDiff(repo, Number(n)),
        renderText: renderDiff,
        timVersion
      })
    )
}

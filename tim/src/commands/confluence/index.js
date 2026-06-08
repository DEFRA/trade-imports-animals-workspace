import { createConfluenceClient } from '../../clients/confluence-client.js'
import { makeClientAction } from '../_client-action.js'

export const renderPage = (p) =>
  [
    `${p.title}  (id: ${p.id}, version ${p.version ?? '?'})`,
    '',
    p.body?.trim() || '(empty body)'
  ].join('\n')

export const register = (program, { timVersion }) => {
  const conf = program
    .command('confluence')
    .description('Read Confluence pages')

  conf
    .command('page <id>')
    .description('Fetch a Confluence page by id (storage-format body)')
    .action(
      makeClientAction({
        client: () => createConfluenceClient(),
        call: (c, [id]) => c.getPage(id),
        renderText: renderPage,
        timVersion
      })
    )
}

import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const conclusionTone = (conclusion) => {
  if (conclusion === 'success') return 'green'
  if (conclusion === 'failure' || conclusion === 'cancelled') return 'red'
  return 'yellow'
}

const Row = ({ run }) =>
  createElement(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    createElement(
      Box,
      null,
      createElement(Text, { bold: true }, `#${run.id} ${run.name ?? ''}`),
      createElement(Text, null, ' '),
      createElement(
        Text,
        { color: conclusionTone(run.conclusion) },
        `[${run.conclusion ?? run.status ?? '—'}]`
      )
    ),
    createElement(
      Text,
      { color: 'gray' },
      `  ${run.headBranch ?? '?'} · ${(run.headSha ?? '').slice(0, 7)} · ${run.createdAt ?? ''}`
    ),
    run.url ? createElement(Text, { color: 'gray' }, `  ${run.url}`) : null
  )

const RunsResultScreen = ({ repo, runs = [], onReturn }) =>
  createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(
        Text,
        { bold: true, color: 'cyan' },
        `Recent workflow runs — ${repo}`
      )
    ),
    runs.length === 0
      ? createElement(Text, { color: 'yellow' }, `No runs found for ${repo}.`)
      : createElement(
          Box,
          { flexDirection: 'column' },
          ...runs.map((run) => createElement(Row, { key: run.id, run })),
          createElement(
            Text,
            { color: 'gray' },
            `${runs.length} run${runs.length === 1 ? '' : 's'} total`
          )
        ),
    onReturn
      ? createElement(
          Box,
          { flexDirection: 'column', marginTop: 1 },
          createElement(Text, { color: 'gray' }, 'Press Enter to go back'),
          createElement(TextInput, {
            value: '',
            onChange: () => {},
            onSubmit: onReturn
          })
        )
      : null
  )

export default RunsResultScreen

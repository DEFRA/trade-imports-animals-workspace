import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const conclusionTone = (conclusion) => {
  if (conclusion === 'success') return 'green'
  if (conclusion === 'failure' || conclusion === 'cancelled') return 'red'
  return 'yellow'
}

const RunStatusScreen = ({ repo, run, onReturn }) =>
  createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(
        Text,
        { bold: true, color: 'cyan' },
        `Run #${run.id} — ${repo}`
      )
    ),
    createElement(
      Box,
      null,
      createElement(Text, null, 'Status: '),
      createElement(Text, { bold: true }, `${run.status ?? '—'}`)
    ),
    createElement(
      Box,
      null,
      createElement(Text, null, 'Conclusion: '),
      createElement(
        Text,
        { color: conclusionTone(run.conclusion) },
        `${run.conclusion ?? '—'}`
      )
    ),
    run.url
      ? createElement(
          Box,
          { marginTop: 1 },
          createElement(Text, { color: 'gray' }, `${run.url}`)
        )
      : null,
    onReturn
      ? createElement(
          Box,
          { flexDirection: 'column', marginTop: 1 },
          createElement(
            Text,
            { color: 'gray' },
            'Press Enter to return to the main menu'
          ),
          createElement(TextInput, {
            value: '',
            onChange: () => {},
            onSubmit: onReturn
          })
        )
      : null
  )

export default RunStatusScreen

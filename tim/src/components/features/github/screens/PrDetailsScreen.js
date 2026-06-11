import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const stateTone = (state) => {
  if (state === 'open') return 'green'
  if (state === 'closed') return 'red'
  return 'yellow'
}

const LabelledRow = ({ label, value }) =>
  createElement(
    Box,
    null,
    createElement(Text, { color: 'gray' }, `${label}: `),
    createElement(Text, null, value)
  )

const PrDetailsScreen = ({ pr, onReturn }) => {
  const body = (pr?.body ?? '').trim()

  return createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(Text, { bold: true }, `#${pr.number} ${pr.title}`),
      createElement(Text, null, ' '),
      createElement(Text, { color: stateTone(pr.state) }, `[${pr.state}]`)
    ),
    createElement(LabelledRow, { label: 'repo', value: pr.repo ?? '' }),
    createElement(LabelledRow, { label: 'author', value: pr.author ?? '' }),
    createElement(LabelledRow, { label: 'url', value: pr.url ?? '' }),
    createElement(
      Box,
      { flexDirection: 'column', marginTop: 1 },
      body === ''
        ? createElement(Text, { color: 'gray' }, '(no description)')
        : createElement(Text, null, body)
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
}

export default PrDetailsScreen

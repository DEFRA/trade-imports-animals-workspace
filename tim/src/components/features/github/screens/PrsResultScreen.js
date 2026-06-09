import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const stateTone = (state) => {
  if (state === 'open') return 'green'
  if (state === 'closed') return 'red'
  return 'yellow'
}

const Row = ({ pr }) =>
  createElement(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    createElement(
      Box,
      null,
      createElement(Text, { bold: true }, `#${pr.number} ${pr.title}`),
      createElement(Text, null, ' '),
      createElement(Text, { color: stateTone(pr.state) }, `[${pr.state}]`)
    ),
    createElement(Text, { color: 'gray' }, `  ${pr.repo}`),
    pr.url ? createElement(Text, { color: 'gray' }, `  ${pr.url}`) : null
  )

const PrsResultScreen = ({ ticketId, prs = [], onReturn }) =>
  createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(
        Text,
        { bold: true, color: 'cyan' },
        `Pull requests for ${ticketId}`
      )
    ),
    prs.length === 0
      ? createElement(
          Text,
          { color: 'yellow' },
          `No pull requests found for ${ticketId}.`
        )
      : createElement(
          Box,
          { flexDirection: 'column' },
          ...prs.map((pr) =>
            createElement(Row, { key: `${pr.repo}#${pr.number}`, pr })
          ),
          createElement(
            Text,
            { color: 'gray' },
            `${prs.length} pull request${prs.length === 1 ? '' : 's'} total`
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

export default PrsResultScreen

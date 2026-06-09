import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const MAX_LINES = 80

const truncateDiff = (diff) => {
  const lines = diff.split('\n')
  if (lines.length <= MAX_LINES) return { text: diff, hiddenCount: 0 }
  const head = lines.slice(0, MAX_LINES).join('\n')
  return { text: head, hiddenCount: lines.length - MAX_LINES }
}

const DiffScreen = ({ repo, number, diff, onReturn }) => {
  const raw = diff ?? ''
  const isEmpty = raw.trim() === ''
  const { text, hiddenCount } = isEmpty
    ? { text: '', hiddenCount: 0 }
    : truncateDiff(raw)

  return createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(
        Text,
        { bold: true, color: 'cyan' },
        `Diff — ${repo}#${number}`
      )
    ),
    isEmpty
      ? createElement(Text, { color: 'yellow' }, '(no diff content)')
      : createElement(
          Box,
          { flexDirection: 'column' },
          createElement(Text, null, text),
          hiddenCount > 0
            ? createElement(
                Text,
                { color: 'gray' },
                `…(${hiddenCount} more lines)`
              )
            : null
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

export default DiffScreen

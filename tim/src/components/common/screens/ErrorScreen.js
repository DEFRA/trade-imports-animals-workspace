import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const ErrorScreen = ({ error, onReturn }) =>
  createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(Text, { bold: true, color: 'red' }, 'Error: '),
      createElement(Text, { color: 'red' }, String(error ?? ''))
    ),
    onReturn
      ? createElement(
          Box,
          { flexDirection: 'column' },
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

export default ErrorScreen

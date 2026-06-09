import { createElement, useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const InputScreen = ({
  title,
  subtitle,
  label,
  placeholder = '',
  initialValue = '',
  onSubmit,
  onCancel
}) => {
  const [value, setValue] = useState(initialValue)

  const handleSubmit = (submitted) => {
    const trimmed = (submitted ?? '').trim()
    if (trimmed === '') {
      onCancel?.()
      return
    }
    onSubmit?.(trimmed)
  }

  return createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(Text, { bold: true, color: 'cyan' }, title)
    ),
    subtitle
      ? createElement(
          Box,
          { marginBottom: 1 },
          createElement(Text, { color: 'gray' }, subtitle)
        )
      : null,
    createElement(
      Box,
      null,
      createElement(Text, null, `${label}: `),
      createElement(TextInput, {
        value,
        onChange: setValue,
        onSubmit: handleSubmit,
        placeholder
      })
    ),
    createElement(
      Box,
      { marginTop: 1 },
      createElement(
        Text,
        { color: 'gray' },
        'Press Enter to submit, leave blank to go back'
      )
    )
  )
}

export default InputScreen

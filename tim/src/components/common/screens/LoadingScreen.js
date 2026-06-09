import { createElement } from 'react'
import { Box, Text } from 'ink'
import { Spinner } from '@inkjs/ui'

const LoadingScreen = ({ message = 'Loading' }) =>
  createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      null,
      createElement(Spinner),
      createElement(Text, { color: 'cyan' }, ` ${message}`)
    )
  )

export default LoadingScreen

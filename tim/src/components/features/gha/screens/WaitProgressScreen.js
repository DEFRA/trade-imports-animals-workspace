import { createElement, useState, useEffect } from 'react'
import { Box, Text } from 'ink'

const TICK_MS = 1000

const WaitProgressScreen = ({ repo, runId, startTime }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.floor((Date.now() - startTime) / 1000)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [startTime])

  return createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(
        Text,
        { bold: true, color: 'cyan' },
        `Waiting for run #${runId} on ${repo}`
      )
    ),
    createElement(
      Box,
      null,
      createElement(Text, { color: 'gray' }, `Elapsed: ${elapsedSeconds}s…`)
    )
  )
}

export default WaitProgressScreen

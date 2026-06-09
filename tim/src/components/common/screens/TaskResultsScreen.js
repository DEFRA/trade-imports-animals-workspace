import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const describeResult = (result) => {
  if (result.ok) {
    const duration =
      typeof result.durationMs === 'number' ? ` (${result.durationMs}ms)` : ''
    return { label: `done${duration}`, tone: 'green' }
  }
  const parts = []
  if (typeof result.exitCode === 'number') parts.push(`exit ${result.exitCode}`)
  if (typeof result.durationMs === 'number') {
    parts.push(`${result.durationMs}ms`)
  }
  const suffix = parts.length > 0 ? ` (${parts.join(', ')})` : ''
  return { label: `failed${suffix}`, tone: 'red' }
}

const rowLabel = (result) =>
  result.label ?? result.repo ?? result.service ?? '?'

const Row = ({ result }) => {
  const { label, tone } = describeResult(result)
  const tail = !result.ok && result.stderrTail ? result.stderrTail : null
  return createElement(
    Box,
    { flexDirection: 'column', marginBottom: tail ? 1 : 0 },
    createElement(
      Box,
      null,
      createElement(Text, { color: tone, bold: true }, result.ok ? '✓ ' : '✗ '),
      createElement(Text, null, `${rowLabel(result)} — `),
      createElement(Text, { color: tone }, label)
    ),
    tail
      ? createElement(
          Box,
          { marginLeft: 4, flexDirection: 'column' },
          createElement(Text, { color: 'gray' }, tail)
        )
      : null
  )
}

const Summary = ({ results }) => {
  if (results.length === 0) {
    return createElement(
      Text,
      { color: 'yellow' },
      'Nothing to run — no matching repos in this workspace.'
    )
  }
  const passed = results.filter((r) => r.ok).length
  const failed = results.length - passed
  const tone = failed === 0 ? 'green' : 'yellow'
  return createElement(
    Text,
    { color: tone },
    `${passed} passed, ${failed} failed`
  )
}

const TaskResultsScreen = ({ title, results = [], onReturn }) =>
  createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(Text, { bold: true, color: 'cyan' }, title)
    ),
    ...results.map((result, index) =>
      createElement(Row, { key: result.repo ?? index, result })
    ),
    createElement(Box, { marginTop: 1 }, createElement(Summary, { results })),
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

export default TaskResultsScreen

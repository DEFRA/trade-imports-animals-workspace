import { createElement, useState, useEffect, useRef } from 'react'
import { Box, Text } from 'ink'
import { Spinner } from '@inkjs/ui'
import TextInput from 'ink-text-input'

// Runner contract: ({tasks, onTaskStart, onTaskComplete}) => Promise<void>.
// Default fans tasks out in parallel; each task settles independently and
// reports back through onTaskComplete so the screen can flip its row.
const defaultRunner = async ({ tasks, onTaskStart, onTaskComplete }) => {
  await Promise.all(
    tasks.map(async (task) => {
      onTaskStart(task.id)
      try {
        const result = await task.run()
        onTaskComplete(task.id, { ...result, ok: result.exitCode === 0 })
      } catch (error) {
        onTaskComplete(task.id, {
          repo: task.repo,
          label: task.label,
          ok: false,
          exitCode: null,
          stderrTail: error.message ?? String(error)
        })
      }
    })
  )
}

const describeRunningLabel = (task) => task.label ?? task.repo ?? task.id

const describeDoneLabel = (result) => {
  if (result.ok) {
    const duration =
      typeof result.durationMs === 'number' ? ` (${result.durationMs}ms)` : ''
    return { label: `done${duration}`, tone: 'green', mark: '✓ ' }
  }
  const parts = []
  if (typeof result.exitCode === 'number') parts.push(`exit ${result.exitCode}`)
  if (typeof result.durationMs === 'number') {
    parts.push(`${result.durationMs}ms`)
  }
  const suffix = parts.length > 0 ? ` (${parts.join(', ')})` : ''
  return { label: `failed${suffix}`, tone: 'red', mark: '✗ ' }
}

const RunningRow = ({ task }) =>
  createElement(
    Box,
    null,
    createElement(Spinner),
    createElement(Text, null, ` ${describeRunningLabel(task)}`)
  )

const DoneRow = ({ task, result }) => {
  const { label, tone, mark } = describeDoneLabel(result)
  const rowLabel = result.label ?? task.label ?? task.repo ?? task.id
  const tail = !result.ok && result.stderrTail ? result.stderrTail : null
  return createElement(
    Box,
    { flexDirection: 'column', marginBottom: tail ? 1 : 0 },
    createElement(
      Box,
      null,
      createElement(Text, { color: tone, bold: true }, mark),
      createElement(Text, null, `${rowLabel} — `),
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

const Summary = ({ tasks, results }) => {
  if (tasks.length === 0) {
    return createElement(
      Text,
      { color: 'yellow' },
      'Nothing to run — no matching repos in this workspace.'
    )
  }
  const completed = Object.values(results)
  const passed = completed.filter((r) => r.ok).length
  const failed = completed.length - passed
  const tone = failed === 0 ? 'green' : 'yellow'
  return createElement(
    Text,
    { color: tone },
    `${passed} passed, ${failed} failed`
  )
}

const ParallelProgressScreen = ({
  title,
  tasks = [],
  onReturn,
  runner = defaultRunner
}) => {
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(tasks.map((task) => [task.id, 'pending']))
  )
  const [results, setResults] = useState({})
  const [allDone, setAllDone] = useState(tasks.length === 0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    if (tasks.length === 0) {
      setAllDone(true)
      return
    }
    const onTaskStart = (id) =>
      setStatuses((prev) => ({ ...prev, [id]: 'running' }))
    const onTaskComplete = (id, result) => {
      setStatuses((prev) => ({ ...prev, [id]: 'done' }))
      setResults((prev) => ({ ...prev, [id]: result }))
    }
    Promise.resolve(runner({ tasks, onTaskStart, onTaskComplete })).finally(
      () => setAllDone(true)
    )
  }, [])

  return createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(Text, { bold: true, color: 'cyan' }, title)
    ),
    ...tasks.map((task) => {
      if (statuses[task.id] === 'done' && results[task.id]) {
        return createElement(DoneRow, {
          key: task.id,
          task,
          result: results[task.id]
        })
      }
      return createElement(RunningRow, { key: task.id, task })
    }),
    allDone
      ? createElement(
          Box,
          { marginTop: 1 },
          createElement(Summary, { tasks, results })
        )
      : null,
    allDone && onReturn
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

export default ParallelProgressScreen

import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const describeBranch = ({ cloned, branch, ahead, behind, dirty }) => {
  if (!cloned) return { label: 'Not cloned', tone: 'yellow' }
  if (!branch) return { label: 'Detached HEAD or no branch', tone: 'yellow' }
  const counts = []
  if (ahead > 0) counts.push(`${ahead} ahead`)
  if (behind > 0) counts.push(`${behind} behind`)
  if (dirty > 0) counts.push(`${dirty} changed`)
  if (counts.length === 0) {
    return {
      label: `On branch ${branch} — up to date and clean`,
      tone: 'green'
    }
  }
  return { label: `On branch ${branch} — ${counts.join(', ')}`, tone: 'yellow' }
}

const RepoBlock = ({ status }) => {
  const { label, tone } = describeBranch(status)
  return createElement(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    createElement(Text, { bold: true }, status.repo),
    createElement(Text, { color: tone }, `  ${label}`)
  )
}

const StatusOutputScreen = ({ statuses = [], onReturn }) =>
  createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(Text, { bold: true, color: 'cyan' }, 'Workspace status')
    ),
    ...statuses.map((status) =>
      createElement(RepoBlock, { key: status.repo, status })
    ),
    onReturn
      ? createElement(
          Box,
          { flexDirection: 'column' },
          createElement(Text, { color: 'gray' }, 'Press Enter to go back'),
          createElement(TextInput, {
            value: '',
            onChange: () => {},
            onSubmit: onReturn
          })
        )
      : null
  )

export default StatusOutputScreen

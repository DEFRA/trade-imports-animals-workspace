import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const FieldRow = ({ label, value }) =>
  createElement(
    Box,
    null,
    createElement(Text, { color: 'gray' }, `${label}: `),
    createElement(Text, null, value)
  )

const TicketResultScreen = ({ ticket = {}, onReturn }) =>
  createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(Text, { bold: true, color: 'cyan' }, ticket.id ?? 'Ticket'),
      createElement(Text, null, ' — '),
      createElement(Text, null, ticket.summary || '(no summary)')
    ),
    createElement(FieldRow, { label: 'Status', value: ticket.status ?? '—' }),
    createElement(FieldRow, { label: 'Type', value: ticket.type ?? '—' }),
    createElement(FieldRow, {
      label: 'Assignee',
      value: ticket.assignee ?? 'Unassigned'
    }),
    createElement(FieldRow, {
      label: 'Priority',
      value: ticket.priority ?? '—'
    }),
    ticket.description
      ? createElement(
          Box,
          { flexDirection: 'column', marginTop: 1 },
          createElement(Text, { color: 'gray' }, 'Description:'),
          createElement(Text, null, ticket.description)
        )
      : null,
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

export default TicketResultScreen

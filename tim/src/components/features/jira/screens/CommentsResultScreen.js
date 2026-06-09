import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const CommentRow = ({ comment }) =>
  createElement(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    createElement(
      Box,
      null,
      createElement(Text, { bold: true }, comment.author ?? 'Unknown'),
      comment.createdAt
        ? createElement(Text, { color: 'gray' }, `  ${comment.createdAt}`)
        : null
    ),
    createElement(Text, null, comment.body ?? '')
  )

const CommentsResultScreen = ({ ticketId, comments = [], onReturn }) =>
  createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(
        Text,
        { bold: true, color: 'cyan' },
        `Comments on ${ticketId}`
      )
    ),
    comments.length === 0
      ? createElement(Text, { color: 'yellow' }, `No comments on ${ticketId}.`)
      : createElement(
          Box,
          { flexDirection: 'column' },
          ...comments.map((comment) =>
            createElement(CommentRow, { key: comment.id, comment })
          ),
          createElement(
            Text,
            { color: 'gray' },
            `${comments.length} comment${comments.length === 1 ? '' : 's'} total`
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

export default CommentsResultScreen

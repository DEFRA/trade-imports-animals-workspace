import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

const BODY_PREVIEW_LIMIT = 800

const stripTags = (html = '') =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const previewBody = (body) => {
  const text = stripTags(body)
  if (text.length === 0) return null
  return text.length > BODY_PREVIEW_LIMIT
    ? `${text.slice(0, BODY_PREVIEW_LIMIT)}…`
    : text
}

const PageResultScreen = ({ page = {}, onReturn }) => {
  const preview = previewBody(page.body)
  return createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(
        Text,
        { bold: true, color: 'cyan' },
        page.title ?? '(no title)'
      )
    ),
    createElement(
      Box,
      null,
      createElement(Text, { color: 'gray' }, 'Page id: '),
      createElement(Text, null, String(page.id ?? '—'))
    ),
    createElement(
      Box,
      null,
      createElement(Text, { color: 'gray' }, 'Version: '),
      createElement(Text, null, String(page.version ?? '—'))
    ),
    createElement(
      Box,
      { flexDirection: 'column', marginTop: 1 },
      createElement(Text, { color: 'gray' }, 'Body preview:'),
      preview
        ? createElement(Text, null, preview)
        : createElement(Text, { color: 'yellow' }, '(empty — no body content)')
    ),
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
}

export default PageResultScreen

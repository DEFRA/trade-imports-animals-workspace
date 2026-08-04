import { createElement } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import {
  describeRepoOutcome,
  appliedHeading,
  stashedRepos,
  STASH_RECOVERY_HINT
} from '../../../../commands/workspace/branch.js'

const RepoBlock = ({ result, dryRun }) => {
  const { text, tone } = describeRepoOutcome(result, dryRun)
  return createElement(
    Box,
    { flexDirection: 'column' },
    createElement(
      Box,
      null,
      createElement(Text, { bold: true }, `${result.repo} — `),
      createElement(Text, { color: tone }, text)
    ),
    result.stderrTail
      ? createElement(
          Box,
          { marginLeft: 2 },
          createElement(Text, { color: 'gray' }, result.stderrTail)
        )
      : null
  )
}

const StashFooter = ({ repos }) => {
  const stashed = stashedRepos(repos)
  if (stashed.length === 0) return null
  return createElement(
    Box,
    { flexDirection: 'column', marginTop: 1 },
    createElement(
      Text,
      { color: 'yellow' },
      `Work stashed in: ${stashed.join(', ')}`
    ),
    createElement(Text, { color: 'gray' }, STASH_RECOVERY_HINT)
  )
}

const BranchOutcomeScreen = ({ outcome, onReturn }) =>
  createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    createElement(
      Box,
      { marginBottom: 1 },
      createElement(
        Text,
        { bold: true, color: 'cyan' },
        appliedHeading(outcome)
      )
    ),
    ...outcome.repos.map((result) =>
      createElement(RepoBlock, {
        key: result.repo,
        result,
        dryRun: outcome.dryRun
      })
    ),
    createElement(StashFooter, { repos: outcome.repos }),
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

export default BranchOutcomeScreen

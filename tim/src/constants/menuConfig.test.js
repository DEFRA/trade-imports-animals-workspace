import { describe, test, expect } from 'vitest'
import { SCREENS } from './menuConfig.js'

describe('SCREENS', () => {
  test('exposes the screen identifiers used by Phase 5a routing', () => {
    expect(SCREENS).toMatchObject({
      MAIN: 'main',
      LOADING: 'loading',
      ERROR: 'error',
      WORKSPACE_MENU: 'workspace-menu',
      WORKSPACE_STATUS_OUTPUT: 'workspace-status-output'
    })
  })

  test('exposes the screen identifiers used by Phase 5b routing', () => {
    expect(SCREENS).toMatchObject({
      WORKSPACE_TASK_RESULTS: 'workspace-task-results',
      AUTH_RESULTS: 'auth-results'
    })
  })

  test('exposes the screen identifiers used by Phase 5d routing', () => {
    expect(SCREENS).toMatchObject({
      DOCKER_MENU: 'docker-menu',
      START_MENU: 'start-menu'
    })
  })

  test('exposes the screen identifiers used by Phase 5e routing', () => {
    expect(SCREENS).toMatchObject({
      JIRA_COMMENTS_INPUT: 'jira-comments-input',
      JIRA_COMMENTS_RESULT: 'jira-comments-result',
      GITHUB_PR_INPUT: 'github-pr-input',
      GITHUB_PR_RESULT: 'github-pr-result',
      GITHUB_DIFF_INPUT: 'github-diff-input',
      GITHUB_DIFF_RESULT: 'github-diff-result',
      GHA_STATUS_INPUT: 'gha-status-input',
      GHA_STATUS_RESULT: 'gha-status-result'
    })
  })

  test('exposes the screen identifiers used by Phase 5c routing', () => {
    expect(SCREENS).toMatchObject({
      JIRA_MENU: 'jira-menu',
      JIRA_TICKET_INPUT: 'jira-ticket-input',
      JIRA_TICKET_RESULT: 'jira-ticket-result',
      GITHUB_MENU: 'github-menu',
      GITHUB_PRS_INPUT: 'github-prs-input',
      GITHUB_PRS_RESULT: 'github-prs-result',
      CONFLUENCE_MENU: 'confluence-menu',
      CONFLUENCE_PAGE_INPUT: 'confluence-page-input',
      CONFLUENCE_PAGE_RESULT: 'confluence-page-result',
      GHA_MENU: 'gha-menu',
      GHA_RUNS_INPUT: 'gha-runs-input',
      GHA_RUNS_RESULT: 'gha-runs-result'
    })
  })

  test('exposes the screen identifiers used by Phase 5f routing', () => {
    expect(SCREENS).toMatchObject({
      GHA_WAIT_INPUT: 'gha-wait-input',
      GHA_WAIT_PROGRESS: 'gha-wait-progress'
    })
  })

  test('every value is a unique non-empty string', () => {
    const values = Object.values(SCREENS)
    expect(new Set(values).size).toBe(values.length)
    for (const value of values) expect(value).toMatch(/^[a-z][a-z0-9-]*$/)
  })
})

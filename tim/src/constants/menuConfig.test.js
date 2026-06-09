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

  test('every value is a unique non-empty string', () => {
    const values = Object.values(SCREENS)
    expect(new Set(values).size).toBe(values.length)
    for (const value of values) expect(value).toMatch(/^[a-z][a-z0-9-]*$/)
  })
})

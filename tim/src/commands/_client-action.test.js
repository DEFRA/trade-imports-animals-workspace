import { describe, test, expect } from 'vitest'
import { makeClientAction } from './_client-action.js'

// makeClientAction is a higher-order function whose action handler
// process.exit()s on completion, which makes direct invocation in tests
// painful. The behaviour we care about is exercised through the per-
// service subprocess smoke tests (where they exist). Here we cover the
// shape of the factory return value.
describe('makeClientAction', () => {
  test('returns an async function', () => {
    const action = makeClientAction({
      client: () => ({}),
      call: async () => null,
      renderText: () => '',
      timVersion: '0.0.0'
    })
    expect(typeof action).toBe('function')
    expect(action.constructor.name).toBe('AsyncFunction')
  })
})

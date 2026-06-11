import nock from 'nock'

/**
 * Set up HTTP mocking for a test file. Blocks all real network calls.
 * Returns a helper to stage intercepts per origin.
 *
 * Use in beforeEach; call `closeHttpMocks()` in afterEach.
 *
 * @returns {{ mockPool: (origin: string) => import('nock').Scope }}
 */
export const installHttpMocks = () => {
  nock.disableNetConnect()
  return {
    mockPool: (origin) => nock(origin)
  }
}

/**
 * Tear down all mocks and re-enable real network access.
 */
export const closeHttpMocks = () => {
  nock.cleanAll()
  nock.enableNetConnect()
}

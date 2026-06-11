/**
 * Run an async task for every item in parallel, collecting one result per
 * item in input order. Each task's success and failure is captured as a
 * result object — the call itself never rejects.
 *
 * @template TItem
 * @template TResult
 * @param {TItem[]} items
 * @param {(item: TItem) => Promise<TResult>} taskFn
 * @returns {Promise<Array<{item: TItem, ok: boolean, durationMs: number, error?: string} & Partial<TResult>>>}
 */
export const runAcross = async (items, taskFn) => {
  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const start = performance.now()
      try {
        const value = await taskFn(item)
        return {
          item,
          ...value,
          ok: value?.ok ?? value?.exitCode === 0,
          durationMs: Math.round(performance.now() - start)
        }
      } catch (error) {
        return {
          item,
          ok: false,
          error: error.message ?? String(error),
          durationMs: Math.round(performance.now() - start)
        }
      }
    })
  )
  return settled.map((s) =>
    s.status === 'fulfilled'
      ? s.value
      : { item: null, ok: false, error: String(s.reason), durationMs: 0 }
  )
}

/**
 * Run an async task for every item one at a time, preserving order.
 *
 * @template TItem
 * @template TResult
 * @param {TItem[]} items
 * @param {(item: TItem) => Promise<TResult>} taskFn
 * @returns {Promise<Array<{item: TItem, ok: boolean, durationMs: number, error?: string} & Partial<TResult>>>}
 */
export const runSerial = async (items, taskFn) => {
  const results = []
  for (const item of items) {
    const start = performance.now()
    try {
      const value = await taskFn(item)
      results.push({
        item,
        ...value,
        ok: value?.ok ?? value?.exitCode === 0,
        durationMs: Math.round(performance.now() - start)
      })
    } catch (error) {
      results.push({
        item,
        ok: false,
        error: error.message ?? String(error),
        durationMs: Math.round(performance.now() - start)
      })
    }
  }
  return results
}

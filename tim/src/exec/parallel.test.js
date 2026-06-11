import { describe, test, expect } from 'vitest'
import { runAcross, runSerial } from './parallel.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe('runAcross', () => {
  test('returns one result per item in input order', async () => {
    const results = await runAcross([10, 20, 30], async (n) => ({
      ok: true,
      doubled: n * 2
    }))
    expect(results.map((r) => r.item)).toEqual([10, 20, 30])
    expect(results.map((r) => r.doubled)).toEqual([20, 40, 60])
  })

  test('captures failures as ok: false with error message', async () => {
    const results = await runAcross([1, 2, 3], async (n) => {
      if (n === 2) throw new Error('boom on 2')
      return { ok: true, value: n }
    })
    expect(results[1].ok).toBe(false)
    expect(results[1].error).toBe('boom on 2')
    expect(results[0].ok).toBe(true)
    expect(results[2].ok).toBe(true)
  })

  test('runs tasks in parallel — total wall-clock is the slowest, not the sum', async () => {
    const start = performance.now()
    await runAcross([50, 50, 50], async (ms) => {
      await delay(ms)
      return { ok: true }
    })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(150) // would be 150ms+ if serial; parallel ~50ms
  })

  test('infers ok from exitCode when the task does not set ok explicitly', async () => {
    const results = await runAcross([0, 1, 2], async (code) => ({
      exitCode: code
    }))
    expect(results.map((r) => r.ok)).toEqual([true, false, false])
  })

  test('falls back to String(error) when the thrown value has no message', async () => {
    const results = await runAcross([1], async () => {
      // Throwing a non-Error literal — error.message is undefined.
      // eslint-disable-next-line no-throw-literal
      throw 'plain string failure'
    })
    expect(results[0].ok).toBe(false)
    expect(results[0].error).toBe('plain string failure')
  })
})

describe('runSerial', () => {
  test('returns results in input order', async () => {
    const results = await runSerial(['a', 'b', 'c'], async (s) => ({
      ok: true,
      upper: s.toUpperCase()
    }))
    expect(results.map((r) => r.upper)).toEqual(['A', 'B', 'C'])
  })

  test('continues after a failure rather than short-circuiting', async () => {
    const results = await runSerial([1, 2, 3], async (n) => {
      if (n === 2) throw new Error('boom')
      return { ok: true, value: n }
    })
    expect(results.map((r) => r.ok)).toEqual([true, false, true])
  })

  test('infers ok from exitCode when the task does not set ok explicitly', async () => {
    const results = await runSerial([0, 1, 2], async (code) => ({
      exitCode: code
    }))
    expect(results.map((r) => r.ok)).toEqual([true, false, false])
  })

  test('falls back to String(error) when the thrown value has no message', async () => {
    const results = await runSerial([1], async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'plain string failure'
    })
    expect(results[0].ok).toBe(false)
    expect(results[0].error).toBe('plain string failure')
  })

  test('runs tasks serially — total wall-clock is the sum', async () => {
    const start = performance.now()
    await runSerial([30, 30, 30], async (ms) => {
      await delay(ms)
      return { ok: true }
    })
    const elapsed = performance.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(85) // 3 × ~30ms serial
  })
})

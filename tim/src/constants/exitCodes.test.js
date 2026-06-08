import { describe, test, expect } from 'vitest'
import * as codes from './exitCodes.js'

describe('exit codes', () => {
  test('OK is 0 — POSIX success convention', () => {
    expect(codes.OK).toBe(0)
  })

  test('every named code is a distinct non-negative integer', () => {
    const values = Object.values(codes)
    expect(values.length).toBeGreaterThan(0)
    expect(new Set(values).size).toBe(values.length)
    for (const value of values) {
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
    }
  })

  test('non-success codes (1..5) cover the documented failure modes', () => {
    expect(codes.ERROR).toBe(1)
    expect(codes.USAGE).toBe(2)
    expect(codes.MISSING_DEP).toBe(3)
    expect(codes.USER_ABORT).toBe(4)
    expect(codes.PARTIAL_FAILURE).toBe(5)
  })
})

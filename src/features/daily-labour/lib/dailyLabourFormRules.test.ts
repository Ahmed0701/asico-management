import { describe, expect, it } from "vitest"
import {
  isValidLabourCount,
  isValidLabourDateYmd,
  isValidLabourNotesLength,
} from "./dailyLabourFormRules"

describe("dailyLabourFormRules", () => {
  const now = new Date("2026-03-15T12:00:00.000Z")

  it("validates labour dates", () => {
    expect(isValidLabourDateYmd("2026-03-15", now)).toBe(true)
    expect(isValidLabourDateYmd("2026-03-18", now)).toBe(false)
  })

  it("validates labour count", () => {
    expect(isValidLabourCount(0)).toBe(true)
    expect(isValidLabourCount(100_000)).toBe(true)
    expect(isValidLabourCount(-1)).toBe(false)
    expect(isValidLabourCount(100_001)).toBe(false)
  })

  it("validates notes length", () => {
    expect(isValidLabourNotesLength(null)).toBe(true)
    expect(isValidLabourNotesLength("a".repeat(500))).toBe(true)
    expect(isValidLabourNotesLength("a".repeat(501))).toBe(false)
  })
})

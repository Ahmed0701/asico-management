import { describe, expect, it } from "vitest"
import {
  isValidReportDateYmd,
  isValidWorkersCount,
} from "./dailyReportsFormRules"

describe("dailyReportsFormRules", () => {
  const now = new Date("2026-03-15T12:00:00.000Z")

  it("accepts today and tomorrow UTC", () => {
    expect(isValidReportDateYmd("2026-03-15", now)).toBe(true)
    expect(isValidReportDateYmd("2026-03-16", now)).toBe(true)
  })

  it("rejects dates after tomorrow UTC", () => {
    expect(isValidReportDateYmd("2026-03-17", now)).toBe(false)
  })

  it("validates workers count range", () => {
    expect(isValidWorkersCount(0)).toBe(true)
    expect(isValidWorkersCount(100_000)).toBe(true)
    expect(isValidWorkersCount(-1)).toBe(false)
    expect(isValidWorkersCount(100_001)).toBe(false)
    expect(isValidWorkersCount(1.5)).toBe(false)
  })
})

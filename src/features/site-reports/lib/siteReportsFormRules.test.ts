import { describe, expect, it } from "vitest"
import {
  isValidSiteReportRating,
  isValidVisitDateYmd,
} from "./siteReportsFormRules"

describe("siteReportsFormRules", () => {
  const now = new Date("2026-03-15T12:00:00.000Z")

  it("validates visit dates", () => {
    expect(isValidVisitDateYmd("2026-03-16", now)).toBe(true)
    expect(isValidVisitDateYmd("2026-03-17", now)).toBe(false)
  })

  it("validates rating 1 to 5", () => {
    expect(isValidSiteReportRating(1)).toBe(true)
    expect(isValidSiteReportRating(5)).toBe(true)
    expect(isValidSiteReportRating(0)).toBe(false)
    expect(isValidSiteReportRating(6)).toBe(false)
    expect(isValidSiteReportRating(3.5)).toBe(false)
  })
})

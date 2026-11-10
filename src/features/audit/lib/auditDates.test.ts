import { describe, expect, it } from "vitest"
import { datetimeLocalToIso, isDateOnly, toApiDateBoundary } from "./auditDates"

describe("auditDates", () => {
  it("sends date-only values unchanged", () => {
    expect(toApiDateBoundary("2026-01-31", "date")).toBe("2026-01-31")
    expect(isDateOnly("2026-01-31")).toBe(true)
  })

  it("converts datetime-local to ISO with Z", () => {
    const iso = datetimeLocalToIso("2026-01-15T10:30")
    expect(iso).toMatch(/Z$/)
  })
})

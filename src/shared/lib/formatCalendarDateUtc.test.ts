import { describe, expect, it } from "vitest"
import { formatCalendarDateUtc } from "./formatCalendarDateUtc"

describe("formatCalendarDateUtc", () => {
  it("formats an ISO UTC midnight date", () => {
    const iso = "2026-03-15T00:00:00.000Z"
    const formatted = formatCalendarDateUtc(iso)
    expect(formatted).toMatch(/2026/)
    expect(formatted).toMatch(/15/)
  })
})

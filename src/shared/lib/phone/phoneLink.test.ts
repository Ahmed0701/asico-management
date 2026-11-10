import { describe, expect, it } from "vitest"
import { safeTelHref } from "./phoneLink"

describe("safeTelHref", () => {
  it("builds tel links only for safe digit strings", () => {
    expect(safeTelHref("+20 100-1234")).toBe("tel:+201001234")
    expect(safeTelHref("abc")).toBeUndefined()
  })
})

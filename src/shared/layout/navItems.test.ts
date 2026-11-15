import { describe, expect, it } from "vitest"
import { findNavItem } from "./navItems"

describe("findNavItem", () => {
  it("finds the menu page a path is, or is under, by the longest menu path", () => {
    expect(findNavItem("/")?.item.key).toBe("dashboard")
    expect(findNavItem("/villas")?.item.key).toBe("villas")
    expect(findNavItem("/villas/123")?.item.key).toBe("villas")
    expect(findNavItem("/villas/mew-follow-up")?.item.key).toBe("mewFollowUp")
    expect(findNavItem("/payments")?.group.key).toBe("directory")
    expect(findNavItem("/audit")?.item.key).toBe("auditLog")
  })

  it("does not mistake a longer word for a menu path, and knows no page outside the menu", () => {
    expect(findNavItem("/villasx")).toBeUndefined()
    expect(findNavItem("/profile")).toBeUndefined()
  })
})

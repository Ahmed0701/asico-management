import { describe, expect, it } from "vitest"
import { ALL_PERMISSION_CODES, NAV_ITEM_PERMISSIONS } from "./permissions"

describe("permissions catalog", () => {
  it("lists every backend permission code", () => {
    expect(ALL_PERMISSION_CODES).toHaveLength(80)
    expect(new Set(ALL_PERMISSION_CODES).size).toBe(80)
  })

  it("maps sidebar items to :read permissions", () => {
    for (const [key, code] of Object.entries(NAV_ITEM_PERMISSIONS)) {
      expect(code, key).toBeDefined()
      expect(code!.endsWith(":read") || code === "permissions:assign").toBe(
        true,
      )
    }
  })
})

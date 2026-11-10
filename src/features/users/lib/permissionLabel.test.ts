import { describe, expect, it } from "vitest"
import { permissionDiff } from "./permissionLabel"

describe("permissionDiff", () => {
  it("computes added and removed codes", () => {
    const diff = permissionDiff(["users:read", "users:update"], [
      "users:read",
      "users:create",
    ])
    expect(diff.added).toEqual(["users:create"])
    expect(diff.removed).toEqual(["users:update"])
  })
})

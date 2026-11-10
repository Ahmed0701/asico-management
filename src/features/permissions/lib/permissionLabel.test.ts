import { describe, expect, it } from "vitest"
import { permissionDiff } from "./permissionLabel"

describe("permissionDiff", () => {
  it("computes added and removed", () => {
    expect(permissionDiff(["a:read", "a:write"], ["a:read", "b:read"])).toEqual(
      {
        added: ["b:read"],
        removed: ["a:write"],
      },
    )
  })
})

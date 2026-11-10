import { describe, expect, it } from "vitest"
import { clampProgressPercent, progressIndicatorClass } from "./progressDisplay"

describe("progressDisplay", () => {
  it("clamps and rounds progress", () => {
    expect(clampProgressPercent(-5)).toBe(0)
    expect(clampProgressPercent(33.6)).toBe(34)
    expect(clampProgressPercent(150)).toBe(100)
  })

  it("maps fill color by threshold", () => {
    expect(progressIndicatorClass(0)).toBe("bg-transparent")
    expect(progressIndicatorClass(1)).toBe("bg-accent")
    expect(progressIndicatorClass(99)).toBe("bg-accent")
    expect(progressIndicatorClass(100)).toBe("bg-success")
  })
})

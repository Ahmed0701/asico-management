import { describe, expect, it } from "vitest"
import {
  inferStatusFromProgress,
  resolveStatusAndProgress,
  statusAgreesWithProgress,
} from "./openWorksFormRules"

describe("statusAgreesWithProgress", () => {
  it("requires 100 for DONE and 0 for NOT_STARTED", () => {
    expect(statusAgreesWithProgress("DONE", 100)).toBe(true)
    expect(statusAgreesWithProgress("DONE", 50)).toBe(false)
    expect(statusAgreesWithProgress("NOT_STARTED", 0)).toBe(true)
    expect(statusAgreesWithProgress("NOT_STARTED", 1)).toBe(false)
  })

  it("allows IN_PROGRESS below 100", () => {
    expect(statusAgreesWithProgress("IN_PROGRESS", 40)).toBe(true)
    expect(statusAgreesWithProgress("IN_PROGRESS", 100)).toBe(false)
  })
})

describe("resolveStatusAndProgress", () => {
  it("infers status from progress when status omitted", () => {
    expect(resolveStatusAndProgress({ progress: 0 }).status).toBe("NOT_STARTED")
    expect(resolveStatusAndProgress({ progress: 50 }).status).toBe(
      "IN_PROGRESS",
    )
  })
})

describe("inferStatusFromProgress", () => {
  it("maps edge values", () => {
    expect(inferStatusFromProgress(100)).toBe("DONE")
    expect(inferStatusFromProgress(0)).toBe("NOT_STARTED")
  })
})

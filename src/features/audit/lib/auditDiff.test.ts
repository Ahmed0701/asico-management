import { describe, expect, it } from "vitest"
import {
  REDACTED,
  diffAuditSnapshots,
  flattenVisibleChanges,
  isRedacted,
} from "./auditDiff"

describe("auditDiff", () => {
  it("detects created and removed snapshots", () => {
    expect(diffAuditSnapshots(null, { name: "a" })).toEqual([
      { kind: "created" },
    ])
    expect(diffAuditSnapshots({ name: "a" }, null)).toEqual([
      { kind: "removed" },
    ])
    expect(diffAuditSnapshots(null, null)).toEqual([{ kind: "none" }])
  })

  it("diffs string arrays as added and removed", () => {
    const changes = flattenVisibleChanges(
      diffAuditSnapshots({ permissions: ["a", "b"] }, {
        permissions: ["a", "c"],
      }),
    )
    const arr = changes.find((c) => c.kind === "stringArray")
    expect(arr && arr.kind === "stringArray" && arr.added).toEqual(["c"])
    expect(arr && arr.kind === "stringArray" && arr.removed).toEqual(["b"])
  })

  it("treats redacted marker distinctly", () => {
    expect(isRedacted(REDACTED)).toBe(true)
    const changes = flattenVisibleChanges(
      diffAuditSnapshots({ password: "x" }, { password: REDACTED }),
    )
    expect(changes.some((c) => c.kind === "scalar")).toBe(true)
  })
})

import { describe, expect, it } from "vitest"
import { auditEntityHref, formatAuditEntityLine } from "./auditEntity"

const canAll = () => true
const canNone = () => false

describe("formatAuditEntityLine", () => {
  it("joins label and name with a middle dot", () => {
    expect(formatAuditEntityLine("Project", "P-2026-014")).toBe(
      "Project · P-2026-014",
    )
  })

  it("returns label only when name is null", () => {
    expect(formatAuditEntityLine("User", null)).toBe("User")
  })
})

describe("auditEntityHref", () => {
  it("uses entityCode for routing", () => {
    expect(auditEntityHref("User", "u1", canAll)).toBe("/users/u1")
    expect(auditEntityHref("Project", "p1", canAll)).toBe("/villas/p1")
  })

  it("returns null without permission or id", () => {
    expect(auditEntityHref("User", "u1", canNone)).toBeNull()
    expect(auditEntityHref("User", null, canAll)).toBeNull()
  })
})

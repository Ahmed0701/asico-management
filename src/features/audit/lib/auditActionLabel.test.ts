import { describe, expect, it } from "vitest"
import { resolveAuditActionLabel } from "./auditActionLabel"

describe("resolveAuditActionLabel", () => {
  it("uses API labels and falls back to the code", () => {
    expect(
      resolveAuditActionLabel("auth.login", {
        "auth.login": "Sign in",
      }),
    ).toBe("Sign in")
    expect(resolveAuditActionLabel("custom.unknown.action", {})).toBe(
      "custom.unknown.action",
    )
    expect(resolveAuditActionLabel("villa.create")).toBe("villa.create")
  })
})

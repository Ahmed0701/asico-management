import { describe, expect, it } from "vitest"
import { userActionRules } from "./userRules"

const meEmployee = {
  id: "emp-1",
  name: "Employee",
  email: "emp@example.com",
  role: "EMPLOYEE" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  permissions: ["users:update"],
}

const meAdmin = { ...meEmployee, id: "admin-1", role: "ADMIN" as const }

describe("userActionRules.canResetPassword", () => {
  it("allows reset for employee target", () => {
    const rules = userActionRules({ id: "u2", role: "EMPLOYEE" }, meEmployee)
    expect(rules.canResetPassword).toBe(true)
  })

  it("blocks admin target for non-admin caller", () => {
    const rules = userActionRules({ id: "admin-2", role: "ADMIN" }, meEmployee)
    expect(rules.canResetPassword).toBe(false)
  })

  it("allows admin target for admin caller", () => {
    const rules = userActionRules({ id: "admin-2", role: "ADMIN" }, meAdmin)
    expect(rules.canResetPassword).toBe(true)
  })
})

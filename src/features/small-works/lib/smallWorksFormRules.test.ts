import { describe, expect, it } from "vitest"
import { isPlannedDateWithinTenYears } from "./smallWorksFormRules"
import { smallWorkCreateSchema } from "../schema"

describe("smallWorksFormRules", () => {
  const now = new Date("2026-03-15T12:00:00.000Z")

  it("allows future dates within ten years", () => {
    expect(isPlannedDateWithinTenYears("2027-01-01", now)).toBe(true)
  })

  it("rejects dates more than ten years ahead", () => {
    expect(isPlannedDateWithinTenYears("2037-01-01", now)).toBe(false)
  })
})

describe("smallWorkCreateSchema", () => {
  const base = {
    villaId: "11111111-1111-4111-8111-111111111111",
    contractorId: "22222222-2222-4222-8222-222222222222",
    startDate: "2026-03-01",
    endDate: "2026-03-10",
    description: "Patch tiles",
    status: "PENDING" as const,
  }

  it("requires contractor and valid date order", () => {
    expect(
      smallWorkCreateSchema.safeParse({ ...base, contractorId: "" }).success,
    ).toBe(false)
    const badOrder = smallWorkCreateSchema.safeParse({
      ...base,
      startDate: "2026-03-12",
      endDate: "2026-03-10",
    })
    expect(badOrder.success).toBe(false)
    if (!badOrder.success) {
      expect(badOrder.error.issues.some((i) => i.path[0] === "endDate")).toBe(
        true,
      )
    }
    expect(smallWorkCreateSchema.safeParse(base).success).toBe(true)
  })
})

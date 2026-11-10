import { describe, expect, it } from "vitest"
import { buildDailyLabourListQueryParams } from "./daily-labour.api"
import type { DailyLabourListParams } from "./daily-labour.types"

describe("buildDailyLabourListQueryParams", () => {
  const base: DailyLabourListParams = { page: 2, limit: 50 }

  it("includes filters", () => {
    expect(
      buildDailyLabourListQueryParams({
        ...base,
        villaId: "11111111-1111-4111-8111-111111111111",
        contractorId: "22222222-2222-4222-8222-222222222222",
        labourFrom: "2026-02-01",
        labourTo: "2026-02-28",
        sort: "labourCount:asc",
      }),
    ).toEqual({
      page: 2,
      limit: 50,
      villaId: "11111111-1111-4111-8111-111111111111",
      contractorId: "22222222-2222-4222-8222-222222222222",
      labourFrom: "2026-02-01",
      labourTo: "2026-02-28",
      sort: "labourCount:asc",
    })
  })

  it("omits default labourDate desc sort", () => {
    expect(
      buildDailyLabourListQueryParams({ ...base, sort: "labourDate:desc" }),
    ).toEqual({ page: 2, limit: 50 })
  })
})

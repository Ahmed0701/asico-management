import { describe, expect, it } from "vitest"
import { buildDailyReportsListQueryParams } from "./daily-reports.api"
import type { DailyReportsListParams } from "./daily-reports.types"

describe("buildDailyReportsListQueryParams", () => {
  const base: DailyReportsListParams = { page: 1, limit: 20 }

  it("includes contractor and engineer filters", () => {
    expect(
      buildDailyReportsListQueryParams({
        ...base,
        contractorId: "11111111-1111-4111-8111-111111111111",
        preparedByEngineerId: "22222222-2222-4222-8222-222222222222",
        reportFrom: "2026-01-01",
        weather: "SUNNY",
      }),
    ).toEqual({
      page: 1,
      limit: 20,
      contractorId: "11111111-1111-4111-8111-111111111111",
      preparedByEngineerId: "22222222-2222-4222-8222-222222222222",
      reportFrom: "2026-01-01",
      weather: "SUNNY",
    })
  })
})

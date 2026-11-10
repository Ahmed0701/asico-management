import { describe, expect, it } from "vitest"
import { buildSiteReportsListQueryParams } from "./site-reports.api"
import type { SiteReportsListParams } from "./site-reports.types"

describe("buildSiteReportsListQueryParams", () => {
  const base: SiteReportsListParams = { page: 1, limit: 20 }

  it("includes filters and sort", () => {
    expect(
      buildSiteReportsListQueryParams({
        ...base,
        villaId: "11111111-1111-4111-8111-111111111111",
        type: "SAFETY",
        rating: 4,
        visitFrom: "2026-01-01",
        visitTo: "2026-01-31",
        sort: "rating:desc",
      }),
    ).toEqual({
      page: 1,
      limit: 20,
      villaId: "11111111-1111-4111-8111-111111111111",
      type: "SAFETY",
      rating: 4,
      visitFrom: "2026-01-01",
      visitTo: "2026-01-31",
      sort: "rating:desc",
    })
  })

  it("omits default visitDate desc sort", () => {
    expect(
      buildSiteReportsListQueryParams({ ...base, sort: "visitDate:desc" }),
    ).toEqual({ page: 1, limit: 20 })
  })
})

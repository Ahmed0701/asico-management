import { describe, expect, it } from "vitest"
import { buildSmallWorksListQueryParams } from "./small-works.api"
import { smallWorksListParamsFromSearch } from "./small-works.queries"
import type { SmallWorksListParams } from "./small-works.types"

describe("buildSmallWorksListQueryParams", () => {
  const base: SmallWorksListParams = { page: 1, limit: 20 }

  it("includes filters and sort", () => {
    expect(
      buildSmallWorksListQueryParams({
        ...base,
        villaId: "11111111-1111-4111-8111-111111111111",
        contractorId: "22222222-2222-4222-8222-222222222222",
        status: "PENDING",
        startFrom: "2026-02-01",
        startTo: "2026-02-28",
        endFrom: "2026-03-01",
        endTo: "2026-03-31",
        overdue: true,
        dueSoon: true,
        search: "patch",
        sort: "contractorName:asc",
      }),
    ).toEqual({
      page: 1,
      limit: 20,
      villaId: "11111111-1111-4111-8111-111111111111",
      contractorId: "22222222-2222-4222-8222-222222222222",
      status: "PENDING",
      startFrom: "2026-02-01",
      startTo: "2026-02-28",
      endFrom: "2026-03-01",
      endTo: "2026-03-31",
      overdue: true,
      dueSoon: true,
      search: "patch",
      sort: "contractorName:asc",
    })
  })

  it("omits default endDate desc sort", () => {
    expect(
      buildSmallWorksListQueryParams({ ...base, sort: "endDate:desc" }),
    ).toEqual({ page: 1, limit: 20 })
  })
})

describe("smallWorksListParamsFromSearch", () => {
  it("syncs list filters from the URL", () => {
    const params = new URLSearchParams(
      "overdue=true&dueSoon=true&contractorId=22222222-2222-4222-8222-222222222222&startFrom=2026-01-01",
    )
    expect(smallWorksListParamsFromSearch(params)).toMatchObject({
      overdue: true,
      dueSoon: true,
      contractorId: "22222222-2222-4222-8222-222222222222",
      startFrom: "2026-01-01",
    })
  })
})

import { describe, expect, it } from "vitest"
import { buildOpenWorksListQueryParams } from "./open-works.api"
import type { OpenWorksListParams } from "./open-works.types"

describe("buildOpenWorksListQueryParams", () => {
  const base: OpenWorksListParams = { page: 2, limit: 50 }

  it("includes pagination and filters", () => {
    expect(
      buildOpenWorksListQueryParams({
        ...base,
        villaId: "11111111-1111-4111-8111-111111111111",
        elecPhaseId: "22222222-2222-4222-8222-222222222222",
        status: "IN_PROGRESS",
        overdue: true,
        search: "sleeves",
        sort: "elecPhaseName:desc",
      }),
    ).toEqual({
      page: 2,
      limit: 50,
      villaId: "11111111-1111-4111-8111-111111111111",
      elecPhaseId: "22222222-2222-4222-8222-222222222222",
      status: "IN_PROGRESS",
      overdue: true,
      search: "sleeves",
      sort: "elecPhaseName:desc",
    })
  })

  it("omits default location sort", () => {
    expect(
      buildOpenWorksListQueryParams({ ...base, sort: "location:asc" }),
    ).toEqual({ page: 2, limit: 50 })
  })

  it("drops pagination for export", () => {
    expect(
      buildOpenWorksListQueryParams(
        {
          ...base,
          elecPhaseId: "22222222-2222-4222-8222-222222222222",
        },
        {
          forExport: true,
        },
      ),
    ).toEqual({ elecPhaseId: "22222222-2222-4222-8222-222222222222" })
  })
})

import { describe, expect, it } from "vitest"
import { buildMaintenanceQueryParams } from "./maintenance.api"

describe("buildMaintenanceQueryParams", () => {
  it("asks for the open list, without a sort (newest handover first)", () => {
    expect(
      buildMaintenanceQueryParams({ page: 1, limit: 20, solved: false }),
    ).toEqual({ page: 1, limit: 20, solved: "false" })
  })

  it("asks for the solved list, most recently solved first, with the search", () => {
    expect(
      buildMaintenanceQueryParams({
        page: 2,
        limit: 50,
        solved: true,
        search: "V-1",
      }),
    ).toEqual({
      page: 2,
      limit: 50,
      solved: "true",
      search: "V-1",
      sort: "solvedAt:desc",
    })
  })
})

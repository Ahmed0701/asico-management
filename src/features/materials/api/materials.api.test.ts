import { describe, expect, it } from "vitest"
import {
  buildBalanceQueryParams,
  buildDeliveriesQueryParams,
} from "./materials.api"

describe("buildDeliveriesQueryParams", () => {
  it("sends only the page and size when nothing is filtered", () => {
    expect(buildDeliveriesQueryParams({ page: 1, limit: 20 })).toEqual({
      page: 1,
      limit: 20,
    })
  })

  it("sends every filter, the delivery note one as true or false", () => {
    expect(
      buildDeliveriesQueryParams({
        page: 2,
        limit: 50,
        search: "cable",
        villaId: "v1",
        factoryId: "f1",
        type: "CABLE",
        hasNote: false,
      }),
    ).toEqual({
      page: 2,
      limit: 50,
      search: "cable",
      villaId: "v1",
      factoryId: "f1",
      type: "CABLE",
      hasNote: "false",
    })
  })
})

describe("buildBalanceQueryParams", () => {
  it("sends the status, the material and the villa search", () => {
    expect(
      buildBalanceQueryParams({
        page: 1,
        limit: 50,
        search: "V-1",
        itemId: "i1",
        type: "SWITCHGEAR",
        status: "PENDING",
      }),
    ).toEqual({
      page: 1,
      limit: 50,
      search: "V-1",
      itemId: "i1",
      type: "SWITCHGEAR",
      status: "PENDING",
    })
  })

  it("leaves the status out to show every status", () => {
    expect(buildBalanceQueryParams({ page: 1, limit: 50 })).toEqual({
      page: 1,
      limit: 50,
    })
  })
})

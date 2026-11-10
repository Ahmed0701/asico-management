import { describe, expect, it } from "vitest"
import {
  contractorsListParamsFromSearch,
  contractorSummaryParamsFromSearch,
} from "./contractors.queries"

describe("contractorsListParamsFromSearch", () => {
  it("parses list params and ignores unknown sort", () => {
    const params = contractorsListParamsFromSearch(
      new URLSearchParams("page=2&limit=50&sort=bad&search=abc"),
    )
    expect(params.page).toBe(2)
    expect(params.limit).toBe(50)
    expect(params.sort).toBeUndefined()
    expect(params.search).toBe("abc")
  })
})

describe("contractorSummaryParamsFromSearch", () => {
  it("parses summary sort fields", () => {
    const params = contractorSummaryParamsFromSearch(
      new URLSearchParams("sort=startDate:desc"),
    )
    expect(params.sort).toBe("startDate:desc")
  })

  it("ignores invalid summary sort", () => {
    const params = contractorSummaryParamsFromSearch(
      new URLSearchParams("sort=notifiedAt:desc"),
    )
    expect(params.sort).toBeUndefined()
  })
})

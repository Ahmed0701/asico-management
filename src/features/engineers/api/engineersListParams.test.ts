import { describe, expect, it } from "vitest"
import { engineersListParamsFromSearch } from "./engineers.queries"

describe("engineersListParamsFromSearch", () => {
  it("parses search and ignores invalid sort", () => {
    const params = engineersListParamsFromSearch(
      new URLSearchParams("page=1&limit=20&search=ali&sort=invalid"),
    )
    expect(params.search).toBe("ali")
    expect(params.sort).toBeUndefined()
  })

  it("keeps valid sort values", () => {
    expect(
      engineersListParamsFromSearch(new URLSearchParams("sort=name:desc")).sort,
    ).toBe("name:desc")
  })
})

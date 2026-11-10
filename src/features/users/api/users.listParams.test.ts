import { describe, expect, it } from "vitest"
import { usersListParamsFromSearch } from "./users.queries"

describe("usersListParamsFromSearch", () => {
  it("parses role, isActive, sort, and search", () => {
    const params = usersListParamsFromSearch(
      new URLSearchParams(
        "page=2&limit=50&sort=name:desc&role=EMPLOYEE&isActive=true&search=ali",
      ),
    )
    expect(params).toMatchObject({
      page: 2,
      limit: 50,
      sort: "name:desc",
      role: "EMPLOYEE",
      isActive: true,
      search: "ali",
    })
  })

  it("ignores invalid role values", () => {
    const params = usersListParamsFromSearch(
      new URLSearchParams("role=MANAGER"),
    )
    expect(params.role).toBeUndefined()
  })
})

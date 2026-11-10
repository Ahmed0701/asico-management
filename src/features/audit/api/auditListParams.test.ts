import { describe, expect, it } from "vitest"
import { auditListParamsFromSearch } from "./audit.queries"

describe("auditListParamsFromSearch", () => {
  it("parses filters and omits invalid sort", () => {
    const params = auditListParamsFromSearch(
      new URLSearchParams(
        "page=2&limit=50&actorId=11111111-1111-4111-8111-111111111111&action=user.update&entity=User&entityId=u2&from=2026-01-01&to=2026-01-31&search=login",
      ),
    )
    expect(params.page).toBe(2)
    expect(params.limit).toBe(50)
    expect(params.actorId).toBe("11111111-1111-4111-8111-111111111111")
    expect(params.action).toBe("user.update")
    expect(params.entity).toBe("User")
    expect(params.entityId).toBe("u2")
    expect(params.from).toBe("2026-01-01")
    expect(params.to).toBe("2026-01-31")
    expect(params.search).toBe("login")
    expect(params.sort).toBeUndefined()
  })

  it("accepts createdAt asc and desc only", () => {
    expect(
      auditListParamsFromSearch(new URLSearchParams("sort=createdAt:asc")).sort,
    ).toBe("createdAt:asc")
    expect(
      auditListParamsFromSearch(new URLSearchParams("sort=createdAt:desc"))
        .sort,
    ).toBe("createdAt:desc")
    expect(
      auditListParamsFromSearch(new URLSearchParams("sort=createdAt")).sort,
    ).toBeUndefined()
  })
})

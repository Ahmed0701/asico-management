import { beforeEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import { buildAreasListQueryParams, listAreas } from "./areas.api"

describe("areas api", () => {
  beforeEach(() => {
    setAccessToken("seed-token")
  })

  it("omits default name sort on list", async () => {
    let seenSort: string | null = "unset"
    server.use(
      http.get("/api/v1/areas", ({ request }) => {
        seenSort = new URL(request.url).searchParams.get("sort")
        return HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )
    await listAreas({ page: 1, limit: 20 })
    expect(seenSort).toBeNull()
  })

  it("forExport drops pagination params", () => {
    expect(
      buildAreasListQueryParams({ page: 2, limit: 50, search: "giza" }, {
        forExport: true,
      }),
    ).toEqual({ search: "giza" })
  })
})

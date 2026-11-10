import { beforeEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import { buildVillasQueryParams, listVillas } from "./villas.api"

describe("villas.api", () => {
  beforeEach(() => {
    setAccessToken("seed-token")
  })

  it("omits sort for default location ascending", async () => {
    let seenSort: string | null = "unset"
    server.use(
      http.get("/api/v1/villas", ({ request }) => {
        seenSort = new URL(request.url).searchParams.get("sort")
        return HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )
    await listVillas({ page: 1, limit: 20 })
    expect(seenSort).toBeNull()
  })

  it("export query omits page and limit", () => {
    const q = buildVillasQueryParams({ page: 3, limit: 50, search: "v1" }, {
      forExport: true,
    })
    expect(q.page).toBeUndefined()
    expect(q.limit).toBeUndefined()
    expect(q.search).toBe("v1")
  })
})

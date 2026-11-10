import { beforeEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import { getContractorSummary, listContractors } from "./contractors.api"

describe("contractors.api", () => {
  beforeEach(() => {
    setAccessToken("seed-token")
  })

  it("omits sort for default name ascending", async () => {
    let seenSort: string | null = "unset"
    server.use(
      http.get("/api/v1/contractors", ({ request }) => {
        seenSort = new URL(request.url).searchParams.get("sort")
        return HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )
    await listContractors({ page: 1, limit: 20 })
    expect(seenSort).toBeNull()
  })

  it("summary omits sort for default villaNumber ascending", async () => {
    let seenSort: string | null = "unset"
    server.use(
      http.get("/api/v1/contractors/c1/summary", ({ request }) => {
        seenSort = new URL(request.url).searchParams.get("sort")
        return HttpResponse.json({
          data: {
            contractor: { id: "c1", name: "Acme", phone: "+1" },
            villaCount: 0,
            openWorks: null,
            smallWorks: null,
            dailyReports: null,
            labour: null,
            villas: [],
          },
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )
    await getContractorSummary("c1", { page: 1, limit: 20 })
    expect(seenSort).toBeNull()
  })
})

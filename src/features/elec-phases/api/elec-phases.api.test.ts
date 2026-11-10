import { beforeEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import {
  buildElecPhasesListQueryParams,
  listElecPhases,
} from "./elec-phases.api"

describe("elec-phases api", () => {
  beforeEach(() => {
    setAccessToken("seed-token")
  })

  it("passes status filter to list", async () => {
    let seenStatus: string | null = null
    server.use(
      http.get("/api/v1/elec-phases", ({ request }) => {
        seenStatus = new URL(request.url).searchParams.get("status")
        return HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )
    await listElecPhases({ page: 1, limit: 20, status: "ACTIVE" })
    expect(seenStatus).toBe("ACTIVE")
  })

  it("buildElecPhasesListQueryParams omits status when unset", () => {
    expect(buildElecPhasesListQueryParams({ page: 1, limit: 20 })).toEqual({
      page: 1,
      limit: 20,
    })
  })
})

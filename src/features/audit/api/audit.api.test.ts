import { beforeEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import { listAuditLogs } from "./audit.api"

describe("listAuditLogs", () => {
  beforeEach(() => {
    setAccessToken("seed-token")
  })

  it("omits sort param for newest-first default", async () => {
    let seenSort: string | null = "unset"
    server.use(
      http.get("/api/v1/audit-logs", ({ request }) => {
        seenSort = new URL(request.url).searchParams.get("sort")
        return HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )
    await listAuditLogs({ page: 1, limit: 20 })
    expect(seenSort).toBeNull()
  })

  it("sends createdAt:asc when requested", async () => {
    let seenSort: string | null = null
    server.use(
      http.get("/api/v1/audit-logs", ({ request }) => {
        seenSort = new URL(request.url).searchParams.get("sort")
        return HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )
    await listAuditLogs({ page: 1, limit: 20, sort: "createdAt:asc" })
    expect(seenSort).toBe("createdAt:asc")
  })
})

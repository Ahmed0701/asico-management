import { beforeEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import { listEngineers } from "./engineers.api"

describe("listEngineers query", () => {
  beforeEach(() => {
    setAccessToken("seed-token")
  })

  it("omits sort for default name ascending", async () => {
    let seenSort: string | null = "unset"
    server.use(
      http.get("/api/v1/civil-engineers", ({ request }) => {
        seenSort = new URL(request.url).searchParams.get("sort")
        return HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        })
      }),
    )
    await listEngineers({ page: 1, limit: 20 })
    expect(seenSort).toBeNull()
  })
})

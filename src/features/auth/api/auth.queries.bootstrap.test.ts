import { beforeEach, describe, expect, it, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { clearAccessToken } from "@/shared/auth/accessToken"
import { resetAuthRefreshBroadcastForTests } from "@/shared/auth/authRefreshBroadcast"
import { resetRefreshAccessTokenForTests } from "@/shared/api/refreshAccessToken"
import { server } from "@/test/msw/server"
import {
  bootstrapSession,
  meQueryKey,
  resetBootstrapSessionForTests,
} from "./auth.queries"

const mePayload = {
  id: "u1",
  name: "Test",
  email: "t@e.com",
  role: "EMPLOYEE" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  permissions: [],
}

describe("bootstrapSession", () => {
  beforeEach(() => {
    clearAccessToken()
    resetBootstrapSessionForTests()
    resetRefreshAccessTokenForTests()
    resetAuthRefreshBroadcastForTests()
    vi.stubGlobal("navigator", {
      ...globalThis.navigator,
      locks: {
        request: async (_name: string, fn: () => Promise<unknown>) => fn(),
      },
    })
  })

  it("runs refresh only once when called twice (StrictMode)", async () => {
    let refreshCount = 0
    server.use(
      http.post("/api/v1/auth/refresh", async () => {
        refreshCount += 1
        await new Promise((r) => setTimeout(r, 25))
        return HttpResponse.json({
          data: { accessToken: "boot-token", expiresIn: 900 },
        })
      }),
      http.get("/api/v1/me", () => HttpResponse.json({ data: mePayload })),
    )

    const qc = new QueryClient()
    const [a, b] = await Promise.all([
      bootstrapSession(qc),
      bootstrapSession(qc),
    ])

    expect(refreshCount).toBe(1)
    expect(a).toBe(true)
    expect(b).toBe(true)
    expect(qc.getQueryData(meQueryKey)).toEqual(mePayload)
  })

  it("retries /me on transient 503 before giving up", async () => {
    let meCount = 0
    server.use(
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json({
          data: { accessToken: "boot-token", expiresIn: 900 },
        }),
      ),
      http.get("/api/v1/me", () => {
        meCount += 1
        if (meCount < 3) {
          return HttpResponse.json({ code: "INTERNAL", message: "busy" }, {
            status: 503,
          })
        }
        return HttpResponse.json({ data: mePayload })
      }),
    )

    const qc = new QueryClient()
    const ok = await bootstrapSession(qc)
    expect(ok).toBe(true)
    expect(meCount).toBe(3)
    expect(qc.getQueryData(meQueryKey)).toEqual(mePayload)
  })

  it("clears session when refresh fails definitively", async () => {
    let refreshHits = 0
    server.use(
      http.post("/api/v1/auth/refresh", () => {
        refreshHits += 1
        return HttpResponse.json(
          { code: "INVALID_REFRESH_TOKEN", message: "bad" },
          { status: 401 },
        )
      }),
    )

    const qc = new QueryClient()
    const ok = await bootstrapSession(qc)
    expect(refreshHits).toBe(1)
    expect(ok).toBe(false)
    expect(qc.getQueryData(meQueryKey)).toBeUndefined()
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import i18n from "@/shared/i18n"
import { clearAccessToken, setAccessToken } from "@/shared/auth/accessToken"
import { resetAuthRefreshBroadcastForTests } from "@/shared/auth/authRefreshBroadcast"
import { registerSessionExpiredHandler } from "@/shared/auth/sessionLifecycle"
import { server } from "@/test/msw/server"
import { api, toApiError } from "./client"
import { resetRefreshAccessTokenForTests } from "./refreshAccessToken"

describe("api client", () => {
  beforeEach(() => {
    clearAccessToken()
    resetRefreshAccessTokenForTests()
    resetAuthRefreshBroadcastForTests()
    void i18n.changeLanguage("en")
  })

  it("sends Accept-Language and Bearer token", async () => {
    setAccessToken("seed-token")
    await i18n.changeLanguage("ar")
    let seenLang = ""
    let seenAuth = ""
    server.use(
      http.get("/api/v1/me", ({ request }) => {
        seenLang = request.headers.get("Accept-Language") ?? ""
        seenAuth = request.headers.get("Authorization") ?? ""
        return HttpResponse.json({
          data: {
            id: "u1",
            name: "Test",
            email: "t@e.com",
            role: "EMPLOYEE",
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
            permissions: [],
          },
        })
      }),
    )
    await api.get("/me")
    expect(seenLang).toBe("ar")
    expect(seenAuth).toBe("Bearer seed-token")
  })

  it("refreshes on TOKEN_EXPIRED then retries", async () => {
    setAccessToken("expired-token")
    let refreshCount = 0
    server.use(
      http.get("/api/v1/protected-resource", ({ request }) => {
        const auth = request.headers.get("Authorization")
        if (auth === "Bearer expired-token") {
          return HttpResponse.json(
            { error: { code: "TOKEN_EXPIRED", message: "Token expired" } },
            { status: 401 },
          )
        }
        if (auth === "Bearer refreshed-access-token") {
          return HttpResponse.json({ data: { ok: true } })
        }
        return HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
          { status: 401 },
        )
      }),
      http.post("/api/v1/auth/refresh", () => {
        refreshCount += 1
        return HttpResponse.json({
          data: { accessToken: "refreshed-access-token", expiresIn: 900 },
        })
      }),
    )
    const res = await api.get("/protected-resource")
    expect(refreshCount).toBe(1)
    expect(res.data).toEqual({ data: { ok: true } })
  })

  it("does not refresh on 401 with non-retry auth code", async () => {
    setAccessToken("valid-token")
    let refreshCount = 0
    server.use(
      http.get("/api/v1/protected-resource", () =>
        HttpResponse.json(
          { error: { code: "FORBIDDEN", message: "Forbidden" } },
          { status: 401 },
        ),
      ),
      http.post("/api/v1/auth/refresh", () => {
        refreshCount += 1
        return HttpResponse.json({
          data: { accessToken: "unused", expiresIn: 900 },
        })
      }),
    )
    await expect(api.get("/protected-resource")).rejects.toSatisfy(
      (err: unknown) => toApiError(err).status === 401,
    )
    expect(refreshCount).toBe(0)
  })

  it("refreshes once on 401 then retries", async () => {
    setAccessToken("expired-token")
    let refreshCount = 0
    server.use(
      http.get("/api/v1/protected-resource", ({ request }) => {
        const auth = request.headers.get("Authorization")
        if (auth === "Bearer expired-token") {
          return HttpResponse.json(
            { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
            { status: 401 },
          )
        }
        if (auth === "Bearer refreshed-access-token") {
          return HttpResponse.json({ data: { ok: true } })
        }
        return HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
          { status: 401 },
        )
      }),
      http.post("/api/v1/auth/refresh", () => {
        refreshCount += 1
        return HttpResponse.json({
          data: { accessToken: "refreshed-access-token", expiresIn: 900 },
        })
      }),
    )
    const res = await api.get("/protected-resource")
    expect(refreshCount).toBe(1)
    expect(res.data).toEqual({ data: { ok: true } })
  })

  it("shares one refresh for concurrent 401s", async () => {
    setAccessToken("expired-token")
    let refreshCount = 0
    server.use(
      http.get("/api/v1/protected-resource", ({ request }) => {
        const auth = request.headers.get("Authorization")
        if (auth === "Bearer expired-token") {
          return HttpResponse.json(
            { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
            { status: 401 },
          )
        }
        return HttpResponse.json({ data: { ok: true } })
      }),
      http.post("/api/v1/auth/refresh", async () => {
        refreshCount += 1
        await new Promise((r) => setTimeout(r, 30))
        return HttpResponse.json({
          data: { accessToken: "refreshed-access-token", expiresIn: 900 },
        })
      }),
    )
    await Promise.all([
      api.get("/protected-resource"),
      api.get("/protected-resource"),
    ])
    expect(refreshCount).toBe(1)
  })

  it("notifies session expiry when refresh fails", async () => {
    setAccessToken("expired-token")
    const onExpired = vi.fn()
    registerSessionExpiredHandler(onExpired)
    server.use(
      http.get("/api/v1/protected-resource", () =>
        HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
          { status: 401 },
        ),
      ),
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json(
          {
            error: {
              code: "INVALID_REFRESH_TOKEN",
              message: "Invalid refresh",
            },
          },
          { status: 401 },
        ),
      ),
    )
    await expect(api.get("/protected-resource")).rejects.toSatisfy(
      (err: unknown) => toApiError(err).status === 401,
    )
    expect(onExpired).toHaveBeenCalled()
  })
})

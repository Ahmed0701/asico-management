import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import {
  applyAccessToken,
  clearAccessToken,
  getAccessToken,
} from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import {
  ACCESS_REFRESH_LEAD_MS,
  scheduleProactiveAccessRefresh,
  stopProactiveAccessRefresh,
} from "./proactiveAccessRefresh"

describe("proactiveAccessRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAccessToken()
    stopProactiveAccessRefresh()
  })

  afterEach(() => {
    stopProactiveAccessRefresh()
    vi.useRealTimers()
  })

  it("refreshes access token before expiry", async () => {
    let refreshCount = 0
    server.use(
      http.post("/api/v1/auth/refresh", () => {
        refreshCount += 1
        return HttpResponse.json({
          data: { accessToken: "rotated-token", expiresIn: 900 },
        })
      }),
    )

    applyAccessToken("initial-token", 900)
    scheduleProactiveAccessRefresh()

    const waitMs = 900 * 1000 - ACCESS_REFRESH_LEAD_MS
    await vi.advanceTimersByTimeAsync(waitMs)

    expect(refreshCount).toBe(1)
    expect(getAccessToken()).toBe("rotated-token")
  })
})

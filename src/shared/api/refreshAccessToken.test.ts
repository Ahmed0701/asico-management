import { beforeEach, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/shared/auth/accessToken"
import {
  ensureAuthRefreshBroadcast,
  resetAuthRefreshBroadcastForTests,
  seedPeerRefreshedAccessForTests,
} from "@/shared/auth/authRefreshBroadcast"
import { registerSessionExpiredHandler } from "@/shared/auth/sessionLifecycle"
import { server } from "@/test/msw/server"
import {
  refreshAccessToken,
  resetRefreshAccessTokenForTests,
} from "./refreshAccessToken"

class FakeBroadcastChannel {
  static readonly peers = new Map<string, Set<FakeBroadcastChannel>>()
  readonly name: string
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(name: string) {
    this.name = name
    if (!FakeBroadcastChannel.peers.has(name)) {
      FakeBroadcastChannel.peers.set(name, new Set())
    }
    FakeBroadcastChannel.peers.get(name)!.add(this)
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (type === "message") this.onmessage = listener
  }

  postMessage(data: unknown) {
    for (const peer of FakeBroadcastChannel.peers.get(this.name) ?? []) {
      if (peer !== this && peer.onmessage) {
        peer.onmessage({ data } as MessageEvent)
      }
    }
  }

  close() {
    FakeBroadcastChannel.peers.get(this.name)?.delete(this)
  }

  static resetAll() {
    FakeBroadcastChannel.peers.clear()
  }
}

describe("refreshAccessToken", () => {
  beforeEach(() => {
    clearAccessToken()
    resetRefreshAccessTokenForTests()
    resetAuthRefreshBroadcastForTests()
    FakeBroadcastChannel.resetAll()
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel)
    ensureAuthRefreshBroadcast()
    vi.stubGlobal("navigator", {
      ...globalThis.navigator,
      locks: {
        request: async (_name: string, fn: () => Promise<unknown>) => fn(),
      },
    })
  })

  it("shares one in-flight refresh for concurrent callers", async () => {
    let refreshCount = 0
    server.use(
      http.post("/api/v1/auth/refresh", async () => {
        refreshCount += 1
        await new Promise((r) => setTimeout(r, 20))
        return HttpResponse.json({
          data: { accessToken: "shared-token", expiresIn: 900 },
        })
      }),
    )

    const [a, b] = await Promise.all([
      refreshAccessToken({ notifyExpiry: false }),
      refreshAccessToken({ notifyExpiry: false }),
    ])

    expect(refreshCount).toBe(1)
    expect(a?.accessToken).toBe("shared-token")
    expect(b?.accessToken).toBe("shared-token")
  })

  it("retries on 503 then succeeds without logout", async () => {
    const onExpired = vi.fn()
    registerSessionExpiredHandler(onExpired)
    let refreshCount = 0
    server.use(
      http.post("/api/v1/auth/refresh", () => {
        refreshCount += 1
        if (refreshCount < 2) {
          return HttpResponse.json({ code: "INTERNAL", message: "busy" }, {
            status: 503,
          })
        }
        return HttpResponse.json({
          data: { accessToken: "after-retry", expiresIn: 900 },
        })
      }),
    )

    setAccessToken("old")
    const result = await refreshAccessToken({ notifyExpiry: true })
    expect(result?.accessToken).toBe("after-retry")
    expect(refreshCount).toBe(2)
    expect(onExpired).not.toHaveBeenCalled()
  })

  it("does not notify on transient failure after retries", async () => {
    vi.useFakeTimers()
    const onExpired = vi.fn()
    registerSessionExpiredHandler(onExpired)
    setAccessToken("keep-me")
    server.use(
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json({ code: "INTERNAL", message: "down" }, {
          status: 503,
        }),
      ),
    )

    const resultPromise = refreshAccessToken({ notifyExpiry: true })
    await vi.runAllTimersAsync()
    const result = await resultPromise
    vi.useRealTimers()

    expect(result).toBeNull()
    expect(getAccessToken()).toBe("keep-me")
    expect(onExpired).not.toHaveBeenCalled()
  })

  it("notifies only on definitive refresh 401", async () => {
    const onExpired = vi.fn()
    registerSessionExpiredHandler(onExpired)
    server.use(
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json({ code: "INVALID_REFRESH_TOKEN", message: "bad" }, {
          status: 401,
        }),
      ),
    )

    const result = await refreshAccessToken({ notifyExpiry: true })
    expect(result).toBeNull()
    expect(getAccessToken()).toBeNull()
    expect(onExpired).toHaveBeenCalledTimes(1)
  })

  it("retries once on REFRESH_CONFLICT", async () => {
    let refreshCount = 0
    server.use(
      http.post("/api/v1/auth/refresh", () => {
        refreshCount += 1
        if (refreshCount === 1) {
          return HttpResponse.json(
            { code: "REFRESH_CONFLICT", message: "conflict" },
            { status: 409 },
          )
        }
        return HttpResponse.json({
          data: { accessToken: "after-conflict", expiresIn: 900 },
        })
      }),
    )

    const result = await refreshAccessToken({ notifyExpiry: false })
    expect(refreshCount).toBe(2)
    expect(result?.accessToken).toBe("after-conflict")
  })

  it("two simulated tabs: second call reuses peer after first refresh", async () => {
    let refreshCount = 0
    server.use(
      http.post("/api/v1/auth/refresh", () => {
        refreshCount += 1
        return HttpResponse.json({
          data: { accessToken: "tab-a-token", expiresIn: 900 },
        })
      }),
    )

    await refreshAccessToken({ notifyExpiry: false })
    expect(refreshCount).toBe(1)

    resetRefreshAccessTokenForTests()
    clearAccessToken()
    seedPeerRefreshedAccessForTests("tab-a-token", 900)
    await refreshAccessToken({ notifyExpiry: false })
    expect(refreshCount).toBe(1)
  })

  it("uses peer snapshot instead of calling refresh", async () => {
    let refreshCount = 0
    server.use(
      http.post("/api/v1/auth/refresh", () => {
        refreshCount += 1
        return HttpResponse.json({
          data: { accessToken: "should-not-call", expiresIn: 900 },
        })
      }),
    )

    seedPeerRefreshedAccessForTests("peer-token", 900)
    const result = await refreshAccessToken({ notifyExpiry: false })
    expect(result?.accessToken).toBe("peer-token")
    expect(refreshCount).toBe(0)
    expect(getAccessToken()).toBe("peer-token")
  })
})

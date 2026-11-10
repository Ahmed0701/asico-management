import { describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { setAccessToken } from "@/shared/auth/accessToken"
import { api } from "../client"
import { buildWriteHeaders, executeWrite } from "./index"

describe("executeWrite", () => {
  it("retries IN_PROGRESS once after Retry-After", async () => {
    setAccessToken("t")
    let calls = 0
    server.use(
      http.post("/api/v1/users", () => {
        calls += 1
        if (calls === 1) {
          return HttpResponse.json(
            { code: "IDEMPOTENCY_IN_PROGRESS", message: "wait" },
            { status: 409, headers: { "Retry-After": "0" } },
          )
        }
        return HttpResponse.json({ data: { id: "u1", version: 1 } })
      }),
    )
    const write = { idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }
    await executeWrite(write, () =>
      api.post("/users", { name: "a" }, { headers: buildWriteHeaders(write) }),
    )
    expect(calls).toBe(2)
  })

  it("retries transient 5xx at most twice with the same key", async () => {
    setAccessToken("t")
    let calls = 0
    vi.useFakeTimers()
    server.use(
      http.post("/api/v1/users", () => {
        calls += 1
        if (calls <= 2) {
          return HttpResponse.json(
            { code: "INTERNAL_ERROR", message: "down" },
            { status: 503 },
          )
        }
        return HttpResponse.json({ data: { id: "u1", version: 1 } })
      }),
    )
    const write = { idempotencyKey: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }
    const promise = executeWrite(write, () =>
      api.post("/users", { name: "a" }, { headers: buildWriteHeaders(write) }),
    )
    await vi.runAllTimersAsync()
    await promise
    expect(calls).toBe(3)
    vi.useRealTimers()
  })
})

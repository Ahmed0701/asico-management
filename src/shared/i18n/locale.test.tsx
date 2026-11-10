import { act, render, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import Providers from "@/app/providers"
import { setAccessToken } from "@/shared/auth/accessToken"
import { useUiStore } from "@/shared/lib/store"
import { server } from "@/test/msw/server"
import { api } from "@/shared/api/client"

describe("locale switch", () => {
  it("updates document dir and Accept-Language header", async () => {
    render(<Providers>{null}</Providers>)
    setAccessToken("seed-token")
    act(() => {
      useUiStore.getState().setLang("ar")
    })
    await waitFor(() => expect(document.documentElement.dir).toBe("rtl"))
    expect(document.documentElement.lang).toBe("ar")

    let lang = ""
    server.use(
      http.get("/api/v1/me", ({ request }) => {
        lang = request.headers.get("Accept-Language") ?? ""
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
    expect(lang).toBe("ar")

    act(() => {
      useUiStore.getState().setLang("en")
    })
    await waitFor(() => expect(document.documentElement.dir).toBe("ltr"))
    await api.get("/me")
    expect(lang).toBe("en")
  })
})

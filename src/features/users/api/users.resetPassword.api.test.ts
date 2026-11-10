import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { setAccessToken } from "@/shared/auth/accessToken"
import { toApiError } from "@/shared/api/errors"
import { resetUserPassword } from "./users.api"

describe("resetUserPassword API", () => {
  it("surfaces flat error body on 502", async () => {
    setAccessToken("t")
    server.use(
      http.post("/api/v1/users/u1/reset-password", () =>
        HttpResponse.json(
          {
            code: "EMAIL_DELIVERY_FAILED",
            message: "SMTP down",
            requestId: "req-502",
          },
          { status: 502 },
        ),
      ),
    )
    try {
      await resetUserPassword("u1", {
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      })
      expect.unreachable("should throw")
    } catch (err) {
      const apiErr = toApiError(err)
      expect(apiErr.code).toBe("EMAIL_DELIVERY_FAILED")
      expect(apiErr.message).toBe("SMTP down")
      expect(apiErr.requestId).toBe("req-502")
    }
  })
})

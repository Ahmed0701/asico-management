import { describe, expect, it } from "vitest"
import { AxiosError } from "axios"
import { toApiError } from "./errors"

describe("toApiError", () => {
  it("maps flat API error bodies", () => {
    const err = {
      isAxiosError: true,
      message: "Request failed with status code 403",
      response: {
        status: 403,
        data: {
          code: "FORBIDDEN",
          message: "Missing permission",
          requestId: "req-123",
        },
      },
    } as AxiosError
    const parsed = toApiError(err)
    expect(parsed.code).toBe("FORBIDDEN")
    expect(parsed.message).toBe("Missing permission")
    expect(parsed.requestId).toBe("req-123")
    expect(parsed.status).toBe(403)
  })

  it("does not treat axios errors as already-normalized ApiError", () => {
    const err = {
      isAxiosError: true,
      code: "ERR_BAD_RESPONSE",
      message: "Request failed with status code 502",
      status: 502,
      response: {
        status: 502,
        data: {
          code: "EMAIL_DELIVERY_FAILED",
          message: "SMTP down",
        },
      },
    } as AxiosError
    const parsed = toApiError(err)
    expect(parsed.code).toBe("EMAIL_DELIVERY_FAILED")
    expect(parsed.message).toBe("SMTP down")
    expect(parsed.status).toBe(502)
  })
})

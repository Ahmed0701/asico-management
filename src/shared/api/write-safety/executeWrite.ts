import type { AxiosError } from "axios"
import { toApiError } from "../errors"
import type { ApiError } from "../types"
import { IdempotencyClientError, isIdempotencyRotateCode } from "./errors"
import type { WriteRequest } from "./types"

const TRANSIENT_HTTP = new Set([502, 503, 504])
const TRANSIENT_MS = [500, 1000] as const

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function retryAfterSeconds(error: unknown): number {
  const ax = error as AxiosError
  const raw = ax.response?.headers?.["retry-after"]
  const header = Array.isArray(raw) ? raw[0] : raw
  const n = header === undefined ? Number.NaN : Number(header)
  return Number.isFinite(n) && n >= 0 ? n : 1
}

function isTransientFailure(error: ApiError): boolean {
  if (error.status === 0) return true
  if (!TRANSIENT_HTTP.has(error.status)) return false
  if (error.code === "EMAIL_DELIVERY_FAILED") return false
  return true
}

/**
 * Runs a write once with idempotency / If-Match already applied inside `run`.
 * Retries IN_PROGRESS (once after Retry-After) and transient failures (twice).
 */
export async function executeWrite<T>(
  write: WriteRequest,
  run: () => Promise<T>,
): Promise<T> {
  let transientAttempts = 0
  let inProgressRetried = false

  const attempt = async (): Promise<T> => {
    try {
      return await run()
    } catch (error) {
      const apiErr = toApiError(error)

      if (apiErr.code === "IDEMPOTENCY_IN_PROGRESS" && !inProgressRetried) {
        inProgressRetried = true
        await sleep(retryAfterSeconds(error) * 1000)
        return attempt()
      }

      if (isIdempotencyRotateCode(apiErr.code)) {
        console.error(
          "[write-safety] idempotency key must rotate",
          apiErr.requestId ?? "",
        )
        throw new IdempotencyClientError(apiErr)
      }

      if (apiErr.code === "VERSION_CONFLICT") {
        throw error
      }

      if (
        isTransientFailure(apiErr) &&
        transientAttempts < TRANSIENT_MS.length
      ) {
        await sleep(TRANSIENT_MS[transientAttempts])
        transientAttempts += 1
        return attempt()
      }

      throw error
    }
  }

  void write
  return attempt()
}

export function createIdempotencyKey(): string {
  return crypto.randomUUID()
}

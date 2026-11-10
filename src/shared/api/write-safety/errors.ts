import type { ApiError } from "../types"

export class IdempotencyClientError extends Error {
  readonly apiError: ApiError

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.name = "IdempotencyClientError"
    this.apiError = apiError
  }
}

const IDEMPOTENCY_ROTATE_CODES = new Set([
  "IDEMPOTENCY_KEY_REUSED",
  "INVALID_IDEMPOTENCY_KEY",
])

export function isIdempotencyRotateCode(code: string): boolean {
  return IDEMPOTENCY_ROTATE_CODES.has(code)
}

export function conflictVersionFromError(error: ApiError): number | undefined {
  const detail = error.details?.find((d) => d.path === "version")
  if (detail && typeof detail.value === "number") return detail.value
  if (detail && typeof detail.value === "string") {
    const n = Number(detail.value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

export function isRecordNotFound(error: ApiError): boolean {
  return error.status === 404
}

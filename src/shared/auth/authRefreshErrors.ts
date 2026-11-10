import type { AxiosError } from "axios"
import { isApiErrorBody, isApiErrorFlatBody } from "@/shared/api/errors"

export function readAxiosErrorCode(error: unknown): string | undefined {
  const ax = error as AxiosError
  let body: unknown = ax.response?.data
  if (typeof body === "string") {
    try {
      body = (JSON.parse(body) as unknown)
    } catch {
      body = undefined
    }
  }
  if (isApiErrorFlatBody(body)) return body.code
  if (isApiErrorBody(body)) return body.error.code
  return undefined
}

export function readAxiosStatus(error: unknown): number {
  const ax = error as AxiosError
  return ax.response?.status ?? 0
}

/** Definitive /auth/refresh failures: clear session and optionally redirect. */
export function isDefinitiveRefreshFailure(
  status: number,
  code: string | undefined,
): boolean {
  if (status === 403 && code === "ACCOUNT_INACTIVE") return true
  if (status === 401 && code === "INVALID_REFRESH_TOKEN") return true
  if (status === 401 && code === "REFRESH_TOKEN_REUSED") return true
  return false
}

export function isRefreshConflict(
  status: number,
  code: string | undefined,
): boolean {
  return status === 409 && code === "REFRESH_CONFLICT"
}

export function isTransientRefreshFailure(
  status: number,
  code: string | undefined,
  hasResponse: boolean,
): boolean {
  if (status === 401) return false
  if (!hasResponse) return true
  if (isRefreshConflict(status, code)) return true
  if (status === 429) return true
  if (status >= 500) return true
  return false
}

/** Protected API 401: refresh access and replay when true. */
export function shouldRefreshAccessOn401(code: string | undefined): boolean {
  if (code === "TOKEN_EXPIRED") return true
  if (code === "UNAUTHORIZED" || code === undefined) return true
  return false
}

export function isTransientMeFailure(status: number): boolean {
  if (status === 0) return true
  if (status === 429) return true
  if (status >= 500) return true
  return false
}

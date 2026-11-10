import type { AxiosError } from "axios"
import type { ApiError, ApiErrorBody, ApiErrorFlatBody } from "./types"

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") return false
  const err = (value as ApiErrorBody).error
  return (
    !!err && typeof err.code === "string" && typeof err.message === "string"
  )
}

export function isApiErrorFlatBody(value: unknown): value is ApiErrorFlatBody {
  if (!value || typeof value !== "object") return false
  const body = value as ApiErrorFlatBody
  return typeof body.code === "string" && typeof body.message === "string"
}

function statusFromAxios(ax: AxiosError): number {
  if (ax.response?.status) return ax.response.status
  const match = /status code (\d+)/.exec(ax.message)
  return match ? Number(match[1]) : 0
}

function readErrorBody(ax: AxiosError): unknown {
  let body: unknown = ax.response?.data
  if (typeof body === "string") {
    try {
      body = (JSON.parse(body) as unknown)
    } catch {
      body = undefined
    }
  }
  return body
}

function fromFlatBody(status: number, body: ApiErrorFlatBody): ApiError {
  return {
    status,
    code: body.code,
    message: body.message,
    details: body.details,
    requestId: body.requestId,
  }
}

export function toApiError(error: unknown): ApiError {
  const ax = error as AxiosError<ApiErrorBody>
  const isAxios = typeof ax?.isAxiosError === "boolean" && ax.isAxiosError
  if (
    !isAxios &&
    error &&
    typeof error === "object" &&
    "status" in error &&
    "code" in error &&
    "message" in error
  ) {
    return error as ApiError
  }
  if (!isAxios) {
    return {
      status: 0,
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error",
    }
  }
  const status = statusFromAxios(ax)
  const body = readErrorBody(ax)
  if (isApiErrorFlatBody(body)) {
    return fromFlatBody(status, body)
  }
  if (isApiErrorBody(body)) {
    return {
      status,
      code: body.error.code,
      message: body.error.message,
      details: body.error.details,
    }
  }
  if (status === 401) {
    return {
      status,
      code: "INVALID_CREDENTIALS",
      message: ax.message || "Unauthorized",
    }
  }
  if (status === 403) {
    return {
      status,
      code: "FORBIDDEN",
      message: ax.message || "Forbidden",
    }
  }
  return {
    status,
    code: "NETWORK_ERROR",
    message: ax.message || "Network error",
  }
}

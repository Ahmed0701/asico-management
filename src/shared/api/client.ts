import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import {
  readAxiosErrorCode,
  shouldRefreshAccessOn401,
} from "@/shared/auth/authRefreshErrors"
import { isApiErrorBody, toApiError } from "./errors"
import { refreshAccessToken } from "./refreshAccessToken"
import { api } from "./clientCore"
import type { ApiErrorBody, ApiSuccess } from "./types"

export { api } from "./clientCore"
export { refreshAccessToken } from "./refreshAccessToken"
export { toApiError }
export type { ApiError } from "./types"

const REFRESH_PATH = "/auth/refresh"
const NO_REFRESH_RETRY = new Set([
  "/auth/login",
  REFRESH_PATH,
  "/auth/change-password",
])

function requestPath(config: InternalAxiosRequestConfig): string {
  const url = config.url ?? ""
  if (url.startsWith("http")) {
    try {
      return new URL(url).pathname.replace(/^\/api\/v1/, "") || "/"
    } catch {
      return url
    }
  }
  const base = config.baseURL ?? ""
  const combined = `${base}/${url}`.replace(/\/+/g, "/")
  return combined.replace(/^\/api\/v1/, "") || "/"
}

function shouldSkipRefreshRetry(config: InternalAxiosRequestConfig): boolean {
  const path = requestPath(config)
  for (const blocked of NO_REFRESH_RETRY) {
    if (path === blocked || path.endsWith(blocked)) return true
  }
  return false
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    const code = readAxiosErrorCode(error)
    if (
      !config ||
      error.response?.status !== 401 ||
      !shouldRefreshAccessOn401(code) ||
      shouldSkipRefreshRetry(config) ||
      config._retry
    ) {
      return Promise.reject(toApiError(error))
    }

    config._retry = true
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      return Promise.reject(toApiError(error))
    }
    config.headers.Authorization = `Bearer ${refreshed.accessToken}`
    return api.request(config)
  },
)

export async function unwrap<T>(
  promise: Promise<{ data: ApiSuccess<T> }>,
): Promise<T> {
  const { data } = await promise
  return data.data
}

export function parseAxiosData<T>(body: unknown): T | null {
  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiSuccess<T>).data
  }
  return null
}

export function isAxiosApiError(
  error: unknown,
): error is ReturnType<typeof toApiError> {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error
  )
}

export { isApiErrorBody }

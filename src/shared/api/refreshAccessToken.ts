import {
  applyAccessToken,
  clearAccessToken,
  getAccessToken,
} from "@/shared/auth/accessToken"
import {
  broadcastAuthToken,
  ensureAuthRefreshBroadcast,
  takePeerRefreshedAccess,
} from "@/shared/auth/authRefreshBroadcast"
import {
  isDefinitiveRefreshFailure,
  isRefreshConflict,
  isTransientRefreshFailure,
  readAxiosErrorCode,
  readAxiosStatus,
} from "@/shared/auth/authRefreshErrors"
import { withAuthRefreshLock } from "@/shared/auth/authRefreshLock"
import { backoffDelay, refreshConflictDelay } from "@/shared/auth/retryDelay"
import { stopProactiveAccessRefresh } from "@/shared/auth/accessRefreshTimer"
import { scheduleProactiveAccessRefresh } from "@/shared/auth/proactiveAccessRefresh"
import { notifySessionExpired } from "@/shared/auth/sessionLifecycle"
import { toApiError } from "./errors"
import type { ApiSuccess } from "./types"
import { api } from "./clientCore"

export type RefreshedAccess = {
  accessToken: string
  expiresIn: number
}

let refreshPromise: Promise<RefreshedAccess | null> | null = null

export type RefreshAccessTokenOptions = {
  /** When false, failed refresh clears tokens without redirecting (e.g. cold bootstrap). */
  notifyExpiry?: boolean
}

class RefreshFailedError extends Error {
  readonly kind: "definitive" | "transient"
  constructor(kind: "definitive" | "transient") {
    super(kind)
    this.kind = kind
  }
}

async function postRefreshHttp(): Promise<RefreshedAccess> {
  const { data } =
    await api.post<ApiSuccess<{
      accessToken: string
      expiresIn: number
    }>>("/auth/refresh")
  return data.data
}

async function postRefreshWithRetries(): Promise<RefreshedAccess> {
  let transientAttempts = 0
  let conflictRetried = false

  while (true) {
    const peer = takePeerRefreshedAccess()
    if (peer && getAccessToken() === peer.accessToken) {
      return peer
    }
    if (peer) {
      applyAccessToken(peer.accessToken, peer.expiresIn)
      return peer
    }

    try {
      return await postRefreshHttp()
    } catch (error) {
      const apiErr = toApiError(error)
      const status = apiErr.status || readAxiosStatus(error)
      const code = readAxiosErrorCode(error) ?? apiErr.code
      const hasResponse = status > 0

      if (isDefinitiveRefreshFailure(status, code)) {
        throw new RefreshFailedError("definitive")
      }

      if (isRefreshConflict(status, code)) {
        if (!conflictRetried) {
          conflictRetried = true
          await refreshConflictDelay()
          continue
        }
        throw new RefreshFailedError("transient")
      }

      if (
        isTransientRefreshFailure(status, code, hasResponse) &&
        transientAttempts < 3
      ) {
        transientAttempts += 1
        await backoffDelay(transientAttempts - 1)
        continue
      }

      throw new RefreshFailedError("transient")
    }
  }
}

async function applySuccessfulRefresh(
  body: RefreshedAccess,
): Promise<RefreshedAccess> {
  applyAccessToken(body.accessToken, body.expiresIn)
  broadcastAuthToken(body.accessToken, body.expiresIn)
  scheduleProactiveAccessRefresh()
  return body
}

async function executeRefresh(
  options?: RefreshAccessTokenOptions,
): Promise<RefreshedAccess | null> {
  ensureAuthRefreshBroadcast()
  const notifyExpiry = options?.notifyExpiry !== false

  try {
    const body = await withAuthRefreshLock(() => postRefreshWithRetries())
    return await applySuccessfulRefresh(body)
  } catch (error) {
    if (error instanceof RefreshFailedError && error.kind === "definitive") {
      clearAccessToken()
      stopProactiveAccessRefresh()
      if (notifyExpiry) {
        notifySessionExpired()
      }
      return null
    }
    return null
  }
}

export async function refreshAccessToken(
  options?: RefreshAccessTokenOptions,
): Promise<RefreshedAccess | null> {
  if (!refreshPromise) {
    refreshPromise = executeRefresh(options).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/** Test-only reset of in-flight refresh state. */
export function resetRefreshAccessTokenForTests(): void {
  refreshPromise = null
}

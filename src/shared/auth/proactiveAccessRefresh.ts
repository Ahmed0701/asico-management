import { getAccessExpiresAtMs } from "@/shared/auth/accessToken"
import { refreshAccessToken } from "@/shared/api/refreshAccessToken"
import { armProactiveAccessRefreshTimer } from "@/shared/auth/accessRefreshTimer"

export { stopProactiveAccessRefresh } from "@/shared/auth/accessRefreshTimer"

/** Refresh this long before the access JWT expires. */
export const ACCESS_REFRESH_LEAD_MS = 2 * 60 * 1000

let visibilityRegistered = false

function msUntilScheduledRefresh(): number | null {
  const expiresAt = getAccessExpiresAtMs()
  if (!expiresAt) return null
  const target = expiresAt - ACCESS_REFRESH_LEAD_MS
  return Math.max(0, target - Date.now())
}

function runScheduledRefresh(): void {
  void refreshAccessToken().finally(() => {
    scheduleProactiveAccessRefresh()
  })
}

export function scheduleProactiveAccessRefresh(): void {
  const delay = msUntilScheduledRefresh()
  if (delay === null) return
  armProactiveAccessRefreshTimer(delay, runScheduledRefresh)
}

function onVisibilityChange(): void {
  if (document.visibilityState !== "visible") return
  const expiresAt = getAccessExpiresAtMs()
  if (!expiresAt) return
  if (expiresAt - Date.now() > ACCESS_REFRESH_LEAD_MS) return
  void refreshAccessToken().finally(() => {
    scheduleProactiveAccessRefresh()
  })
}

export function ensureProactiveAccessRefreshListeners(): void {
  if (visibilityRegistered || typeof document === "undefined") return
  visibilityRegistered = true
  document.addEventListener("visibilitychange", onVisibilityChange)
}

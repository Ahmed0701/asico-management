let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null

export function stopProactiveAccessRefresh(): void {
  if (refreshTimeoutId !== null) {
    clearTimeout(refreshTimeoutId)
    refreshTimeoutId = null
  }
}

export function armProactiveAccessRefreshTimer(
  delayMs: number,
  onFire: () => void,
): void {
  stopProactiveAccessRefresh()
  if (delayMs < 0) return
  refreshTimeoutId = setTimeout(() => {
    refreshTimeoutId = null
    onFire()
  }, delayMs)
}

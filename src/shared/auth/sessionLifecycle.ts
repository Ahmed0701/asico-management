type SessionExpiredHandler = () => void

let onSessionExpired: SessionExpiredHandler | null = null

export function registerSessionExpiredHandler(
  handler: SessionExpiredHandler,
): () => void {
  onSessionExpired = handler
  return () => {
    if (onSessionExpired === handler) onSessionExpired = null
  }
}

export function notifySessionExpired(): void {
  onSessionExpired?.()
}

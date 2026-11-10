const LOCK_NAME = "auth-refresh"

export async function withAuthRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.locks?.request === "function"
  ) {
    return navigator.locks.request(LOCK_NAME, fn)
  }
  return fn()
}

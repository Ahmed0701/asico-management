const BACKOFF_MS = [1000, 2000, 4000] as const

export function jitterMs(maxJitter = 200): number {
  return Math.floor(Math.random() * maxJitter)
}

export async function delay(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
}

export async function backoffDelay(attemptIndex: number): Promise<void> {
  const base = BACKOFF_MS[Math.min(attemptIndex, BACKOFF_MS.length - 1)]
  await delay(base + jitterMs())
}

export async function refreshConflictDelay(): Promise<void> {
  await delay(200 + Math.floor(Math.random() * 300))
}

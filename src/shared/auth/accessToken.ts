let accessToken: string | null = null
let accessExpiresAtMs: number | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function getAccessExpiresAtMs(): number | null {
  return accessExpiresAtMs
}

export function applyAccessToken(
  token: string,
  expiresInSeconds: number,
): void {
  accessToken = token
  accessExpiresAtMs = Date.now() + expiresInSeconds * 1000
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  if (!token) {
    accessExpiresAtMs = null
  }
}

export function clearAccessToken(): void {
  accessToken = null
  accessExpiresAtMs = null
}

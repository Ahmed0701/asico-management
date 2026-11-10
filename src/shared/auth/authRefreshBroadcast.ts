import {
  applyAccessToken,
  clearAccessToken,
  getAccessToken,
} from "@/shared/auth/accessToken"
import { notifySessionExpired } from "@/shared/auth/sessionLifecycle"

const CHANNEL_NAME = "asico-auth"

export type AuthBroadcastMessage = {
  type: "token"
  accessToken: string
  expiresIn: number
} | { type: "logout" }

let channel: BroadcastChannel | null = null
let listening = false

let peerSnapshot: {
  accessToken: string
  expiresIn: number
  receivedAt: number
} | null = null

function onMessage(event: MessageEvent<AuthBroadcastMessage>): void {
  const msg = event.data
  if (!msg || typeof msg !== "object") return
  if (msg.type === "token") {
    peerSnapshot = {
      accessToken: msg.accessToken,
      expiresIn: msg.expiresIn,
      receivedAt: Date.now(),
    }
    if (getAccessToken() !== msg.accessToken) {
      applyAccessToken(msg.accessToken, msg.expiresIn)
      void import("@/shared/auth/proactiveAccessRefresh").then((m) => {
        m.scheduleProactiveAccessRefresh()
      })
    }
    return
  }
  if (msg.type === "logout") {
    clearAccessToken()
    void import("@/shared/auth/proactiveAccessRefresh").then((m) => {
      m.stopProactiveAccessRefresh()
    })
    notifySessionExpired()
  }
}

export function ensureAuthRefreshBroadcast(): void {
  if (listening || typeof window === "undefined") return
  if (typeof BroadcastChannel === "undefined") return
  listening = true
  channel = new BroadcastChannel(CHANNEL_NAME)
  channel.addEventListener("message", onMessage)
}

export function broadcastAuthToken(
  accessToken: string,
  expiresIn: number,
): void {
  ensureAuthRefreshBroadcast()
  peerSnapshot = { accessToken, expiresIn, receivedAt: Date.now() }
  channel?.postMessage({
    type: "token",
    accessToken,
    expiresIn,
  } satisfies AuthBroadcastMessage)
}

export function broadcastAuthLogout(): void {
  ensureAuthRefreshBroadcast()
  channel?.postMessage({ type: "logout" } satisfies AuthBroadcastMessage)
}

export function takePeerRefreshedAccess(
  maxAgeMs = 5000,
): {
  accessToken: string
  expiresIn: number
} | null {
  if (!peerSnapshot) return null
  if (Date.now() - peerSnapshot.receivedAt > maxAgeMs) return null
  return {
    accessToken: peerSnapshot.accessToken,
    expiresIn: peerSnapshot.expiresIn,
  }
}

export function resetAuthRefreshBroadcastForTests(): void {
  peerSnapshot = null
  if (channel) {
    channel.close()
    channel = null
  }
  listening = false
}

/** Test-only: simulate another tab's refresh without applying the token locally. */
export function seedPeerRefreshedAccessForTests(
  accessToken: string,
  expiresIn: number,
): void {
  peerSnapshot = { accessToken, expiresIn, receivedAt: Date.now() }
}

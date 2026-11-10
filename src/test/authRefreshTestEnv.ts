import { stopProactiveAccessRefresh } from "@/shared/auth/accessRefreshTimer"
import { vi } from "vitest"

/** Minimal BroadcastChannel for jsdom auth refresh tests. */
export class FakeBroadcastChannel {
  static readonly peers = new Map<string, Set<FakeBroadcastChannel>>()
  readonly name: string
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(name: string) {
    this.name = name
    if (!FakeBroadcastChannel.peers.has(name)) {
      FakeBroadcastChannel.peers.set(name, new Set())
    }
    FakeBroadcastChannel.peers.get(name)!.add(this)
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (type === "message") this.onmessage = listener
  }

  postMessage(data: unknown) {
    for (const peer of FakeBroadcastChannel.peers.get(this.name) ?? []) {
      if (peer !== this && peer.onmessage) {
        peer.onmessage({ data } as MessageEvent)
      }
    }
  }

  close() {
    FakeBroadcastChannel.peers.get(this.name)?.delete(this)
  }

  static resetAll() {
    FakeBroadcastChannel.peers.clear()
  }
}

export function installAuthRefreshTestEnv(): void {
  FakeBroadcastChannel.resetAll()
  vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel)
  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    locks: {
      request: async (_name: string, fn: () => Promise<unknown>) => fn(),
    },
  })
}

export function resetAuthRefreshTestEnv(): void {
  FakeBroadcastChannel.resetAll()
  stopProactiveAccessRefresh()
}

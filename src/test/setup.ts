import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest"
import {
  installAuthRefreshTestEnv,
  resetAuthRefreshTestEnv,
} from "./authRefreshTestEnv"
import { server } from "./msw/server"

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver =
  (ResizeObserverMock as unknown as typeof ResizeObserver)

beforeAll(() => {
  installAuthRefreshTestEnv()
  server.listen()
})
beforeEach(() => {
  resetAuthRefreshTestEnv()
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ExportProvider } from "@/shared/export/ExportProvider"
import i18n from "@/shared/i18n"
import VillasPage from "./VillasPage"

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const who = vi.hoisted(() => ({ admin: true }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  // Every permission granted: only being an administrator decides who adds villas.
  usePermissions: () => ({
    can: () => true,
    isAdmin: who.admin,
    me: undefined,
  }),
}))

function renderPage() {
  http.get.mockResolvedValue({
    data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/villas"]}>
          <ExportProvider>
            <VillasPage />
          </ExportProvider>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Villas: who adds villas", () => {
  it("offers Add villa and Import to an administrator", async () => {
    who.admin = true
    renderPage()
    expect(
      await screen.findByRole("button", { name: /Add villa/ }),
    ).toBeTruthy()
    expect(screen.getByRole("button", { name: /Import/ })).toBeTruthy()
  })

  it("offers neither to anyone else, whatever they were granted", async () => {
    who.admin = false
    renderPage()
    await screen.findByRole("heading", { name: /Villas/ })
    expect(screen.queryByRole("button", { name: /Add villa/ })).toBeNull()
    expect(screen.queryByRole("button", { name: /Import/ })).toBeNull()
  })
})

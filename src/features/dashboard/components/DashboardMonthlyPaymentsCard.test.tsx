import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import DashboardMonthlyPaymentsCard from "./DashboardMonthlyPaymentsCard"

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const perms = vi.hoisted(() => ({ villas: true }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({
    can: (code: string) => code !== "villas:read" || perms.villas,
  }),
}))

function renderCard() {
  http.get.mockResolvedValue({
    data: {
      data: [],
      meta: { page: 1, limit: 1, total: 3, totalPages: 3 },
      summary: {
        villaCount: 3,
        owedCount: 3,
        totalDueMinor: 8_500_000,
        missingWorkOrderCount: 0,
        contractors: [
          {
            contractor: { id: "c1", name: "Nile" },
            villaCount: 2,
            dueMinor: 6_000_000,
          },
          { contractor: null, villaCount: 1, dueMinor: 2_500_000 },
        ],
      },
    },
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <DashboardMonthlyPaymentsCard />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  perms.villas = true
})

describe("DashboardMonthlyPaymentsCard", () => {
  it("shows what the contractors are owed now to the contractors, and opens Monthly Payments", async () => {
    renderCard()

    const link = await screen.findByRole("link", { name: /Monthly Payments/ })
    expect(link.getAttribute("href")).toBe("/monthly-progress")
    expect(link.textContent).toMatch(/8,500/)
    expect(link.textContent).toMatch(/Owed now · Contractors: 1 · Villas: 3/)
    expect(http.get).toHaveBeenCalledWith(
      "/monthly-progress",
      expect.objectContaining({
        params: expect.objectContaining({ owed: "true" }),
      }),
    )
  })

  it("is not shown, nor asked for, without villas:read", () => {
    perms.villas = false
    renderCard()
    expect(screen.queryByRole("link")).toBeNull()
    expect(http.get).not.toHaveBeenCalled()
  })
})

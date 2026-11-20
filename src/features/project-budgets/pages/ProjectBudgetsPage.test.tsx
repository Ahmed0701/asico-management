import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { VillaFinanceListItem } from "@/features/villas/api/villa-finance"
import ProjectBudgetsPage from "./ProjectBudgetsPage"

const row: VillaFinanceListItem = {
  villa: { id: "v1", villaNumber: "V-12", location: "Sabah . B1 . 12" },
  villaId: "v1",
  budgetMinor: 100_000_000,
  currency: "KWD",
  variationOrdersMinor: 6_000_000,
  totalBudgetMinor: 106_000_000,
  workOrderMinor: 70_000_000,
  salaryShareBp: 2500,
  overheadSalariesMinor: 120_000_000,
  salariesMinor: 30_000_000,
  materialsMinor: 10_000_000,
  pettyCashMinor: null,
  expensesMinor: 0,
  totalCostsMinor: 110_000_000,
  remainingMinor: -4_000_000,
  version: 3,
  updatedAt: null,
  updatedBy: null,
}

const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: { get: http.get, put: http.put },
}))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({ can: () => true }),
}))

function renderPage() {
  http.get.mockResolvedValue({
    data: {
      data: [row],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      summary: {
        villaCount: 1,
        budgetMinor: 100_000_000,
        variationOrdersMinor: 6_000_000,
        totalBudgetMinor: 106_000_000,
        totalCostsMinor: 110_000_000,
        remainingMinor: -4_000_000,
        overBudgetCount: 1,
        overheadSalariesMinor: 120_000_000,
        allocatedShareBp: 6000,
      },
    },
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <ProjectBudgetsPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("ProjectBudgetsPage", () => {
  it("lists each villa with its total budget (budget plus variation orders) and marks one over budget", async () => {
    renderPage()

    expect(await screen.findByRole("link", { name: "V-12" })).toBeTruthy()
    expect(http.get).toHaveBeenCalledWith("/villa-finance", expect.anything())
    const villaRow = screen.getByRole("link", { name: "V-12" }).closest("tr")!
    expect(villaRow.getAttribute("data-row-tone")).toBe("danger")
    expect(screen.getByText("Villas over budget")).toBeTruthy()
  })

  it("reads the Department Overhead salaries and shows how much of them the villas share", async () => {
    renderPage()

    expect(await screen.findByText("Department Overhead salaries")).toBeTruthy()
    // 60% given out of 120,000 KWD: 72,000 allocated, 40% (48,000) left.
    expect(screen.getByText(/60% · .*72,000/)).toBeTruthy()
    expect(screen.getByText(/40% · .*48,000/)).toBeTruthy()
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("60")
    // The villa's salaries show its share.
    expect(screen.getByText("25%")).toBeTruthy()
  })

  it("edits a villa's budget from the list, writing the villa's own figures", async () => {
    renderPage()
    http.put.mockResolvedValue({ data: { data: { ...row, budgetMinor: 120_000_000, version: 4 } } })

    fireEvent.click(await screen.findByRole("button", { name: /Edit the budget figures of villa V-12/ }))
    fireEvent.change(screen.getByLabelText(/Villa Budget/), { target: { value: "120000" } })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(http.put).toHaveBeenCalled())
    const [url, body, options] = http.put.mock.calls[0]!
    expect(url).toBe("/villas/v1/finance")
    expect(body).toEqual({ budgetMinor: 120_000_000 })
    expect((options as { headers: Record<string, string> }).headers["If-Match"]).toBe("3")
  })
})

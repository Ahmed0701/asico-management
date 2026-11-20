import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { VillaFinance } from "../api/villa-finance"
import VillaBudgetCard from "./VillaBudgetCard"

const finance: VillaFinance = {
  villaId: "v1",
  budgetMinor: 100_000_000,
  currency: "KWD",
  variationOrdersMinor: 0,
  totalBudgetMinor: 100_000_000,
  workOrderMinor: 60_000_000,
  salaryShareBp: null,
  overheadSalariesMinor: 2_000_000,
  salariesMinor: null,
  materialsMinor: 30_000_000,
  pettyCashMinor: null,
  expensesMinor: 0,
  totalCostsMinor: 90_000_000,
  remainingMinor: 10_000_000,
  version: 2,
  updatedAt: "2026-11-18T09:00:00.000Z",
  updatedBy: { id: "u1", name: "Mona Hassan" },
}

// The HTTP client answers in place of the server: GET gives the figures, PUT what was saved.
const http = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
}))

vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: { get: http.get, put: http.put },
}))

const answer = (data: VillaFinance) => Promise.resolve({ data: { data } })

function renderCard(canEdit: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <VillaBudgetCard villaId="v1" canEdit={canEdit} />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("VillaBudgetCard", () => {
  it("loads when opened and shows the budget, the figures, the total and what remains", async () => {
    http.get.mockImplementation(() => answer(finance))
    renderCard(false)
    expect(http.get).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: /Villa Budget/ }))

    expect(await screen.findByText("Work Order Value")).toBeTruthy()
    expect(screen.getAllByText("Not entered")).toHaveLength(2)
    expect(screen.getByText("Budget used")).toBeTruthy()
    expect(screen.getByText("90%")).toBeTruthy()
    // No edit button without the right to edit.
    expect(screen.queryByRole("button", { name: /Edit figures/ })).toBeNull()
  })

  it("saves only the figures that changed, with the version it read", async () => {
    http.get.mockImplementation(() => answer(finance))
    http.put.mockImplementation(() => answer({ ...finance, pettyCashMinor: 15_500_000, version: 3 }))
    renderCard(true)
    fireEvent.click(screen.getByRole("button", { name: /Villa Budget/ }))
    fireEvent.click(await screen.findByRole("button", { name: /Edit figures/ }))

    fireEvent.change(screen.getByLabelText(/Petty Cash/), { target: { value: "15500" } })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(http.put).toHaveBeenCalled())
    const [url, body, options] = http.put.mock.calls[0]!
    expect(url).toBe("/villas/v1/finance")
    expect(body).toEqual({ pettyCashMinor: 15_500_000 })
    // The version it read goes in If-Match.
    expect((options as { headers: Record<string, string> }).headers["If-Match"]).toBe("2")
  })

  it("refuses an amount that is not a number", async () => {
    http.get.mockImplementation(() => answer(finance))
    http.put.mockClear()
    renderCard(true)
    fireEvent.click(screen.getByRole("button", { name: /Villa Budget/ }))
    fireEvent.click(await screen.findByRole("button", { name: /Edit figures/ }))

    fireEvent.change(screen.getByLabelText(/Petty Cash/), { target: { value: "abc" } })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByText(/Enter a valid amount in KWD/)).toBeTruthy()
    expect(http.put).not.toHaveBeenCalled()
  })

  it("gives the villa a share of the Department Overhead salaries, as a percentage, and shows what it comes to", async () => {
    http.get.mockImplementation(() => answer(finance))
    http.put.mockClear()
    const saved = { ...finance, salaryShareBp: 2550, salariesMinor: 510_000, version: 3 }
    http.put.mockImplementation(() => answer(saved))
    renderCard(true)
    fireEvent.click(screen.getByRole("button", { name: /Villa Budget/ }))
    fireEvent.click(await screen.findByRole("button", { name: /Edit figures/ }))

    // The salaries are not typed in KWD any more: the share is.
    expect(screen.queryByLabelText(/^Salaries \(KWD\)/)).toBeNull()
    fireEvent.change(screen.getByLabelText(/Salaries share/), { target: { value: "25.5" } })
    // 25.5% of 2,000 KWD a month.
    expect(screen.getByText(/510\.000/)).toBeTruthy()
    // After the save the card reads the figures again.
    http.get.mockImplementation(() => answer(saved))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(http.put).toHaveBeenCalled())
    expect(http.put.mock.calls[0]![1]).toEqual({ salaryShareBp: 2550 })
    // Back on the figures: the share is shown under the salaries.
    expect(await screen.findByText("25.5% of Department Overhead")).toBeTruthy()
  })

  it.each(["101", "12.345", "-5", "abc"])("refuses %j as a share", async (typed) => {
    http.get.mockImplementation(() => answer(finance))
    http.put.mockClear()
    renderCard(true)
    fireEvent.click(screen.getByRole("button", { name: /Villa Budget/ }))
    fireEvent.click(await screen.findByRole("button", { name: /Edit figures/ }))

    fireEvent.change(screen.getByLabelText(/Salaries share/), { target: { value: typed } })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByText(/Enter a percentage from 0 to 100/)).toBeTruthy()
    expect(http.put).not.toHaveBeenCalled()
  })
})

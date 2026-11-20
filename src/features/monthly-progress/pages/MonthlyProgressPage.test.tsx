import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { MonthlyProgressItem, ProgressPayment } from "../api"
import MonthlyProgressPage from "./MonthlyProgressPage"

const nile = { id: "c1", name: "Nile Builders" }
const lastPayment: ProgressPayment = {
  id: "p1",
  ratio: 20,
  amountMinor: 2_000_000,
  workOrderMinor: 10_000_000,
  paidAt: "2026-10-31T09:00:00.000Z",
  contractor: nile,
  paidBy: null,
  manual: false,
  note: null,
}
// V-2: 80% now, paid up to 20%, so 60% of 10,000 KWD is owed. V-3: 20% now, never paid, no Work Order Value.
const rows: MonthlyProgressItem[] = [
  {
    villa: { id: "v2", villaNumber: "V-2", location: "Sabah . B1" },
    contractor: nile,
    currentProgress: 80,
    lastUpdatedAt: "2026-11-10T08:00:00.000Z",
    lastPayment,
    paidProgress: 20,
    unpaidProgress: 60,
    workOrderMinor: 10_000_000,
    dueMinor: 6_000_000,
  },
  {
    villa: { id: "v3", villaNumber: "V-3", location: "Sabah . B2" },
    contractor: null,
    currentProgress: 20,
    lastUpdatedAt: null,
    lastPayment: null,
    paidProgress: 0,
    unpaidProgress: 20,
    workOrderMinor: null,
    dueMinor: 0,
  },
]

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const perms = vi.hoisted(() => ({ pay: true }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({
    can: (code: string) => !code.startsWith("payments:") || perms.pay,
  }),
}))

function renderPage(entry = "/monthly-progress") {
  http.get.mockImplementation(async (url: string) => {
    if (url === "/monthly-progress") {
      return {
        data: {
          data: rows,
          meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
          summary: {
            villaCount: 2,
            owedCount: 2,
            totalDueMinor: 6_000_000,
            missingWorkOrderCount: 1,
            contractors: [
              { contractor: nile, villaCount: 1, dueMinor: 6_000_000 },
              { contractor: null, villaCount: 1, dueMinor: 0 },
            ],
          },
        },
      }
    }
    return {
      data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    }
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[entry]}>
          <MonthlyProgressPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

const lastListParams = () =>
  http.get.mock.calls.filter(([url]) => url === "/monthly-progress").at(-1)![1]
    .params as Record<string, string>

beforeEach(() => {
  vi.clearAllMocks()
  perms.pay = true
})

describe("Monthly Payments", () => {
  it("asks for the villas owed money by default, and shows what each contractor is owed now", async () => {
    renderPage()

    expect(await screen.findByText("Contractor payments")).toBeTruthy()
    expect(lastListParams().owed).toBe("true")
    expect(lastListParams().month).toBeUndefined()
    expect(screen.getByText("What each contractor is owed now")).toBeTruthy()
    expect(screen.getByTestId("total-due").textContent).toMatch(/6,000/)
    const card = screen.getByText("Contractor payments").closest("div.mb-4")!
    const nileButton = within(card as HTMLElement).getByRole("button", {
      name: /Nile Builders/,
    })
    expect(nileButton.textContent).toMatch(/6,000/)
    expect(
      screen.getByText(
        /1 villa has unpaid progress without a Work Order Value/,
      ),
    ).toBeTruthy()
    expect(screen.queryByLabelText("Month")).toBeNull()
  })

  it("shows each villa's last update, last payment, unpaid progress and amount owed", async () => {
    renderPage()

    const v2 = (await screen.findByRole("link", { name: "V-2" })).closest("tr")!
    expect(within(v2).getByText(/2,000/)).toBeTruthy()
    expect(within(v2).getByText(/paid up to 20%/)).toBeTruthy()
    expect(within(v2).getByText("+60%")).toBeTruthy()
    expect(within(v2).getByText(/10,000/)).toBeTruthy()
    expect(within(v2).getAllByText(/6,000/).length).toBeGreaterThan(0)

    const v3 = screen.getByRole("link", { name: "V-3" }).closest("tr")!
    expect(within(v3).getByText("Not entered")).toBeTruthy()
    expect(within(v3).getByText("Not paid yet")).toBeTruthy()
    expect(within(v3).getByText("No open works")).toBeTruthy()
    expect(
      (within(v3).getByRole("button", {
        name: "Pay villa V-3",
      }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it("pays a villa after confirming the amount and the progress it covers", async () => {
    http.post.mockResolvedValue({
      data: {
        data: { ...lastPayment, id: "p2", ratio: 80, amountMinor: 6_000_000 },
      },
    })
    renderPage()

    fireEvent.click(
      await screen.findByRole("button", { name: "Pay villa V-2" }),
    )
    const dialog = await screen.findByRole("dialog")
    expect(dialog.textContent).toMatch(/Nile Builders/)
    expect(dialog.textContent).toMatch(/from 20% to 80%/)
    expect(dialog.textContent).toMatch(/6,000/)
    fireEvent.click(within(dialog).getByRole("button", { name: "Pay" }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith("/villas/v2/progress-payments"),
    )
  })

  it("takes back a villa's last payment after confirming", async () => {
    http.delete.mockResolvedValue({ data: undefined })
    renderPage()

    const v2 = (await screen.findByRole("link", { name: "V-2" })).closest("tr")!
    fireEvent.click(within(v2).getByRole("button", { name: "Undo" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog.textContent).toMatch(/2,000/)
    fireEvent.click(within(dialog).getByRole("button", { name: "Undo" }))

    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith("/progress-payments/p1"),
    )
  })

  it("opens the import of previous payments for someone who may record payments", async () => {
    renderPage()
    fireEvent.click(
      await screen.findByRole("button", { name: "Import previous payments" }),
    )
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Import previous payments")).toBeTruthy()
  })

  it("hides Pay and Undo without the payments permissions", async () => {
    perms.pay = false
    renderPage()

    await screen.findByRole("link", { name: "V-2" })
    expect(screen.queryByRole("button", { name: /^Pay villa/ })).toBeNull()
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Import previous payments" }),
    ).toBeNull()
  })

  it("shows one contractor's villas when it is clicked, and every villa when asked", async () => {
    renderPage()
    const [nileButton] = await screen.findAllByRole("button", {
      name: /Nile Builders/,
    })
    expect(nileButton!.getAttribute("title")).toBe(
      "Show the villas of Nile Builders",
    )
    fireEvent.click(nileButton!)
    await waitFor(() => expect(lastListParams().contractorId).toBe("c1"))

    fireEvent.click(screen.getByRole("checkbox"))
    await waitFor(() => expect(lastListParams().owed).toBe("false"))
  })
})

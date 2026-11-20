import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { VillaPaymentHistory } from "../api"
import VillaPaymentHistoryCard from "./VillaPaymentHistoryCard"

const nile = { id: "c1", name: "Nile Builders" }
// Paid 40% then up to 70%; 100% now, so 30% of 10,000 KWD is owed.
const history: VillaPaymentHistory = {
  data: [
    {
      id: "p2",
      fromRatio: 40,
      ratio: 70,
      amountMinor: 3_000_000,
      workOrderMinor: 10_000_000,
      paidAt: "2026-11-05T09:00:00.000Z",
      contractor: nile,
      paidBy: { id: "u1", name: "Sara" },
      manual: false,
      note: null,
    },
    {
      id: "p1",
      fromRatio: 0,
      ratio: 40,
      amountMinor: 4_000_000,
      workOrderMinor: 10_000_000,
      paidAt: "2026-10-01T00:00:00.000Z",
      contractor: nile,
      paidBy: null,
      manual: true,
      note: "Receipt 17",
    },
  ],
  summary: {
    count: 2,
    totalPaidMinor: 7_000_000,
    paidProgress: 70,
    currentProgress: 100,
    unpaidProgress: 30,
    workOrderMinor: 10_000_000,
    dueMinor: 3_000_000,
  },
}

const download = vi.hoisted(() => vi.fn())
vi.mock("@/shared/export/downloadExport", () => ({ downloadExport: download }))

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const perms = vi.hoisted(() => ({ write: true }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({
    can: (code: string) => code === "payments:read" || perms.write,
  }),
}))

function renderCard() {
  http.get.mockResolvedValue({ data: history })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <VillaPaymentHistoryCard villaId="v2" villaNumber="V-2" />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

const openCard = async () => {
  fireEvent.click(screen.getByRole("button", { name: /Payment history/ }))
  return screen.findByRole("table")
}

beforeEach(() => {
  vi.clearAllMocks()
  perms.write = true
})

describe("VillaPaymentHistoryCard", () => {
  it("loads only when opened, then shows every payment and what is owed now", async () => {
    renderCard()
    expect(http.get).not.toHaveBeenCalled()

    const table = await openCard()
    expect(http.get).toHaveBeenCalledWith(
      "/villas/v2/progress-payments",
      expect.anything(),
    )
    const rows = within(table).getAllByRole("row").slice(1)
    expect(rows).toHaveLength(2)
    expect(rows[0]!.textContent).toMatch(/40% to 70%/)
    expect(rows[0]!.textContent).toMatch(/\+30%/)
    expect(rows[0]!.textContent).toMatch(/3,000/)
    expect(rows[0]!.textContent).toMatch(/Sara/)
    expect(rows[1]!.textContent).toMatch(/0% to 40%/)
    expect(screen.getByText("Total paid").nextSibling!.textContent).toMatch(
      /7,000/,
    )
    expect(screen.getByText("Owed now").nextSibling!.textContent).toMatch(
      /3,000/,
    )
    // The latest payment is taken back; one entered by hand is deleted at any time.
    expect(within(rows[0]!).getByRole("button", { name: "Undo" })).toBeTruthy()
    expect(within(rows[1]!).queryByRole("button", { name: "Undo" })).toBeNull()
    expect(
      within(rows[1]!).getByRole("button", { name: "Delete" }),
    ).toBeTruthy()
    expect(within(rows[1]!).getByText("Previous")).toBeTruthy()
    expect(within(rows[1]!).getByText("Receipt 17")).toBeTruthy()
  })

  it("pays what is owed after confirming", async () => {
    http.post.mockResolvedValue({
      data: { data: { ...history.data[0], id: "p3", ratio: 100 } },
    })
    renderCard()
    await openCard()

    fireEvent.click(screen.getByRole("button", { name: "Pay" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog.textContent).toMatch(/from 70% to 100%/)
    fireEvent.click(within(dialog).getByRole("button", { name: "Pay" }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith("/villas/v2/progress-payments"),
    )
  })

  it("takes back the latest payment after confirming", async () => {
    http.delete.mockResolvedValue({ data: undefined })
    renderCard()
    const table = await openCard()

    fireEvent.click(within(table).getByRole("button", { name: "Undo" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Undo" }))
    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith("/progress-payments/p2"),
    )
  })

  it("deletes a payment entered by hand even when it is not the latest", async () => {
    http.delete.mockResolvedValue({ data: undefined })
    renderCard()
    const table = await openCard()

    fireEvent.click(within(table).getByRole("button", { name: "Delete" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog.textContent).toMatch(/Delete previous payment/)
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }))
    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith("/progress-payments/p1"),
    )
  })

  it("downloads the history as an Excel file", async () => {
    download.mockResolvedValue(undefined)
    renderCard()
    await openCard()

    fireEvent.click(screen.getByRole("button", { name: "Export to Excel" }))
    await waitFor(() =>
      expect(download).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/villas/v2/progress-payments/export",
          format: "xlsx",
        }),
      ),
    )
  })

  it("enters a previous payment, with the range it has to fit and the amount the Work Order Value suggests", async () => {
    http.post.mockResolvedValue({
      data: { data: { ...history.data[1], id: "p0", ratio: 20 } },
    })
    renderCard()
    await openCard()

    fireEvent.click(
      screen.getByRole("button", { name: "Add previous payment" }),
    )
    const dialog = await screen.findByRole("dialog")
    // Before the payment of 1 October (40%): more than 0% and less than 40%.
    fireEvent.change(within(dialog).getByLabelText("Payment date"), {
      target: { value: "2026-09-15" },
    })
    expect(dialog.textContent).toMatch(/more than 0% and less than 40%/)
    fireEvent.change(within(dialog).getByLabelText("Paid up to (%)"), {
      target: { value: "50" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )
    expect(
      await within(dialog).findByText(/fits the range for this date/),
    ).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText("Paid up to (%)"), {
      target: { value: "20" },
    })
    // 20% of 10,000 KWD.
    expect(dialog.textContent).toMatch(/By the Work Order Value: .*2,000/)
    fireEvent.click(within(dialog).getByRole("button", { name: "Use it" }))
    fireEvent.change(within(dialog).getByLabelText("Note"), {
      target: { value: "Cheque 88" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/villas/v2/progress-payments/manual",
        {
          paidOn: "2026-09-15",
          ratio: 20,
          amountMinor: 2_000_000,
          note: "Cheque 88",
        },
      ),
    )
  })

  it("only shows the history without the payments write permissions", async () => {
    perms.write = false
    renderCard()
    await openCard()
    expect(screen.queryByRole("button", { name: "Pay" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Add previous payment" }),
    ).toBeNull()
  })
})

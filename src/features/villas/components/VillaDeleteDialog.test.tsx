import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import VillaDeleteDialog from "./VillaDeleteDialog"

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))

const none = {
  openWorks: 0,
  smallWorks: 0,
  siteReports: 0,
  labour: 0,
  deliveries: 0,
  materialOrders: 0,
  ownerNotes: 0,
  foremanMissions: 0,
  payments: 0,
  progressPayments: 0,
  variationOrders: 0,
  overheadExpenses: 0,
  documents: 0,
  images: 0,
  inspectionReports: 0,
}

const onConfirm = vi.fn()

function renderDialog(impact: Partial<typeof none>) {
  http.get.mockResolvedValue({ data: { data: { ...none, ...impact } } })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <VillaDeleteDialog
          villa={{ id: "v1", villaNumber: "V-101" }}
          pending={false}
          onConfirm={onConfirm}
          onClose={() => {}}
        />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe("VillaDeleteDialog", () => {
  it("says what goes with the villa, only the kinds it has, before deleting", async () => {
    renderDialog({ openWorks: 4, smallWorks: 2, payments: 1 })

    const list = await screen.findByRole("list", { name: "These go with it" })
    const items = within(list)
      .getAllByRole("listitem")
      .map((li) => li.textContent)
    expect(items).toEqual(["Open works4", "Small works2", "Payments1"])
    expect(http.get).toHaveBeenCalledWith("/villas/v1/deletion-impact")
    expect(
      screen.getByText(
        /Delete villa “V-101” and everything that belongs to it/,
      ),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("says so when nothing else belongs to the villa", async () => {
    renderDialog({})

    expect(
      await screen.findByText("Nothing else belongs to this villa."),
    ).toBeTruthy()
    expect(screen.queryByRole("list")).toBeNull()
  })
})

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { MaterialDelivery } from "../api"
import DeliveriesTable from "./DeliveriesTable"

const base: MaterialDelivery = {
  id: "d1",
  villa: { id: "v1", villaNumber: "V-12" },
  factory: { id: "f1", name: "Gulf Switchgear", type: "SWITCHGEAR" },
  lines: [{ item: { id: "i1", name: "MSB Box", unit: "pcs" }, quantity: 1 }],
  noteNumber: "DN-7",
  deliveryDate: "2026-11-10",
  mrDate: "2026-10-20",
  poDate: "2026-10-25",
  deliveryNotes: [],
  version: 1,
  createdAt: "2026-11-10T08:00:00.000Z",
  updatedAt: "2026-11-10T08:00:00.000Z",
}

function renderTable(rows: MaterialDelivery[]) {
  const client = new QueryClient()
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <DeliveriesTable
            rows={rows}
            isLoading={false}
            showVilla
            canUpdate={false}
            canDelete={false}
            emptyText="No deliveries"
            onEdit={vi.fn()}
            onDelete={vi.fn()}
          />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("DeliveriesTable", () => {
  it("shows the MR date and the PO date beside the delivery date, and a dash for one not known", () => {
    renderTable([base, { ...base, id: "d2", mrDate: null, poDate: null }])

    const headers = screen
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent)
    expect(headers.slice(0, 3)).toEqual(["Delivery date", "MR Date", "PO Date"])

    const [, first, second] = screen.getAllByRole("row")
    const firstCells = within(first!).getAllByRole("cell")
    expect(firstCells[1]!.textContent).toMatch(/20/)
    expect(firstCells[1]!.textContent).not.toBe("-")
    expect(firstCells[2]!.textContent).toMatch(/25/)
    const secondCells = within(second!).getAllByRole("cell")
    expect(secondCells[1]!.textContent).toBe("-")
    expect(secondCells[2]!.textContent).toBe("-")
  })
})

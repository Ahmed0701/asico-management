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
import type { MaterialOrder } from "../api"
import OrdersPanel from "./OrdersPanel"

const order = (over: Partial<MaterialOrder>): MaterialOrder => ({
  villa: { id: "v1", villaNumber: "V-1" },
  type: "SWITCHGEAR",
  factory: { id: "sw", name: "Gulf Switchgear" },
  mrDate: null,
  poDate: null,
  dueDate: null,
  deliveryMrDate: null,
  deliveryPoDate: null,
  lastDeliveryDate: null,
  requiredItems: 2,
  completeItems: 0,
  status: "NOT_DELIVERED",
  overdue: false,
  ...over,
})
const rows = [
  order({
    status: "DELIVERED",
    completeItems: 2,
    deliveryMrDate: "2026-09-01",
    lastDeliveryDate: "2026-10-20",
  }),
  order({
    villa: { id: "v2", villaNumber: "V-2" },
    status: "PARTIAL",
    completeItems: 1,
    mrDate: "2026-08-01",
    poDate: "2026-08-10",
    dueDate: "2026-11-30",
    overdue: true,
  }),
]

const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const perms = vi.hoisted(() => ({ edit: true }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({
    can: (code: string) => code !== "materials:update" || perms.edit,
  }),
}))

function renderPanel(entry = "/materials?tab=orders") {
  http.get.mockResolvedValue({
    data: {
      data: rows,
      meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
      summary: {
        total: 2,
        delivered: 1,
        partial: 1,
        notDelivered: 0,
        overdue: 1,
      },
    },
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[entry]}>
          <OrdersPanel />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

const lastParams = () =>
  http.get.mock.calls.filter(([url]) => url === "/material-orders").at(-1)![1]
    .params as Record<string, string>

beforeEach(() => {
  vi.clearAllMocks()
  perms.edit = true
})

describe("OrdersPanel", () => {
  it("shows each villa's MR, PO and due dates with whether all or part came, and the late ones", async () => {
    renderPanel()

    const v1 = (await screen.findByRole("link", { name: "V-1" })).closest("tr")!
    expect(within(v1).getByText("All delivered")).toBeTruthy()
    expect(within(v1).getByText("Gulf Switchgear")).toBeTruthy()
    // No MR entered: the one on the delivery note, marked as such.
    expect(within(v1).getByText("from delivery note")).toBeTruthy()

    const v2 = screen.getByRole("link", { name: "V-2" }).closest("tr")!
    expect(within(v2).getByText("Partially delivered")).toBeTruthy()
    expect(within(v2).getByText("Overdue")).toBeTruthy()
    expect(within(v2).getByText("1 of 2 materials complete")).toBeTruthy()
  })

  it("filters by status, by the late ones, and sorts by due date", async () => {
    renderPanel()
    await screen.findByRole("link", { name: "V-1" })

    fireEvent.click(screen.getByRole("checkbox"))
    await waitFor(() => expect(lastParams().overdue).toBe("true"))

    fireEvent.click(screen.getByRole("button", { name: /Partially delivered/ }))
    await waitFor(() => expect(lastParams().status).toBe("PARTIAL"))

    fireEvent.click(screen.getByRole("button", { name: /Due date/ }))
    await waitFor(() => expect(lastParams().sort).toBe("dueDate:asc"))
  })

  it("edits a villa's dates and refuses a PO before the MR", async () => {
    http.put.mockResolvedValue({ data: { data: rows[1] } })
    renderPanel()

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Edit dates of villa V-2, Switchgears",
      }),
    )
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("PO date"), {
      target: { value: "2026-07-01" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )
    expect(
      await within(dialog).findByText(
        "The PO date cannot be before the MR date",
      ),
    ).toBeTruthy()
    expect(http.put).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText("PO date"), {
      target: { value: "2026-08-15" },
    })
    fireEvent.change(within(dialog).getByLabelText("Due date"), {
      target: { value: "" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith(
        "/villas/v2/material-orders/SWITCHGEAR",
        { mrDate: "2026-08-01", poDate: "2026-08-15", dueDate: null },
      ),
    )
  })

  it("only lists the dates without materials:update", async () => {
    perms.edit = false
    renderPanel()
    await screen.findByRole("link", { name: "V-1" })
    expect(screen.queryByRole("button", { name: /Edit dates/ })).toBeNull()
  })
})

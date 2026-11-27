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
import { ExportProvider } from "@/shared/export/ExportProvider"
import i18n from "@/shared/i18n"
import {
  buildStoreItemsQueryParams,
  buildStoreMovementsQueryParams,
  type StoreItem,
  type StoreMovement,
} from "../api"
import StorePage from "./StorePage"

const mutlaa = { id: "w1", name: "Mutlaa" }
const khitan = { id: "w2", name: "Khitan" }

const cable: StoreItem = {
  id: "i1",
  name: "Cable 4mm",
  category: "WIRE",
  unit: "m",
  factory: { id: "f1", name: "KWT Wires" },
  quantity: 1250.5,
  minQuantity: 100,
  low: false,
  stocks: [
    { warehouse: mutlaa, quantity: 1250.5, low: false },
    { warehouse: khitan, quantity: 20, low: true },
  ],
  active: true,
  notes: null,
  lastMovementAt: "2026-11-20T08:00:00.000Z",
  version: 3,
  createdAt: "2026-11-01T08:00:00.000Z",
  updatedAt: "2026-11-20T08:00:00.000Z",
}
const box: StoreItem = {
  ...cable,
  id: "i2",
  name: "Box 3x3",
  category: "BOX",
  unit: "pcs",
  factory: null,
  quantity: 4,
  minQuantity: 10,
  low: true,
  stocks: [
    { warehouse: mutlaa, quantity: 4, low: true },
    { warehouse: khitan, quantity: 0, low: true },
  ],
  version: 1,
}
const issue: StoreMovement = {
  id: "m1",
  item: {
    id: "i2",
    name: "Box 3x3",
    unit: "pcs",
    category: "BOX",
    factory: null,
  },
  warehouse: mutlaa,
  transfer: null,
  kind: "ISSUE",
  change: -6,
  quantity: 6,
  balanceAfter: 4,
  villa: { id: "v1", villaNumber: "V-12" },
  party: null,
  reference: "DN-7",
  note: null,
  movedOn: "2026-11-20",
  createdBy: { id: "u1", name: "Keeper" },
  createdAt: "2026-11-20T08:00:00.000Z",
  latest: true,
}

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const perms = vi.hoisted(() => ({ codes: new Set<string>() }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({ can: (code: string) => perms.codes.has(code) }),
}))

const page = { page: 1, limit: 20, total: 2, totalPages: 1 }

function renderPage(path = "/store") {
  http.get.mockImplementation((url: string) => {
    if (url === "/store/items")
      return Promise.resolve({
        data: {
          data: [box, cable],
          meta: page,
          summary: { itemCount: 2, lowCount: 1, outCount: 0 },
        },
      })
    if (url === "/store/items/options")
      return Promise.resolve({
        data: {
          data: [cable, box].map(
            ({ id, name, unit, category, factory, stocks }) => ({
              id,
              name,
              unit,
              category,
              factory,

              stocks: stocks.map((s) => ({
                warehouseId: s.warehouse.id,
                quantity: s.quantity,
              })),
            }),
          ),
        },
      })
    if (url === "/store/item-names")
      return Promise.resolve({
        data: {
          data: [
            {
              id: "n1",
              name: "Gland",
              category: "WIRE",
              factory: { id: "f2", name: "Gulf Wires" },
              unit: "Roll",
              createdAt: "2026-11-01T08:00:00.000Z",
            },
            {
              id: "n2",
              name: "Tape",
              category: "OTHER",
              factory: null,
              unit: "Pcs",
              createdAt: "2026-11-01T08:00:00.000Z",
            },
            {
              id: "n4",
              name: "Earth Yellow Green",
              category: "OTHER",
              factory: null,
              unit: "Roll",
              createdAt: "2026-11-01T08:00:00.000Z",
            },
            {
              id: "n3",
              name: "Cable 4mm",
              category: "WIRE",
              factory: { id: "f1", name: "KWT Wires" },
              unit: "m",
              createdAt: "2026-11-01T08:00:00.000Z",
            },
          ],
        },
      })
    if (url === "/store/warehouses")
      return Promise.resolve({ data: { data: [mutlaa, khitan] } })
    if (url === "/store/factories")
      return Promise.resolve({
        data: {
          data: [
            {
              id: "f1",
              name: "KWT Wires",
              category: "WIRE",
              itemCount: 1,
              createdAt: cable.createdAt,
            },
            {
              id: "f2",
              name: "Gulf Wires",
              category: "WIRE",
              itemCount: 0,
              createdAt: cable.createdAt,
            },
            {
              id: "f3",
              name: "Box Co",
              category: "BOX",
              itemCount: 1,
              createdAt: cable.createdAt,
            },
          ],
        },
      })
    if (url === "/store/movements")
      return Promise.resolve({
        data: { data: [issue], meta: { ...page, total: 1 } },
      })
    return Promise.resolve({ data: { data: [] } })
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[path]}>
          <ExportProvider>
            <StorePage />
          </ExportProvider>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

// The list boxes (Radix Select) use pointer capture and scrolling, which jsdom does not have.
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

/** Opens a list box by its label and picks an option. */
async function pick(container: HTMLElement, label: string, option: string) {
  fireEvent.pointerDown(
    within(container).getByRole("combobox", { name: label }),
    {
      button: 0,
      ctrlKey: false,
      pointerType: "mouse",
    },
  )
  fireEvent.click(await screen.findByRole("option", { name: option }))
}

beforeEach(async () => {
  vi.clearAllMocks()
  await i18n.changeLanguage("en")
  perms.codes = new Set([
    "store:read",
    "store:create",
    "store:update",
    "store:delete",
  ])
})

describe("StorePage", () => {
  it("shows the stock of each item, flags the low ones, and counts them at the top", async () => {
    renderPage()

    expect(await screen.findByText("Cable 4mm")).toBeTruthy()
    expect(http.get).toHaveBeenCalledWith(
      "/store/items",
      expect.objectContaining({
        params: expect.not.objectContaining({ active: expect.anything() }),
      }),
    )
    expect(screen.getByText("1,250.5")).toBeTruthy()
    expect(screen.getByText("Low")).toBeTruthy()
    expect(screen.getByText("Wire")).toBeTruthy()
    const tiles = screen.getByTestId("store-summary")
    expect(within(tiles).getByText("Low on stock")).toBeTruthy()
    expect(within(tiles).getAllByText("1")).toHaveLength(1)
  })

  it("adds an item picked from the reference list, with its category, factory and unit, and its opening stock", async () => {
    renderPage()
    http.post.mockResolvedValue({
      data: { data: { ...cable, id: "i3", name: "Gland" } },
    })
    await screen.findByText("Cable 4mm")

    fireEvent.click(screen.getByRole("button", { name: "Add item" }))
    const dialog = screen.getByRole("dialog")
    // The list offers its entries, less the ones another item already has (Cable 4mm).
    const pick = within(dialog).getByRole("combobox", { name: "Item" })
    fireEvent.focus(pick)
    fireEvent.change(pick, { target: { value: "" } })
    expect(
      (await screen.findAllByRole("option")).map((o) => o.textContent),
    ).toEqual([
      "Gland · Gulf Wires (Wire)",
      "Tape (Other)",
      "Earth Yellow Green (Other)",
    ])
    // A name with a color is drawn in it, in the list too.
    const earth = screen.getByRole("option", {
      name: "Earth Yellow Green (Other)",
    })
    expect(
      earth.querySelector("[data-color]")?.getAttribute("data-color"),
    ).toBe("yellow green")
    fireEvent.mouseDown(
      screen
        .getAllByRole("option")
        .find((o) => o.textContent === "Gland · Gulf Wires (Wire)")!,
    )
    // What the entry gives the item is shown, not asked again.
    const picked = within(dialog).getByTestId("store-item-picked")
    expect(within(picked).getByText("Wire")).toBeTruthy()
    expect(within(picked).getByText("Gulf Wires")).toBeTruthy()
    expect(within(picked).getByText("Roll")).toBeTruthy()
    expect(
      within(dialog).queryByRole("combobox", { name: "Factory" }),
    ).toBeNull()
    fireEvent.change(within(dialog).getByLabelText("Minimum"), {
      target: { value: "20" },
    })
    fireEvent.change(within(dialog).getByLabelText("Stock now"), {
      target: { value: "100.5" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/store/items",
        {
          name: "Gland",
          category: "WIRE",
          unit: "Roll",
          minQuantity: 20,
          factoryId: "f2",
          notes: null,
          openingQuantity: 100.5,
          // The store on screen (the first one).
          openingWarehouseId: "w1",
        },
        expect.anything(),
      ),
    )
  })

  it("receives stock into an item from its row", async () => {
    renderPage()
    http.post.mockResolvedValue({
      data: {
        data: { ...issue, kind: "RECEIVE", change: 30, balanceAfter: 1280.5 },
      },
    })
    await screen.findByText("Cable 4mm")

    fireEvent.click(screen.getByRole("button", { name: "Receive Cable 4mm" }))
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Receive stock")).toBeTruthy()
    expect(await within(dialog).findByTestId("store-in-stock")).toBeTruthy()
    fireEvent.change(within(dialog).getByLabelText("Quantity"), {
      target: { value: "30" },
    })
    fireEvent.change(within(dialog).getByLabelText("Supplier"), {
      target: { value: "Gulf Cables" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() => expect(http.post).toHaveBeenCalled())
    const [path, body] = http.post.mock.calls[0]!
    expect(path).toBe("/store/movements")
    expect(body).toMatchObject({
      itemId: "i1",
      kind: "RECEIVE",
      quantity: 30,
      villaId: null,
      party: "Gulf Cables",
      reference: null,
    })
    expect(body.movedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("will not issue stock to no one, or a quantity that is not a number", async () => {
    renderPage()
    await screen.findByText("Cable 4mm")

    fireEvent.click(screen.getByRole("button", { name: "Issue Cable 4mm" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Quantity"), {
      target: { value: "1.234" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    expect(
      await within(dialog).findByText(
        "Enter a number of 0 or more, with at most two decimals",
      ),
    ).toBeTruthy()
    expect(
      within(dialog).getByText("Pick a villa or name who received it"),
    ).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it("lists the movements with the villa, and takes back the latest one", async () => {
    renderPage("/store?tab=movements")
    http.delete.mockResolvedValue({ data: undefined })

    expect(await screen.findByText("V-12")).toBeTruthy()
    expect(screen.getByText("-6")).toBeTruthy()
    expect(screen.getByText("DN-7")).toBeTruthy()

    fireEvent.click(
      screen.getByRole("button", {
        name: "Take back the last movement of Box 3x3",
      }),
    )
    const confirm = await screen.findByRole("dialog")
    fireEvent.click(within(confirm).getByRole("button", { name: "Take back" }))

    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith("/store/movements/m1"),
    )
  })

  it("only shows the stock to someone who can read it", async () => {
    perms.codes = new Set(["store:read"])
    renderPage()
    await screen.findByText("Cable 4mm")

    for (const name of [
      "Add item",
      "Receive",
      "Issue",
      "Count",
      "Receive Cable 4mm",
      "Edit",
      "Delete",
    ]) {
      expect(screen.queryByRole("button", { name })).toBeNull()
    }
    expect(
      screen.getByRole("button", { name: "Movements of Cable 4mm" }),
    ).toBeTruthy()
    // Reading the store is enough to export it.
    expect(screen.getByRole("button", { name: "Export list" })).toBeTruthy()
  })

  it("exports the tab on screen with its filters, never the paging", () => {
    expect(
      buildStoreItemsQueryParams(
        {
          page: 3,
          limit: 50,
          category: "BOX",
          low: true,
          sort: "quantity:desc",
        },
        { forExport: true },
      ),
    ).toEqual({ category: "BOX", low: "true", sort: "quantity:desc" })
    expect(
      buildStoreMovementsQueryParams(
        { page: 2, limit: 20, kind: "ISSUE", itemId: "i1", search: "V-12" },
        { forExport: true },
      ),
    ).toEqual({ kind: "ISSUE", itemId: "i1", search: "V-12" })
    expect(buildStoreItemsQueryParams({ page: 3, limit: 50 })).toEqual({
      page: 3,
      limit: 50,
    })
  })

  it("will not add an item that is not picked from the list, and an item of other kind has no factory", async () => {
    renderPage()
    http.post.mockResolvedValue({ data: { data: { ...cable, id: "i4" } } })
    await screen.findByText("Cable 4mm")

    fireEvent.click(screen.getByRole("button", { name: "Add item" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )
    expect(await within(dialog).findByText("Pick an item")).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()

    const pick = within(dialog).getByRole("combobox", { name: "Item" })
    fireEvent.focus(pick)
    fireEvent.change(pick, { target: { value: "Tape" } })
    fireEvent.mouseDown(
      await screen.findByRole("option", { name: "Tape (Other)" }),
    )
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )
    await waitFor(() => expect(http.post).toHaveBeenCalled())
    expect(http.post.mock.calls[0][1]).toMatchObject({
      name: "Tape",
      category: "OTHER",
      factoryId: null,
      unit: "Pcs",
    })
  })

  it("shows one store at a time, and switches to the other", async () => {
    renderPage()
    await screen.findByText("Cable 4mm")
    expect(http.get).toHaveBeenCalledWith(
      "/store/items",
      expect.objectContaining({
        params: expect.objectContaining({ warehouseId: "w1" }),
      }),
    )
    // The other store's stock is under this store's.
    expect(screen.getByText("Khitan: 20")).toBeTruthy()

    fireEvent.click(screen.getByRole("tab", { name: "Khitan" }))
    await waitFor(() =>
      expect(http.get).toHaveBeenCalledWith(
        "/store/items",
        expect.objectContaining({
          params: expect.objectContaining({ warehouseId: "w2" }),
        }),
      ),
    )
  })

  it("offers no transfer between the stores", async () => {
    renderPage()
    await screen.findByText("Cable 4mm")
    expect(screen.queryByRole("button", { name: "Transfer" })).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Receive" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.pointerDown(
      within(dialog).getByRole("combobox", { name: "Movement" }),
      {
        button: 0,
        ctrlKey: false,
        pointerType: "mouse",
      },
    )
    expect(
      (await screen.findAllByRole("option")).map((o) => o.textContent),
    ).toEqual(["Receive", "Issue", "Count"])
  })

  it("offers the import into the store on screen to someone with store:import", async () => {
    perms.codes = new Set(["store:read", "store:import"])
    renderPage()
    await screen.findByText("Cable 4mm")

    fireEvent.click(screen.getByRole("button", { name: "Import" }))
    expect(
      await screen.findByText(
        "The items and their stock go into Mutlaa (the store on screen).",
      ),
    ).toBeTruthy()
  })
})

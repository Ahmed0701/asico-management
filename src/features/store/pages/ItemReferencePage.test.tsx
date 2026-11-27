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
import type { StoreItemName } from "../api"
import ItemReferencePage from "./ItemReferencePage"

const createdAt = "2026-11-01T08:00:00.000Z"
const names: StoreItemName[] = [
  {
    id: "n1",
    name: "Cable 16mm",
    category: "WIRE",
    factory: { id: "f1", name: "KWT Wires" },
    unit: "Roll",
    createdAt,
  },
  {
    id: "n2",
    name: "Box 3x3",
    category: "BOX",
    factory: null,
    unit: "Pcs",
    createdAt,
  },
]
const factories = [
  { id: "f1", name: "KWT Wires", category: "WIRE", itemCount: 0, createdAt },
  { id: "f2", name: "Gulf Wires", category: "WIRE", itemCount: 0, createdAt },
]

// The list boxes (Radix Select) use pointer capture and scrolling, which jsdom does not have.
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

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

function renderPage(path = "/item-reference") {
  http.get.mockImplementation((url: string) =>
    Promise.resolve({
      data: {
        data:
          url === "/store/item-names"
            ? names
            : url === "/store/factories"
              ? factories
              : [],
      },
    }),
  )
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[path]}>
          <ItemReferencePage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(async () => {
  vi.clearAllMocks()
  await i18n.changeLanguage("en")
  perms.codes = new Set(["store:read", "store:create", "store:delete"])
})

describe("ItemReferencePage", () => {
  it("lists the names with their category, and filters them", async () => {
    renderPage("/item-reference?category=WIRE")

    expect(await screen.findByText("Cable 16mm")).toBeTruthy()
    expect(screen.queryByText("Box 3x3")).toBeNull()
    const row = screen.getByText("Cable 16mm").closest("tr")!
    expect(within(row).getByText("KWT Wires")).toBeTruthy()
    expect(within(row).getByText("Roll")).toBeTruthy()
    expect(
      within(screen.getByText("Cable 16mm").closest("tr")!).getByText("Wire"),
    ).toBeTruthy()
  })

  it("adds a name in its own form", async () => {
    renderPage()
    http.post.mockResolvedValue({
      data: { data: { id: "n3", name: "Gland", category: "WIRE", createdAt } },
    })
    await screen.findByText("Cable 16mm")

    fireEvent.click(screen.getByRole("button", { name: "Add item" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Item"), {
      target: { value: " Gland " },
    })
    // A wire needs one of the wire factories.
    fireEvent.pointerDown(
      within(dialog).getByRole("combobox", { name: "Factory" }),
      { button: 0, ctrlKey: false, pointerType: "mouse" },
    )
    fireEvent.click(await screen.findByRole("option", { name: "Gulf Wires" }))
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/store/item-names",
        { name: "Gland", category: "WIRE", factoryId: "f2", unit: "Pcs" },
        expect.anything(),
      ),
    )
  })

  it("removes a name after confirming", async () => {
    renderPage()
    http.delete.mockResolvedValue({ data: undefined })
    await screen.findByText("Cable 16mm")

    fireEvent.click(screen.getByRole("button", { name: "Remove Cable 16mm" }))
    const confirm = await screen.findByRole("dialog")
    expect(within(confirm).getByText(/keep their name/)).toBeTruthy()
    fireEvent.click(within(confirm).getByRole("button", { name: "Delete" }))

    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith("/store/item-names/n1"),
    )
  })

  it("lets someone who can only read the store see the list and change nothing", async () => {
    perms.codes = new Set(["store:read"])
    renderPage()
    await screen.findByText("Cable 16mm")

    expect(screen.queryByRole("button", { name: "Add item" })).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Remove Cable 16mm" }),
    ).toBeNull()
  })

  it("keeps the factories here: shows the wire factories and adds one", async () => {
    renderPage()
    http.post.mockResolvedValue({
      data: {
        data: {
          id: "f3",
          name: "Burgan Wires",
          category: "WIRE",
          itemCount: 0,
          createdAt,
        },
      },
    })
    await screen.findByText("Cable 16mm")

    fireEvent.click(screen.getByRole("button", { name: "Factories" }))
    const dialog = screen.getByRole("dialog")
    expect(await within(dialog).findByText("KWT Wires")).toBeTruthy()
    expect(within(dialog).getByText("Gulf Wires")).toBeTruthy()

    fireEvent.change(within(dialog).getByLabelText("Factory name"), {
      target: { value: " Burgan Wires " },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Add factory" }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/store/factories",
        { name: "Burgan Wires", category: "WIRE" },
        expect.anything(),
      ),
    )
  })

  it("edits an item, sending only what changed", async () => {
    perms.codes = new Set(["store:read", "store:update"])
    renderPage()
    http.patch.mockResolvedValue({
      data: { data: { ...names[0], name: "Cable 16 mm" } },
    })
    await screen.findByText("Cable 16mm")

    fireEvent.click(screen.getByRole("button", { name: "Edit Cable 16mm" }))
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Edit item")).toBeTruthy()
    const name = within(dialog).getByLabelText("Item") as HTMLInputElement
    expect(name.value).toBe("Cable 16mm")
    fireEvent.change(name, { target: { value: "Cable 16 mm" } })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() =>
      expect(http.patch).toHaveBeenCalledWith("/store/item-names/n1", {
        name: "Cable 16 mm",
      }),
    )
    // Editing does not need store:create or store:delete.
    expect(screen.queryByRole("button", { name: "Add item" })).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Remove Cable 16mm" }),
    ).toBeNull()
  })

  it("deletes a factory after confirming", async () => {
    renderPage()
    http.delete.mockResolvedValue({ data: undefined })
    await screen.findByText("Cable 16mm")

    fireEvent.click(screen.getByRole("button", { name: "Factories" }))
    const list = screen.getByRole("dialog")
    await within(list).findByText("KWT Wires")
    // Every factory has its delete button; the server refuses one that items come from.
    expect(
      within(list).getByRole("button", { name: "Delete Gulf Wires" }),
    ).toBeTruthy()
    fireEvent.click(
      within(list).getByRole("button", { name: "Delete KWT Wires" }),
    )
    const confirm = await screen.findByText(/Delete the factory KWT Wires?/)
    const dialog = confirm.closest("[role=dialog]") as HTMLElement
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith("/store/factories/f1"),
    )
  })

  it("renames a factory in place", async () => {
    perms.codes = new Set(["store:read", "store:update"])
    renderPage()
    http.patch.mockResolvedValue({
      data: { data: { ...factories[0], name: "Kuwait Wires" } },
    })
    await screen.findByText("Cable 16mm")

    fireEvent.click(screen.getByRole("button", { name: "Factories" }))
    const list = screen.getByRole("dialog")
    await within(list).findByText("KWT Wires")
    fireEvent.click(
      within(list).getByRole("button", { name: "Rename KWT Wires" }),
    )
    const field = within(list).getByLabelText("Factory name", {
      selector: "input[value='KWT Wires']",
    })
    fireEvent.change(field, { target: { value: " Kuwait Wires " } })
    fireEvent.keyDown(field, { key: "Enter" })

    await waitFor(() =>
      expect(http.patch).toHaveBeenCalledWith("/store/factories/f1", {
        name: "Kuwait Wires",
      }),
    )
  })
})

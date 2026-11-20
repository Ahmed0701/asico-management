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
import MaterialItemsPage from "./MaterialItemsPage"

const item = (
  id: string,
  name: string,
  type: string,
  required: number,
  lineCount: number,
) => ({
  id,
  name,
  type,
  unit: "pcs",
  sortOrder: 1,
  requiredPerVilla: required,
  lineCount,
  version: 2,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
})
const items = [
  item("i1", "MSB Box", "SWITCHGEAR", 1, 4),
  item("i2", "Cut-out Box", "SWITCHGEAR", 0, 0),
  item("i4", "Cable 4x16", "CABLE", 100, 0),
]

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
const perms = vi.hoisted(() => ({ edit: true }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({
    can: (code: string) => code !== "materials:update" || perms.edit,
  }),
}))

function renderPage(entry = "/material-items") {
  http.get.mockResolvedValue({ data: { data: items } })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[entry]}>
          <MaterialItemsPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  perms.edit = true
})

describe("MaterialItemsPage", () => {
  it("lists the materials with their type, unit and the quantity each villa needs", async () => {
    renderPage()

    const row = (await screen.findByText("Cable 4x16")).closest("tr")!
    expect(within(row).getByText("Cable")).toBeTruthy()
    expect(within(row).getByText("100 pcs")).toBeTruthy()
    const cutOut = screen.getByText("Cut-out Box").closest("tr")!
    expect(within(cutOut).getByText("Not needed")).toBeTruthy()
    // A material on deliveries is not deleted.
    expect(
      (screen.getByRole("button", {
        name: "Delete MSB Box",
      }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it("filters by type and searches", async () => {
    renderPage("/material-items?type=CABLE")
    expect(await screen.findByText("Cable 4x16")).toBeTruthy()
    expect(screen.queryByText("MSB Box")).toBeNull()
  })

  it("adds a material", async () => {
    renderPage()
    http.post.mockResolvedValue({
      data: { data: item("i9", "Breaker", "SWITCHGEAR", 2, 0) },
    })
    await screen.findByText("MSB Box")

    fireEvent.click(screen.getByRole("button", { name: "Add material" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Material"), {
      target: { value: " Breaker " },
    })
    const unit = within(dialog).getByLabelText("Unit") as HTMLSelectElement
    // pcs first, then meters.
    expect(Array.from(unit.options).map((o) => o.value)).toEqual(["pcs", "Mt"])
    expect(unit.value).toBe("pcs")
    fireEvent.change(unit, { target: { value: "Mt" } })
    fireEvent.change(within(dialog).getByLabelText("Needed per villa"), {
      target: { value: "2" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/material-items",
        {
          name: "Breaker",
          type: "SWITCHGEAR",
          unit: "Mt",
          requiredPerVilla: 2,
        },
        expect.anything(),
      ),
    )
  })

  it("keeps the type of a material on deliveries, and sends only what changed", async () => {
    renderPage()
    http.patch.mockResolvedValue({ data: { data: items[0] } })
    await screen.findByText("MSB Box")

    fireEvent.click(screen.getByRole("button", { name: "Edit MSB Box" }))
    const dialog = await screen.findByRole("dialog")
    expect(
      (within(dialog).getByLabelText("Type") as HTMLSelectElement).disabled,
    ).toBe(true)
    fireEvent.change(within(dialog).getByLabelText("Needed per villa"), {
      target: { value: "2" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() => expect(http.patch).toHaveBeenCalled())
    expect(http.patch.mock.calls[0]![0]).toBe("/material-items/i1")
    expect(http.patch.mock.calls[0]![1]).toEqual({ requiredPerVilla: 2 })
  })

  it("hides adding and editing without materials:update", async () => {
    perms.edit = false
    renderPage()
    await screen.findByText("MSB Box")
    expect(screen.queryByRole("button", { name: "Add material" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Edit MSB Box" })).toBeNull()
  })
})

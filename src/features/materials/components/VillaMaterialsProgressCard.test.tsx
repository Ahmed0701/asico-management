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
import VillaMaterialsProgressCard from "./VillaMaterialsProgressCard"

const item = (id: string, name: string, type: string, required: number) => ({
  id,
  name,
  type,
  unit: "pcs",
  sortOrder: 1,
  requiredPerVilla: required,
  lineCount: 0,
  version: 1,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
})
const items = [
  item("i1", "MSB Box", "SWITCHGEAR", 1),
  item("i2", "DB Interior", "SWITCHGEAR", 3),
  item("i3", "Cut-out Box", "SWITCHGEAR", 0),
  item("i4", "Cable 4x16", "CABLE", 100),
]
const summary = {
  villaId: "v1",
  deliveries: 1,
  withNote: 1,
  withoutNote: 0,
  byType: [],
  materials: [
    {
      type: "SWITCHGEAR",
      itemId: "i1",
      name: "MSB Box",
      unit: "pcs",
      required: 1,
      custom: false,
      delivered: 1,
      balance: 0,
      status: "COMPLETE",
      deliveries: 1,
      withNote: 1,
    },
    {
      type: "SWITCHGEAR",
      itemId: "i2",
      name: "DB Interior",
      unit: "pcs",
      required: 4,
      custom: true,
      delivered: 1,
      balance: 3,
      status: "PENDING",
      deliveries: 1,
      withNote: 1,
    },
    {
      type: "CABLE",
      itemId: "i4",
      name: "Cable 4x16",
      unit: "pcs",
      required: 100,
      custom: false,
      delivered: 0,
      balance: 100,
      status: "PENDING",
      deliveries: 0,
      withNote: 0,
    },
  ],
}
const factories = [
  { id: "f1", name: "Gulf Switchgear", type: "SWITCHGEAR" },
  { id: "f3", name: "Kuwait Cables", type: "CABLE" },
]

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
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

type Vendor = {
  id: string
  name: string
}

type AssignedVendors = {
  switchgear: Vendor | null
  cable: Vendor | null
}

function renderCard(
  vendors: AssignedVendors = { switchgear: null, cable: null },
) {
  http.get.mockImplementation(async (url: string) => {
    if (url === "/villas/v1/vendors") {
      return {
        data: {
          data: {
            villa: { id: "v1", villaNumber: "V-12", location: "" },
            ...vendors,
            version: 1,
            listedAt: null,
          },
        },
      }
    }
    if (url === "/material-items") return { data: { data: items } }
    if (url === "/villas/v1/materials-summary")
      return { data: { data: summary } }
    if (url === "/factories") return { data: { data: factories } }
    return { data: { data: [] } }
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <VillaMaterialsProgressCard villaId="v1" villaNumber="V-12" />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

// The list (Delivered or Not delivered) by its heading.
const listOf = (title: string) =>
  screen
    .getByRole("heading", { name: new RegExp(`^${title}`) })
    .closest("section")!
// A material's Update button (a material that came in part is in both lists: the first one).
const updateButton = (name: string) =>
  screen.getAllByRole("button", { name: `Update ${name}` })[0]!

beforeEach(() => {
  vi.clearAllMocks()
  perms.codes = new Set([
    "materials:read",
    "materials:update",
    "materials:create",
  ])
})

describe("VillaMaterialsProgressCard", () => {
  it("shows what came in green and what is still to come in red, from the materials list", async () => {
    renderCard()

    await screen.findAllByText("MSB Box")
    const delivered = listOf("Delivered")
    expect(
      within(delivered).getByText("MSB Box").closest("li")!.className,
    ).toContain("success")
    expect(within(delivered).getByText("DB Interior")).toBeTruthy()
    expect(within(delivered).queryByText("Cable 4x16")).toBeNull()

    const missing = listOf("Not delivered")
    // The villa's own 4 DB Interiors, 1 came: 3 still to come.
    const db = within(missing).getByText("DB Interior").closest("li")!
    expect(db.className).toContain("danger")
    expect(within(db).getByText("3 pcs")).toBeTruthy()
    expect(within(db).getByText("of 4 pcs required")).toBeTruthy()
    expect(within(missing).getByText("Cable 4x16")).toBeTruthy()
    expect(within(missing).queryByText("MSB Box")).toBeNull()
    // Neither needed nor delivered: in neither list.
    expect(screen.queryByText("Cut-out Box")).toBeNull()
    expect(screen.getByText("2 materials not fully delivered")).toBeTruthy()
  })

  it("takes the new delivery's factory from the villa's vendors", async () => {
    renderCard({
      switchgear: { id: "f1", name: "Gulf Switchgear" },
      cable: null,
    })
    http.post.mockResolvedValue({ data: { data: { id: "d9" } } })
    await screen.findAllByText("DB Interior")

    fireEvent.click(updateButton("DB Interior"))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Delivered (pcs)"), {
      target: { value: "2" },
    })
    const factory = within(dialog).getByLabelText(
      "Factory",
    ) as HTMLSelectElement
    await waitFor(() => expect(factory.value).toBe("f1"))
    expect(within(dialog).getByText("From the villa's vendors")).toBeTruthy()
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() => expect(http.post).toHaveBeenCalled())
    expect(http.post.mock.calls[0]![1]).toMatchObject({
      factoryId: "f1",
      lines: [{ itemId: "i2", quantity: 1 }],
    })
  })

  it("opens the villa's required materials from the card", async () => {
    renderCard()
    await screen.findAllByText("MSB Box")
    fireEvent.click(screen.getByRole("button", { name: "Required materials" }))
    expect(await screen.findByRole("dialog")).toBeTruthy()
  })

  it("records a delivery of what came more, from a factory of the material's type", async () => {
    renderCard()
    http.post.mockResolvedValue({ data: { data: { id: "d9" } } })
    await screen.findAllByText("DB Interior")

    fireEvent.click(updateButton("DB Interior"))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Delivered (pcs)"), {
      target: { value: "3.5" },
    })
    expect(within(dialog).getByText("New delivery: 2.5 pcs")).toBeTruthy()
    const factory = within(dialog).getByLabelText(
      "Factory",
    ) as HTMLSelectElement
    // A switchgear material: only the switchgear factories.
    await waitFor(() =>
      expect(Array.from(factory.options).map((o) => o.text)).toEqual([
        "Choose a factory",
        "Gulf Switchgear",
      ]),
    )

    expect(
      within(dialog).getByText(
        "No factory of this type is assigned to the villa on the Vendors page",
      ),
    ).toBeTruthy()
    // The factory is asked for.
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )
    expect(
      await within(dialog).findByText(
        "Choose the factory the delivery came from",
      ),
    ).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()

    fireEvent.change(factory, { target: { value: "f1" } })
    fireEvent.change(within(dialog).getByLabelText("Delivery note no."), {
      target: { value: "DN-9" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() => expect(http.post).toHaveBeenCalled())
    const [url, body] = http.post.mock.calls[0]!
    expect(url).toBe("/material-deliveries")
    expect(body).toMatchObject({
      villaId: "v1",
      factoryId: "f1",
      lines: [{ itemId: "i2", quantity: 2.5 }],
      noteNumber: "DN-9",
    })
    // The requirement was not touched.
    expect(http.put).not.toHaveBeenCalled()
  })

  it("sets the villa's own quantity, or gives it back to the list's, without a delivery", async () => {
    renderCard()
    http.put.mockResolvedValue({ data: { data: summary } })
    await screen.findAllByText("DB Interior")

    fireEvent.click(updateButton("DB Interior"))
    const dialog = await screen.findByRole("dialog")
    const needed = within(dialog).getByLabelText(
      "Needed (pcs)",
    ) as HTMLInputElement
    expect(needed.value).toBe("4")
    fireEvent.change(needed, { target: { value: "" } })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() => expect(http.put).toHaveBeenCalled())
    expect(http.put.mock.calls[0]![0]).toBe("/villas/v1/material-requirements")
    expect(http.put.mock.calls[0]![1]).toEqual({
      items: [{ itemId: "i2", quantity: null }],
    })
    expect(http.post).not.toHaveBeenCalled()
  })

  it("does not lower what came", async () => {
    renderCard()
    await screen.findAllByText("MSB Box")

    fireEvent.click(updateButton("MSB Box"))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Delivered (pcs)"), {
      target: { value: "0" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    expect(
      await within(dialog).findByText(/Delivered cannot go down here/),
    ).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
    expect(http.put).not.toHaveBeenCalled()
  })

  it("shows no update button without the right to change materials", async () => {
    perms.codes = new Set(["materials:read"])
    renderCard()
    await screen.findAllByText("MSB Box")
    expect(screen.queryByRole("button", { name: /^Update / })).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Required materials" }),
    ).toBeNull()
  })
})

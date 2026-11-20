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
import type { VillaVendors } from "../api"
import VendorsPage from "./VendorsPage"

const v12: VillaVendors = {
  villa: { id: "v1", villaNumber: "V-12", location: "Sabah . B1 . 12" },
  switchgear: { id: "f1", name: "Gulf Switchgear" },
  cable: null,
  version: 4,
  listedAt: "2026-11-18T08:00:00.000Z",
}
const v15: VillaVendors = {
  villa: { id: "v2", villaNumber: "V-15", location: "Sabah . B1 . 15" },
  switchgear: null,
  cable: null,
  version: 1,
  listedAt: "2026-11-18T08:00:00.000Z",
}
const factories = [
  { id: "f1", name: "Gulf Switchgear", type: "SWITCHGEAR" },
  { id: "f2", name: "Alfanar", type: "SWITCHGEAR" },
  { id: "f3", name: "Kuwait Cables", type: "CABLE" },
].map((f) => ({
  ...f,
  deliveryCount: 0,
  version: 1,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
}))

const http = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
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

function renderPage() {
  http.get.mockImplementation(async (url: string) => {
    if (url === "/material-vendors") {
      return {
        data: {
          data: [v12, v15],
          meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
          summary: {
            villaCount: 2,
            withSwitchgear: 1,
            withCable: 0,
            withNone: 7,
          },
        },
      }
    }
    if (url === "/factories") return { data: { data: factories } }
    if (url === "/material-vendors/available") {
      return { data: { data: [{ id: "v9", villaNumber: "V-30" }] } }
    }
    return { data: { data: [] } }
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <VendorsPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  perms.edit = true
})

describe("VendorsPage", () => {
  it("lists each villa with its assigned factories as text, and the villas still unassigned", async () => {
    renderPage()

    const row = (await screen.findByRole("link", { name: "V-12" })).closest(
      "tr",
    )!
    expect(within(row).getByText("Gulf Switchgear")).toBeTruthy()
    expect(within(row).getByText("Not assigned")).toBeTruthy()
    expect(within(row).queryByRole("combobox")).toBeNull()
    const empty = screen.getByRole("link", { name: "V-15" }).closest("tr")!
    expect(empty.getAttribute("data-row-tone")).toBe("warn")
    const tile = screen.getByText("Nothing assigned yet").parentElement!
    expect(within(tile).getByText("7")).toBeTruthy()
  })

  it("assigns a villa's cable factory from the form, offering only cable factories, with its version", async () => {
    renderPage()
    http.put.mockResolvedValue({
      data: { data: { ...v12, cable: { id: "f3", name: "Kuwait Cables" } } },
    })

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Assign the factories of villa V-12",
      }),
    )
    const dialog = await screen.findByRole("dialog")
    const switchgear = within(dialog).getByLabelText(
      "Switchgear factory",
    ) as HTMLSelectElement
    expect(switchgear.value).toBe("f1")
    const cable = within(dialog).getByLabelText(
      "Cable factory",
    ) as HTMLSelectElement
    await waitFor(() =>
      expect(Array.from(cable.options).map((o) => o.text)).toEqual([
        "Not assigned",
        "Kuwait Cables",
      ]),
    )
    fireEvent.change(cable, { target: { value: "f3" } })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() => expect(http.put).toHaveBeenCalled())
    const [url, body, config] = http.put.mock.calls[0]!
    expect(url).toBe("/villas/v1/vendors")
    // Only what changed is sent.
    expect(body).toEqual({ cableFactoryId: "f3" })
    expect(config.headers["If-Match"]).toBe("4")
  })

  it("adds a villa from the form and assigns its factories in the same go", async () => {
    renderPage()
    const added: VillaVendors = {
      ...v15,
      villa: { ...v15.villa, id: "v9", villaNumber: "V-30" },
      version: 2,
    }
    http.post.mockResolvedValue({ data: { data: added } })
    http.put.mockResolvedValue({ data: { data: added } })

    fireEvent.click(await screen.findByRole("button", { name: "Add villa" }))
    const dialog = await screen.findByRole("dialog")
    const villa = within(dialog).getByRole("combobox", { name: "Villa" })
    fireEvent.focus(villa)
    fireEvent.change(villa, { target: { value: "30" } })
    fireEvent.mouseDown(await screen.findByRole("option", { name: "V-30" }))
    await waitFor(() =>
      expect(
        (within(dialog).getByLabelText(
          "Switchgear factory",
        ) as HTMLSelectElement).options.length,
      ).toBe(3),
    )
    fireEvent.change(within(dialog).getByLabelText("Switchgear factory"), {
      target: { value: "f2" },
    })
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() => expect(http.put).toHaveBeenCalled())
    expect(http.post).toHaveBeenCalledWith("/villas/v9/vendors")
    const [url, body, config] = http.put.mock.calls[0]!
    expect(url).toBe("/villas/v9/vendors")
    expect(body).toEqual({ switchgearFactoryId: "f2" })
    // The version the add answered.
    expect(config.headers["If-Match"]).toBe("2")
  })

  it("asks for a villa before adding", async () => {
    renderPage()
    fireEvent.click(await screen.findByRole("button", { name: "Add villa" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )
    expect(await within(dialog).findByText("Choose a villa")).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it("takes a villa off the list after confirming, with its version", async () => {
    renderPage()
    http.delete.mockResolvedValue({ data: undefined })

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Take villa V-12 off the list",
      }),
    )
    expect(
      await screen.findByText(/Its assigned factories are taken off too/),
    ).toBeTruthy()
    const confirm = screen.getAllByRole("button", {
      name: /confirm|delete|remove|take/i,
    })
    fireEvent.click(confirm[confirm.length - 1]!)

    await waitFor(() => expect(http.delete).toHaveBeenCalled())
    const [url, config] = http.delete.mock.calls[0]!
    expect(url).toBe("/villas/v1/vendors")
    expect(config.headers["If-Match"]).toBe("4")
  })

  it("shows the names only without materials:update, and keeps the factories button", async () => {
    perms.edit = false
    renderPage()

    await screen.findByRole("link", { name: "V-12" })
    expect(screen.queryByRole("button", { name: "Add villa" })).toBeNull()
    expect(
      screen.queryByRole("button", {
        name: "Assign the factories of villa V-12",
      }),
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Take villa V-12 off the list" }),
    ).toBeNull()
    expect(screen.getByRole("button", { name: "Factories" })).toBeTruthy()
  })
})

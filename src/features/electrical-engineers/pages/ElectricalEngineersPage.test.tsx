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
import ElectricalEngineersPage from "./ElectricalEngineersPage"

const engineers = [
  {
    id: "e1",
    version: 1,
    name: "Omar Khaled",
    phone: "0100 123 4567",
    email: "omar@example.test",
    status: "ACTIVE",
    user: { id: "u1", name: "Omar User", email: "omar.user@example.test" },
    villaCount: 3,
    createdAt: "2026-01-05T09:30:00.000Z",
    updatedAt: "2026-01-05T09:30:00.000Z",
  },
  {
    id: "e2",
    version: 1,
    name: "Sami Adel",
    phone: "0100 765 4321",
    email: null,
    status: "INACTIVE",
    user: null,
    villaCount: 0,
    createdAt: "2026-02-10T12:00:00.000Z",
    updatedAt: "2026-02-10T12:00:00.000Z",
  },
]

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({ can: () => true, isAdmin: true, me: undefined }),
}))

function renderPage() {
  http.get.mockImplementation((url: string) =>
    Promise.resolve(
      url === "/electrical-engineers/options"
        ? {
            data: {
              data: [
                { id: "e1", name: "Omar Khaled" },
                { id: "e3", name: "Huda Fathy" },
              ],
            },
          }
        : {
            data: {
              data: engineers,
              meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
            },
          },
    ),
  )
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/electrical-engineers"]}>
          <ExportProvider>
            <ElectricalEngineersPage />
          </ExportProvider>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe("Electrical engineers list", () => {
  it("sums up the engineers: how many, active, with a user account, and their villas", async () => {
    renderPage()
    const summary = await screen.findByRole("region", {
      name: "Electrical engineers at a glance",
    })
    await within(summary).findByText("Electrical engineers")
    const tile = (label: string) =>
      within(summary).getByText(label).previousSibling?.textContent
    expect(tile("Electrical engineers")).toBe("2")
    expect(tile("Active")).toBe("1")
    expect(tile("With a user account")).toBe("1")
    expect(tile("Villas assigned")).toBe("3")
  })

  it("shows each engineer's status, contact, user account and villas", async () => {
    renderPage()
    const omar = (
      await screen.findByRole("link", { name: "Omar Khaled" })
    ).closest("tr")!
    // The status pill (the status switch says it too).
    expect(within(omar).getAllByText("Active").length).toBeGreaterThan(0)
    expect(within(omar).getByText("Omar User")).toBeTruthy()
    const villas = within(omar).getByRole("link", { name: /3 villas/ })
    expect(villas.getAttribute("href")).toBe("/villas?electricalEngineerId=e1")

    const sami = screen.getByRole("link", { name: "Sami Adel" }).closest("tr")!
    expect(within(sami).getAllByText("Inactive").length).toBeGreaterThan(0)
    expect(within(sami).getByText("Not linked")).toBeTruthy()
    // No villas: a plain pill, not a link.
    expect(within(sami).getByText("0 villas")).toBeTruthy()
    expect(within(sami).queryByRole("link", { name: /villas/ })).toBeNull()
  })

  it("moves every villa of an engineer to another one from the list", async () => {
    renderPage()
    http.post.mockResolvedValue({
      data: { data: { moved: 3, to: { id: "e3", name: "Huda Fathy" } } },
    })
    const omar = (
      await screen.findByRole("link", { name: "Omar Khaled" })
    ).closest("tr")!
    // Only an engineer with villas has the button.
    const sami = screen.getByRole("link", { name: "Sami Adel" }).closest("tr")!
    expect(
      within(sami).queryByRole("button", { name: /Move the villas/ }),
    ).toBeNull()
    fireEvent.click(
      within(omar).getByRole("button", {
        name: "Move the villas of Omar Khaled to another engineer",
      }),
    )

    const dialog = await screen.findByRole("dialog", {
      name: "Move every villa to another engineer",
    })
    expect(within(dialog).getByText("3 villas will move")).toBeTruthy()
    // Nothing chosen: the form says so and sends nothing.
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Move 3 villas" }),
    )
    expect(
      await within(dialog).findByText(
        "Choose the engineer to move the villas to",
      ),
    ).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()

    const picker = within(dialog).getByRole("combobox", {
      name: "Move them to",
    })
    fireEvent.focus(picker)
    fireEvent.change(picker, { target: { value: "a" } })
    // The engineer itself is not offered.
    expect(await within(dialog).findByText("Huda Fathy")).toBeTruthy()
    expect(
      within(dialog).queryByRole("option", { name: "Omar Khaled" }),
    ).toBeNull()
    fireEvent.mouseDown(within(dialog).getByText("Huda Fathy"))
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Move 3 villas" }),
    )

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/electrical-engineers/e1/transfer-villas",
        { toEngineerId: "e3" },
      ),
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("keeps the dialog open with the server's reason when the move is refused", async () => {
    renderPage()
    http.post.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          code: "ELECTRICAL_ENGINEER_INACTIVE",
          message: "This electrical engineer is inactive",
        },
      },
    })
    const omar = (
      await screen.findByRole("link", { name: "Omar Khaled" })
    ).closest("tr")!
    fireEvent.click(
      within(omar).getByRole("button", { name: /Move the villas of Omar/ }),
    )
    const dialog = await screen.findByRole("dialog")
    const picker = within(dialog).getByRole("combobox", {
      name: "Move them to",
    })
    fireEvent.focus(picker)
    fireEvent.change(picker, { target: { value: "Huda" } })
    fireEvent.mouseDown(await within(dialog).findByText("Huda Fathy"))
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Move 3 villas" }),
    )

    expect(await within(dialog).findByRole("alert")).toBeTruthy()
    expect(screen.getByRole("dialog")).toBeTruthy()
  })
})

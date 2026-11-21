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
import ElectricalEngineerFormModal from "./ElectricalEngineerFormModal"

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const perms = vi.hoisted(() => ({ update: true }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({
    can: (code: string) =>
      code !== "electrical-engineers:update" || perms.update,
  }),
}))

const users = [
  {
    id: "u1",
    name: "Sara Ali",
    email: "sara@example.test",
    isActive: true,
    engineer: null,
  },
  {
    id: "u2",
    name: "Omar Nabil",
    email: "omar@example.test",
    isActive: true,
    engineer: { id: "e9", name: "Other Engineer" },
  },
]
const engineer = {
  id: "e1",
  version: 2,
  name: "Eng One",
  phone: "0100 123 4567",
  email: null,
  status: "ACTIVE",
  user: { id: "u1", name: "Sara Ali", email: "sara@example.test" },
  villaCount: 3,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
}

function renderModal(engineerId?: string) {
  http.get.mockImplementation(async (url: string) => {
    if (url === "/electrical-engineers/user-options")
      return { data: { data: users } }
    if (url === "/electrical-engineers/e1") {
      return { data: { data: engineer }, headers: { etag: '"2"' } }
    }
    throw new Error(`unexpected GET ${url}`)
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <ElectricalEngineerFormModal
            open
            engineerId={engineerId}
            onClose={() => {}}
            onSaved={() => {}}
            onDeletedWhileEditing={() => {}}
          />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  perms.update = true
})

describe("ElectricalEngineerFormModal: the user account", () => {
  it("links a user account when adding an engineer, and shows who is linked elsewhere", async () => {
    http.post.mockResolvedValue({ data: { data: { ...engineer, id: "new" } } })
    renderModal()
    const dialog = await screen.findByRole("dialog")

    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Eng New" },
    })
    fireEvent.change(within(dialog).getByLabelText("Phone"), {
      target: { value: "0100 765 4321" },
    })
    const picker = within(dialog).getByRole("combobox", {
      name: "User account",
    })
    fireEvent.focus(picker)
    fireEvent.change(picker, { target: { value: "a" } })
    expect(
      await within(dialog).findByText(
        /Omar Nabil \(omar@example.test, linked to Other Engineer\)/,
      ),
    ).toBeTruthy()
    fireEvent.mouseDown(
      within(dialog).getByText(/Sara Ali \(sara@example.test\)/),
    )
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/electrical-engineers",
        expect.objectContaining({ name: "Eng New", userId: "u1" }),
        expect.anything(),
      ),
    )
  })

  it("unlinks the user account of an engineer", async () => {
    http.patch.mockResolvedValue({
      data: { data: { ...engineer, user: null, version: 3 } },
    })
    renderModal("e1")
    const dialog = await screen.findByRole("dialog")
    const picker = await within(dialog).findByRole("combobox", {
      name: "User account",
    })
    await waitFor(() =>
      expect((picker as HTMLInputElement).value).toMatch(/Sara Ali/),
    )

    fireEvent.mouseDown(within(dialog).getByRole("button", { name: "Clear" }))
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    )

    await waitFor(() =>
      expect(http.patch).toHaveBeenCalledWith(
        "/electrical-engineers/e1",
        { userId: null },
        expect.anything(),
      ),
    )
  })

  it("has no user picker without electrical-engineers:update", async () => {
    perms.update = false
    renderModal()
    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).queryByRole("combobox", { name: "User account" }),
    ).toBeNull()
    expect(http.get).not.toHaveBeenCalledWith(
      "/electrical-engineers/user-options",
    )
  })
})

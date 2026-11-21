import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import CreateUserModal from "./CreateUserModal"

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const perms = vi.hoisted(() => ({ isAdmin: true }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({ can: () => true, isAdmin: perms.isAdmin }),
}))

function renderModal() {
  http.get.mockResolvedValue({ data: { data: [] } })
  http.post.mockResolvedValue({
    data: {
      data: {
        id: "u9",
        version: 1,
        name: "Admin Two",
        email: "two@example.test",
        role: "ADMIN",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        permissions: [],
      },
    },
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <CreateUserModal open onClose={() => {}} />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

function fill() {
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Admin Two" },
  })
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "two@example.test" },
  })
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Correct-Horse-9" },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  perms.isAdmin = true
})

describe("CreateUserModal role", () => {
  it("an administrator chooses administrator or engineer; engineer is the default", async () => {
    renderModal()
    expect(
      screen
        .getByRole("button", { name: /Engineer/ })
        .getAttribute("aria-pressed"),
    ).toBe("true")
    fireEvent.click(screen.getByRole("button", { name: /Admin/ }))
    fill()
    fireEvent.click(screen.getByRole("button", { name: "Create user" }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/users",
        expect.objectContaining({ role: "ADMIN", permissions: [] }),
        expect.anything(),
      ),
    )
  })

  it("someone who is not an administrator sees no choice and creates an engineer", async () => {
    perms.isAdmin = false
    renderModal()
    expect(
      screen.queryByRole("group", { name: "Administrator or engineer" }),
    ).toBeNull()
    fill()
    fireEvent.click(screen.getByRole("button", { name: "Create user" }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/users",
        expect.objectContaining({ role: "EMPLOYEE" }),
        expect.anything(),
      ),
    )
  })
})

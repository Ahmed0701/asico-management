import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { UserDetail } from "../api"
import EditUserModal from "./EditUserModal"

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const perms = vi.hoisted(() => ({ isAdmin: true, meId: "u1" }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({
    can: () => true,
    isAdmin: perms.isAdmin,
    me: { id: perms.meId },
  }),
}))

const sara: UserDetail = {
  id: "u2",
  version: 3,
  name: "Sara Ali",
  email: "sara@example.test",
  role: "EMPLOYEE",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  permissions: ["villas:read"],
}

const onClose = vi.fn()

function renderModal(user: UserDetail = sara) {
  // Each write answers the user one version on.
  http.patch.mockImplementation(
    (url: string, body: Record<string, unknown>) => {
      const version = url.endsWith("/role") && body.role ? 5 : 4
      return Promise.resolve({ data: { data: { ...user, ...body, version } } })
    },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <EditUserModal user={user} onClose={onClose} />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

const save = () =>
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
const roleGroup = () =>
  screen.queryByRole("group", { name: "Administrator or engineer" })

beforeEach(() => {
  vi.clearAllMocks()
  perms.isAdmin = true
  perms.meId = "u1"
})

describe("EditUserModal role", () => {
  it("an administrator changes only the role: one request, on the user's version", async () => {
    renderModal()
    expect(roleGroup()).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /Admin/ }))
    // What the change means is said before saving.
    expect(screen.getByText(/Make Sara Ali an administrator/)).toBeTruthy()
    save()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(http.patch).toHaveBeenCalledTimes(1)
    expect(http.patch).toHaveBeenCalledWith(
      "/users/u2/role",
      { role: "ADMIN" },
      expect.objectContaining({
        headers: expect.objectContaining({ "If-Match": "3" }),
      }),
    )
  })

  it("the name and the role together: the name first, then the role on the new version", async () => {
    renderModal()
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Sara A." },
    })
    fireEvent.click(screen.getByRole("button", { name: /Admin/ }))
    save()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(http.patch.mock.calls.map((call) => call[0])).toEqual([
      "/users/u2",
      "/users/u2/role",
    ])
    expect(http.patch.mock.calls[0]?.[1]).toEqual({
      name: "Sara A.",
      email: "sara@example.test",
    })
    expect(http.patch.mock.calls[1]?.[2]).toMatchObject({
      headers: { "If-Match": "4" },
    })
  })

  it("the name alone leaves the role alone", async () => {
    renderModal()
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Sara A." },
    })
    save()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(http.patch.mock.calls.map((call) => call[0])).toEqual(["/users/u2"])
  })

  it("no role choice on your own account, nor for someone who is not an administrator", () => {
    perms.meId = "u2"
    const { unmount } = render(
      <QueryClientProvider client={new QueryClient()}>
        <I18nextProvider i18n={i18n}>
          <EditUserModal user={sara} onClose={onClose} />
        </I18nextProvider>
      </QueryClientProvider>,
    )
    expect(roleGroup()).toBeNull()
    unmount()

    perms.meId = "u1"
    perms.isAdmin = false
    renderModal()
    expect(roleGroup()).toBeNull()
  })

  it("keeps the form open with the server's reason when the role is refused", async () => {
    http.patch.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          code: "USER_IS_ENGINEER_ACCOUNT",
          message: "This user is the account of an electrical engineer",
        },
      },
    })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <I18nextProvider i18n={i18n}>
          <EditUserModal user={sara} onClose={onClose} />
        </I18nextProvider>
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: /Admin/ }))
    save()

    expect(
      await screen.findByText(/account of an electrical engineer/),
    ).toBeTruthy()
    expect(onClose).not.toHaveBeenCalled()
  })
})

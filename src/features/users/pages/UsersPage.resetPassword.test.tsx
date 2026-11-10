import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import UsersPage from "./UsersPage"

const adminRow = {
  id: "admin-user",
  name: "Admin User",
  email: "admin@asico.example",
  role: "ADMIN",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const employeeRow = {
  id: "emp-user",
  name: "Employee User",
  email: "emp@asico.example",
  role: "EMPLOYEE",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

function renderUsersPage(me: {
  id: string
  role: "ADMIN" | "EMPLOYEE"
  permissions: string[]
}) {
  setAccessToken("test-token")
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  qc.setQueryData(meQueryKey, {
    id: me.id,
    name: "Caller",
    email: "caller@asico.example",
    role: me.role,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    permissions: me.permissions,
  })
  server.use(
    http.get("/api/v1/me", () =>
      HttpResponse.json({
        data: {
          id: me.id,
          name: "Caller",
          email: "caller@asico.example",
          role: me.role,
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          permissions: me.permissions,
        },
      }),
    ),
    http.get("/api/v1/users", () =>
      HttpResponse.json({
        data: [adminRow, employeeRow],
        meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
      }),
    ),
  )
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/users"]}>
        <I18nextProvider i18n={i18n}>
          <UsersPage />
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("UsersPage reset password action", () => {
  it("hides reset action without users:update", async () => {
    renderUsersPage({ id: "u1", role: "EMPLOYEE", permissions: ["users:read"] })
    await waitFor(() =>
      expect(screen.getByText(employeeRow.name)).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole("button", {
        name: i18n.t("users.resetPasswordAction"),
      }),
    ).not.toBeInTheDocument()
  })

  it("disables reset for admin row when caller is not admin", async () => {
    renderUsersPage({
      id: "u1",
      role: "EMPLOYEE",
      permissions: ["users:update"],
    })
    await waitFor(() =>
      expect(screen.getByText(adminRow.name)).toBeInTheDocument(),
    )
    const buttons = screen.getAllByRole("button", {
      name: i18n.t("users.adminResetRestricted"),
    })
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it("enables reset for admin row when caller is admin", async () => {
    renderUsersPage({ id: "u1", role: "ADMIN", permissions: [] })
    await waitFor(() =>
      expect(screen.getByText(adminRow.name)).toBeInTheDocument(),
    )
    const enabled = screen.getAllByRole("button", {
      name: i18n.t("users.resetPasswordAction"),
    })
    expect(enabled.length).toBeGreaterThanOrEqual(2)
  })
})

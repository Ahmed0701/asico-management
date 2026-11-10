import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { I18nextProvider } from "react-i18next"
import { http, HttpResponse } from "msw"
import i18n from "@/shared/i18n"
import { setAccessToken } from "@/shared/auth/accessToken"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import { PERMISSIONS_EMPLOYEE } from "@/test/msw/handlers"
import { server } from "@/test/msw/server"
import { ExportProvider } from "@/shared/export/ExportProvider"
import Sidebar from "./Sidebar"

function renderSidebar(me: {
  role: "ADMIN" | "EMPLOYEE"
  permissions: string[]
}) {
  setAccessToken("seed-token")
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  queryClient.setQueryData(meQueryKey, {
    id: "u1",
    name: "Test",
    email: "t@e.com",
    role: me.role,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    permissions: me.permissions,
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <ExportProvider>
            <Sidebar />
          </ExportProvider>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("Sidebar permissions", () => {
  it("hides admin items for limited employee", () => {
    renderSidebar({ role: "EMPLOYEE", permissions: PERMISSIONS_EMPLOYEE })
    expect(screen.queryByText(i18n.t("nav.users"))).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t("nav.auditLog"))).not.toBeInTheDocument()
    expect(screen.getByText(i18n.t("nav.contractors"))).toBeInTheDocument()
  })

  it("shows audit log when employee has audit:read", () => {
    renderSidebar({
      role: "EMPLOYEE",
      permissions: [...PERMISSIONS_EMPLOYEE, "audit:read"],
    })
    expect(screen.getByText(i18n.t("nav.auditLog"))).toBeInTheDocument()
  })

  it("shows all nav items for admin", () => {
    server.use(
      http.get("/api/v1/me", () =>
        HttpResponse.json({
          data: {
            id: "admin",
            name: "Admin",
            email: "admin@asico.example",
            role: "ADMIN",
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
            permissions: [],
          },
        }),
      ),
    )
    renderSidebar({ role: "ADMIN", permissions: [] })
    expect(screen.getByText(i18n.t("nav.users"))).toBeInTheDocument()
    expect(screen.getByText(i18n.t("nav.auditLog"))).toBeInTheDocument()
    expect(screen.getByText(i18n.t("nav.dashboard"))).toBeInTheDocument()
  })
})

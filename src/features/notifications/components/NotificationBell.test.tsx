import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import { server } from "@/test/msw/server"
import { setAccessToken } from "@/shared/auth/accessToken"
import NotificationBell from "./NotificationBell"

const me = {
  id: "u1",
  name: "Test User",
  email: "test@asico.example",
  role: "EMPLOYEE" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  permissions: [],
}

function renderBell(qc: QueryClient) {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <I18nextProvider i18n={i18n}>
          <NotificationBell />
        </I18nextProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe("NotificationBell", () => {
  beforeEach(() => {
    setAccessToken("seed-token")
  })

  it("shows unread badge and 99+ cap", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    qc.setQueryData(meQueryKey, me)
    server.use(
      http.get("/api/v1/notifications", () =>
        HttpResponse.json({
          data: [],
          meta: {
            page: 1,
            limit: 1,
            total: 0,
            totalPages: 1,
            unreadCount: 120,
          },
        }),
      ),
    )
    renderBell(qc)
    await waitFor(() => expect(screen.getByText("99+")).toBeInTheDocument())
  })

  it("marks all as read from the panel", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    qc.setQueryData(meQueryKey, me)
    const user = userEvent.setup()
    renderBell(qc)
    await user.click(screen.getByRole("button", { name: "Notifications" }))
    await waitFor(() =>
      expect(screen.getByText("Small work overdue")).toBeInTheDocument(),
    )
    await user.click(screen.getByRole("button", { name: "Mark all as read" }))
    await waitFor(() =>
      expect(screen.queryByText("99+")).not.toBeInTheDocument(),
    )
  })
})

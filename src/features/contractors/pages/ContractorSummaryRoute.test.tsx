import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter, Route, Routes } from "react-router"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import ContractorSummaryRoute from "./ContractorSummaryRoute"
import { ExportProvider } from "@/shared/export/ExportProvider"

describe("ContractorSummaryRoute", () => {
  it("allows summary-only permission without contractors:read", async () => {
    setAccessToken("seed-token")
    server.use(
      http.get("/api/v1/me", () =>
        HttpResponse.json({
          data: {
            id: "u1",
            name: "Test",
            email: "t@x.com",
            role: "EMPLOYEE",
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
            permissions: ["contractors:summary"],
          },
        }),
      ),
      http.get("/api/v1/contractors/c1/summary", () =>
        HttpResponse.json({
          data: {
            contractor: { id: "c1", name: "Acme", phone: "+1" },
            totals: { total: 0, open: 0, inProgress: 0, closed: 0 },
            projects: [],
          },
          meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
        }),
      ),
    )
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={qc}>
        <ExportProvider>
          <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={["/contractors/c1/summary"]}>
              <Routes>
                <Route
                  path="/contractors/:id/summary"
                  element={<ContractorSummaryRoute />}
                />
              </Routes>
            </MemoryRouter>
          </I18nextProvider>
        </ExportProvider>
      </QueryClientProvider>,
    )
    expect(await screen.findByText("Acme")).toBeInTheDocument()
    expect(screen.queryByText(/back to contractors/i)).toBeNull()
  })
})

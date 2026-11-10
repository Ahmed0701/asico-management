import { render, screen, waitFor } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter, Route, Routes } from "react-router"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import ContractorSummaryPage from "./ContractorSummaryPage"
import { ExportProvider } from "@/shared/export/ExportProvider"

function wrap(initial = "/contractors/c1/summary") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ExportProvider>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={[initial]}>
            <Routes>
              <Route
                path="/contractors/:id/summary"
                element={<ContractorSummaryPage />}
              />
            </Routes>
          </MemoryRouter>
        </I18nextProvider>
      </ExportProvider>
    </QueryClientProvider>,
  )
}

describe("ContractorSummaryPage", () => {
  it("hides null figure sections and lists villas", async () => {
    setAccessToken("seed-token")
    server.use(
      http.get("/api/v1/contractors/c1/summary", () =>
        HttpResponse.json({
          data: {
            contractor: { id: "c1", name: "Acme", phone: "+100" },
            villaCount: 2,
            openWorks: null,
            smallWorks: {
              total: 3,
              pending: 2,
              done: 1,
              overdue: 0,
              dueSoon: 1,
            },
            dailyReports: null,
            labour: null,
            villas: [
              {
                id: "v1",
                villaNumber: "P-1",
                area: "A",
                block: "B",
                plot: "1",
                startDate: "2026-01-01",
                targetDate: null,
              },
            ],
          },
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      ),
      http.get("/api/v1/me", () =>
        HttpResponse.json({
          data: {
            id: "u1",
            name: "Test",
            email: "t@x.com",
            role: "EMPLOYEE",
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
            permissions: ["contractors:summary", "contractors:read"],
          },
        }),
      ),
    )

    wrap()
    await waitFor(() => expect(screen.getByText("Acme")).toBeInTheDocument())
    expect(screen.queryByText(/open works/i)).not.toBeInTheDocument()
    expect(screen.getByText("P-1")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })
})

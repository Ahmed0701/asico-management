import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { DashboardSummary } from "../api/dashboard.types"
import DashboardSummarySection from "./DashboardSummarySection"

vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({ can: () => false, engineerScope: false }),
}))

const empty: DashboardSummary = {
  villas: null,
  progress: null,
  overdue: null,
  upcoming: null,
  mewFollowUp: null,
  mewInspection: null,
  byArea: null,
  topContractors: null,
  openWorks: null,
  dailyReports: null,
  smallWorks: null,
  siteReports: null,
  labour: null,
  totalLabour: null,
  delayedSmallWorks: null,
  maintenance: null,
  ownerNotes: null,
  foremanMissions: null,
  payments: null,
  generatedAt: "2026-11-21T08:00:00.000Z",
}

function renderSummary(data: DashboardSummary) {
  const query = {
    data,
    isLoading: false,
    isError: false,
  } as UseQueryResult<DashboardSummary, Error>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <DashboardSummarySection
            query={query}
            canVillasRead={false}
            canContractorsRead={false}
          />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("DashboardSummarySection", () => {
  it("counts only the small works not done yet, and opens the pending list, as open works do", () => {
    renderSummary({
      ...empty,
      smallWorks: { total: 7, pending: 2, dueSoon: 0, overdue: 0, urgent: [] },
      openWorks: {
        total: 9,
        delayed: 1,
        byStatus: { NOT_STARTED: 2, IN_PROGRESS: 1, DELAYED: 1, DONE: 5 },
        overdue: 0,
        overdueList: [],
      },
    })

    const small = screen.getByRole("link", { name: /Small works \(not done\)/ })
    expect(small.textContent).toMatch(/2/)
    expect(small.textContent).not.toMatch(/7/)
    expect(small.getAttribute("href")).toBe("/small-works?status=PENDING")

    const open = screen.getByRole("link", { name: /Open works \(not done\)/ })
    expect(open.textContent).toMatch(/4/)
  })
})

import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { contractorsKeys } from "@/features/contractors/api/contractors.queries"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { dailyReportsKeys } from "../api/daily-reports.queries"
import { invalidateDailyReportsAfterWrite } from "./dailyReportsQueryCache"

describe("invalidateDailyReportsAfterWrite", () => {
  it("invalidates daily reports, dashboard, and contractor summaries", () => {
    const qc = new QueryClient()
    qc.setQueryData(dailyReportsKeys.all, [])
    qc.setQueryData(dashboardKeys.summary(), {})
    qc.setQueryData(contractorsKeys.summary("c1", { page: 1, limit: 20 }), {})

    invalidateDailyReportsAfterWrite(qc)

    expect(qc.getQueryState(dailyReportsKeys.all)?.isInvalidated).toBe(true)
    expect(qc.getQueryState(dashboardKeys.summary())?.isInvalidated).toBe(true)
    expect(
      qc.getQueryState(contractorsKeys.summary("c1", { page: 1, limit: 20 }))
        ?.isInvalidated,
    ).toBe(true)
  })
})

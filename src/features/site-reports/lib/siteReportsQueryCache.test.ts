import { describe, expect, it, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { siteReportsKeys } from "../api/site-reports.queries"
import { invalidateSiteReportsAfterWrite } from "./siteReportsQueryCache"

describe("invalidateSiteReportsAfterWrite", () => {
  it("invalidates site reports and dashboard", () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    invalidateSiteReportsAfterWrite(qc)
    expect(spy).toHaveBeenCalledWith({ queryKey: siteReportsKeys.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: dashboardKeys.summary() })
  })
})

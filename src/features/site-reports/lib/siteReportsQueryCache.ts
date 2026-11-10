import type { QueryClient } from "@tanstack/react-query"
import { invalidateContractorSummariesAndLists } from "@/features/contractors/lib/contractorSummaryQueryCache"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { villasKeys } from "@/features/villas/api/villas.queries"
import { siteReportsKeys } from "../api/site-reports.queries"

export function invalidateSiteReportsAfterWrite(
  qc: QueryClient,
  villaId?: string,
): void {
  void qc.invalidateQueries({ queryKey: siteReportsKeys.all })
  if (villaId) {
    void qc.invalidateQueries({ queryKey: villasKeys.detail(villaId) })
  } else {
    void qc.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === villasKeys.all[0] &&
        query.queryKey[1] === "detail",
    })
  }
  void qc.invalidateQueries({ queryKey: dashboardKeys.summary() })
  invalidateContractorSummariesAndLists(qc)
}

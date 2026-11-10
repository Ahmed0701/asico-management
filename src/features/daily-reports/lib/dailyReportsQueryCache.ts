import type { QueryClient } from "@tanstack/react-query"
import { invalidateContractorSummariesAndLists } from "@/features/contractors/lib/contractorSummaryQueryCache"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { dailyReportsKeys } from "../api/daily-reports.queries"

export function invalidateDailyReportsAfterWrite(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: dailyReportsKeys.all })
  void qc.invalidateQueries({ queryKey: dashboardKeys.summary() })
  invalidateContractorSummariesAndLists(qc)
}

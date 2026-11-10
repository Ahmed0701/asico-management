import type { QueryClient } from "@tanstack/react-query"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { invalidateContractorSummariesAndLists } from "@/features/contractors/lib/contractorSummaryQueryCache"
import { villasKeys } from "@/features/villas/api/villas.queries"
import { openWorksKeys } from "../api/open-works.queries"

export function invalidateOpenWorksAfterWrite(
  qc: QueryClient,
  villaId?: string,
): void {
  void qc.invalidateQueries({ queryKey: openWorksKeys.all })
  if (villaId) {
    void qc.invalidateQueries({ queryKey: villasKeys.detail(villaId) })
  } else {
    void qc.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === villasKeys.all[0] &&
        query.queryKey[1] === "detail",
    })
  }
  // A villa's progress is read from its open works: the villa lists show it too.
  void qc.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === villasKeys.all[0] && query.queryKey[1] === "list",
  })
  void qc.invalidateQueries({ queryKey: dashboardKeys.summary() })
  invalidateContractorSummariesAndLists(qc)
}

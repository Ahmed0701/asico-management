import type { Query, QueryClient } from "@tanstack/react-query"
import { invalidateContractorSummariesAndLists } from "@/features/contractors/lib/contractorSummaryQueryCache"
import { openWorksKeys } from "@/features/open-works/api/open-works.queries"
import { villasKeys } from "@/features/villas/api/villas.queries"
import { invalidateVillaListsAndDashboard } from "@/features/villas/lib/villaQueryCache"

export function invalidateElecPhasesAfterWrite(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: ["elec-phases"] })
  void qc.invalidateQueries({ queryKey: openWorksKeys.all })
  void qc.invalidateQueries({
    predicate: (query: Query) => {
      const key = query.queryKey
      return key[0] === villasKeys.all[0] && key[1] === "detail"
    },
  })
  // A phase's status or progress ratio changes every villa's overall progress: the lists and the dashboard too.
  invalidateVillaListsAndDashboard(qc)
  invalidateContractorSummariesAndLists(qc)
}

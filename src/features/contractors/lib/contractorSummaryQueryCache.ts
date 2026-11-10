import type { QueryClient } from "@tanstack/react-query"
import { contractorsKeys } from "../api/contractors.queries"

/** Refetch every contractor summary and list (counts may change). */
export function invalidateContractorSummariesAndLists(qc: QueryClient): void {
  void qc.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey
      if (key[0] !== contractorsKeys.all[0]) return false
      return key[1] === "summary" || key[1] === "list"
    },
  })
}

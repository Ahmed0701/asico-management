import type { QueryClient } from "@tanstack/react-query"
import type { ApiError } from "@/shared/api/types"
import { smallWorksKeys } from "./small-works.queries"

export function onSmallWorksForbidden(qc: QueryClient, error: ApiError): void {
  if (error.status !== 403) return
  void qc.cancelQueries({ queryKey: smallWorksKeys.all })
}

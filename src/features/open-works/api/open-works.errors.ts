import type { QueryClient } from "@tanstack/react-query"
import type { ApiError } from "@/shared/api/types"
import { openWorksKeys } from "./open-works.queries"

export function onOpenWorksForbidden(qc: QueryClient, error: ApiError): void {
  if (error.status !== 403) return
  void qc.cancelQueries({ queryKey: openWorksKeys.all })
}

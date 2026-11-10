import type { QueryClient } from "@tanstack/react-query"
import type { ApiError } from "@/shared/api/types"
import { dailyLabourKeys } from "./daily-labour.queries"

export function onDailyLabourForbidden(qc: QueryClient, error: ApiError): void {
  if (error.status !== 403) return
  void qc.cancelQueries({ queryKey: dailyLabourKeys.all })
}

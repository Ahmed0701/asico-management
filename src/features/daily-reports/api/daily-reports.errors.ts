import type { QueryClient } from "@tanstack/react-query"
import type { ApiError } from "@/shared/api/types"
import { dailyReportsKeys } from "./daily-reports.queries"

export function onDailyReportsForbidden(
  qc: QueryClient,
  error: ApiError,
): void {
  if (error.status !== 403) return
  void qc.cancelQueries({ queryKey: dailyReportsKeys.all })
}

import type { QueryClient } from "@tanstack/react-query"
import type { ApiError } from "@/shared/api/types"
import { siteReportsKeys } from "./site-reports.queries"

export function onSiteReportsForbidden(qc: QueryClient, error: ApiError): void {
  if (error.status !== 403) return
  void qc.cancelQueries({ queryKey: siteReportsKeys.all })
}

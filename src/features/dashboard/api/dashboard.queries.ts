import { useQuery } from "@tanstack/react-query"
import { getDashboardSummary } from "./dashboard.api"

/** Do not refetch on focus more than once per minute. */
export const DASHBOARD_STALE_MS = 60_000

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
}

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: ({ signal }) => getDashboardSummary(signal),
    staleTime: DASHBOARD_STALE_MS,
    refetchOnWindowFocus: true,
  })
}

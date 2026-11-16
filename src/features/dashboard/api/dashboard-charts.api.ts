import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import type { DashboardCharts } from "./dashboard-charts.types"
import { DASHBOARD_STALE_MS, dashboardKeys } from "./dashboard.queries"

export async function getDashboardCharts(
  signal?: AbortSignal,
): Promise<DashboardCharts> {
  return unwrap(
    api.get<ApiSuccess<DashboardCharts>>("/dashboard/charts", { signal }),
  )
}

export const dashboardChartsKey = () =>
  [...dashboardKeys.all, "charts"] as const

export function useDashboardChartsQuery() {
  return useQuery({
    queryKey: dashboardChartsKey(),
    queryFn: ({ signal }) => getDashboardCharts(signal),
    staleTime: DASHBOARD_STALE_MS,
    refetchOnWindowFocus: true,
  })
}

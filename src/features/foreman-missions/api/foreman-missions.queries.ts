import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import type { WriteRequest } from "@/shared/api/write-safety"
import * as api from "./foreman-missions.api"
import type {
  ForemanMissionInput,
  ForemanMissionsListParams,
  ForemanMissionUpdate,
} from "./foreman-missions.types"

export const foremanMissionsKeys = {
  all: ["foreman-missions"] as const,
  list: (params: ForemanMissionsListParams) =>
    [...foremanMissionsKeys.all, "list", params] as const,
}

// Both lists (open and done) and the dashboard's counts change with any write.
function invalidateForemanMissions(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: foremanMissionsKeys.all })
  void qc.invalidateQueries({ queryKey: dashboardKeys.summary() })
}

/** Page, page size and search from the URL; `done` picks the list. */
export function useForemanMissionsListParams(done: boolean) {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo<ForemanMissionsListParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      done,
    }
  }, [searchParams, done])
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  return { params, setParam, setPage, setLimit }
}

export function useForemanMissionsListQuery(params: ForemanMissionsListParams) {
  return useQuery({
    queryKey: foremanMissionsKeys.list(params),
    queryFn: ({ signal }) => api.listForemanMissions(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

export function useCreateForemanMissionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: ForemanMissionInput
      write: WriteRequest
    }) => api.createForemanMission(input, write),
    onSuccess: () => invalidateForemanMissions(qc),
  })
}

export function useUpdateForemanMissionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: ForemanMissionUpdate
      write: WriteRequest
    }) => api.updateForemanMission(id, input, write),
    onSuccess: () => invalidateForemanMissions(qc),
  })
}

type DeleteArgs = {
  id: string
  version: number
}

export function useDeleteForemanMissionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: DeleteArgs) =>
      api.deleteForemanMission(id, { ifMatch: version }),
    onSuccess: () => invalidateForemanMissions(qc),
  })
}

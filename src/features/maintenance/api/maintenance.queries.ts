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
import * as api from "./maintenance.api"
import type {
  MaintenanceInput,
  MaintenanceListParams,
  MaintenanceUpdate,
} from "./maintenance.types"

export const maintenanceKeys = {
  all: ["maintenance"] as const,
  list: (params: MaintenanceListParams) =>
    [...maintenanceKeys.all, "list", params] as const,
}

// Both lists (open and solved) and the dashboard's counts change with any write.
function invalidateMaintenance(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: maintenanceKeys.all })
  void qc.invalidateQueries({ queryKey: dashboardKeys.summary() })
}

/** Page, page size and search from the URL; `solved` picks the list. */
export function useMaintenanceListParams(solved: boolean) {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo<MaintenanceListParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      solved,
    }
  }, [searchParams, solved])
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  return { params, setParam, setPage, setLimit }
}

export function useMaintenanceListQuery(params: MaintenanceListParams) {
  return useQuery({
    queryKey: maintenanceKeys.list(params),
    queryFn: ({ signal }) => api.listMaintenance(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

export function useCreateMaintenanceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: MaintenanceInput
      write: WriteRequest
    }) => api.createMaintenance(input, write),
    onSuccess: () => invalidateMaintenance(qc),
  })
}

export function useUpdateMaintenanceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: MaintenanceUpdate
      write: WriteRequest
    }) => api.updateMaintenance(id, input, write),
    onSuccess: () => invalidateMaintenance(qc),
  })
}

type DeleteArgs = {
  id: string
  version: number
}

export function useDeleteMaintenanceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: DeleteArgs) =>
      api.deleteMaintenance(id, { ifMatch: version }),
    onSuccess: () => invalidateMaintenance(qc),
  })
}

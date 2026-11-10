import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import { toApiError } from "@/shared/api/errors"
import { invalidateElecPhasesAfterWrite } from "../lib/elecPhasesQueryCache"
import type {
  CreateElecPhaseInput,
  ElecPhaseStatus,
  ElecPhasesListParams,
  UpdateElecPhaseInput,
} from "./elec-phases.types"
import * as api from "./elec-phases.api"
import { onElecPhasesForbidden } from "./elec-phases.errors"

const DEFAULT_LIMIT = 20
const OPTIONS_STALE_MS = 5 * 60 * 1000

export const elecPhasesKeys = {
  all: ["elec-phases"] as const,
  list: (params: ElecPhasesListParams) =>
    [...elecPhasesKeys.all, "list", params] as const,
  detail: (id: string) => [...elecPhasesKeys.all, "detail", id] as const,
  options: () => [...elecPhasesKeys.all, "options"] as const,
  orderSnapshot: () => [...elecPhasesKeys.all, "order-snapshot"] as const,
}

const STATUS_VALUES: ElecPhaseStatus[] = ["ACTIVE", "INACTIVE"]

export function elecPhasesListParamsFromSearch(
  searchParams: URLSearchParams,
): ElecPhasesListParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const statusRaw = searchParams.get("status")
  const status =
    statusRaw && STATUS_VALUES.includes(statusRaw as ElecPhaseStatus)
      ? statusRaw as ElecPhaseStatus
      : undefined
  return {
    page: base.page,
    limit: base.limit,
    status,
  }
}

export function useElecPhasesListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => elecPhasesListParamsFromSearch(searchParams),
    [searchParams],
  )
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  return { params, setParam, setPage, setLimit, searchParams }
}

export function useElecPhasesListQuery() {
  const qc = useQueryClient()
  const { params } = useElecPhasesListParams()
  return useQuery({
    queryKey: elecPhasesKeys.list(params),
    queryFn: ({ signal }) => api.listElecPhases(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onElecPhasesForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

/** All phases in sort order for reorder (ignores list status filter). */
export function useElecPhasesOrderSnapshotQuery(enabled: boolean) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: elecPhasesKeys.orderSnapshot(),
    queryFn: ({ signal }) =>
      api.listElecPhases({ page: 1, limit: api.ELEC_PHASES_LIST_CAP }, signal),
    enabled,
    staleTime: 0,
    retry: (count, err) => {
      onElecPhasesForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useElecPhaseQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: elecPhasesKeys.detail(id ?? ""),
    queryFn: () => api.getElecPhase(id!),
    enabled: !!id,
    staleTime: 0,
    retry: (count, err) => {
      onElecPhasesForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useElecPhaseOptionsQuery() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: elecPhasesKeys.options(),
    queryFn: () => api.listElecPhaseOptions(),
    staleTime: OPTIONS_STALE_MS,
    retry: (count, err) => {
      const parsed = toApiError(err)
      onElecPhasesForbidden(qc, parsed)
      if (parsed.status === 403) return false
      return count < 1
    },
  })
}

function invalidateAfterWrite(qc: ReturnType<typeof useQueryClient>) {
  invalidateElecPhasesAfterWrite(qc)
}

export function useCreateElecPhaseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateElecPhaseInput
      write: Parameters<typeof api.createElecPhase>[1]
    }) => api.createElecPhase(input, write),
    onError: (err) => onElecPhasesForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateAfterWrite(qc),
  })
}

export function useUpdateElecPhaseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateElecPhaseInput
      write: Parameters<typeof api.updateElecPhase>[2]
    }) => api.updateElecPhase(id, input, write),
    onError: (err) => onElecPhasesForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateAfterWrite(qc),
  })
}

export function useReorderElecPhasesMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: Parameters<typeof api.reorderElecPhases>[0]
      write: Parameters<typeof api.reorderElecPhases>[1]
    }) => api.reorderElecPhases(input, write),
    onError: (err) => onElecPhasesForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateAfterWrite(qc),
  })
}

export function useDeleteElecPhaseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: Parameters<typeof api.deleteElecPhase>[1]
    }) => api.deleteElecPhase(id, write),
    onError: (err) => onElecPhasesForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateAfterWrite(qc),
  })
}
